import type { Config, Context } from '@netlify/functions';
import { database } from './_shared/database.mts';

function isValidEntityType(value: string): value is 'menu' | 'bundle' {
  return value === 'menu' || value === 'bundle';
}

function isValidEntityId(value: string): boolean {
  return value.length > 0 && value.length <= 100 && /^[A-Za-z0-9_-]+$/.test(value);
}

export default async function handler(_request: Request, context: Context): Promise<Response> {
  const entityType = String(context.params?.entityType || '');
  const entityId = String(context.params?.entityId || '');

  if (!isValidEntityType(entityType) || !isValidEntityId(entityId)) {
    return new Response('Image not found.', { status: 404 });
  }

  try {
    const db = database();
    const result = await db.pool.query(
      `SELECT content_type, image_data FROM catalog_images WHERE id = $1 LIMIT 1`,
      [`${entityType}:${entityId}`]
    );

    if (result.rows.length === 0) {
      return new Response('Image not found.', { status: 404 });
    }

    const row = result.rows[0] as { content_type: string; image_data: Buffer };
    const imageData = row.image_data;
    return new Response(imageData, {
      status: 200,
      headers: {
        'Content-Type': row.content_type || 'image/webp',
        'Cache-Control': 'public, max-age=300, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Unable to load image.', { status: 500 });
  }
}

export const config: Config = {
  path: '/api/catalog-images/:entityType/:entityId',
  method: ['GET'],
};
