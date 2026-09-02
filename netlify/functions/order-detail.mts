import type { Config, Context } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import {
  fetchOrderById,
  OrderStatus,
  updateOrderStatusInDatabase,
  VALID_ORDER_STATUSES,
} from './_shared/orders.mts';
import {
  enforceSameOrigin,
  errorResponse,
  json,
  readJsonObject,
  RequestError,
} from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  try {
    const orderId = context.params.id;
    if (!orderId) {
      throw new RequestError(400, 'Order ID is required.');
    }

    if (request.method === 'GET') {
      const order = await fetchOrderById(orderId);
      if (!order) {
        throw new RequestError(404, `Order "${orderId}" not found.`);
      }
      return json({ order });
    }

    if (request.method === 'PATCH') {
      enforceSameOrigin(request);
      const body = await readJsonObject(request);

      // Customer self-cancellation is allowed only for the customer who owns
      // the order and only while the order is still New.
      if (body.action === 'customer-cancel') {
        const customerId = typeof body.customerId === 'string' ? body.customerId.trim() : '';
        const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail.trim().toLowerCase() : '';

        if (!customerId) {
          throw new RequestError(400, 'Customer ID is required.');
        }

        const existingOrder = await fetchOrderById(orderId);
        if (!existingOrder) {
          throw new RequestError(404, `Order "${orderId}" not found.`);
        }

        if (!existingOrder.isCustomerOrder || existingOrder.customerId !== customerId) {
          throw new RequestError(403, 'You can only cancel your own customer order.');
        }

        if (customerEmail && (existingOrder.customerEmail || '').toLowerCase() !== customerEmail) {
          throw new RequestError(403, 'Customer verification failed.');
        }

        if (existingOrder.status !== 'New') {
          throw new RequestError(409, 'This order can no longer be cancelled because preparation has started.');
        }

        const cancelledOrder = await updateOrderStatusInDatabase(orderId, 'Cancelled');
        return json({ order: cancelledOrder });
      }

      await requireAuthenticatedAdmin(request);

      const status = body.status as OrderStatus;

      if (!status || typeof status !== 'string') {
        throw new RequestError(400, 'Status is required.');
      }

      if (!VALID_ORDER_STATUSES.includes(status)) {
        throw new RequestError(
          400,
          `Invalid order status "${status}". Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`
        );
      }

      const updatedOrder = await updateOrderStatusInDatabase(orderId, status);
      return json({ order: updatedOrder });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/orders/:id',
  method: ['GET', 'PATCH'],
};
