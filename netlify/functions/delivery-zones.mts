import type { Config } from '@netlify/functions';
import { database } from './_shared/database.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { DeliveryZone, listDeliveryZones, resolveDeliveryPolicy } from './_shared/deliveryZones.mts';

const normalizeZone = (input: any, index: number): DeliveryZone => ({
  id: String(input?.id || `zone-${Date.now()}-${index}`).trim().slice(0, 64),
  name: String(input?.name || '').trim().slice(0, 128),
  keywords: [...new Set((Array.isArray(input?.keywords) ? input.keywords : String(input?.keywords || '').split(',')).map((v: unknown) => String(v || '').trim().toLocaleLowerCase()).filter(Boolean))].slice(0, 50),
  deliveryFee: Math.max(0, Number(input?.deliveryFee) || 0),
  freeDeliveryThreshold: Math.max(0, Number(input?.freeDeliveryThreshold) || 0),
  priority: Math.max(1, Math.min(999, Number(input?.priority) || index + 1)),
  active: input?.active !== false,
});

async function replaceZones(zones: DeliveryZone[]): Promise<DeliveryZone[]> {
  const db = database();
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM delivery_zones');
    for (const zone of zones) {
      await client.query(`
        INSERT INTO delivery_zones (id, name, keywords, delivery_fee, free_delivery_threshold, priority, active, created_at, updated_at)
        VALUES ($1, $2, $3::text[], $4, $5, $6, $7, NOW(), NOW())
      `, [zone.id, zone.name, zone.keywords, zone.deliveryFee, zone.freeDeliveryThreshold, zone.priority, zone.active]);
    }
    await client.query('COMMIT');
    return listDeliveryZones();
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      const zones = await listDeliveryZones();
      const url = new URL(request.url);
      const address = url.searchParams.get('address');
      const subtotal = Math.max(0, Number(url.searchParams.get('subtotal') || 0));
      const policy = address ? await resolveDeliveryPolicy(address, subtotal, zones) : null;
      return json({ zones, policy });
    }

    if (request.method !== 'PUT' && request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405);
    }

    enforceSameOrigin(request);
    await requireAuthenticatedAdmin(request);
    const body = await readJsonObject(request);

    if (body.action === 'reset') {
      const defaults: DeliveryZone[] = [
        { id: 'zone_deca_tacunan', name: 'Deca Homes / Tacunan', keywords: ['deca homes', 'deca', 'tacunan'], deliveryFee: 49, freeDeliveryThreshold: 500, priority: 1, active: true },
        { id: 'zone_mintal', name: 'Mintal', keywords: ['mintal'], deliveryFee: 49, freeDeliveryThreshold: 500, priority: 2, active: true },
        { id: 'zone_tugbok', name: 'Tugbok', keywords: ['tugbok'], deliveryFee: 49, freeDeliveryThreshold: 500, priority: 3, active: true },
      ];
      return json({ zones: await replaceZones(defaults), message: 'Delivery zones reset to defaults.' });
    }

    if (!Array.isArray(body.zones)) throw new RequestError(400, 'zones must be an array.');
    const zones = body.zones.map(normalizeZone, 0).filter((zone) => zone.name && zone.keywords.length);
    if (zones.length === 0) throw new RequestError(400, 'At least one valid delivery zone is required.');
    const priorities = new Set(zones.map((zone) => zone.priority));
    if (priorities.size !== zones.length) throw new RequestError(400, 'Each delivery zone must have a unique priority.');
    return json({ zones: await replaceZones(zones), message: 'Delivery zones updated successfully.' });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/delivery-zones',
  method: ['GET', 'PUT', 'POST'],
};
