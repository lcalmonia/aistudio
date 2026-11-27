import type { Config, Context } from '@netlify/functions';
import { clearStaffSessionCookie, requireAuthenticatedStaff } from './_shared/staffAuth.mts';
import { errorResponse, json } from './_shared/http.mts';

export default async function handler(request: Request, context: Context): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);
  try {
    const staff = await requireAuthenticatedStaff(request);
    return json({ authenticated: true, staff });
  } catch (error) {
    clearStaffSessionCookie(context);
    const response = errorResponse(error);
    if (response.status === 401) return response;
    return response;
  }
}
export const config: Config = { path: '/api/staff/session', method: ['GET'] };
