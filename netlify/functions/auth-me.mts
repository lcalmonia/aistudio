import type { Config, Context } from '@netlify/functions';
import { clearAdminSessionCookie, getAuthenticatedAdmin, publicAdmin } from './_shared/auth.mts';
import { errorResponse, json } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);

  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      clearAdminSessionCookie(context);
      return json({ authenticated: false }, 401);
    }
    return json(publicAdmin(admin));
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/auth/me',
  method: 'GET',
};
