import type { Config, Context } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { deleteAddonFromDatabase, fetchAddonById, toggleAddonStockInDatabase, updateAddonInDatabase } from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  try {
    const addonId = context.params?.id;
    if (!addonId) throw new RequestError(400, 'Add-on ID parameter is required.');

    if (request.method === 'GET') {
      const addon = await fetchAddonById(addonId);
      if (!addon) throw new RequestError(404, 'Add-on not found.');
      return json({ addon });
    }

    if (request.method === 'PATCH') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);

      if (body.toggleStock === true) {
        const addon = await toggleAddonStockInDatabase(addonId);
        return json({ addon, message: 'Add-on stock toggled.' });
      }

      const addon = await updateAddonInDatabase(addonId, body);
      return json({ addon, message: 'Add-on updated successfully.' });
    }

    if (request.method === 'DELETE') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const deleted = await deleteAddonFromDatabase(addonId);
      if (!deleted) throw new RequestError(404, 'Add-on not found.');
      return json({ success: true, message: 'Add-on deleted successfully.' });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/addons/:id',
  method: ['GET', 'PATCH', 'DELETE'],
};
