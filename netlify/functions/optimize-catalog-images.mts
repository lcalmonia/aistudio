import type { Config, Context } from '@netlify/functions';
import sharp from 'sharp';
import { getAuthenticatedAdmin, requireSuperAdmin } from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import { enforceSameOrigin, errorResponse, json, RequestError } from './_shared/http.mts';

const MAX_DIMENSION = 1200;
const TARGET_BYTES = 700 * 1024;
const MIN_QUALITY = 55;

async function optimizeImage(input: Buffer): Promise<{ data: Buffer; contentType: string }> {
  let quality = 82;
  let data = await sharp(input)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  while (data.length > TARGET_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 7);
    data = await sharp(input)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  }

  if (data.length > TARGET_BYTES) {
    throw new RequestError(422, 'An image could not be compressed below 700KB.');
  }

  return { data, contentType: 'image/webp' };
}

export default async function handler(request: Request, _context: Context): Promise<Response> {
  try {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    enforceSameOrigin(request);

    const admin = await getAuthenticatedAdmin(request);
    requireSuperAdmin(admin);

    const db = database();
    const result = await db.pool.query(
      `SELECT id, content_type, image_data
       FROM catalog_images
       ORDER BY updated_at ASC`
    );

    let processed = 0;
    let optimized = 0;
    let skipped = 0;
    let failed = 0;
    let bytesBefore = 0;
    let bytesAfter = 0;
    const failures: string[] = [];

    for (const row of result.rows as Array<{ id: string; content_type: string; image_data: Buffer }>) {
      processed += 1;
      bytesBefore += row.image_data.length;

      const alreadyOptimized = row.content_type === 'image/webp' && row.image_data.length <= TARGET_BYTES;
      if (alreadyOptimized) {
        skipped += 1;
        bytesAfter += row.image_data.length;
        continue;
      }

      try {
        const output = await optimizeImage(row.image_data);
        await db.pool.query(
          `UPDATE catalog_images
           SET content_type = $1, image_data = $2, updated_at = NOW()
           WHERE id = $3`,
          [output.contentType, output.data, row.id],
        );
        optimized += 1;
        bytesAfter += output.data.length;
      } catch (error) {
        failed += 1;
        bytesAfter += row.image_data.length;
        failures.push(`${row.id}: ${error instanceof Error ? error.message : 'optimization failed'}`);
      }
    }

    return json({
      success: true,
      processed,
      optimized,
      skipped,
      failed,
      bytesBefore,
      bytesAfter,
      bytesSaved: Math.max(0, bytesBefore - bytesAfter),
      failures,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/admin/optimize-catalog-images',
  method: ['POST'],
};
