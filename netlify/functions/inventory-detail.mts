import type { Config, Context } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { deleteInventoryItemFromDatabase, fetchInventoryItemById, updateInventoryItemInDatabase } from './_shared/inventory.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  try {
    const itemId = context.params?.id;
    if (!itemId) throw new RequestError(400, 'Inventory item ID parameter is required.');

    if (request.method === 'GET') {
      const item = await fetchInventoryItemById(itemId);
      if (!item) throw new RequestError(404, 'Inventory item not found.');
      return json({ item });
    }

    if (request.method === 'PATCH') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const item = await updateInventoryItemInDatabase(itemId, body);
      return json({ item, message: 'Inventory item updated successfully.' });
    }

    if (request.method === 'DELETE') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const deleted = await deleteInventoryItemFromDatabase(itemId);
      if (!deleted) throw new RequestError(404, 'Inventory item not found.');
      return json({ success: true, message: 'Inventory item deleted successfully.' });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/inventory/:id',
  method: ['GET', 'PATCH', 'DELETE'],
};
