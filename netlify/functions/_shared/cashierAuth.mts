import { createHash, randomBytes } from 'node:crypto';
import type { Context } from '@netlify/functions';
import { database } from './database.mts';
import { RequestError } from './http.mts';

export const CASHIER_COOKIE = 'iluvkeyks_cashier_session';
const SESSION_SECONDS = 12 * 60 * 60;
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createCashierSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const db = database();
  await db.sql`DELETE FROM cashier_sessions WHERE expires_at <= NOW() OR (invalidated_at IS NOT NULL AND invalidated_at < NOW() - INTERVAL '1 day')`;
  await db.sql`INSERT INTO cashier_sessions (id, token_hash, cashier_user_id, expires_at)
    VALUES (${'cashier_session_' + randomBytes(16).toString('hex')}, ${hash(token)}, ${userId}, ${new Date(Date.now() + SESSION_SECONDS * 1000)})`;
  return token;
}
export function setCashierCookie(context: Context, request: Request, token: string) {
  context.cookies.set({ name: CASHIER_COOKIE, value: token, httpOnly: true, secure: new URL(request.url).protocol === 'https:', sameSite: 'Strict', path: '/', maxAge: SESSION_SECONDS });
}
export function clearCashierCookie(context: Context) { context.cookies.delete({ name: CASHIER_COOKIE, path: '/' }); }
export async function invalidateCashierSession(request: Request) {
  const token = readToken(request);
  if (!token) return;
  const db = database();
  await db.sql`UPDATE cashier_sessions SET invalidated_at = COALESCE(invalidated_at, NOW()) WHERE token_hash = ${hash(token)}`;
}
function readToken(request: Request): string | null {
  const value = request.headers.get('cookie') || '';
  for (const part of value.split(';')) {
    const i = part.indexOf('=');
    if (i >= 0 && part.slice(0, i).trim() === CASHIER_COOKIE) return part.slice(i + 1).trim();
  }
  return null;
}
export async function invalidateCashierSessions(userId: string) {
  const db = database();
  await db.sql`UPDATE cashier_sessions SET invalidated_at = COALESCE(invalidated_at, NOW()) WHERE cashier_user_id = ${userId} AND invalidated_at IS NULL`;
}
export async function requireAuthenticatedCashier(request: Request) {
  const token = readToken(request);
  if (!token) throw new RequestError(401, 'Cashier sign-in required.');
  const db = database();
  const rows = await db.sql`SELECT u.id, u.username, u.name AS display_name
    FROM cashier_sessions s JOIN cashier_users u ON u.id = s.cashier_user_id
    WHERE s.token_hash = ${hash(token)} AND s.invalidated_at IS NULL AND s.expires_at > NOW() AND u.active = TRUE LIMIT 1`;
  const user = rows[0] as {id:string;username:string;display_name:string}|undefined;
  if (!user) throw new RequestError(401, 'Your cashier session is no longer valid. Please sign in again.');
  return {id:user.id,username:user.username,displayName:user.display_name};
}
