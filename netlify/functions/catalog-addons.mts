import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { fetchAddonsFromDatabase, insertAddonToDatabase, ProductAddon } from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, requireString } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      const addons = await fetchAddonsFromDatabase();
      return json({ addons });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const name = requireString(body.name, 'Add-on name', { min: 1, max: 255 });
      const addon = await insertAddonToDatabase({
        ...body,
        name,
      } as Partial<ProductAddon>);
      return json({ addon, message: 'Add-on created successfully.' }, 201);
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/addons',
  method: ['GET', 'POST'],
};
