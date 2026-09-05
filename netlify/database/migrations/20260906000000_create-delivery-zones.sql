CREATE TABLE IF NOT EXISTS delivery_zones (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 49 CHECK (delivery_fee >= 0),
  free_delivery_threshold NUMERIC(12,2) NOT NULL DEFAULT 500 CHECK (free_delivery_threshold >= 0),
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_active_priority
  ON delivery_zones (active, priority);

INSERT INTO delivery_zones (id, name, keywords, delivery_fee, free_delivery_threshold, priority, active)
VALUES
  ('zone_deca_tacunan', 'Deca Homes / Tacunan', ARRAY['deca homes','deca','tacunan'], 49, 500, 1, TRUE),
  ('zone_mintal', 'Mintal', ARRAY['mintal'], 49, 500, 2, TRUE),
  ('zone_tugbok', 'Tugbok', ARRAY['tugbok'], 49, 500, 3, TRUE)
ON CONFLICT (id) DO NOTHING;
