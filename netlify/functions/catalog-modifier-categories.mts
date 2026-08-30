import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { fetchModifierCategoriesFromDatabase, insertModifierCategoryToDatabase, ModifierCategory } from './_shared/catalog.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, requireString } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      const modifierCategories = await fetchModifierCategoriesFromDatabase();
      return json({ modifierCategories });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const name = requireString(body.name, 'Category name', { min: 1, max: 128 });
      const modifierCategory = await insertModifierCategoryToDatabase({
        ...body,
        name,
      } as Partial<ModifierCategory>);
      return json({ modifierCategory, message: 'Modifier category created successfully.' }, 201);
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/modifier-categories',
  method: ['GET', 'POST'],
};
