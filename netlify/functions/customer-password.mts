import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin, requireSuperAdmin } from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';
import { hashPassword, verifyPassword } from './_shared/password.mts';

const DEFAULT_CUSTOMER_PASSWORD = 'password1234';

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
      const admin = await requireAuthenticatedAdmin(request);
      const db = database();
      const result = await db.pool.query(`
        SELECT r.id, r.customer_id, r.requested_at, r.status, r.reviewed_at,
               c.name, c.email, c.mobile
        FROM customer_password_reset_requests r
        INNER JOIN customers c ON c.id = r.customer_id
        WHERE r.status = 'pending'
        ORDER BY r.requested_at DESC
      `);

      return json({
        requests: result.rows.map((row) => ({
          id: String(row.id),
          customerId: String(row.customer_id),
          customerName: String(row.name),
          email: String(row.email),
          mobile: String(row.mobile),
          requestedAt: row.requested_at instanceof Date
            ? row.requested_at.toISOString()
            : String(row.requested_at),
          status: String(row.status),
          reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
        })),
        canApprove: admin.isSuperAdmin,
      });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      const body = await readJsonObject(request);
      const action = typeof body.action === 'string' ? body.action : '';
      const db = database();

      if (action === 'login') {
        const identifier = typeof body.identifier === 'string' ? body.identifier.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        if (!identifier || !password) throw new RequestError(400, 'Email/mobile and password are required.');

        const normalizedMobile = identifier.replace(/\D/g, '');
        const result = await db.pool.query(
          `SELECT id, name, email, mobile, address, status, role, stamps, points, created_at, password_hash
           FROM customers
           WHERE LOWER(email) = $1
              OR regexp_replace(mobile, '\\D', '', 'g') = $2
              OR LOWER(id) = $1
           LIMIT 1`,
          [identifier, normalizedMobile]
        );
        const customer = result.rows[0];
        if (!customer) throw new RequestError(401, 'Account not found. Please verify your email or phone number.');
        if (customer.status === 'inactive') throw new RequestError(403, 'This account has been deactivated. Please contact cafe support.');
        if (!customer.password_hash) throw new RequestError(409, 'This account needs a password reset. Please use Forgot Password.');

        const valid = await verifyPassword(password, String(customer.password_hash));
        if (!valid) throw new RequestError(401, 'Incorrect password. Please verify your credentials.');

        return json({ customer: mapCustomer(customer) });
      }

      if (action === 'request') {
        const identifier = typeof body.identifier === 'string' ? body.identifier.trim().toLowerCase() : '';
        if (!identifier) throw new RequestError(400, 'Email or mobile number is required.');

        const normalizedMobile = identifier.replace(/\D/g, '');
        const result = await db.pool.query(
          `SELECT id FROM customers
           WHERE LOWER(email) = $1
              OR regexp_replace(mobile, '\\D', '', 'g') = $2
           LIMIT 1`,
          [identifier, normalizedMobile]
        );

        const customer = result.rows[0];
        if (!customer) throw new RequestError(404, 'No customer account was found with those details.');

        const existing = await db.pool.query(
          `SELECT id FROM customer_password_reset_requests
           WHERE customer_id = $1 AND status = 'pending' LIMIT 1`,
          [customer.id]
        );

        if (existing.rows.length === 0) {
          await db.pool.query(
            `INSERT INTO customer_password_reset_requests (customer_id) VALUES ($1)`,
            [customer.id]
          );
        }

        return json({ requested: true });
      }

      const admin = await requireAuthenticatedAdmin(request);
      requireSuperAdmin(admin);

      if (action === 'approve') {
        const requestId = Number(body.requestId);
        if (!Number.isSafeInteger(requestId)) throw new RequestError(400, 'Reset request ID is required.');

        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');
          const requests = await client.query(
            `SELECT customer_id FROM customer_password_reset_requests
             WHERE id = $1 AND status = 'pending' FOR UPDATE`,
            [requestId]
          );
          if (requests.rows.length === 0) throw new RequestError(404, 'Password reset request is no longer pending.');

          const customerId = requests.rows[0].customer_id;
          const passwordHash = await hashPassword(DEFAULT_CUSTOMER_PASSWORD);

          await client.query(
            `UPDATE customers SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
            [passwordHash, customerId]
          );
          await client.query(
            `UPDATE customer_password_reset_requests
             SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
             WHERE id = $2`,
            [admin.userId || admin.username, requestId]
          );
          await client.query('COMMIT');

          return json({ approved: true, customerId, defaultPassword: DEFAULT_CUSTOMER_PASSWORD });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }

      if (action === 'reject') {
        const requestId = Number(body.requestId);
        if (!Number.isSafeInteger(requestId)) throw new RequestError(400, 'Reset request ID is required.');

        const result = await db.pool.query(
          `UPDATE customer_password_reset_requests
           SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $1
           WHERE id = $2 AND status = 'pending'
           RETURNING id`,
          [admin.userId || admin.username, requestId]
        );
        if (result.rows.length === 0) throw new RequestError(404, 'Password reset request is no longer pending.');

        return json({ rejected: true });
      }

      if (action === 'reset') {
        const customerId = typeof body.customerId === 'string' ? body.customerId.trim() : '';
        if (!customerId) throw new RequestError(400, 'Customer ID is required.');

        const passwordHash = await hashPassword(DEFAULT_CUSTOMER_PASSWORD);
        const result = await db.pool.query(
          `UPDATE customers SET password_hash = $1, updated_at = NOW()
           WHERE id = $2
           RETURNING id, name, email, mobile, address, status, role, stamps, points, created_at`,
          [passwordHash, customerId]
        );
        if (result.rows.length === 0) throw new RequestError(404, 'Customer account not found.');

        return json({ reset: true, customer: mapCustomer(result.rows[0]), defaultPassword: DEFAULT_CUSTOMER_PASSWORD });
      }

      if (action === 'delete') {
        const customerId = typeof body.customerId === 'string' ? body.customerId.trim() : '';
        if (!customerId) throw new RequestError(400, 'Customer ID is required.');

        const result = await db.pool.query(
          `DELETE FROM customers WHERE id = $1 RETURNING id`,
          [customerId]
        );
        if (result.rows.length === 0) throw new RequestError(404, 'Customer account not found.');

        return json({ deleted: true, customerId });
      }

      throw new RequestError(400, 'Unsupported customer password action.');
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/customer-password',
  method: ['GET', 'POST'],
};
