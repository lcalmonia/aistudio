import type { Config, Context } from '@netlify/functions';
import { clearAdminSessionCookie, invalidateRequestSession } from './_shared/auth.mts';
import { enforceSameOrigin, errorResponse, json } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    enforceSameOrigin(request);
    await invalidateRequestSession(request);
    clearAdminSessionCookie(context);
    return json({ authenticated: false });
  } catch (error) {
    clearAdminSessionCookie(context);
    const response = errorResponse(error);
    if (response.status < 500) return response;
    return json({ authenticated: false });
  }
}

export const config: Config = {
  path: '/api/auth/logout',
  method: 'POST',
};
