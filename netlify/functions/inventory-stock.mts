import type { Config, Context } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { adjustInventoryStockInDatabase } from './_shared/inventory.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    enforceSameOrigin(request);
    const actor = await requireAuthenticatedAdmin(request);
    const itemId = context.params?.id;
    if (!itemId) throw new RequestError(400, 'Inventory item ID parameter is required.');

    const body = await readJsonObject(request);
    const type = body.type as 'addition' | 'deduction' | 'adjustment' | 'restock' | 'waste';
    if (!['addition', 'deduction', 'adjustment', 'restock', 'waste'].includes(type)) {
      throw new RequestError(400, 'Invalid stock adjustment type.');
    }

    const quantity = Number(body.quantity);
    if (isNaN(quantity) || quantity < 0) {
      throw new RequestError(400, 'Adjustment quantity must be a non-negative number.');
    }

    const item = await adjustInventoryStockInDatabase(itemId, {
      type,
      quantity,
      reason: typeof body.reason === 'string' ? body.reason.trim() : undefined,
      staffName: actor.displayName || actor.username || 'Admin',
    });

    return json({ item, message: `Stock level updated for "${item.name}".` });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/inventory/:id/stock',
  method: 'POST',
};
