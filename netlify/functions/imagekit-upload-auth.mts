import { createHmac, randomUUID } from 'node:crypto';
import type { Config, Context } from '@netlify/functions';
import { getAuthenticatedAdmin, requireSuperAdmin } from './_shared/auth.mts';
import { enforceSameOrigin, errorResponse, json, RequestError } from './_shared/http.mts';

const AUTH_TTL_SECONDS = 15 * 60;

export default async function handler(request: Request, _context: Context): Promise<Response> {
  try {
    if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);

    enforceSameOrigin(request);

    const admin = await getAuthenticatedAdmin(request);
    requireSuperAdmin(admin);

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();

    if (!privateKey || !publicKey) {
      return json(
        {
          error: 'ImageKit is not configured on the server.',
          code: 'IMAGEKIT_NOT_CONFIGURED',
        },
        503,
      );
    }

    const expire = Math.floor(Date.now() / 1000) + AUTH_TTL_SECONDS;
    const token = randomUUID();
    const signature = createHmac('sha1', privateKey)
      .update(`${token}${expire}`)
      .digest('hex');

    return json({
      token,
      expire,
      signature,
      publicKey,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/imagekit-upload-auth',
  method: ['GET'],
};
