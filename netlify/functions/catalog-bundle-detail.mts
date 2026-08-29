import type { Config, Context } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { deleteBundleFromDatabase, fetchBundleById, updateBundleInDatabase } from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  try {
    const bundleId = context.params?.id;
    if (!bundleId) throw new RequestError(400, 'Bundle ID parameter is required.');

    if (request.method === 'GET') {
      const bundle = await fetchBundleById(bundleId);
      if (!bundle) throw new RequestError(404, 'Bundle not found.');
      return json({ bundle });
    }

    if (request.method === 'PATCH') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const bundle = await updateBundleInDatabase(bundleId, body);
      return json({ bundle, message: 'Bundle updated successfully.' });
    }

    if (request.method === 'DELETE') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const deleted = await deleteBundleFromDatabase(bundleId);
      if (!deleted) throw new RequestError(404, 'Bundle not found.');
      return json({ success: true, message: 'Bundle deleted successfully.' });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/bundles/:id',
  method: ['GET', 'PATCH', 'DELETE'],
};
