import { database } from './_shared/database.mts';
import { requireAdmin, requireSuperAdmin } from './_shared/auth.mts';

const defaults = { welcomeEnabled: false, welcomeStamps: 0, welcomePoints: 0, stampMinimumPurchase: 0, stampsPerQualifyingOrder: 1, pointsMinimumPurchase: 0, pointsMode: 'ratio' as const, fixedPoints: 0, pointsPerCurrency: 1, currencyUnit: 10, stampCycle: 10 };

const mapSettings = (r: any) => ({
  welcomeEnabled: Boolean(r.welcome_enabled), welcomeStamps: Number(r.welcome_stamps), welcomePoints: Number(r.welcome_points),
  stampMinimumPurchase: Number(r.stamp_minimum_purchase), stampsPerQualifyingOrder: Number(r.stamps_per_qualifying_order),
  pointsMinimumPurchase: Number(r.points_minimum_purchase), pointsMode: r.points_mode === 'fixed' ? 'fixed' : 'ratio',
  fixedPoints: Number(r.fixed_points), pointsPerCurrency: Number(r.points_per_currency), currencyUnit: Number(r.currency_unit), stampCycle: Number(r.stamp_cycle),
});
const mapPerk = (r: any) => ({ id: String(r.id), name: String(r.name), description: String(r.description || ''), rewardSource: r.reward_source, menuItemId: r.menu_item_id || undefined, customItemName: r.custom_item_name || undefined, redemptionType: r.redemption_type, redemptionCost: Number(r.redemption_cost), active: Boolean(r.active), createdAt: r.created_at, updatedAt: r.updated_at });

export default async function handler(request: Request): Promise<Response> {
  const db = database();
  if (request.method === 'GET') {
    const result = await db.pool.query(`SELECT * FROM loyalty_settings WHERE id = 'default' LIMIT 1`);
    const perks = await db.pool.query(`SELECT * FROM loyalty_perks ORDER BY created_at DESC`);
    return Response.json({ settings: result.rows[0] ? mapSettings(result.rows[0]) : defaults, perks: perks.rows.map(mapPerk) });
  }
  const admin = await requireSuperAdmin(request);
  if (!admin) return Response.json({ error: 'Super Admin required.' }, { status: 403 });
  const body: any = await request.json();
  if (body.action === 'save-settings') {
    const v = body.settings || {};
    const result = await db.pool.query(`
      INSERT INTO loyalty_settings (id,welcome_enabled,welcome_stamps,welcome_points,stamp_minimum_purchase,stamps_per_qualifying_order,points_minimum_purchase,points_mode,fixed_points,points_per_currency,currency_unit,stamp_cycle,updated_at)
      VALUES ('default',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
      ON CONFLICT(id) DO UPDATE SET welcome_enabled=EXCLUDED.welcome_enabled,welcome_stamps=EXCLUDED.welcome_stamps,welcome_points=EXCLUDED.welcome_points,stamp_minimum_purchase=EXCLUDED.stamp_minimum_purchase,stamps_per_qualifying_order=EXCLUDED.stamps_per_qualifying_order,points_minimum_purchase=EXCLUDED.points_minimum_purchase,points_mode=EXCLUDED.points_mode,fixed_points=EXCLUDED.fixed_points,points_per_currency=EXCLUDED.points_per_currency,currency_unit=EXCLUDED.currency_unit,stamp_cycle=EXCLUDED.stamp_cycle,updated_at=NOW()
      RETURNING *`, [Boolean(v.welcomeEnabled), Math.max(0, Math.floor(Number(v.welcomeStamps) || 0)), Math.max(0, Math.floor(Number(v.welcomePoints) || 0)), Math.max(0, Number(v.stampMinimumPurchase) || 0), Math.max(1, Math.floor(Number(v.stampsPerQualifyingOrder) || 1)), Math.max(0, Number(v.pointsMinimumPurchase) || 0), v.pointsMode === 'fixed' ? 'fixed' : 'ratio', Math.max(0, Math.floor(Number(v.fixedPoints) || 0)), Math.max(0, Number(v.pointsPerCurrency) || 0), Math.max(0.01, Number(v.currencyUnit) || 10), Math.max(1, Math.floor(Number(v.stampCycle) || 10))]);
    return Response.json({ settings: mapSettings(result.rows[0]) });
  }
  if (body.action === 'save-perk') {
    const p = body.perk || {};
    const id = String(p.id || crypto.randomUUID());
    const name = String(p.name || '').trim();
    if (!name) return Response.json({ error: 'Reward name is required.' }, { status: 400 });
    const rewardSource = p.rewardSource === 'menu' ? 'menu' : 'custom';
    const redemptionType = p.redemptionType === 'stamps' ? 'stamps' : 'points';
    const redemptionCost = Math.max(1, Math.floor(Number(p.redemptionCost) || 0));
    if (!redemptionCost) return Response.json({ error: 'Redemption cost must be greater than zero.' }, { status: 400 });
    if (rewardSource === 'menu' && !p.menuItemId) return Response.json({ error: 'Select a menu product.' }, { status: 400 });
    if (rewardSource === 'custom' && !String(p.customItemName || '').trim()) return Response.json({ error: 'Enter a custom reward item.' }, { status: 400 });
    const result = await db.pool.query(`
      INSERT INTO loyalty_perks (id,name,description,reward_source,menu_item_id,custom_item_name,redemption_type,redemption_cost,active,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,reward_source=EXCLUDED.reward_source,menu_item_id=EXCLUDED.menu_item_id,custom_item_name=EXCLUDED.custom_item_name,redemption_type=EXCLUDED.redemption_type,redemption_cost=EXCLUDED.redemption_cost,active=EXCLUDED.active,updated_at=NOW()
      RETURNING *`, [id, name, String(p.description || '').trim(), rewardSource, rewardSource === 'menu' ? String(p.menuItemId) : null, rewardSource === 'custom' ? String(p.customItemName).trim() : null, redemptionType, redemptionCost, p.active !== false]);
    return Response.json({ perk: mapPerk(result.rows[0]) });
  }
  if (body.action === 'delete-perk') { await db.pool.query('DELETE FROM loyalty_perks WHERE id=$1', [String(body.id)]); return Response.json({ success: true }); }
  if (body.action === 'toggle-perk') { const result = await db.pool.query('UPDATE loyalty_perks SET active=NOT active,updated_at=NOW() WHERE id=$1 RETURNING *', [String(body.id)]); return Response.json({ perk: result.rows[0] ? mapPerk(result.rows[0]) : null }); }
  return Response.json({ error: 'Unknown action.' }, { status: 400 });
}
