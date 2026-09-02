import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';
import { hashPassword } from './_shared/password.mts';

function mapCustomer(row: Record<string, unknown>) {
  const rawCreatedAt = row.created_at;
  const createdAt = rawCreatedAt instanceof Date
    ? rawCreatedAt.toISOString().slice(0, 10)
    : String(rawCreatedAt || '').slice(0, 10);

  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    mobile: String(row.mobile),
    address: String(row.address),
    createdAt,
    status: row.status === 'inactive' ? 'inactive' : 'active',
    role: 'customer',
    stamps: Number(row.stamps) || 0,
    points: Number(row.points) || 0,
  };
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      await requireAuthenticatedAdmin(request);

      const db = database();
      const result = await db.pool.query(`
        SELECT id, name, email, mobile, address, status, role, stamps, points, created_at
        FROM customers
        ORDER BY created_at DESC, name ASC
      `);

      return json({ customers: result.rows.map(mapCustomer) });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      const body = await readJsonObject(request);
      const password = typeof body.password === 'string' ? body.password : '';
      if (password && (password.length < 6 || password.length > 128)) {
        throw new RequestError(400, 'Password must be between 6 and 128 characters.');
      }

      const id = typeof body.id === 'string' ? body.id.trim() : '';
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const mobile = typeof body.mobile === 'string' ? body.mobile.trim() : '';
      const address = typeof body.address === 'string' ? body.address.trim() : '';
      const stamps = Number.isFinite(Number(body.stamps))
        ? Math.max(0, Math.floor(Number(body.stamps)))
        : 1;
      const points = Number.isFinite(Number(body.points))
        ? Math.max(0, Math.floor(Number(body.points)))
        : 50;

      if (!id || !name || !email || !mobile || !address) {
        throw new RequestError(400, 'Customer name, email, mobile, address, and ID are required.');
      }

      const db = database();
      const existing = await db.pool.query(
        `SELECT id FROM customers WHERE email = $1 OR id = $2 LIMIT 1`,
        [email, id]
      );

      if (existing.rows.length > 0) {
        throw new RequestError(409, 'A customer account with this email or ID already exists.');
      }

      const passwordHash = password ? await hashPassword(password) : null;
      const result = await db.pool.query(
        `INSERT INTO customers (
          id, name, email, mobile, address, status, role, stamps, points, password_hash, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'active', 'customer', $6, $7, $8, NOW(), NOW())
        RETURNING id, name, email, mobile, address, status, role, stamps, points, created_at`,
        [id, name, email, mobile, address, stamps, points, passwordHash]
      );

      return json({ customer: mapCustomer(result.rows[0]) }, 201);
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/customers',
  method: ['GET', 'POST'],
};
