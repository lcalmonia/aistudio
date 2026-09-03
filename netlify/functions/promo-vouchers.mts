import type { Config } from '@netlify/functions';
import { database } from './_shared/database.mts';
import { requireAuthenticatedAdmin, requireSuperAdmin } from './_shared/auth.mts';
import { errorResponse, json, RequestError } from './_shared/http.mts';

const mapVoucher = (r: any) => ({
  id: String(r.id),
  code: String(r.code),
  description: String(r.description || ''),
  discountType: r.discount_type === 'fixed' ? 'fixed' : 'percentage',
  discountValue: Number(r.discount_value),
  minimumOrderAmount: Number(r.minimum_order_amount),
  maxUses: Number(r.max_uses),
  usedCount: Number(r.used_count),
  expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
  active: Boolean(r.active),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export default async function handler(request: Request): Promise<Response> {
  try {
    const db = database();

    if (request.method === 'GET') {
      const result = await db.pool.query(`
        SELECT * FROM promo_vouchers
        WHERE active = TRUE
          AND (expires_at IS NULL OR expires_at > NOW())
          AND (max_uses = 0 OR used_count < max_uses)
        ORDER BY created_at DESC
      `);
      return json({ vouchers: result.rows.map(mapVoucher) });
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

    const admin = await requireAuthenticatedAdmin(request);
    requireSuperAdmin(admin);
    const body: any = await request.json();
    const action = String(body.action || '');

    if (action === 'create') {
      const code = String(body.code || '').trim().toUpperCase();
      const description = String(body.description || '').trim();
      const discountType = body.discountType === 'fixed' ? 'fixed' : 'percentage';
      const discountValue = Number(body.discountValue);
      const minimumOrderAmount = Math.max(0, Number(body.minimumOrderAmount) || 0);
      const maxUses = Math.max(0, Math.floor(Number(body.maxUses) || 0));
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

      if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) {
        throw new RequestError(400, 'Voucher code must be 3–32 characters using letters, numbers, hyphens, or underscores.');
      }
      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        throw new RequestError(400, 'Discount value must be greater than zero.');
      }
      if (discountType === 'percentage' && discountValue > 100) {
        throw new RequestError(400, 'Percentage discount cannot exceed 100%.');
      }
      if (expiresAt && Number.isNaN(expiresAt.getTime())) {
        throw new RequestError(400, 'Invalid expiration date.');
      }
      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        throw new RequestError(400, 'Expiration must be in the future.');
      }

      const result = await db.pool.query(`
        INSERT INTO promo_vouchers
          (id, code, description, discount_type, discount_value, minimum_order_amount, max_uses, expires_at, active, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,NOW())
        RETURNING *
      `, [
        `voucher-${crypto.randomUUID()}`,
        code,
        description,
        discountType,
        discountValue,
        minimumOrderAmount,
        maxUses,
        expiresAt ? expiresAt.toISOString() : null,
      ]);

      return json({ voucher: mapVoucher(result.rows[0]) });
    }

    if (action === 'toggle') {
      const result = await db.pool.query(
        'UPDATE promo_vouchers SET active=NOT active, updated_at=NOW() WHERE id=$1 RETURNING *',
        [String(body.id)],
      );
      if (!result.rows[0]) throw new RequestError(404, 'Voucher not found.');
      return json({ voucher: mapVoucher(result.rows[0]) });
    }

    if (action === 'delete') {
      await db.pool.query('DELETE FROM promo_vouchers WHERE id=$1', [String(body.id)]);
      return json({ success: true });
    }

    if (action === 'validate') {
      const code = String(body.code || '').trim().toUpperCase();
      const subtotal = Math.max(0, Number(body.subtotal) || 0);
      if (!code) throw new RequestError(400, 'Enter a voucher code.');

      const result = await db.pool.query(`
        SELECT * FROM promo_vouchers
        WHERE code=$1
          AND active=TRUE
          AND (expires_at IS NULL OR expires_at > NOW())
          AND (max_uses = 0 OR used_count < max_uses)
        LIMIT 1
      `, [code]);
      const voucher = result.rows[0];
      if (!voucher) throw new RequestError(400, 'Invalid or expired voucher code.');

      const minimum = Number(voucher.minimum_order_amount || 0);
      if (subtotal < minimum) {
        throw new RequestError(400, `Minimum order for this voucher is ₱${minimum.toFixed(2)}.`);
      }

      const value = Number(voucher.discount_value);
      const discount = voucher.discount_type === 'fixed'
        ? Math.min(subtotal, value)
        : Math.min(subtotal, (subtotal * value) / 100);

      return json({
        valid: true,
        voucher: mapVoucher(voucher),
        discount,
      });
    }

    throw new RequestError(400, 'Unknown action.');
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/promo-vouchers',
  method: ['GET', 'POST'],
};
