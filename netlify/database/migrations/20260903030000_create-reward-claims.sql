CREATE TABLE IF NOT EXISTS reward_claims (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  perk_id VARCHAR(64) NOT NULL REFERENCES loyalty_perks(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  perk_name VARCHAR(255) NOT NULL,
  redemption_type VARCHAR(16) NOT NULL CHECK (redemption_type IN ('stamps', 'points')),
  redemption_cost INTEGER NOT NULL CHECK (redemption_cost > 0),
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS reward_claims_status_requested_idx
  ON reward_claims(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS reward_claims_customer_idx
  ON reward_claims(customer_id, requested_at DESC);
