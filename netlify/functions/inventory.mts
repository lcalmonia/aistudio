import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { fetchInventoryFromDatabase, insertInventoryItemToDatabase, InventoryItem } from './_shared/inventory.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, requireString } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      const items = await fetchInventoryFromDatabase();
      return json({ items });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const name = requireString(body.name, 'Item name', { min: 1, max: 255 });
      const item = await insertInventoryItemToDatabase({
        ...body,
        name,
      } as Partial<InventoryItem>);
      return json({ item, message: 'Inventory item created successfully.' }, 201);
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/inventory',
  method: ['GET', 'POST'],
};
