import type { Config, Context } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { deleteModifierCategoryFromDatabase, updateModifierCategoryInDatabase } from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  try {
    const categoryId = context.params?.id;
    if (!categoryId) throw new RequestError(400, 'Category ID parameter is required.');

    if (request.method === 'PATCH') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const category = await updateModifierCategoryInDatabase(categoryId, body);
      return json({ category, message: 'Modifier category updated successfully.' });
    }

    if (request.method === 'DELETE') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const deleted = await deleteModifierCategoryFromDatabase(categoryId);
      if (!deleted) throw new RequestError(404, 'Modifier category not found.');
      return json({ success: true, message: 'Modifier category deleted successfully.' });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/modifier-categories/:id',
  method: ['PATCH', 'DELETE'],
};
