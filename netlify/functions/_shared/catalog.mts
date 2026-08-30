import { database } from './database.mts';
import { RequestError } from './http.mts';
import crypto from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ProductSize {
  name: string;
  volume: string;
  priceDelta: number;
  availableTemperatures?: ('Hot' | 'Cold' | 'Both')[];
  applicableTemperature?: 'Hot' | 'Cold' | 'Both' | 'All';
}

export type ProductTemperature = 'Hot' | 'Cold' | 'Both' | 'N/A';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  tags?: string[];
  popular?: boolean;
  available: boolean;
  temperature: ProductTemperature;
  sizes?: ProductSize[];
  addons?: string[];
  allergens?: string[];
  calories?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ModifierCategoryType = 'modifier' | 'addon';

export interface ModifierCategory {
  id: string;
  name: string;
  itemType: ModifierCategoryType;
  required?: boolean;
  selectionType?: 'single' | 'multiple';
  applicableCategories?: string[];
  applicableTemperature?: 'Hot' | 'Cold' | 'Both' | 'All';
  sortOrder?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductAddon {
  id: string;
  name: string;
  category: string;
  itemType?: ModifierCategoryType;
  price: number;
  applicableTemperature: 'Hot' | 'Cold' | 'Both' | 'All';
  available: boolean;
  required?: boolean;
  selectionType?: 'single' | 'multiple';
  applicableCategories?: string[];
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromoBundle {
  id: string;
  name: string;
  description: string;
  bundleItems: string[];
  price: number;
  originalPrice: number;
  discountBadge: string;
  image: string;
  available: boolean;
  temperatureOption?: string;
  timeSlot?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Promo {
  id: string;
  code?: string;
  name: string;
  description: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minimumOrderAmount: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Database Row Types
export interface CategoryRow {
  name: string;
  sort_order: number;
  active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface AddonRow {
  id: string;
  name: string;
  category: string;
  item_type?: ModifierCategoryType | null;
  price: string | number;
  applicable_temperature: 'Hot' | 'Cold' | 'Both' | 'All';
  available: boolean;
  required?: boolean | null;
  selection_type?: 'single' | 'multiple' | null;
  applicable_categories?: string[] | null;
  sort_order?: number | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface ModifierCategoryRow {
  id: string;
  name: string;
  item_type: ModifierCategoryType;
  required: boolean | null;
  selection_type: 'single' | 'multiple' | null;
  applicable_categories: string[] | null;
  applicable_temperature: 'Hot' | 'Cold' | 'Both' | 'All' | null;
  sort_order: number | null;
  active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface MenuItemRow {
  id: string;
  name: string;
  category: string;
  price: string | number;
  image: string;
  description: string;
  tags: string[] | null;
  popular: boolean | null;
  available: boolean;
  temperature: ProductTemperature;
  sizes: unknown;
  add_on_ids: string[] | null;
  allergens: string[] | null;
  calories: number | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface BundleRow {
  id: string;
  name: string;
  description: string;
  bundle_items: string[] | null;
  price: string | number;
  original_price: string | number;
  discount_badge: string;
  image: string;
  available: boolean;
  temperature_option: string | null;
  time_slot: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface PromoRow {
  id: string;
  code: string | null;
  name: string;
  description: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: string | number;
  minimum_order_amount: string | number;
  active: boolean;
  starts_at: string | Date | null;
  ends_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

// ============================================================================
// MAPPERS
// ============================================================================

export function mapCategoryRecord(row: { name?: string; category_name?: string }): string {
  return String(row.name || row.category_name || '').trim();
}

export function mapModifierCategoryRecord(row: ModifierCategoryRow): ModifierCategory {
  return {
    id: row.id,
    name: row.name,
    itemType: row.item_type || 'modifier',
    required: Boolean(row.required),
    selectionType: row.selection_type || 'single',
    applicableCategories: Array.isArray(row.applicable_categories) ? row.applicable_categories : [],
    applicableTemperature: row.applicable_temperature || 'Both',
    sortOrder: Number(row.sort_order) || 0,
    active: row.active !== false,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export function mapAddonRecord(row: AddonRow): ProductAddon {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    itemType: row.item_type || 'addon',
    price: Number(row.price) || 0,
    applicableTemperature: row.applicable_temperature || 'Both',
    available: row.available !== false,
    required: Boolean(row.required),
    selectionType: row.selection_type || 'single',
    applicableCategories: Array.isArray(row.applicable_categories) ? row.applicable_categories : undefined,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export function mapMenuItemRecord(row: MenuItemRow): MenuItem {
  let parsedSizes: ProductSize[] | undefined;
  if (Array.isArray(row.sizes)) {
    parsedSizes = row.sizes.map((s: Record<string, unknown>) => ({
      name: String(s.name || ''),
      volume: String(s.volume || ''),
      priceDelta: Number(s.priceDelta) || 0,
    }));
  } else if (typeof row.sizes === 'string') {
    try {
      const parsed = JSON.parse(row.sizes);
      if (Array.isArray(parsed)) {
        parsedSizes = parsed.map((s: Record<string, unknown>) => ({
          name: String(s.name || ''),
          volume: String(s.volume || ''),
          priceDelta: Number(s.priceDelta) || 0,
        }));
      }
    } catch {
      parsedSizes = undefined;
    }
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price) || 0,
    image: row.image || '',
    description: row.description || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    popular: Boolean(row.popular),
    available: row.available !== false,
    temperature: row.temperature || 'Hot',
    sizes: parsedSizes && parsedSizes.length > 0 ? parsedSizes : undefined,
    addons: Array.isArray(row.add_on_ids) ? row.add_on_ids : [],
    allergens: Array.isArray(row.allergens) ? row.allergens : [],
    calories: row.calories != null ? Number(row.calories) : undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export function mapBundleRecord(row: BundleRow): PromoBundle {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    bundleItems: Array.isArray(row.bundle_items) ? row.bundle_items : [],
    price: Number(row.price) || 0,
    originalPrice: Number(row.original_price) || 0,
    discountBadge: row.discount_badge || '',
    image: row.image || '',
    available: row.available !== false,
    temperatureOption: row.temperature_option || undefined,
    timeSlot: row.time_slot || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export function mapPromoRecord(row: PromoRow): Promo {
  return {
    id: row.id,
    code: row.code || undefined,
    name: row.name,
    description: row.description || '',
    discountType: row.discount_type,
    discountValue: Number(row.discount_value) || 0,
    minimumOrderAmount: Number(row.minimum_order_amount) || 0,
    active: row.active !== false,
    startsAt: row.starts_at ? (row.starts_at instanceof Date ? row.starts_at.toISOString() : String(row.starts_at)) : undefined,
    endsAt: row.ends_at ? (row.ends_at instanceof Date ? row.ends_at.toISOString() : String(row.ends_at)) : undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

export async function fetchCategoriesFromDatabase(): Promise<string[]> {
  const db = database();
  const result = await db.pool.query(
    `SELECT name FROM categories WHERE active = TRUE ORDER BY sort_order ASC, name ASC`
  );
  return result.rows.map((r: { name: string }) => r.name);
}

export async function insertCategoryToDatabase(name: string): Promise<string[]> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new RequestError(400, 'Category name is required.');
  }

  const db = database();
  await db.pool.query(
    `INSERT INTO categories (name, sort_order, active, created_at, updated_at)
     VALUES ($1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories), TRUE, NOW(), NOW())
     ON CONFLICT (name) DO UPDATE SET active = TRUE, updated_at = NOW()`,
    [cleanName]
  );
  return fetchCategoriesFromDatabase();
}

export async function renameCategoryInDatabase(oldName: string, newName: string): Promise<string[]> {
  const cleanOld = oldName.trim();
  const cleanNew = newName.trim();
  if (!cleanOld || !cleanNew) {
    throw new RequestError(400, 'Both old and new category names are required.');
  }
  if (cleanOld === cleanNew) return fetchCategoriesFromDatabase();

  const db = database();
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    // Check if new category name already exists
    const existing = await client.query('SELECT name FROM categories WHERE name = $1', [cleanNew]);
    if (existing.rows.length > 0) {
      // Reassign menu items from old to new, then remove old
      await client.query('UPDATE menu_items SET category = $1, updated_at = NOW() WHERE category = $2', [cleanNew, cleanOld]);
      await client.query('DELETE FROM categories WHERE name = $1', [cleanOld]);
    } else {
      // Direct update will cascade to menu_items due to ON UPDATE CASCADE
      await client.query('UPDATE categories SET name = $1, updated_at = NOW() WHERE name = $2', [cleanNew, cleanOld]);
    }
    await client.query('COMMIT');
    return fetchCategoriesFromDatabase();
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteCategoryFromDatabase(name: string, fallbackCategory?: string): Promise<string[]> {
  const cleanName = name.trim();
  if (!cleanName) throw new RequestError(400, 'Category name is required.');

  const db = database();
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    // Find fallback category
    let targetFallback = fallbackCategory?.trim();
    if (!targetFallback || targetFallback === cleanName) {
      const fallbackResult = await client.query(
        'SELECT name FROM categories WHERE name != $1 AND active = TRUE ORDER BY sort_order ASC, name ASC LIMIT 1',
        [cleanName]
      );
      if (fallbackResult.rows.length === 0) {
        throw new RequestError(400, 'Cannot delete the only remaining category. At least one category must exist.');
      }
      targetFallback = fallbackResult.rows[0].name;
    }

    // Reassign existing menu items to fallback category
    await client.query(
      'UPDATE menu_items SET category = $1, updated_at = NOW() WHERE category = $2',
      [targetFallback, cleanName]
    );

    // Delete category
    await client.query('DELETE FROM categories WHERE name = $1', [cleanName]);
    await client.query('COMMIT');
    return fetchCategoriesFromDatabase();
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ============================================================================
// MODIFIER CATEGORY OPERATIONS
// ============================================================================

export async function fetchModifierCategoriesFromDatabase(): Promise<ModifierCategory[]> {
  const db = database();
  try {
    const result = await db.pool.query(
      `SELECT * FROM modifier_categories ORDER BY sort_order ASC, name ASC`
    );
    return result.rows.map((row: ModifierCategoryRow) => mapModifierCategoryRecord(row));
  } catch {
    // If table doesn't exist yet in fallback environment, return empty list
    return [];
  }
}

export async function insertModifierCategoryToDatabase(cat: Partial<ModifierCategory>): Promise<ModifierCategory> {
  const name = cat.name?.trim();
  if (!name) throw new RequestError(400, 'Category name is required.');

  const itemType = cat.itemType || 'modifier';
  const required = Boolean(cat.required);
  const selectionType = cat.selectionType || 'single';
  const applicableCats = Array.isArray(cat.applicableCategories) ? cat.applicableCategories : [];
  const applicableTemp = cat.applicableTemperature || 'Both';
  const sortOrder = Number(cat.sortOrder) || 0;
  const active = cat.active !== false;
  const id = cat.id || `modcat-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  const db = database();
  const result = await db.pool.query(
    `INSERT INTO modifier_categories (
      id, name, item_type, required, selection_type, applicable_categories,
      applicable_temperature, sort_order, active, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING *`,
    [id, name, itemType, required, selectionType, applicableCats, applicableTemp, sortOrder, active]
  );
  return mapModifierCategoryRecord(result.rows[0]);
}

export async function updateModifierCategoryInDatabase(id: string, updates: Partial<ModifierCategory>): Promise<ModifierCategory> {
  const db = database();
  const currentResult = await db.pool.query(`SELECT * FROM modifier_categories WHERE id = $1 LIMIT 1`, [id]);
  if (currentResult.rows.length === 0) throw new RequestError(404, `Modifier category "${id}" not found.`);

  const current = mapModifierCategoryRecord(currentResult.rows[0]);
  const name = updates.name !== undefined ? updates.name.trim() : current.name;
  const itemType = updates.itemType !== undefined ? updates.itemType : current.itemType;
  const required = updates.required !== undefined ? Boolean(updates.required) : Boolean(current.required);
  const selectionType = updates.selectionType !== undefined ? updates.selectionType : current.selectionType;
  const applicableCats = updates.applicableCategories !== undefined ? updates.applicableCategories : current.applicableCategories;
  const applicableTemp = updates.applicableTemperature !== undefined ? updates.applicableTemperature : current.applicableTemperature;
  const sortOrder = updates.sortOrder !== undefined ? Number(updates.sortOrder) : current.sortOrder;
  const active = updates.active !== undefined ? Boolean(updates.active) : current.active;

  const result = await db.pool.query(
    `UPDATE modifier_categories
     SET name = $1, item_type = $2, required = $3, selection_type = $4, applicable_categories = $5,
         applicable_temperature = $6, sort_order = $7, active = $8, updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [name, itemType, required, selectionType, applicableCats, applicableTemp, sortOrder, active, id]
  );
  return mapModifierCategoryRecord(result.rows[0]);
}

export async function deleteModifierCategoryFromDatabase(id: string): Promise<boolean> {
  const db = database();
  const result = await db.pool.query(`DELETE FROM modifier_categories WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// ============================================================================
// ADD-ON & MODIFIER OPERATIONS
// ============================================================================

export async function fetchAddonsFromDatabase(): Promise<ProductAddon[]> {
  const db = database();
  const result = await db.pool.query(
    `SELECT * FROM add_ons ORDER BY category ASC, name ASC`
  );
  return result.rows.map((row: AddonRow) => mapAddonRecord(row));
}

export async function fetchAddonById(id: string): Promise<ProductAddon | null> {
  const db = database();
  const result = await db.pool.query(`SELECT * FROM add_ons WHERE id = $1 LIMIT 1`, [id]);
  if (result.rows.length === 0) return null;
  return mapAddonRecord(result.rows[0]);
}

export async function insertAddonToDatabase(addon: Partial<ProductAddon>): Promise<ProductAddon> {
  const name = addon.name?.trim();
  if (!name) throw new RequestError(400, 'Add-on name is required.');

  const category = addon.category || 'Milk';
  const itemType = addon.itemType || 'addon';
  const price = Math.max(0, Number(addon.price) || 0);
  const applicableTemp = addon.applicableTemperature || 'Both';
  const available = addon.available !== false;
  const required = Boolean(addon.required);
  const selectionType = addon.selectionType || 'single';
  const applicableCategories = Array.isArray(addon.applicableCategories) ? addon.applicableCategories : [];
  const sortOrder = Number(addon.sortOrder) || 0;
  const id = addon.id || `addon-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  const db = database();
  const result = await db.pool.query(
    `INSERT INTO add_ons (
      id, name, category, item_type, price, applicable_temperature, available,
      required, selection_type, applicable_categories, sort_order, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    RETURNING *`,
    [id, name, category, itemType, price, applicableTemp, available, required, selectionType, applicableCategories, sortOrder]
  );
  return mapAddonRecord(result.rows[0]);
}

export async function updateAddonInDatabase(id: string, updates: Partial<ProductAddon>): Promise<ProductAddon> {
  const current = await fetchAddonById(id);
  if (!current) throw new RequestError(404, `Add-on "${id}" not found.`);

  const name = updates.name !== undefined ? updates.name.trim() : current.name;
  const category = updates.category !== undefined ? updates.category : current.category;
  const itemType = updates.itemType !== undefined ? updates.itemType : (current.itemType || 'addon');
  const price = updates.price !== undefined ? Math.max(0, Number(updates.price) || 0) : current.price;
  const applicableTemp = updates.applicableTemperature !== undefined ? updates.applicableTemperature : current.applicableTemperature;
  const available = updates.available !== undefined ? updates.available : current.available;
  const required = updates.required !== undefined ? Boolean(updates.required) : Boolean(current.required);
  const selectionType = updates.selectionType !== undefined ? updates.selectionType : (current.selectionType || 'single');
  const applicableCategories = updates.applicableCategories !== undefined ? updates.applicableCategories : (current.applicableCategories || []);
  const sortOrder = updates.sortOrder !== undefined ? Number(updates.sortOrder) : (current.sortOrder || 0);

  const db = database();
  const result = await db.pool.query(
    `UPDATE add_ons
     SET name = $1, category = $2, item_type = $3, price = $4, applicable_temperature = $5,
         available = $6, required = $7, selection_type = $8, applicable_categories = $9,
         sort_order = $10, updated_at = NOW()
     WHERE id = $11
     RETURNING *`,
    [name, category, itemType, price, applicableTemp, available, required, selectionType, applicableCategories, sortOrder, id]
  );
  return mapAddonRecord(result.rows[0]);
}

export async function deleteAddonFromDatabase(id: string): Promise<boolean> {
  const db = database();
  const result = await db.pool.query(`DELETE FROM add_ons WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function toggleAddonStockInDatabase(id: string): Promise<ProductAddon> {
  const db = database();
  const result = await db.pool.query(
    `UPDATE add_ons SET available = NOT available, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  if (result.rows.length === 0) throw new RequestError(404, `Add-on "${id}" not found.`);
  return mapAddonRecord(result.rows[0]);
}

// ============================================================================
// MENU ITEM OPERATIONS
// ============================================================================

export async function fetchMenuItemsFromDatabase(): Promise<MenuItem[]> {
  const db = database();
  const result = await db.pool.query(
    `SELECT * FROM menu_items ORDER BY created_at DESC, name ASC`
  );
  return result.rows.map((row: MenuItemRow) => mapMenuItemRecord(row));
}

export async function fetchMenuItemById(id: string): Promise<MenuItem | null> {
  const db = database();
  const result = await db.pool.query(`SELECT * FROM menu_items WHERE id = $1 LIMIT 1`, [id]);
  if (result.rows.length === 0) return null;
  return mapMenuItemRecord(result.rows[0]);
}

export async function insertMenuItemToDatabase(item: Partial<MenuItem>): Promise<MenuItem> {
  const name = item.name?.trim();
  if (!name) throw new RequestError(400, 'Menu item name is required.');

  const category = item.category?.trim() || 'Coffee';
  const price = Math.max(0, Number(item.price) || 0);
  const image = item.image?.trim() || '';
  const description = item.description?.trim() || '';
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const popular = Boolean(item.popular);
  const available = item.available !== false;
  const temperature = item.temperature || 'Hot';
  const sizesJson = item.sizes && Array.isArray(item.sizes) ? JSON.stringify(item.sizes) : null;
  const addons = Array.isArray(item.addons) ? item.addons : [];
  const allergens = Array.isArray(item.allergens) ? item.allergens : [];
  const calories = item.calories != null ? Math.max(0, Math.floor(Number(item.calories) || 0)) : null;
  const id = item.id || `menu-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  const db = database();
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    // Ensure category exists to satisfy foreign key constraint
    await client.query(
      `INSERT INTO categories (name, sort_order, active, created_at, updated_at)
       VALUES ($1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories), TRUE, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [category]
    );

    const result = await client.query(
      `INSERT INTO menu_items (
        id, name, category, price, image, description, tags, popular, available,
        temperature, sizes, add_on_ids, allergens, calories, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, NOW(), NOW())
      RETURNING *`,
      [id, name, category, price, image, description, tags, popular, available, temperature, sizesJson, addons, allergens, calories]
    );
    await client.query('COMMIT');
    return mapMenuItemRecord(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateMenuItemInDatabase(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
  const current = await fetchMenuItemById(id);
  if (!current) throw new RequestError(404, `Menu item "${id}" not found.`);

  const name = updates.name !== undefined ? updates.name.trim() : current.name;
  const category = updates.category !== undefined ? updates.category.trim() : current.category;
  const price = updates.price !== undefined ? Math.max(0, Number(updates.price) || 0) : current.price;
  const image = updates.image !== undefined ? updates.image.trim() : current.image;
  const description = updates.description !== undefined ? updates.description.trim() : current.description;
  const tags = updates.tags !== undefined ? (Array.isArray(updates.tags) ? updates.tags : []) : (current.tags || []);
  const popular = updates.popular !== undefined ? Boolean(updates.popular) : Boolean(current.popular);
  const available = updates.available !== undefined ? updates.available : current.available;
  const temperature = updates.temperature !== undefined ? updates.temperature : current.temperature;
  const sizesJson = updates.sizes !== undefined ? (Array.isArray(updates.sizes) ? JSON.stringify(updates.sizes) : null) : (current.sizes ? JSON.stringify(current.sizes) : null);
  const addons = updates.addons !== undefined ? (Array.isArray(updates.addons) ? updates.addons : []) : (current.addons || []);
  const allergens = updates.allergens !== undefined ? (Array.isArray(updates.allergens) ? updates.allergens : []) : (current.allergens || []);
  const calories = updates.calories !== undefined ? (updates.calories != null ? Math.max(0, Math.floor(Number(updates.calories) || 0)) : null) : (current.calories != null ? current.calories : null);

  const db = database();
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    // Ensure category exists
    await client.query(
      `INSERT INTO categories (name, sort_order, active, created_at, updated_at)
       VALUES ($1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories), TRUE, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [category]
    );

    const result = await client.query(
      `UPDATE menu_items SET
        name = $1, category = $2, price = $3, image = $4, description = $5,
        tags = $6, popular = $7, available = $8, temperature = $9, sizes = $10::jsonb,
        add_on_ids = $11, allergens = $12, calories = $13, updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [name, category, price, image, description, tags, popular, available, temperature, sizesJson, addons, allergens, calories, id]
    );
    await client.query('COMMIT');
    return mapMenuItemRecord(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteMenuItemFromDatabase(id: string): Promise<boolean> {
  const db = database();
  const result = await db.pool.query(`DELETE FROM menu_items WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function toggleMenuItemAvailabilityInDatabase(id: string): Promise<MenuItem> {
  const db = database();
  const result = await db.pool.query(
    `UPDATE menu_items SET available = NOT available, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  if (result.rows.length === 0) throw new RequestError(404, `Menu item "${id}" not found.`);
  return mapMenuItemRecord(result.rows[0]);
}

// ============================================================================
// BUNDLE / COMBO OPERATIONS
// ============================================================================

export async function fetchBundlesFromDatabase(): Promise<PromoBundle[]> {
  const db = database();
  const result = await db.pool.query(
    `SELECT * FROM bundles ORDER BY created_at DESC, name ASC`
  );
  return result.rows.map((row: BundleRow) => mapBundleRecord(row));
}

export async function fetchBundleById(id: string): Promise<PromoBundle | null> {
  const db = database();
  const result = await db.pool.query(`SELECT * FROM bundles WHERE id = $1 LIMIT 1`, [id]);
  if (result.rows.length === 0) return null;
  return mapBundleRecord(result.rows[0]);
}

export async function insertBundleToDatabase(bundle: Partial<PromoBundle>): Promise<PromoBundle> {
  const name = bundle.name?.trim();
  if (!name) throw new RequestError(400, 'Bundle name is required.');

  const description = bundle.description?.trim() || '';
  const bundleItems = Array.isArray(bundle.bundleItems) ? bundle.bundleItems : [];
  const price = Math.max(0, Number(bundle.price) || 0);
  const originalPrice = Math.max(0, Number(bundle.originalPrice) || price);
  const discountBadge = bundle.discountBadge?.trim() || '';
  const image = bundle.image?.trim() || '';
  const available = bundle.available !== false;
  const tempOption = bundle.temperatureOption?.trim() || null;
  const timeSlot = bundle.timeSlot?.trim() || null;
  const id = bundle.id || `bundle-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  const db = database();
  const result = await db.pool.query(
    `INSERT INTO bundles (
      id, name, description, bundle_items, price, original_price, discount_badge,
      image, available, temperature_option, time_slot, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    RETURNING *`,
    [id, name, description, bundleItems, price, originalPrice, discountBadge, image, available, tempOption, timeSlot]
  );
  return mapBundleRecord(result.rows[0]);
}

export async function updateBundleInDatabase(id: string, updates: Partial<PromoBundle>): Promise<PromoBundle> {
  const current = await fetchBundleById(id);
  if (!current) throw new RequestError(404, `Bundle "${id}" not found.`);

  const name = updates.name !== undefined ? updates.name.trim() : current.name;
  const description = updates.description !== undefined ? updates.description.trim() : current.description;
  const bundleItems = updates.bundleItems !== undefined ? (Array.isArray(updates.bundleItems) ? updates.bundleItems : []) : current.bundleItems;
  const price = updates.price !== undefined ? Math.max(0, Number(updates.price) || 0) : current.price;
  const originalPrice = updates.originalPrice !== undefined ? Math.max(0, Number(updates.originalPrice) || 0) : current.originalPrice;
  const discountBadge = updates.discountBadge !== undefined ? updates.discountBadge.trim() : current.discountBadge;
  const image = updates.image !== undefined ? updates.image.trim() : current.image;
  const available = updates.available !== undefined ? updates.available : current.available;
  const tempOption = updates.temperatureOption !== undefined ? updates.temperatureOption.trim() || null : current.temperatureOption || null;
  const timeSlot = updates.timeSlot !== undefined ? updates.timeSlot.trim() || null : current.timeSlot || null;

  const db = database();
  const result = await db.pool.query(
    `UPDATE bundles SET
      name = $1, description = $2, bundle_items = $3, price = $4, original_price = $5,
      discount_badge = $6, image = $7, available = $8, temperature_option = $9, time_slot = $10,
      updated_at = NOW()
     WHERE id = $11
     RETURNING *`,
    [name, description, bundleItems, price, originalPrice, discountBadge, image, available, tempOption, timeSlot, id]
  );
  return mapBundleRecord(result.rows[0]);
}

export async function deleteBundleFromDatabase(id: string): Promise<boolean> {
  const db = database();
  const result = await db.pool.query(`DELETE FROM bundles WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// ============================================================================
// PROMO OPERATIONS
// ============================================================================

export async function fetchPromosFromDatabase(): Promise<Promo[]> {
  const db = database();
  const result = await db.pool.query(`SELECT * FROM promos ORDER BY created_at DESC`);
  return result.rows.map((row: PromoRow) => mapPromoRecord(row));
}

export async function fetchPromoById(id: string): Promise<Promo | null> {
  const db = database();
  const result = await db.pool.query(`SELECT * FROM promos WHERE id = $1 LIMIT 1`, [id]);
  if (result.rows.length === 0) return null;
  return mapPromoRecord(result.rows[0]);
}

export async function insertPromoToDatabase(promo: Partial<Promo>): Promise<Promo> {
  const name = promo.name?.trim();
  if (!name) throw new RequestError(400, 'Promo name is required.');

  const code = promo.code?.trim() || null;
  const description = promo.description?.trim() || '';
  const discountType = promo.discountType || 'percentage';
  const discountValue = Math.max(0, Number(promo.discountValue) || 0);
  const minOrder = Math.max(0, Number(promo.minimumOrderAmount) || 0);
  const active = promo.active !== false;
  const startsAt = promo.startsAt ? new Date(promo.startsAt) : null;
  const endsAt = promo.endsAt ? new Date(promo.endsAt) : null;
  const id = promo.id || `promo-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  const db = database();
  const result = await db.pool.query(
    `INSERT INTO promos (
      id, code, name, description, discount_type, discount_value, minimum_order_amount,
      active, starts_at, ends_at, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    RETURNING *`,
    [id, code, name, description, discountType, discountValue, minOrder, active, startsAt, endsAt]
  );
  return mapPromoRecord(result.rows[0]);
}

export async function updatePromoInDatabase(id: string, updates: Partial<Promo>): Promise<Promo> {
  const current = await fetchPromoById(id);
  if (!current) throw new RequestError(404, `Promo "${id}" not found.`);

  const name = updates.name !== undefined ? updates.name.trim() : current.name;
  const code = updates.code !== undefined ? (updates.code.trim() || null) : (current.code || null);
  const description = updates.description !== undefined ? updates.description.trim() : current.description;
  const discountType = updates.discountType !== undefined ? updates.discountType : current.discountType;
  const discountValue = updates.discountValue !== undefined ? Math.max(0, Number(updates.discountValue) || 0) : current.discountValue;
  const minOrder = updates.minimumOrderAmount !== undefined ? Math.max(0, Number(updates.minimumOrderAmount) || 0) : current.minimumOrderAmount;
  const active = updates.active !== undefined ? updates.active : current.active;
  const startsAt = updates.startsAt !== undefined ? (updates.startsAt ? new Date(updates.startsAt) : null) : (current.startsAt ? new Date(current.startsAt) : null);
  const endsAt = updates.endsAt !== undefined ? (updates.endsAt ? new Date(updates.endsAt) : null) : (current.endsAt ? new Date(current.endsAt) : null);

  const db = database();
  const result = await db.pool.query(
    `UPDATE promos SET
      name = $1, code = $2, description = $3, discount_type = $4, discount_value = $5,
      minimum_order_amount = $6, active = $7, starts_at = $8, ends_at = $9, updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [name, code, description, discountType, discountValue, minOrder, active, startsAt, endsAt, id]
  );
  return mapPromoRecord(result.rows[0]);
}

export async function deletePromoFromDatabase(id: string): Promise<boolean> {
  const db = database();
  const result = await db.pool.query(`DELETE FROM promos WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
