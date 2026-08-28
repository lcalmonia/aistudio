-- Migration: 20260827020000_centralize-shared-orders.sql
-- Description: Centralize orders for cross-device synchronization and resilient data persistence

-- 1. Ensure customer_id does not fail if guest or local-only customer IDs are used before customer DB sync
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

-- 2. Add completed_at and cancelled_at columns if not present
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 3. Add performance and lookup indexes for real-time barista and customer queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp_desc ON orders (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id, line_position);
