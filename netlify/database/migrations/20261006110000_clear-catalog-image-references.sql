-- Clear existing catalog image references so every catalog item can be re-uploaded through ImageKit.
-- Intentionally preserves rows in catalog_images as a temporary recovery copy.
-- This migration changes only the image URL/reference fields; product, bundle,
-- pricing, availability, category, and other catalog data remain untouched.

UPDATE menu_items
SET image = '',
    updated_at = NOW()
WHERE image <> '';

UPDATE bundles
SET image = '',
    updated_at = NOW()
WHERE image <> '';
