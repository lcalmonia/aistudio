import type { Config, Context } from '@netlify/functions';
import { clearStaffSessionCookie, invalidateStaffSession } from './_shared/staffAuth.mts';
import { enforceSameOrigin, errorResponse, json } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  try {
    enforceSameOrigin(request);
    await invalidateStaffSession(request);
    clearStaffSessionCookie(context);
    return json({ authenticated: false });
  } catch (error) {
    clearStaffSessionCookie(context);
    return errorResponse(error);
  }
}
export const config: Config = { path: '/api/staff/logout', method: ['POST'] };
