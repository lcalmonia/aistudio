CREATE TABLE IF NOT EXISTS promo_vouchers (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL DEFAULT '',
  discount_type VARCHAR(16) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
  minimum_order_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (minimum_order_amount >= 0),
  max_uses INTEGER NOT NULL DEFAULT 0 CHECK (max_uses >= 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS promo_vouchers_active_idx
  ON promo_vouchers(active, expires_at);
