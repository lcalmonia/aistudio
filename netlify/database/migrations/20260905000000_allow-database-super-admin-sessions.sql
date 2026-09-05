ALTER TABLE admin_sessions
  DROP CONSTRAINT IF EXISTS admin_sessions_check;

ALTER TABLE admin_sessions
  ADD CONSTRAINT admin_sessions_staff_user_role_check
  CHECK (
    (role = 'SUPER_ADMIN')
    OR
    (role = 'ADMIN' AND staff_user_id IS NOT NULL)
  );
