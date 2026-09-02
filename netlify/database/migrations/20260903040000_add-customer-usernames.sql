ALTER TABLE customers ADD COLUMN IF NOT EXISTS username VARCHAR(64);
UPDATE customers SET username = LEFT(COALESCE(NULLIF(regexp_replace(LOWER(name), '[^a-z0-9]+', '', 'g'), ''), 'customer') || '_' || RIGHT(regexp_replace(id, '[^a-zA-Z0-9]', '', 'g'), 6), 64) WHERE username IS NULL OR BTRIM(username) = '';
CREATE UNIQUE INDEX IF NOT EXISTS customers_username_lower_key ON customers (LOWER(username));
ALTER TABLE customers ALTER COLUMN username SET NOT NULL;
