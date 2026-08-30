-- Migration: 20260829000000_advanced-modifiers-addons.sql
-- Description: Non-destructive enhancements for flexible modifiers, add-ons, and dynamic category configurations

-- 1. Relax category constraint on add_ons to allow arbitrary modifier & add-on categories
ALTER TABLE add_ons DROP CONSTRAINT IF EXISTS add_ons_category_check;
ALTER TABLE add_ons ALTER COLUMN category TYPE VARCHAR(128);

-- 2. Add supporting columns to add_ons
ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS item_type VARCHAR(16) NOT NULL DEFAULT 'addon';
ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS selection_type VARCHAR(16) NOT NULL DEFAULT 'single';
ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS applicable_categories TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 3. Create modifier_categories table for customizable modifier groups
CREATE TABLE IF NOT EXISTS modifier_categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) UNIQUE NOT NULL,
  item_type VARCHAR(16) NOT NULL DEFAULT 'modifier',
  required BOOLEAN NOT NULL DEFAULT FALSE,
  selection_type VARCHAR(16) NOT NULL DEFAULT 'single',
  applicable_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  applicable_temperature VARCHAR(8) DEFAULT 'Both',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_add_ons_item_type ON add_ons(item_type);
CREATE INDEX IF NOT EXISTS idx_add_ons_category ON add_ons(category);
CREATE INDEX IF NOT EXISTS idx_modifier_categories_sort_order ON modifier_categories(sort_order ASC, name ASC);
