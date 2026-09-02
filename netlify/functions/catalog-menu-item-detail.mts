import type { Config, Context } from '@netlify/functions';
import { requireAuthenticatedAdmin, requireSuperAdmin } from './_shared/auth.mts';
import {
  deleteMenuItemFromDatabase,
  fetchMenuItemById,
  toggleMenuItemAvailabilityInDatabase,
  updateMenuItemInDatabase,
} from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  try {
    const menuItemId = context.params?.id;
    if (!menuItemId) throw new RequestError(400, 'Menu item ID parameter is required.');

    if (request.method === 'GET') {
      const menuItem = await fetchMenuItemById(menuItemId);
      if (!menuItem) throw new RequestError(404, 'Menu item not found.');
      return json({ menuItem });
    }

    if (request.method === 'PATCH') {
      enforceSameOrigin(request);
      const admin = await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);

      if (body.toggleAvailability === true) {
        requireSuperAdmin(admin);
        const menuItem = await toggleMenuItemAvailabilityInDatabase(menuItemId);
        return json({ menuItem, message: 'Availability updated.' });
      }

      requireSuperAdmin(admin);
      const menuItem = await updateMenuItemInDatabase(menuItemId, body);
      return json({ menuItem, message: 'Menu item updated successfully.' });
    }

    if (request.method === 'DELETE') {
      enforceSameOrigin(request);
      const admin = await requireAuthenticatedAdmin(request);
      requireSuperAdmin(admin);
      const deleted = await deleteMenuItemFromDatabase(menuItemId);
      if (!deleted) throw new RequestError(404, 'Menu item not found.');
      return json({ success: true, message: 'Menu item deleted successfully.' });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/menu-items/:id',
  method: ['GET', 'PATCH', 'DELETE'],
};
