import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Context } from '@netlify/functions';
import { database } from './database.mts';
import { RequestError } from './http.mts';
import { computeDateRangeBoundaries } from './dateRange.mts';

export const ADMIN_SESSION_COOKIE = 'iluvkeyks_admin_session';
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

export interface AuthenticatedAdmin {
  authenticated: true;
  userId: string | null;
  role: AdminRole;
  username: string;
  displayName: string;
  hasProfilePicture: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  sessionId: string;
}

interface SessionRow {
  session_id: string;
  role: AdminRole;
  staff_user_id: string | null;
  username: string | null;
  display_name: string | null;
  active: boolean | null;
  has_profile_picture: boolean;
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function secureStringEqual(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function getSuperAdminCredentials(): { username: string; password: string } | null {
  const username = process.env.SUPER_ADMIN_USERNAME;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!username || !password) return null;
  return { username, password };
}

export function verifySuperAdminCredentials(username: string, password: string): boolean {
  const credentials = getSuperAdminCredentials();
  if (!credentials) return false;
  return secureStringEqual(username, credentials.username) && secureStringEqual(password, credentials.password);
}

export async function createAdminSession(role: AdminRole, staffUserId: string | null): Promise<string> {
  const db = database();
  const token = randomBytes(32).toString('base64url');
  const sessionId = `session_${randomBytes(16).toString('hex')}`;
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_SECONDS * 1000);

  await db.sql`
    DELETE FROM admin_sessions
    WHERE expires_at <= NOW()
       OR (invalidated_at IS NOT NULL AND invalidated_at < NOW() - INTERVAL '1 day')
  `;
  await db.sql`
    INSERT INTO admin_sessions (id, token_hash, staff_user_id, role, expires_at)
    VALUES (${sessionId}, ${tokenHash(token)}, ${staffUserId}, ${role}, ${expiresAt})
  `;

  return token;
}

export function setAdminSessionCookie(context: Context, request: Request, token: string): void {
  context.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'Strict',
    path: '/',
    maxAge: ADMIN_SESSION_SECONDS,
  });
}

export function clearAdminSessionCookie(context: Context): void {
  context.cookies.delete({ name: ADMIN_SESSION_COOKIE, path: '/' });
}

export function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return null;
}

export async function invalidateRequestSession(request: Request): Promise<void> {
  const token = readCookie(request, ADMIN_SESSION_COOKIE);
  if (!token) return;
  const db = database();
  await db.sql`
    UPDATE admin_sessions
    SET invalidated_at = COALESCE(invalidated_at, NOW())
    WHERE token_hash = ${tokenHash(token)}
  `;
}

export async function invalidateAdminSessions(staffUserId: string): Promise<void> {
  const db = database();
  await db.sql`
    UPDATE admin_sessions
    SET invalidated_at = COALESCE(invalidated_at, NOW())
    WHERE staff_user_id = ${staffUserId} AND invalidated_at IS NULL
  `;
}

