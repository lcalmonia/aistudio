import { database } from './database.mts';

export interface DeliveryZone {
  id: string;
  name: string;
  keywords: string[];
  deliveryFee: number;
  freeDeliveryThreshold: number;
  priority: number;
  active: boolean;
}

export interface DeliveryPolicy {
  fee: number;
  freeDeliveryThreshold: number;
  zone: DeliveryZone | null;
  matchedKeyword: string | null;
}

const DEFAULT_FEE = 49;
const DEFAULT_FREE_THRESHOLD = 500;

const normalizeKeyword = (value: unknown) => String(value || '').trim().toLocaleLowerCase();

export function normalizeAddress(address: unknown): string {
  return String(address || '')
    .toLocaleLowerCase()
    .replace(/[.,#\-/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchDeliveryZone(zones: DeliveryZone[], address: unknown): { zone: DeliveryZone | null; matchedKeyword: string | null } {
  const text = normalizeAddress(address);
  if (!text) return { zone: null, matchedKeyword: null };

  const matches = zones
    .filter((zone) => zone.active !== false)
    .map((zone) => {
      const keyword = zone.keywords.map(normalizeKeyword).find((term) => term && text.includes(term));
      return keyword ? { zone, matchedKeyword: keyword } : null;
    })
    .filter(Boolean) as { zone: DeliveryZone; matchedKeyword: string }[];

  matches.sort((a, b) => Number(a.zone.priority || 999) - Number(b.zone.priority || 999));
  return matches[0] || { zone: null, matchedKeyword: null };
}

export async function listDeliveryZones(): Promise<DeliveryZone[]> {
  const db = database();
  const result = await db.pool.query(`
    SELECT id, name, keywords, delivery_fee, free_delivery_threshold, priority, active
    FROM delivery_zones
    ORDER BY priority ASC, name ASC
  `);
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    keywords: Array.isArray(row.keywords) ? row.keywords.map(normalizeKeyword).filter(Boolean) : [],
    deliveryFee: Math.max(0, Number(row.delivery_fee) || 0),
    freeDeliveryThreshold: Math.max(0, Number(row.free_delivery_threshold) || 0),
    priority: Math.max(1, Number(row.priority) || 999),
    active: row.active !== false,
  }));
}

export async function resolveDeliveryPolicy(address: unknown, subtotal: number, zones?: DeliveryZone[]): Promise<DeliveryPolicy> {
  const allZones = zones || await listDeliveryZones();
  const matched = matchDeliveryZone(allZones, address);
  const zone = matched.zone;
  const fee = zone ? zone.deliveryFee : DEFAULT_FEE;
  const freeDeliveryThreshold = zone ? zone.freeDeliveryThreshold : DEFAULT_FREE_THRESHOLD;
  return {
    fee: subtotal >= freeDeliveryThreshold ? 0 : fee,
    freeDeliveryThreshold,
    zone,
    matchedKeyword: matched.matchedKeyword,
  };
}
