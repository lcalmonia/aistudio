import type { Config, Context } from '@netlify/functions';
import { getAuthenticatedAdmin, requireSuperAdmin } from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

const MAX_IMAGE_BYTES = 700 * 1024;
const DATA_URL_PATTERN = /^data:(image\/(?:webp|png|jpe?g|gif|svg\+xml));base64,([A-Za-z0-9+/=]+)$/i;

function assertEntityType(value: unknown): 'menu' | 'bundle' {
  if (value !== 'menu' && value !== 'bundle') {
    throw new RequestError(400, 'Image entity type must be menu or bundle.');
  }
  return value;
}

function assertEntityId(value: unknown): string {
  const id = String(value || '').trim();
  if (!id || id.length > 100 || !/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new RequestError(400, 'A valid image entity ID is required.');
  }
  return id;
}

export default async function handler(request: Request, _context: Context): Promise<Response> {
  try {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

    enforceSameOrigin(request);
    const admin = await getAuthenticatedAdmin(request);
    requireSuperAdmin(admin);

    const body = await readJsonObject(request);
    const entityType = assertEntityType(body.entityType);
    const entityId = assertEntityId(body.entityId);
    const dataUrl = String(body.dataUrl || '').trim();

    const match = dataUrl.match(DATA_URL_PATTERN);
    if (!match) {
      throw new RequestError(400, 'Please provide a supported prepared image.');
    }

    const contentType = match[1].toLowerCase();
    const base64 = match[2];
    const imageData = Buffer.from(base64, 'base64');
    if (!imageData.length) throw new RequestError(400, 'The uploaded image is empty.');
    if (imageData.length > MAX_IMAGE_BYTES) {
      throw new RequestError(413, 'The uploaded image is larger than 700KB. Please choose a smaller image.');
    }

    const imageId = `${entityType}:${entityId}`;
    const db = database();
    await db.pool.query(
      `INSERT INTO catalog_images (id, content_type, image_data, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         content_type = EXCLUDED.content_type,
         image_data = EXCLUDED.image_data,
         updated_at = NOW()`,
      [imageId, contentType, imageData]
    );

    return json({
      url: `/api/catalog-images/${entityType}/${encodeURIComponent(entityId)}?v=${Date.now()}`,
      entityType,
      entityId,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/catalog-image-upload',
  method: ['POST'],
};