export async function setAdminAccountActive(
  staffUserId: string,
  active: boolean,
): Promise<{ id: string; username: string; name: string; active: boolean; updated_at: string }> {
  const db = database();
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE staff_users
       SET active = $1, updated_at = NOW()
       WHERE id = $2 AND role IN ('admin', 'super_admin')
       RETURNING id, username, name, active, updated_at`,
      [active, staffUserId],
    );
    if (!active) {
      await client.query(
        `UPDATE admin_sessions
         SET invalidated_at = COALESCE(invalidated_at, NOW())
         WHERE staff_user_id = $1 AND invalidated_at IS NULL`,
        [staffUserId],
      );
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function changeAdminPassword(staffUserId: string, passwordHash: string): Promise<void> {
  const db = database();
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE staff_users
       SET passcode_hash = $1, updated_at = NOW()
       WHERE id = $2 AND role IN ('admin', 'super_admin')`,
      [passwordHash, staffUserId],
    );
    await client.query(
      `UPDATE admin_sessions
       SET invalidated_at = COALESCE(invalidated_at, NOW())
       WHERE staff_user_id = $1 AND invalidated_at IS NULL`,
      [staffUserId],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getAuthenticatedAdmin(request: Request): Promise<AuthenticatedAdmin | null> {
  const token = readCookie(request, ADMIN_SESSION_COOKIE);
  if (!token) return null;

  const db = database();
  const rows = (await db.sql`
    SELECT
      sessions.id AS session_id,
      sessions.role,
      sessions.staff_user_id,
      staff.username,
      staff.name AS display_name,
      staff.active,
      CASE
        WHEN sessions.role = 'SUPER_ADMIN' AND sessions.staff_user_id IS NULL THEN super_profile.profile_picture IS NOT NULL
        ELSE staff.profile_picture IS NOT NULL
      END AS has_profile_picture
    FROM admin_sessions AS sessions
    LEFT JOIN staff_users AS staff ON staff.id = sessions.staff_user_id
    LEFT JOIN super_admin_profile AS super_profile ON super_profile.id = 'default'
    WHERE sessions.token_hash = ${tokenHash(token)}
      AND sessions.invalidated_at IS NULL
      AND sessions.expires_at > NOW()
    LIMIT 1
  `) as SessionRow[];

  const session = rows[0];
  if (!session) return null;

  if (session.staff_user_id && (!session.active || !session.username)) {
    return null;
  }

  if (session.staff_user_id === null && (!getSuperAdminCredentials() || session.role !== 'SUPER_ADMIN')) {
    return null;
  }

  await db.sql`UPDATE admin_sessions SET last_seen_at = NOW() WHERE id = ${session.session_id}`;

  const isEnvSuperAdmin = session.role === 'SUPER_ADMIN' && session.staff_user_id === null;
  const superCredentials = isEnvSuperAdmin ? getSuperAdminCredentials() : null;
  const username = superCredentials ? superCredentials.username : session.username!;
  const displayName = superCredentials ? superCredentials.username : session.display_name || username;
  return {
    authenticated: true,
    userId: session.staff_user_id,
    role: session.role,
    username,
    displayName,
    hasProfilePicture: Boolean(session.has_profile_picture),
    isSuperAdmin: session.role === 'SUPER_ADMIN',
    isAdmin: session.role === 'ADMIN',
    sessionId: session.session_id,
  };
}

export async function requireAuthenticatedAdmin(request: Request): Promise<AuthenticatedAdmin> {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) throw new RequestError(401, 'Authentication required.');
  return admin;
}

export function requireSuperAdmin(admin: AuthenticatedAdmin): void {
  if (!admin.isSuperAdmin) {
    throw new RequestError(403, 'Super Admin access required for catalog and modifier configuration.');
  }
}

export function requireAdminAccountManager(admin: AuthenticatedAdmin): void {
  if (!admin.isSuperAdmin && !admin.isAdmin) {
    throw new RequestError(403, 'Administrator access required.');
  }
}

export function enforceAdminCreationRole(
  actorOrRole?: AuthenticatedAdmin | unknown,
  requestedRole?: unknown,
): AdminRole {
  if (actorOrRole && typeof actorOrRole === 'object' && 'isSuperAdmin' in actorOrRole) {
    const actor = actorOrRole as AuthenticatedAdmin;
    if (!actor.isSuperAdmin) {
      throw new RequestError(403, 'Only Super Admin can create administrative accounts.');
    }
    if (requestedRole === undefined || requestedRole === null || requestedRole === 'ADMIN') {
      return 'ADMIN';
    }
    if (requestedRole === 'SUPER_ADMIN') {
      return 'SUPER_ADMIN';
    }
    throw new RequestError(400, 'Invalid account role. Allowed roles: ADMIN, SUPER_ADMIN.');
  }

  const role = actorOrRole;
  if (role !== undefined && role !== 'ADMIN') {
    throw new RequestError(403, 'Only ADMIN accounts can be created.');
  }
  return 'ADMIN';
}

