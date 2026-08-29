import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { fetchBundlesFromDatabase, insertBundleToDatabase, PromoBundle } from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, requireString } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      const bundles = await fetchBundlesFromDatabase();
      return json({ bundles });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const name = requireString(body.name, 'Combo bundle name', { min: 1, max: 255 });
      const bundle = await insertBundleToDatabase({
        ...body,
        name,
      } as Partial<PromoBundle>);
      return json({ bundle, message: 'Combo bundle created successfully.' }, 201);
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/bundles',
  method: ['GET', 'POST'],
};
