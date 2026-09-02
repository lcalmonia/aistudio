import { database } from './database.mts';
import { RequestError } from './http.mts';
import crypto from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  status: 'In Stock' | 'Low Stock' | 'Critical';
  minThreshold: number;
  costPerUnit?: number;
  supplier?: string;
  notes?: string;
  active?: boolean;
  sku?: string;
  description?: string;
  lastRestocked?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  itemName: string;
  type: 'addition' | 'deduction' | 'adjustment' | 'restock' | 'waste';
  quantity: number;
  previousQuantity: number;
  resultingQuantity: number;
  reason?: string;
  staffName?: string;
  timestamp: number;
  createdAt: string;
}

export interface InventoryItemRow {
  id: string;
  name: string;
  category: string;
  stock: string | number;
  unit: string;
  status: 'In Stock' | 'Low Stock' | 'Critical';
  min_threshold: string | number;
  cost_per_unit: string | number | null;
  supplier: string | null;
  notes: string | null;
  active: boolean | null;
  sku: string | null;
  description: string | null;
  last_restocked: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface InventoryMovementRow {
  id: string;
  inventory_item_id: string;
  item_name: string;
  type: string;
  quantity: string | number;
  previous_quantity: string | number;
  resulting_quantity: string | number;
  reason: string | null;
  staff_name: string | null;
  timestamp: string | number;
  created_at: string | Date;
}

// ============================================================================
// MAPPERS & HELPERS
// ============================================================================

export function computeInventoryStatus(stock: number, minThreshold: number): 'In Stock' | 'Low Stock' | 'Critical' {
  if (stock <= 0) return 'Critical';
  if (stock <= minThreshold * 0.3) return 'Critical';
  if (stock <= minThreshold) return 'Low Stock';
  return 'In Stock';
}

export function mapInventoryItemRecord(row: InventoryItemRow): InventoryItem {
  const stock = Math.max(0, Number(row.stock) || 0);
  const minThreshold = Math.max(0, Number(row.min_threshold) || 0);
  const lastRestockedStr = row.last_restocked
    ? row.last_restocked instanceof Date
      ? row.last_restocked.toISOString().split('T')[0]
      : String(row.last_restocked).split('T')[0]
    : undefined;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    stock,
    unit: row.unit,
    status: row.status || computeInventoryStatus(stock, minThreshold),
    minThreshold,
    costPerUnit: row.cost_per_unit != null ? Number(row.cost_per_unit) : undefined,
    supplier: row.supplier || undefined,
    notes: row.notes || undefined,
    active: row.active !== false,
    sku: row.sku || undefined,
    description: row.description || undefined,
    lastRestocked: lastRestockedStr,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export function mapInventoryMovementRecord(row: InventoryMovementRow): InventoryMovement {
  return {
    id: row.id,
    inventoryItemId: row.inventory_item_id,
    itemName: row.item_name,
    type: row.type as InventoryMovement['type'],
    quantity: Number(row.quantity) || 0,
    previousQuantity: Number(row.previous_quantity) || 0,
    resultingQuantity: Number(row.resulting_quantity) || 0,
    reason: row.reason || undefined,
    staffName: row.staff_name || undefined,
    timestamp: Number(row.timestamp) || Date.now(),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

// ============================================================================
// INVENTORY CRUD
// ============================================================================

export async function fetchInventoryFromDatabase(): Promise<InventoryItem[]> {
  const db = database();
  const result = await db.pool.query(
    `SELECT * FROM inventory_items WHERE active = TRUE OR active IS NULL ORDER BY category ASC, name ASC`
  );
  return result.rows.map((row: InventoryItemRow) => mapInventoryItemRecord(row));
}

export async function fetchInventoryItemById(id: string): Promise<InventoryItem | null> {
  const db = database();
  const result = await db.pool.query(`SELECT * FROM inventory_items WHERE id = $1 LIMIT 1`, [id]);
  if (result.rows.length === 0) return null;
  return mapInventoryItemRecord(result.rows[0]);
}

export async function insertInventoryItemToDatabase(item: Partial<InventoryItem>): Promise<InventoryItem> {
  const name = item.name?.trim();
  if (!name) throw new RequestError(400, 'Item name is required.');

  const category = item.category?.trim() || 'General';
  const stock = Math.max(0, Number(item.stock) || 0);
  const unit = item.unit?.trim() || 'pcs';
  const minThreshold = Math.max(0, Number(item.minThreshold) || 0);
  const status = item.status || computeInventoryStatus(stock, minThreshold);
  const costPerUnit = item.costPerUnit != null ? Math.max(0, Number(item.costPerUnit)) : null;
  const supplier = item.supplier?.trim() || null;
  const notes = item.notes?.trim() || null;
  const active = item.active !== false;
  const sku = item.sku?.trim() || null;
  const description = item.description?.trim() || null;
  const lastRestocked = item.lastRestocked ? new Date(item.lastRestocked) : new Date();
  const id = item.id || `inv-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  const db = database();
  const result = await db.pool.query(
    `INSERT INTO inventory_items (
      id, name, category, stock, unit, status, min_threshold, cost_per_unit,
      supplier, notes, active, sku, description, last_restocked, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    RETURNING *`,
    [id, name, category, stock, unit, status, minThreshold, costPerUnit, supplier, notes, active, sku, description, lastRestocked]
  );
  return mapInventoryItemRecord(result.rows[0]);
}

export async function updateInventoryItemInDatabase(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
  const current = await fetchInventoryItemById(id);
  if (!current) throw new RequestError(404, `Inventory item "${id}" not found.`);

  const name = updates.name !== undefined ? updates.name.trim() : current.name;
  const category = updates.category !== undefined ? updates.category.trim() : current.category;
  const stock = updates.stock !== undefined ? Math.max(0, Number(updates.stock)) : current.stock;
  const unit = updates.unit !== undefined ? updates.unit.trim() : current.unit;
  const minThreshold = updates.minThreshold !== undefined ? Math.max(0, Number(updates.minThreshold)) : current.minThreshold;
  const status = updates.status !== undefined ? updates.status : computeInventoryStatus(stock, minThreshold);
  const costPerUnit = updates.costPerUnit !== undefined ? (updates.costPerUnit != null ? Math.max(0, Number(updates.costPerUnit)) : null) : (current.costPerUnit ?? null);
  const supplier = updates.supplier !== undefined ? (updates.supplier.trim() || null) : (current.supplier || null);
  const notes = updates.notes !== undefined ? (updates.notes.trim() || null) : (current.notes || null);
  const active = updates.active !== undefined ? updates.active : current.active;
  const sku = updates.sku !== undefined ? (updates.sku.trim() || null) : (current.sku || null);
  const description = updates.description !== undefined ? (updates.description.trim() || null) : (current.description || null);
  const lastRestocked = updates.lastRestocked !== undefined ? (updates.lastRestocked ? new Date(updates.lastRestocked) : null) : (current.lastRestocked ? new Date(current.lastRestocked) : null);

  const db = database();
  const result = await db.pool.query(
    `UPDATE inventory_items SET
      name = $1, category = $2, stock = $3, unit = $4, status = $5, min_threshold = $6,
      cost_per_unit = $7, supplier = $8, notes = $9, active = $10, sku = $11, description = $12,
      last_restocked = $13, updated_at = NOW()
     WHERE id = $14
     RETURNING *`,
    [name, category, stock, unit, status, minThreshold, costPerUnit, supplier, notes, active, sku, description, lastRestocked, id]
  );
  return mapInventoryItemRecord(result.rows[0]);
}

export async function deleteInventoryItemFromDatabase(id: string): Promise<boolean> {
  const db = database();
  const result = await db.pool.query(`DELETE FROM inventory_items WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function adjustInventoryStockInDatabase(
  id: string,
  adjustment: {
    type: 'addition' | 'deduction' | 'adjustment' | 'restock' | 'waste';
    quantity: number;
    reason?: string;
    staffName?: string;
  }
): Promise<InventoryItem> {
  const db = database();
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const itemRes = await client.query(`SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE`, [id]);
    if (itemRes.rows.length === 0) throw new RequestError(404, `Inventory item "${id}" not found.`);

    const current = itemRes.rows[0] as InventoryItemRow;
    const prevStock = Number(current.stock) || 0;
    const delta = Number(adjustment.quantity) || 0;
    let newStock = prevStock;

    if (adjustment.type === 'addition' || adjustment.type === 'restock') {
      newStock = prevStock + Math.max(0, delta);
    } else if (adjustment.type === 'deduction' || adjustment.type === 'waste') {
      newStock = Math.max(0, prevStock - Math.max(0, delta));
    } else if (adjustment.type === 'adjustment') {
      newStock = Math.max(0, delta);
    }

    const minThresh = Number(current.min_threshold) || 0;
    const newStatus = computeInventoryStatus(newStock, minThresh);
    const updateResult = await client.query(
      `UPDATE inventory_items
       SET stock = $1, status = $2, last_restocked = CASE WHEN $3 = 'restock' THEN CURRENT_DATE ELSE last_restocked END, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [newStock, newStatus, adjustment.type, id]
    );

    // Record movement audit
    const movementId = `mov-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    await client.query(
      `INSERT INTO inventory_movements (
        id, inventory_item_id, item_name, type, quantity, previous_quantity, resulting_quantity, reason, staff_name, timestamp, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        movementId,
        id,
        current.name,
        adjustment.type,
        delta,
        prevStock,
        newStock,
        adjustment.reason || null,
        adjustment.staffName || null,
        Date.now(),
      ]
    );

    await client.query('COMMIT');
    return mapInventoryItemRecord(updateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ============================================================================
// INVENTORY CATEGORIES
// ============================================================================

export async function fetchInventoryCategoriesFromDatabase(): Promise<string[]> {
  const db = database();
  const [explicitCats, itemCats] = await Promise.all([
    db.pool.query(`SELECT name FROM inventory_categories ORDER BY name ASC`),
    db.pool.query(`SELECT DISTINCT category FROM inventory_items WHERE category IS NOT NULL AND category != ''`),
  ]);

  const set = new Set<string>([
    'Coffee Beans',
    'Dairy & Plant Milk',
    'Syrups & Flavors',
    'Pastry Ingredients',
    'Packaging & Cups',
    'Tea & Infusions',
  ]);

  for (const row of explicitCats.rows) {
    if (row.name) set.add(row.name);
  }
  for (const row of itemCats.rows) {
    if (row.category) set.add(row.category);
  }

  return Array.from(set).sort();
}

export async function insertInventoryCategoryToDatabase(name: string): Promise<string[]> {
  const cleanName = name.trim();
  if (!cleanName) throw new RequestError(400, 'Category name is required.');

  const db = database();
  await db.pool.query(
    `INSERT INTO inventory_categories (name, created_at) VALUES ($1, NOW()) ON CONFLICT (name) DO NOTHING`,
    [cleanName]
  );
  return fetchInventoryCategoriesFromDatabase();
}
export async function renameInventoryCategoryInDatabase(
  oldName: string,
  newName: string,
): Promise<string[]> {
  const cleanOldName = oldName.trim();
  const cleanNewName = newName.trim();

  if (!cleanOldName || !cleanNewName) {
    throw new RequestError(400, 'Both old and new category names are required.');
  }

  if (cleanOldName.toLowerCase() === cleanNewName.toLowerCase()) {
    return fetchInventoryCategoriesFromDatabase();
  }

  const db = database();

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const duplicate = await client.query(
      `SELECT 1
       FROM inventory_categories
       WHERE LOWER(name) = LOWER($1)
       LIMIT 1`,
      [cleanNewName],
    );

    if (duplicate.rowCount) {
      throw new RequestError(409, 'A category with that name already exists.');
    }

    const result = await client.query(
      `UPDATE inventory_categories
       SET name = $1
       WHERE LOWER(name) = LOWER($2)`,
      [cleanNewName, cleanOldName],
    );

    if (!result.rowCount) {
      throw new RequestError(404, 'Inventory category not found.');
    }

    await client.query(
      `UPDATE inventory_items
       SET category = $1
       WHERE LOWER(category) = LOWER($2)`,
      [cleanNewName, cleanOldName],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return fetchInventoryCategoriesFromDatabase();
}

export async function deleteInventoryCategoryFromDatabase(
  categoryName: string,
  fallbackCategory: string = 'Coffee Beans',
): Promise<string[]> {
  const cleanCategory = categoryName.trim();
  const cleanFallback = fallbackCategory.trim();

  if (!cleanCategory) {
    throw new RequestError(400, 'Category name is required.');
  }

  if (cleanCategory.toLowerCase() === cleanFallback.toLowerCase()) {
    throw new RequestError(400, 'The fallback category cannot be deleted.');
  }

  const db = database();

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE inventory_items
       SET category = $1
       WHERE LOWER(category) = LOWER($2)`,
      [cleanFallback, cleanCategory],
    );

    await client.query(
      `DELETE FROM inventory_categories
       WHERE LOWER(name) = LOWER($1)`,
      [cleanCategory],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return fetchInventoryCategoriesFromDatabase();
}
