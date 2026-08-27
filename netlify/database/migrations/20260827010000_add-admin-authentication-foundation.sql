ALTER TABLE staff_users
  ALTER COLUMN email DROP NOT NULL,
  ADD COLUMN username VARCHAR(128),
  ADD COLUMN created_by_staff_user_id VARCHAR(64)
    REFERENCES staff_users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD COLUMN profile_picture BYTEA,
  ADD COLUMN profile_picture_content_type VARCHAR(32),
  ADD COLUMN profile_picture_size INTEGER,
  ADD COLUMN profile_picture_updated_at TIMESTAMPTZ,
  ADD CONSTRAINT staff_users_profile_picture_size_check
    CHECK (profile_picture_size IS NULL OR profile_picture_size BETWEEN 1 AND 2097152),
  ADD CONSTRAINT staff_users_profile_picture_fields_check
    CHECK (
      (profile_picture IS NULL AND profile_picture_content_type IS NULL AND profile_picture_size IS NULL)
      OR
      (profile_picture IS NOT NULL AND profile_picture_content_type IS NOT NULL AND profile_picture_size IS NOT NULL)
    );

CREATE UNIQUE INDEX staff_users_username_lower_uidx
  ON staff_users (LOWER(username))
  WHERE username IS NOT NULL;

CREATE TABLE admin_sessions (
  id VARCHAR(64) PRIMARY KEY,
  token_hash CHAR(64) NOT NULL UNIQUE,
  staff_user_id VARCHAR(64)
    REFERENCES staff_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL
    CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
  expires_at TIMESTAMPTZ NOT NULL,
  invalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (role = 'SUPER_ADMIN' AND staff_user_id IS NULL)
    OR
    (role = 'ADMIN' AND staff_user_id IS NOT NULL)
  )
);

CREATE INDEX admin_sessions_token_active_idx
  ON admin_sessions(token_hash, expires_at)
  WHERE invalidated_at IS NULL;

CREATE INDEX admin_sessions_staff_user_id_idx
  ON admin_sessions(staff_user_id)
  WHERE staff_user_id IS NOT NULL;

CREATE TABLE super_admin_profile (
  id VARCHAR(32) PRIMARY KEY DEFAULT 'default'
    CHECK (id = 'default'),
  profile_picture BYTEA,
  profile_picture_content_type VARCHAR(32),
  profile_picture_size INTEGER,
  profile_picture_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (profile_picture_size IS NULL OR profile_picture_size BETWEEN 1 AND 2097152),
  CHECK (
    (profile_picture IS NULL AND profile_picture_content_type IS NULL AND profile_picture_size IS NULL)
    OR
    (profile_picture IS NOT NULL AND profile_picture_content_type IS NOT NULL AND profile_picture_size IS NOT NULL)
  )
);
