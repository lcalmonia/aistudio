import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import { enforceSameOrigin, errorResponse, json, RequestError } from './_shared/http.mts';
import { MAX_PROFILE_PICTURE_BYTES, validateProfilePicture } from './_shared/profile-picture.mts';

interface ProfilePictureRow {
  profile_picture: Uint8Array | null;
  profile_picture_content_type: string | null;
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const admin = await requireAuthenticatedAdmin(request);
    const db = database();

    if (request.method === 'GET') {
      const rows = admin.userId === null
        ? ((await db.sql`
            SELECT profile_picture, profile_picture_content_type
            FROM super_admin_profile
            WHERE id = 'default'
          `) as ProfilePictureRow[])
        : ((await db.sql`
            SELECT profile_picture, profile_picture_content_type
            FROM staff_users
            WHERE id = ${admin.userId} AND role IN ('admin', 'super_admin')
          `) as ProfilePictureRow[]);
      const picture = rows[0];
      if (!picture?.profile_picture || !picture.profile_picture_content_type) {
        throw new RequestError(404, 'No profile picture is set.');
      }

      return new Response(picture.profile_picture, {
        headers: {
          'Cache-Control': 'private, no-store',
          'Content-Type': picture.profile_picture_content_type,
          'Content-Disposition': 'inline',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    if (request.method === 'PUT') {
      enforceSameOrigin(request);
      const declaredLength = Number(request.headers.get('content-length') || 0);
      if (declaredLength > MAX_PROFILE_PICTURE_BYTES) {
        throw new RequestError(413, 'Profile pictures must be no larger than 2 MB.');
      }

      const data = new Uint8Array(await request.arrayBuffer());
      const contentType = validateProfilePicture(request.headers.get('content-type'), data);
      const image = Buffer.from(data);

      if (admin.userId === null) {
        await db.sql`
          INSERT INTO super_admin_profile (
            id, profile_picture, profile_picture_content_type, profile_picture_size,
            profile_picture_updated_at, updated_at
          )
          VALUES ('default', ${image}, ${contentType}, ${data.length}, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            profile_picture = EXCLUDED.profile_picture,
            profile_picture_content_type = EXCLUDED.profile_picture_content_type,
            profile_picture_size = EXCLUDED.profile_picture_size,
            profile_picture_updated_at = NOW(),
            updated_at = NOW()
        `;
      } else {
        await db.sql`
          UPDATE staff_users
          SET profile_picture = ${image},
              profile_picture_content_type = ${contentType},
              profile_picture_size = ${data.length},
              profile_picture_updated_at = NOW(),
              updated_at = NOW()
          WHERE id = ${admin.userId} AND role IN ('admin', 'super_admin')
        `;
      }
      return json({ updated: true, profilePictureUrl: '/api/auth/profile-picture' });
    }

    if (request.method === 'DELETE') {
      enforceSameOrigin(request);
      if (admin.userId === null) {
        await db.sql`
          UPDATE super_admin_profile
          SET profile_picture = NULL,
              profile_picture_content_type = NULL,
              profile_picture_size = NULL,
              profile_picture_updated_at = NOW(),
              updated_at = NOW()
          WHERE id = 'default'
        `;
      } else {
        await db.sql`
          UPDATE staff_users
          SET profile_picture = NULL,
              profile_picture_content_type = NULL,
              profile_picture_size = NULL,
              profile_picture_updated_at = NOW(),
              updated_at = NOW()
          WHERE id = ${admin.userId} AND role IN ('admin', 'super_admin')
        `;
      }
      return json({ removed: true });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/auth/profile-picture',
  method: ['GET', 'PUT', 'DELETE'],
};
