-- Support the initial 24-hour staff order list and incremental updated_at polling.
-- These indexes are read optimizations only; they do not change order data.
CREATE INDEX IF NOT EXISTS orders_created_at_staff_board_idx
  ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS orders_updated_at_staff_sync_idx
  ON orders (updated_at DESC);
