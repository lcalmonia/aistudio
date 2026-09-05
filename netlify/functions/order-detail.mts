import type { Config, Context } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import { fetchOrderById, OrderStatus, updateOrderStatusInDatabase, VALID_ORDER_STATUSES } from './_shared/orders.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

async function awardCompletedOrderLoyalty(orderId: string) {
  const db = database(); const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const orderResult = await client.query(`SELECT id, customer_id, order_type, subtotal, total, discount, status, loyalty_awarded_at FROM orders WHERE id = $1 FOR UPDATE`, [orderId]);
    const order = orderResult.rows[0];
    if (!order || order.status !== 'Completed' || order.loyalty_awarded_at || !order.customer_id) { await client.query('COMMIT'); return null; }
    const settingsResult = await client.query(`SELECT welcome_enabled, welcome_stamps, welcome_points, stamp_minimum_purchase, stamps_per_qualifying_order, points_minimum_purchase, points_mode, fixed_points, points_per_currency, currency_unit, stamp_cycle FROM loyalty_settings WHERE id = 'default' LIMIT 1`);
    const settings = settingsResult.rows[0] || { stamp_minimum_purchase: 0, stamps_per_qualifying_order: 1, points_minimum_purchase: 0, points_mode: 'ratio', fixed_points: 0, points_per_currency: 1, currency_unit: 10, stamp_cycle: 10 };
    const eligibleAmount = Math.max(0, Number(order.subtotal ?? order.total ?? 0) - Number(order.discount || 0));
    const orderType = String(order.order_type || 'Dine-In'); let stampsAdded = 0; let pointsAdded = 0;
    const customerResult = await client.query(`SELECT stamps, points FROM customers WHERE id = $1 FOR UPDATE`, [order.customer_id]); const customer = customerResult.rows[0];
    if (customer) {
      let stamps = Math.max(0, Number(customer.stamps) || 0); let points = Math.max(0, Number(customer.points) || 0);
      if ((orderType === 'Dine-In' || orderType === 'Takeout') && eligibleAmount >= Number(settings.stamp_minimum_purchase || 0)) { const count = Math.max(1, Math.floor(Number(settings.stamps_per_qualifying_order) || 1)); const cycle = Math.max(1, Math.floor(Number(settings.stamp_cycle) || 10)); for (let i = 0; i < count; i += 1) { stamps = (stamps % cycle) + 1; stampsAdded += 1; } }
      if (orderType === 'Delivery' && eligibleAmount >= Number(settings.points_minimum_purchase || 0)) { if (settings.points_mode === 'fixed') pointsAdded = Math.max(0, Math.floor(Number(settings.fixed_points) || 0)); else { const unit = Math.max(0.01, Number(settings.currency_unit) || 10); const perCurrency = Math.max(0, Number(settings.points_per_currency) || 0); pointsAdded = Math.max(0, Math.floor((eligibleAmount / unit) * perCurrency)); } }
      points += pointsAdded; await client.query(`UPDATE customers SET stamps = $1, points = $2, updated_at = NOW() WHERE id = $3`, [stamps, points, order.customer_id]);
    }
    await client.query(`UPDATE orders SET loyalty_awarded_at = NOW(), updated_at = NOW() WHERE id = $1`, [orderId]); await client.query('COMMIT'); return { customerId: String(order.customer_id), stampsAdded, pointsAdded };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  try {
    const orderId = context.params.id; if (!orderId) throw new RequestError(400, 'Order ID is required.');
    if (request.method === 'GET') { const order = await fetchOrderById(orderId); if (!order) throw new RequestError(404, `Order "${orderId}" not found.`); return json({ order }); }
    if (request.method === 'PATCH') {
      enforceSameOrigin(request); const body = await readJsonObject(request);
      if (body.action === 'customer-cancel') {
        const customerId = typeof body.customerId === 'string' ? body.customerId.trim() : ''; const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail.trim().toLowerCase() : '';
        if (!customerId) throw new RequestError(400, 'Customer ID is required.'); const existingOrder = await fetchOrderById(orderId); if (!existingOrder) throw new RequestError(404, `Order "${orderId}" not found.`);
        if (!existingOrder.isCustomerOrder || existingOrder.customerId !== customerId) throw new RequestError(403, 'You can only cancel your own customer order.'); if (customerEmail && (existingOrder.customerEmail || '').toLowerCase() !== customerEmail) throw new RequestError(403, 'Customer verification failed.'); if (existingOrder.status !== 'New') throw new RequestError(409, 'This order can no longer be cancelled because preparation has started.');
        return json({ order: await updateOrderStatusInDatabase(orderId, 'Cancelled') });
      }
      const actor = await requireAuthenticatedAdmin(request);
      const status = body.status as OrderStatus;
      if (!status || typeof status !== 'string') throw new RequestError(400, 'Status is required.');
      if (!VALID_ORDER_STATUSES.includes(status)) throw new RequestError(400, `Invalid order status "${status}". Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`);
      const existingOrder = await fetchOrderById(orderId); if (!existingOrder) throw new RequestError(404, `Order "${orderId}" not found.`);
      if (status === 'Cancelled' && !actor.isSuperAdmin) throw new RequestError(403, 'Only Super Admin can cancel transactions from the Orders tab.');
      const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : undefined; const isSplitPayment = Boolean(paymentMethod?.startsWith('Split Payment: '));
      if (paymentMethod && !['GCash', 'Maya', 'Cash', 'Card'].includes(paymentMethod) && !isSplitPayment) throw new RequestError(400, `Invalid payment method "${paymentMethod}".`);
      if (isSplitPayment && status !== 'Completed') throw new RequestError(400, 'Split Payment can only be recorded when completing an order.');
      const updatedOrder = await updateOrderStatusInDatabase(orderId, status, paymentMethod as 'GCash' | 'Maya' | 'Cash' | 'Card' | undefined); let loyalty = null; if (status === 'Completed') loyalty = await awardCompletedOrderLoyalty(orderId); return json({ order: updatedOrder, loyalty });
    }
    if (request.method === 'DELETE') {
      enforceSameOrigin(request); const actor = await requireAuthenticatedAdmin(request); if (!actor.isSuperAdmin) throw new RequestError(403, 'Only Super Admin can delete transactions from the Orders tab.');
      const existingOrder = await fetchOrderById(orderId); if (!existingOrder) throw new RequestError(404, `Order "${orderId}" not found.`);
      const db = database(); const result = await db.sql`DELETE FROM orders WHERE id = ${orderId} RETURNING id`; if (!result?.length) throw new RequestError(404, `Order "${orderId}" not found.`);
      return json({ deleted: true, orderId });
    }
    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) { return errorResponse(error); }
}

export const config: Config = { path: '/api/orders/:id', method: ['GET', 'PATCH', 'DELETE'] };
