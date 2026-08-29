import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { fetchCategoriesFromDatabase, insertCategoryToDatabase } from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, requireString } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      const categories = await fetchCategoriesFromDatabase();
      return json({ categories });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const categoryName = requireString(body.name, 'Category name', { min: 1, max: 128 });
      const categories = await insertCategoryToDatabase(categoryName);
      return json({ categories, message: 'Category added successfully.' }, 201);
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/categories',
  method: ['GET', 'POST'],
};
