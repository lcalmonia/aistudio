import type { Config, Context } from '@netlify/functions';
import {
  createAdminSession,
  normalizeUsername,
  publicAdmin,
  setAdminSessionCookie,
  verifySuperAdminCredentials,
} from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, requireString } from './_shared/http.mts';
import { verifyPassword } from './_shared/password.mts';

const DUMMY_PASSWORD_HASH =
  'scrypt$32768$8$1$jhZgDMKz7QUdCGb3crdFSQ$WkpkNGh_YU8DsRzUzrdFtOcs8Trb2doXu1KS__AqSnXCVwF7MN9IgiHGnO1zHi1rW6112WiSCWi9CoPkW0Z8ZA';

interface AdminLoginRow {
  id: string;
  username: string;
  name: string;
  passcode_hash: string | null;
  active: boolean;
  has_profile_picture: boolean;
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    enforceSameOrigin(request);
    const body = await readJsonObject(request);
    const username = requireString(body.username, 'Username', { max: 128 });
    const password = requireString(body.password, 'Password', { max: 128, trim: false });
    const normalizedUsername = normalizeUsername(username);
    const db = database();
    const rows = (await db.sql`
      SELECT
        id,
        username,
        name,
        passcode_hash,
        active,
        profile_picture IS NOT NULL AS has_profile_picture
      FROM staff_users
      WHERE role = 'admin' AND LOWER(username) = ${normalizedUsername}
      LIMIT 1
    `) as AdminLoginRow[];
    const account = rows[0];

    const adminPasswordValid = await verifyPassword(password, account?.passcode_hash || DUMMY_PASSWORD_HASH);
    const superAdminValid = verifySuperAdminCredentials(username, password);

    if (superAdminValid) {
      const profileRows = await db.sql`
        SELECT profile_picture IS NOT NULL AS has_profile_picture
        FROM super_admin_profile
        WHERE id = 'default'
      `;
      const hasProfilePicture = Boolean(profileRows[0]?.has_profile_picture);
      const token = await createAdminSession('SUPER_ADMIN', null);
      setAdminSessionCookie(context, request, token);
      return json({
        authenticated: true,
        role: 'SUPER_ADMIN',
        username,
        displayName: username,
        userId: null,
        hasProfilePicture,
        profilePictureUrl: hasProfilePicture ? '/api/auth/profile-picture' : null,
      });
    }

    if (!account || !account.active || !adminPasswordValid) {
      return json({ error: 'Invalid username or password.' }, 401);
    }

    const token = await createAdminSession('ADMIN', account.id);
    setAdminSessionCookie(context, request, token);
    return json(
      publicAdmin({
        authenticated: true,
        userId: account.id,
        role: 'ADMIN',
        username: account.username,
        displayName: account.name,
        hasProfilePicture: account.has_profile_picture,
        isSuperAdmin: false,
        isAdmin: true,
        sessionId: '',
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/auth/login',
  method: 'POST',
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: ['ip'],
    windowSize: 60,
    windowLimit: 10,
  },
};
