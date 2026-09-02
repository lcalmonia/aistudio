import type { Config } from '@netlify/functions';
import { database } from './_shared/database.mts';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

function mapClaim(row: any) {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    customerName: String(row.customer_name),
    perkId: String(row.perk_id),
    perkName: String(row.perk_name),
    redemptionType: row.redemption_type === 'points' ? 'points' : 'stamps',
    redemptionCost: Number(row.redemption_cost),
    status: String(row.status),
    requestedAt: row.requested_at,
    fulfilledAt: row.fulfilled_at || null,
  };
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const db = database();

    if (request.method === 'GET') {
      await requireAuthenticatedAdmin(request);
      const result = await db.pool.query(`
        SELECT id, customer_id, customer_name, perk_id, perk_name,
               redemption_type, redemption_cost, status, requested_at, fulfilled_at
        FROM reward_claims
        WHERE status = 'pending'
        ORDER BY requested_at ASC
      `);
      return json({ claims: result.rows.map(mapClaim) });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405);
    }

    enforceSameOrigin(request);
    const body = await readJsonObject(request);
    const action = String(body.action || '');

    if (action === 'request') {
      const customerId = String(body.customerId || '').trim();
      const perkId = String(body.perkId || '').trim();
      if (!customerId || !perkId) throw new RequestError(400, 'Customer and reward perk are required.');

      const customerResult = await db.pool.query(
        `SELECT id, name, stamps, points FROM customers WHERE id = $1 AND status = 'active' LIMIT 1`,
        [customerId],
      );
      const customer = customerResult.rows[0];
      if (!customer) throw new RequestError(404, 'Customer account not found.');

      const perkResult = await db.pool.query(
        `SELECT id, name, redemption_type, redemption_cost, active
         FROM loyalty_perks WHERE id = $1 LIMIT 1`,
        [perkId],
      );
      const perk = perkResult.rows[0];
      if (!perk || !perk.active) throw new RequestError(404, 'Reward perk is no longer available.');

      const balance = perk.redemption_type === 'points' ? Number(customer.points || 0) : Number(customer.stamps || 0);
      const cost = Number(perk.redemption_cost);
      if (balance < cost) {
        throw new RequestError(400, `Insufficient ${perk.redemption_type}.`);
      }

      const duplicate = await db.pool.query(
        `SELECT id FROM reward_claims
         WHERE customer_id = $1 AND perk_id = $2 AND status = 'pending' LIMIT 1`,
        [customerId, perkId],
      );
      if (duplicate.rows[0]) throw new RequestError(409, 'You already have a pending claim for this reward.');

      const id = crypto.randomUUID();
      const result = await db.pool.query(
        `INSERT INTO reward_claims
          (id, customer_id, customer_name, perk_id, perk_name, redemption_type, redemption_cost)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, customer_id, customer_name, perk_id, perk_name,
                   redemption_type, redemption_cost, status, requested_at, fulfilled_at`,
        [id, customer.id, customer.name, perk.id, perk.name, perk.redemption_type, cost],
      );
      return json({ claim: mapClaim(result.rows[0]) }, 201);
    }

    if (action === 'fulfill') {
      const admin = await requireAuthenticatedAdmin(request);
      const claimId = String(body.claimId || '').trim();
      if (!claimId) throw new RequestError(400, 'Claim ID is required.');

      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        const claimResult = await client.query(
          `SELECT * FROM reward_claims WHERE id = $1 AND status = 'pending' FOR UPDATE`,
          [claimId],
        );
        const claim = claimResult.rows[0];
        if (!claim) throw new RequestError(404, 'Reward claim is no longer pending.');

        const customerResult = await client.query(
          `SELECT id, stamps, points FROM customers WHERE id = $1 FOR UPDATE`,
          [claim.customer_id],
        );
        const customer = customerResult.rows[0];
        if (!customer) throw new RequestError(404, 'Customer account not found.');

        const field = claim.redemption_type === 'points' ? 'points' : 'stamps';
        const balance = Number(customer[field] || 0);
        if (balance < Number(claim.redemption_cost)) {
          throw new RequestError(400, `Customer no longer has enough ${claim.redemption_type}.`);
        }

        await client.query(
          `UPDATE customers SET ${field} = ${field} - $1, updated_at = NOW() WHERE id = $2`,
          [Number(claim.redemption_cost), claim.customer_id],
        );
        const result = await client.query(
          `UPDATE reward_claims
           SET status = 'fulfilled', fulfilled_at = NOW()
           WHERE id = $1
           RETURNING id, customer_id, customer_name, perk_id, perk_name,
                     redemption_type, redemption_cost, status, requested_at, fulfilled_at`,
          [claimId],
        );
        await client.query('COMMIT');
        return json({ claim: mapClaim(result.rows[0]), fulfilledBy: admin.displayName || admin.username });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    if (action === 'reject') {
      await requireAuthenticatedAdmin(request);
      const claimId = String(body.claimId || '').trim();
      if (!claimId) throw new RequestError(400, 'Claim ID is required.');
      const result = await db.pool.query(
        `UPDATE reward_claims SET status = 'rejected', fulfilled_at = NOW()
         WHERE id = $1 AND status = 'pending'
         RETURNING id, customer_id, customer_name, perk_id, perk_name,
                   redemption_type, redemption_cost, status, requested_at, fulfilled_at`,
        [claimId],
      );
      if (!result.rows[0]) throw new RequestError(404, 'Reward claim is no longer pending.');
      return json({ claim: mapClaim(result.rows[0]) });
    }

    throw new RequestError(400, 'Unknown action.');
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/reward-claims',
  method: ['GET', 'POST'],
};
