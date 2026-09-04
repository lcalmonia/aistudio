import type { Config, Context } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import { fetchOrderById } from './_shared/orders.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  try {
    if (request.method !== 'PATCH') return json({ error: 'Method not allowed.' }, 405);
    enforceSameOrigin(request);
    await requireAuthenticatedAdmin(request);

    const orderId = context.params.id;
    if (!orderId) throw new RequestError(400, 'Order ID is required.');

    const existingOrder = await fetchOrderById(orderId);
    if (!existingOrder) throw new RequestError(404, `Order "${orderId}" not found.`);
    if (existingOrder.status !== 'Completed') throw new RequestError(409, 'Only completed orders can have their payment method finalized.');

    const body = await readJsonObject(request);
    const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : '';
    if (!paymentMethod.startsWith('Split Payment: ')) {
      throw new RequestError(400, 'A valid split payment breakdown is required.');
    }

    const breakdown = paymentMethod.slice('Split Payment: '.length).trim();
    if (!breakdown) throw new RequestError(400, 'Split payment breakdown cannot be empty.');

    const db = database();
    const result = await db.pool.query(
      `UPDATE orders SET payment_method = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [paymentMethod, orderId],
    );

    if (!result.rows[0]) throw new RequestError(404, `Order "${orderId}" not found.`);
    const updatedOrder = await fetchOrderById(orderId);
    return json({ order: updatedOrder });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/orders/:id/payment',
  method: ['PATCH'],
};