export function enforceStatsDateRangeAccess(
  admin: AuthenticatedAdmin,
  options: {
    startDate?: string;
    endDate?: string;
    preset?: string;
    limit?: number;
    isAllTime?: boolean;
  },
): void {
  if (admin.isSuperAdmin) {
    return;
  }

  if (admin.isAdmin) {
    if (options.preset) {
      if (options.preset !== 'today' && options.preset !== 'yesterday') {
        throw new RequestError(403, 'Admins are restricted to viewing stats for Today and Yesterday only.');
      }
    }

    if (options.isAllTime || (options.limit && options.limit > 200 && !options.startDate && !options.endDate)) {
      throw new RequestError(403, 'Admins are restricted to viewing stats for Today and Yesterday only.');
    }

    if (options.startDate || options.endDate) {
      const today = computeDateRangeBoundaries('today');
      const yesterday = computeDateRangeBoundaries('yesterday');

      const startMs = options.startDate ? new Date(options.startDate).getTime() : NaN;
      const endMs = options.endDate ? new Date(options.endDate).getTime() : NaN;

      const todayStartMs = new Date(today.startDate!).getTime();
      const todayEndMs = new Date(today.endDate!).getTime();
      const yesterdayStartMs = new Date(yesterday.startDate!).getTime();
      const yesterdayEndMs = new Date(yesterday.endDate!).getTime();

      const MARGIN_MS = 5 * 60 * 1000;
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      const isToday =
        (!isNaN(startMs) ? startMs >= todayStartMs - MARGIN_MS : true) &&
        (!isNaN(endMs) ? endMs <= todayEndMs + MARGIN_MS : true) &&
        (!isNaN(startMs) && !isNaN(endMs) ? endMs >= startMs && (endMs - startMs) <= (ONE_DAY_MS + MARGIN_MS) : true);

      const isYesterday =
        (!isNaN(startMs) ? startMs >= yesterdayStartMs - MARGIN_MS && startMs <= yesterdayEndMs + MARGIN_MS : true) &&
        (!isNaN(endMs) ? endMs <= yesterdayEndMs + MARGIN_MS && endMs >= yesterdayStartMs - MARGIN_MS : true) &&
        (!isNaN(startMs) && !isNaN(endMs) ? endMs >= startMs && (endMs - startMs) <= (ONE_DAY_MS + MARGIN_MS) : true);

      if (!isToday && !isYesterday) {
        throw new RequestError(403, 'Admins are restricted to viewing stats for Today and Yesterday only.');
      }
    }

    return;
  }

  throw new RequestError(403, 'Administrator access required.');
}

export function canViewAdminAccount(
  admin: AuthenticatedAdmin,
  accountId: string,
  createdByStaffUserId: string | null,
): boolean {
  return admin.isSuperAdmin || admin.userId === accountId || admin.userId === createdByStaffUserId;
}

export function canChangeAdminAccountStatus(
  admin: AuthenticatedAdmin,
  accountId: string,
  createdByStaffUserId: string | null,
): boolean {
  return admin.isSuperAdmin || (admin.userId !== accountId && admin.userId === createdByStaffUserId);
}

export function canResetAdminAccountPassword(
  admin: AuthenticatedAdmin,
  accountId: string,
  createdByStaffUserId: string | null,
): boolean {
  return admin.isSuperAdmin || admin.userId === accountId || admin.userId === createdByStaffUserId;
}

export function publicAdmin(admin: AuthenticatedAdmin) {
  return {
    authenticated: true as const,
    userId: admin.userId,
    role: admin.role,
    username: admin.username,
    displayName: admin.displayName,
    hasProfilePicture: admin.hasProfilePicture,
    profilePictureUrl: admin.hasProfilePicture ? '/api/auth/profile-picture' : null,
  };
}
