import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { fetchStoreSettingsFromDatabase, resetStoreSettingsInDatabase, updateStoreSettingsInDatabase } from './_shared/settings.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      const settings = await fetchStoreSettingsFromDatabase();
      return json({ settings });
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const settings = await updateStoreSettingsInDatabase(body);
      return json({ settings, message: 'Store settings updated successfully.' });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      if (body.action === 'reset') {
        const settings = await resetStoreSettingsInDatabase();
        return json({ settings, message: 'Store settings reset to defaults.' });
      }
      const settings = await updateStoreSettingsInDatabase(body);
      return json({ settings, message: 'Store settings updated successfully.' });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/settings',
  method: ['GET', 'PUT', 'PATCH', 'POST'],
};
