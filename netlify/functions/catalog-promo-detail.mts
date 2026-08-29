import type { Config, Context } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { deletePromoFromDatabase, fetchPromoById, updatePromoInDatabase } from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  try {
    const promoId = context.params?.id;
    if (!promoId) throw new RequestError(400, 'Promo ID parameter is required.');

    if (request.method === 'GET') {
      const promo = await fetchPromoById(promoId);
      if (!promo) throw new RequestError(404, 'Promo not found.');
      return json({ promo });
    }

    if (request.method === 'PATCH') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const promo = await updatePromoInDatabase(promoId, body);
      return json({ promo, message: 'Promo updated successfully.' });
    }

    if (request.method === 'DELETE') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const deleted = await deletePromoFromDatabase(promoId);
      if (!deleted) throw new RequestError(404, 'Promo not found.');
      return json({ success: true, message: 'Promo deleted successfully.' });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/promos/:id',
  method: ['GET', 'PATCH', 'DELETE'],
};
