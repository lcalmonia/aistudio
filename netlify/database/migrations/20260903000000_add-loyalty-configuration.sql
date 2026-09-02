CREATE TABLE IF NOT EXISTS loyalty_settings (
  id VARCHAR(64) PRIMARY KEY,
  welcome_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  welcome_stamps INTEGER NOT NULL DEFAULT 0 CHECK (welcome_stamps >= 0),
  welcome_points INTEGER NOT NULL DEFAULT 0 CHECK (welcome_points >= 0),
  stamp_minimum_purchase NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (stamp_minimum_purchase >= 0),
  stamps_per_qualifying_order INTEGER NOT NULL DEFAULT 1 CHECK (stamps_per_qualifying_order >= 1),
  points_minimum_purchase NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (points_minimum_purchase >= 0),
  points_mode VARCHAR(16) NOT NULL DEFAULT 'ratio' CHECK (points_mode IN ('fixed','ratio')),
  fixed_points INTEGER NOT NULL DEFAULT 0 CHECK (fixed_points >= 0),
  points_per_currency NUMERIC(12,4) NOT NULL DEFAULT 1 CHECK (points_per_currency >= 0),
  currency_unit NUMERIC(12,2) NOT NULL DEFAULT 10 CHECK (currency_unit > 0),
  stamp_cycle INTEGER NOT NULL DEFAULT 10 CHECK (stamp_cycle >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_perks (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  reward_source VARCHAR(16) NOT NULL CHECK (reward_source IN ('menu','custom')),
  menu_item_id VARCHAR(64),
  custom_item_name VARCHAR(160),
  redemption_type VARCHAR(16) NOT NULL CHECK (redemption_type IN ('stamps','points')),
  redemption_cost INTEGER NOT NULL CHECK (redemption_cost > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO loyalty_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
