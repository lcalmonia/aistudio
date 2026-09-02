CREATE TABLE customer_password_reset_requests (
  id BIGSERIAL PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL
    REFERENCES customers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by VARCHAR(64)
);

CREATE UNIQUE INDEX customer_password_reset_requests_one_pending_idx
  ON customer_password_reset_requests(customer_id)
  WHERE status = 'pending';

CREATE INDEX customer_password_reset_requests_status_idx
  ON customer_password_reset_requests(status, requested_at DESC);
