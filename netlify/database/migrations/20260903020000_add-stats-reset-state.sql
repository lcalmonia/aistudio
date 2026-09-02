CREATE TABLE IF NOT EXISTS stats_reset_state (
  id TEXT PRIMARY KEY,
  reset_at TIMESTAMPTZ NOT NULL
);

INSERT INTO stats_reset_state (id, reset_at)
VALUES ('default', '1970-01-01T00:00:00Z'::timestamptz)
ON CONFLICT (id) DO NOTHING;
