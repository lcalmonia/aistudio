import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import {
  fetchInventoryCategoriesFromDatabase,
  insertInventoryCategoryToDatabase,
  renameInventoryCategoryInDatabase,
  deleteInventoryCategoryFromDatabase,
} from './_shared/inventory.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, requireString } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      const categories = await fetchInventoryCategoriesFromDatabase();
      return json({ categories });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);
      const body = await readJsonObject(request);
      const categoryName = requireString(body.category || body.name, 'Inventory category name', { min: 1, max: 128 });
      const categories = await insertInventoryCategoryToDatabase(categoryName);
      return json({ categories, message: 'Inventory category added.' }, 201);
    }
    if (request.method === 'PATCH') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);

      const body = await readJsonObject(request);

      const oldCategory = requireString(
        body.oldCategory,
        'Old inventory category name',
        { min: 1, max: 128 }
      );

      const newCategory = requireString(
        body.newCategory,
        'New inventory category name',
        { min: 1, max: 128 }
      );

      const categories = await renameInventoryCategoryInDatabase(
        oldCategory,
        newCategory
      );

      return json({
        categories,
        message: 'Inventory category renamed.',
      });
    }

    if (request.method === 'DELETE') {
      enforceSameOrigin(request);
      await requireAuthenticatedAdmin(request);

      const body = await readJsonObject(request);

      const categoryName = requireString(
        body.category,
        'Inventory category name',
        { min: 1, max: 128 }
      );

      const categories = await deleteInventoryCategoryFromDatabase(categoryName);

      return json({
        categories,
        message: 'Inventory category deleted.',
      });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/inventory/categories',
 method: ['GET', 'POST', 'PATCH', 'DELETE'],
