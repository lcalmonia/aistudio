import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin, requireSuperAdmin } from './_shared/auth.mts';
import { fetchMenuItemsFromDatabase, insertMenuItemToDatabase, MenuItem } from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, requireString } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      const menuItems = await fetchMenuItemsFromDatabase();
      return json({ menuItems });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      const admin = await requireAuthenticatedAdmin(request);
      requireSuperAdmin(admin);
      const body = await readJsonObject(request);
      const name = requireString(body.name, 'Menu item name', { min: 1, max: 255 });
      const menuItem = await insertMenuItemToDatabase({
        ...body,
        name,
      } as Partial<MenuItem>);
      return json({ menuItem, message: 'Menu item created successfully.' }, 201);
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/menu-items',
  method: ['GET', 'POST'],
};
