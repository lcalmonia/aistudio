CREATE TABLE staff_sessions (
  id VARCHAR(64) PRIMARY KEY,
  token_hash CHAR(64) NOT NULL UNIQUE,
  staff_user_id VARCHAR(64) NOT NULL REFERENCES staff_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  invalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX staff_sessions_token_active_idx
  ON staff_sessions(token_hash, expires_at)
  WHERE invalidated_at IS NULL;

CREATE INDEX staff_sessions_user_id_idx
  ON staff_sessions(staff_user_id);
