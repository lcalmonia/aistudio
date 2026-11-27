CREATE TABLE cashier_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(128) NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX cashier_users_username_lower_uidx ON cashier_users (LOWER(username));
CREATE TABLE cashier_sessions (
  id VARCHAR(64) PRIMARY KEY,
  token_hash CHAR(64) NOT NULL UNIQUE,
  cashier_user_id VARCHAR(64) NOT NULL REFERENCES cashier_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  invalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX cashier_sessions_active_idx ON cashier_sessions(token_hash, expires_at) WHERE invalidated_at IS NULL;
CREATE INDEX cashier_sessions_user_idx ON cashier_sessions(cashier_user_id);
ALTER TABLE orders ADD COLUMN cashier_user_id VARCHAR(64) REFERENCES cashier_users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(16) NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid','Unpaid','Refunded'));
ALTER TABLE orders ADD COLUMN cashier_idempotency_key VARCHAR(80);
CREATE UNIQUE INDEX orders_cashier_idempotency_uidx ON orders(cashier_idempotency_key) WHERE cashier_idempotency_key IS NOT NULL;
CREATE INDEX orders_cashier_sales_idx ON orders(cashier_user_id, payment_status, created_at DESC);
