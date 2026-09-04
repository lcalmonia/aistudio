ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders
  ALTER COLUMN payment_method TYPE VARCHAR(255);

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (
    payment_method IS NULL
    OR payment_method IN ('GCash', 'Maya', 'Cash', 'Card')
    OR payment_method LIKE 'Split Payment: %'
  );
