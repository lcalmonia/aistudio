CREATE TABLE IF NOT EXISTS catalog_images (
  id VARCHAR(160) PRIMARY KEY,
  content_type VARCHAR(100) NOT NULL,
  image_data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE catalog_images IS 'Centralized binary storage for menu item and promo bundle images. Catalog records store a URL pointing to the image endpoint instead of device-local data.';
