-- Migration: 20260830000000_product-modifier-categories.sql
-- Description: Non-destructive addition to support Product -> Modifier Category assignments

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS modifier_category_ids TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create GIN index for fast lookup of menu items by assigned modifier categories
CREATE INDEX IF NOT EXISTS idx_menu_items_modifier_category_ids ON menu_items USING GIN (modifier_category_ids);
