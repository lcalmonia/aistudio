import { createHash, randomBytes } from 'node:crypto';
import type { Context } from '@netlify/functions';
import { database } from './database.mts';
import { RequestError } from './http.mts';

export const STAFF_SESSION_COOKIE = 'iluvkeyks_staff_session';
const STAFF_SESSION_SECONDS = 12 * 60 * 60;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function readStaffCookie(request: Request): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator >= 0 && part.slice(0, separator).trim() === STAFF_SESSION_COOKIE) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return null;
}

export async function createStaffSession(staffUserId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const db = database();
  await db.sql`DELETE FROM staff_sessions WHERE expires_at <= NOW() OR (invalidated_at IS NOT NULL AND invalidated_at < NOW() - INTERVAL '1 day')`;
  await db.sql`
    INSERT INTO staff_sessions (id, token_hash, staff_user_id, expires_at)
    VALUES (${'staff_session_' + randomBytes(16).toString('hex')}, ${hashToken(token)}, ${staffUserId}, ${new Date(Date.now() + STAFF_SESSION_SECONDS * 1000)})
  `;
  return token;
}

export function setStaffSessionCookie(context: Context, request: Request, token: string): void {
  context.cookies.set({
    name: STAFF_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'Strict',
    path: '/',
    maxAge: STAFF_SESSION_SECONDS,
  });
}

export function clearStaffSessionCookie(context: Context): void {
  context.cookies.delete({ name: STAFF_SESSION_COOKIE, path: '/' });
}

export async function invalidateStaffSession(request: Request): Promise<void> {
  const token = readStaffCookie(request);
  if (!token) return;
  const db = database();
  await db.sql`UPDATE staff_sessions SET invalidated_at = COALESCE(invalidated_at, NOW()) WHERE token_hash = ${hashToken(token)}`;
}

export async function requireAuthenticatedStaff(request: Request): Promise<{ id: string; username: string; displayName: string }> {
  const token = readStaffCookie(request);
  if (!token) throw new RequestError(401, 'Staff sign-in required.');
  const db = database();
  const rows = await db.sql`
    SELECT staff.id, staff.username, staff.name AS display_name
    FROM staff_sessions AS sessions
    JOIN staff_users AS staff ON staff.id = sessions.staff_user_id
    WHERE sessions.token_hash = ${hashToken(token)}
      AND sessions.invalidated_at IS NULL
      AND sessions.expires_at > NOW()
      AND staff.role = 'staff'
      AND staff.active = TRUE
    LIMIT 1
  `;
  const staff = rows[0] as { id: string; username: string; display_name: string } | undefined;
  if (!staff) throw new RequestError(401, 'Your staff session is no longer valid. Please sign in again.');
  return { id: staff.id, username: staff.username, displayName: staff.display_name };
}

export async function invalidateStaffSessions(staffUserId: string): Promise<void> {
  const db = database();
  await db.sql`UPDATE staff_sessions SET invalidated_at = COALESCE(invalidated_at, NOW()) WHERE staff_user_id = ${staffUserId} AND invalidated_at IS NULL`;
}
