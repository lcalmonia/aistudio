import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { fetchPromosFromDatabase, insertPromoToDatabase, Promo } from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, requireString } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      const promos = await fetchPromosFromDatabase();
      return json({ promos });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const name = requireString(body.name, 'Promo name', { min: 1, max: 255 });
      const promo = await insertPromoToDatabase({
        ...body,
        name,
      } as Partial<Promo>);
      return json({ promo, message: 'Promo created successfully.' }, 201);
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/promos',
  method: ['GET', 'POST'],
};
