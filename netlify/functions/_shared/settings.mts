import { database } from './database.mts';
import { RequestError } from './http.mts';

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl: string;
  branchName: string;
  phoneNumber: string;
  email: string;
  address: string;
  currencySymbol: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  openHours: string;
  receiptFooter: string;
  wifiSsid?: string;
  wifiPassword?: string;
  socialFb?: string;
  socialIg?: string;
  updatedAt?: string;
}

export interface StoreSettingsRow {
  id: string;
  store_name: string;
  tagline: string;
  logo_url: string;
  branch_name: string;
  phone_number: string;
  email: string;
  address: string;
  currency_symbol: string;
  delivery_fee: string | number;
  free_delivery_threshold: string | number;
  open_hours: string;
  receipt_footer: string;
  wifi_ssid: string | null;
  wifi_password: string | null;
  social_fb: string | null;
  social_ig: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'iLuvKeyks Coffee & Tea',
  tagline: 'Handcrafted Coffee & Artisanal Pastries',
  logoUrl: '',
  branchName: 'Main Flagship',
  phoneNumber: '0917-123-4567',
  email: 'hello@iluvkeyks.com',
  address: '123 Barista Avenue, Quezon City, Metro Manila',
  currencySymbol: '₱',
  deliveryFee: 49,
  freeDeliveryThreshold: 500,
  openHours: 'Mon-Sun: 7:00 AM - 10:00 PM',
  receiptFooter: 'Thank you for choosing iLuvKeyks! Enjoy your coffee.',
  wifiSsid: 'iLuvKeyks-Guest',
  wifiPassword: 'coffeelover2026',
  socialFb: 'https://facebook.com/iluvkeyks',
  socialIg: 'https://instagram.com/iluvkeyks',
};

export function mapStoreSettingsRecord(row: StoreSettingsRow): StoreSettings {
  return {
    storeName: row.store_name,
    tagline: row.tagline || '',
    logoUrl: row.logo_url || '',
    branchName: row.branch_name,
    phoneNumber: row.phone_number,
    email: row.email,
    address: row.address,
    currencySymbol: row.currency_symbol || '₱',
    deliveryFee: Math.max(0, Number(row.delivery_fee) || 0),
    freeDeliveryThreshold: Math.max(0, Number(row.free_delivery_threshold) || 0),
    openHours: row.open_hours || '',
    receiptFooter: row.receipt_footer || '',
    wifiSsid: row.wifi_ssid || undefined,
    wifiPassword: row.wifi_password || undefined,
    socialFb: row.social_fb || undefined,
    socialIg: row.social_ig || undefined,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function fetchStoreSettingsFromDatabase(): Promise<StoreSettings> {
  const db = database();
  const result = await db.pool.query(`SELECT * FROM store_settings WHERE id = 'default' LIMIT 1`);
  if (result.rows.length === 0) {
    // Seed default settings row if missing
    return updateStoreSettingsInDatabase(DEFAULT_STORE_SETTINGS);
  }
  return mapStoreSettingsRecord(result.rows[0]);
}

export async function updateStoreSettingsInDatabase(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const storeName = (settings.storeName || DEFAULT_STORE_SETTINGS.storeName).trim();
  const tagline = settings.tagline !== undefined ? settings.tagline.trim() : DEFAULT_STORE_SETTINGS.tagline;
  const logoUrl = settings.logoUrl !== undefined ? settings.logoUrl.trim() : DEFAULT_STORE_SETTINGS.logoUrl;
  const branchName = (settings.branchName || DEFAULT_STORE_SETTINGS.branchName).trim();
  const phoneNumber = (settings.phoneNumber || DEFAULT_STORE_SETTINGS.phoneNumber).trim();
  const email = (settings.email || DEFAULT_STORE_SETTINGS.email).trim();
  const address = (settings.address || DEFAULT_STORE_SETTINGS.address).trim();
  const currencySymbol = (settings.currencySymbol || DEFAULT_STORE_SETTINGS.currencySymbol).trim();
  const deliveryFee = settings.deliveryFee != null ? Math.max(0, Number(settings.deliveryFee)) : DEFAULT_STORE_SETTINGS.deliveryFee;
  const freeDeliveryThreshold = settings.freeDeliveryThreshold != null ? Math.max(0, Number(settings.freeDeliveryThreshold)) : DEFAULT_STORE_SETTINGS.freeDeliveryThreshold;
  const openHours = settings.openHours !== undefined ? settings.openHours.trim() : DEFAULT_STORE_SETTINGS.openHours;
  const receiptFooter = settings.receiptFooter !== undefined ? settings.receiptFooter.trim() : DEFAULT_STORE_SETTINGS.receiptFooter;
  const wifiSsid = settings.wifiSsid !== undefined ? (settings.wifiSsid.trim() || null) : null;
  const wifiPassword = settings.wifiPassword !== undefined ? (settings.wifiPassword.trim() || null) : null;
  const socialFb = settings.socialFb !== undefined ? (settings.socialFb.trim() || null) : null;
  const socialIg = settings.socialIg !== undefined ? (settings.socialIg.trim() || null) : null;

  const db = database();
  const result = await db.pool.query(
    `INSERT INTO store_settings (
      id, store_name, tagline, logo_url, branch_name, phone_number, email,
      address, currency_symbol, delivery_fee, free_delivery_threshold, open_hours,
      receipt_footer, wifi_ssid, wifi_password, social_fb, social_ig, created_at, updated_at
    ) VALUES (
      'default', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      store_name = EXCLUDED.store_name,
      tagline = EXCLUDED.tagline,
      logo_url = EXCLUDED.logo_url,
      branch_name = EXCLUDED.branch_name,
      phone_number = EXCLUDED.phone_number,
      email = EXCLUDED.email,
      address = EXCLUDED.address,
      currency_symbol = EXCLUDED.currency_symbol,
      delivery_fee = EXCLUDED.delivery_fee,
      free_delivery_threshold = EXCLUDED.free_delivery_threshold,
      open_hours = EXCLUDED.open_hours,
      receipt_footer = EXCLUDED.receipt_footer,
      wifi_ssid = EXCLUDED.wifi_ssid,
      wifi_password = EXCLUDED.wifi_password,
      social_fb = EXCLUDED.social_fb,
      social_ig = EXCLUDED.social_ig,
      updated_at = NOW()
    RETURNING *`,
    [
      storeName, tagline, logoUrl, branchName, phoneNumber, email,
      address, currencySymbol, deliveryFee, freeDeliveryThreshold, openHours,
      receiptFooter, wifiSsid, wifiPassword, socialFb, socialIg
    ]
  );
  return mapStoreSettingsRecord(result.rows[0]);
}

export async function resetStoreSettingsInDatabase(): Promise<StoreSettings> {
  return updateStoreSettingsInDatabase(DEFAULT_STORE_SETTINGS);
}
