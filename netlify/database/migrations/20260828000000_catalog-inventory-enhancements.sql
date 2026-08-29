-- Migration: 20260828000000_catalog-inventory-enhancements.sql
-- Description: Non-destructive enhancements for catalog, inventory, and store settings cross-device synchronization

-- 1. Add supporting columns to inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS sku VARCHAR(128);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Create inventory_movements table for stock audit trails
CREATE TABLE IF NOT EXISTS inventory_movements (
  id VARCHAR(64) PRIMARY KEY,
  inventory_item_id VARCHAR(64) REFERENCES inventory_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL,
  quantity NUMERIC(14, 3) NOT NULL,
  previous_quantity NUMERIC(14, 3) NOT NULL,
  resulting_quantity NUMERIC(14, 3) NOT NULL,
  reason TEXT,
  staff_name VARCHAR(255),
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create inventory_categories table for expandable categories
CREATE TABLE IF NOT EXISTS inventory_categories (
  name VARCHAR(128) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create supporting indexes for fast lookup and sorting
CREATE INDEX IF NOT EXISTS idx_menu_items_updated_at ON menu_items(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order ASC, name ASC);
CREATE INDEX IF NOT EXISTS idx_add_ons_available ON add_ons(available);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at DESC);
