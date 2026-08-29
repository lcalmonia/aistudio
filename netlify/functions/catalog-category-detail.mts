import type { Config, Context } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { deleteCategoryFromDatabase, renameCategoryInDatabase } from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError, requireString } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  try {
    const rawCategoryName = context.params?.name;
    if (!rawCategoryName) throw new RequestError(400, 'Category name parameter is required.');
    const categoryName = decodeURIComponent(rawCategoryName).trim();

    if (request.method === 'PATCH') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const newCategoryName = requireString(body.newName || body.name, 'New category name', { min: 1, max: 128 });
      const categories = await renameCategoryInDatabase(categoryName, newCategoryName);
      return json({ categories, message: `Category renamed to "${newCategoryName}".` });
    }

    if (request.method === 'DELETE') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const url = new URL(request.url);
      const fallback = url.searchParams.get('fallback') || undefined;
      const categories = await deleteCategoryFromDatabase(categoryName, fallback);
      return json({ categories, message: `Category "${categoryName}" deleted.` });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/categories/:name',
  method: ['PATCH', 'DELETE'],
};
