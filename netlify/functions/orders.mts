import type { Config } from '@netlify/functions';
import {
  CreateOrderPayload,
  fetchOrdersFromDatabase,
  insertOrderToDatabase,
  OrderStatus,
} from './_shared/orders.mts';
import {
  enforceSameOrigin,
  errorResponse,
  json,
  readJsonObject,
  RequestError,
} from './_shared/http.mts';
import {
  enforceStatsDateRangeAccess,
  requireAuthenticatedAdmin,
} from './_shared/auth.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      const customerId = url.searchParams.get('customerId') || url.searchParams.get('customer_id') || undefined;
      const orderId = url.searchParams.get('orderId') || url.searchParams.get('order_id') || url.searchParams.get('id') || undefined;
      const orderNumber = url.searchParams.get('orderNumber') || url.searchParams.get('order_number') || undefined;
      const statusParam = url.searchParams.get('status') || undefined;
      const startDate = url.searchParams.get('startDate') || url.searchParams.get('start_date') || undefined;
      const endDate = url.searchParams.get('endDate') || url.searchParams.get('end_date') || undefined;
      const preset = url.searchParams.get('preset') || undefined;
      const isAllTime = url.searchParams.get('allTime') === 'true' || url.searchParams.get('all_time') === 'true';
      const limitParam = url.searchParams.get('limit');
      const limit = limitParam ? parseInt(limitParam, 10) : undefined;

      const isStatsOrDateQuery = Boolean(startDate || endDate || preset || isAllTime || (limit !== undefined && limit > 200));
      if (isStatsOrDateQuery) {
        const admin = await requireAuthenticatedAdmin(request);
        enforceStatsDateRangeAccess(admin, {
          startDate,
          endDate,
          preset,
          limit,
          isAllTime,
        });
      }

      const orders = await fetchOrdersFromDatabase({
        customerId,
        orderId,
        orderNumber,
        status: statusParam as OrderStatus | undefined,
        startDate,
        endDate,
        limit,
      });

      return json({ orders });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      const body = await readJsonObject(request);
      const payload = body as unknown as CreateOrderPayload;

      if (!payload || typeof payload !== 'object') {
        throw new RequestError(400, 'Order data is required.');
      }

      const order = await insertOrderToDatabase(payload);
      return json({ order }, 201);
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/orders',
  method: ['GET', 'POST'],
};
