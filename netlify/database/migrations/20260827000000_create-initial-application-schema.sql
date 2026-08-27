CREATE TABLE customers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  mobile VARCHAR(64) NOT NULL,
  address TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  role VARCHAR(16) NOT NULL DEFAULT 'customer'
    CHECK (role = 'customer'),
  stamps INTEGER NOT NULL DEFAULT 0
    CHECK (stamps >= 0),
  points INTEGER NOT NULL DEFAULT 0
    CHECK (points >= 0),
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE staff_users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  role VARCHAR(16) NOT NULL
    CHECK (role IN ('staff', 'admin', 'super_admin')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  passcode_hash TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  name VARCHAR(128) PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE add_ons (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(16) NOT NULL
    CHECK (category IN ('Milk', 'Shot', 'Syrup', 'Topping', 'Prep')),
  price NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (price >= 0),
  applicable_temperature VARCHAR(8) NOT NULL
    CHECK (applicable_temperature IN ('Hot', 'Cold', 'Both', 'All')),
  available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_items (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL
    REFERENCES categories(name) ON UPDATE CASCADE,
  price NUMERIC(12, 2) NOT NULL
    CHECK (price >= 0),
  image TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[],
  popular BOOLEAN,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  temperature VARCHAR(8) NOT NULL
    CHECK (temperature IN ('Hot', 'Cold', 'Both', 'N/A')),
  sizes JSONB,
  add_on_ids TEXT[],
  allergens TEXT[],
  calories INTEGER
    CHECK (calories IS NULL OR calories >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (sizes IS NULL OR jsonb_typeof(sizes) = 'array')
);

CREATE TABLE bundles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  bundle_items TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  price NUMERIC(12, 2) NOT NULL
    CHECK (price >= 0),
  original_price NUMERIC(12, 2) NOT NULL
    CHECK (original_price >= 0),
  discount_badge VARCHAR(255) NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  available BOOLEAN NOT NULL DEFAULT TRUE,
  temperature_option VARCHAR(64),
  time_slot VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promos (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  discount_type VARCHAR(16) NOT NULL
    CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value NUMERIC(12, 2) NOT NULL
    CHECK (discount_value >= 0),
  minimum_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (minimum_order_amount >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CHECK (discount_type <> 'percentage' OR discount_value <= 100)
);

CREATE TABLE inventory_items (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL,
  stock NUMERIC(14, 3) NOT NULL DEFAULT 0
    CHECK (stock >= 0),
  unit VARCHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL
    CHECK (status IN ('In Stock', 'Low Stock', 'Critical')),
  min_threshold NUMERIC(14, 3) NOT NULL DEFAULT 0
    CHECK (min_threshold >= 0),
  cost_per_unit NUMERIC(12, 2)
    CHECK (cost_per_unit IS NULL OR cost_per_unit >= 0),
  supplier VARCHAR(255),
  notes TEXT,
  last_restocked DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE store_settings (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'default'
    CHECK (id = 'default'),
  store_name VARCHAR(255) NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  branch_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(64) NOT NULL,
  email VARCHAR(320) NOT NULL,
  address TEXT NOT NULL,
  currency_symbol VARCHAR(16) NOT NULL,
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (delivery_fee >= 0),
  free_delivery_threshold NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (free_delivery_threshold >= 0),
  open_hours TEXT NOT NULL DEFAULT '',
  receipt_footer TEXT NOT NULL DEFAULT '',
  wifi_ssid VARCHAR(255),
  wifi_password TEXT,
  social_fb TEXT,
  social_ig TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(32) NOT NULL UNIQUE,
  customer_id VARCHAR(64)
    REFERENCES customers(id) ON UPDATE CASCADE ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(320),
  customer_phone VARCHAR(64),
  time_ago VARCHAR(64) NOT NULL DEFAULT 'Just now',
  timestamp BIGINT NOT NULL
    CHECK (timestamp >= 0),
  status VARCHAR(16) NOT NULL
    CHECK (status IN ('New', 'Brewing', 'Ready', 'Completed', 'Pending', 'Preparing', 'Cancelled')),
  total NUMERIC(12, 2) NOT NULL
    CHECK (total >= 0),
  image TEXT,
  notes TEXT,
  order_type VARCHAR(16)
    CHECK (order_type IS NULL OR order_type IN ('Dine-In', 'Takeout', 'Delivery')),
  table_number VARCHAR(32),
  delivery_address TEXT,
  payment_method VARCHAR(16)
    CHECK (payment_method IS NULL OR payment_method IN ('GCash', 'Maya', 'Cash', 'Card')),
  subtotal NUMERIC(12, 2)
    CHECK (subtotal IS NULL OR subtotal >= 0),
  discount NUMERIC(12, 2)
    CHECK (discount IS NULL OR discount >= 0),
  delivery_fee NUMERIC(12, 2)
    CHECK (delivery_fee IS NULL OR delivery_fee >= 0),
  is_customer_order BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL
    REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  line_position INTEGER NOT NULL
    CHECK (line_position >= 0),
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL
    CHECK (quantity > 0),
  customization TEXT,
  price NUMERIC(12, 2) NOT NULL
    CHECK (price >= 0),
  completed BOOLEAN,
  temperature VARCHAR(8)
    CHECK (temperature IS NULL OR temperature IN ('Hot', 'Iced')),
  size VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, line_position)
);

CREATE INDEX orders_customer_id_idx ON orders(customer_id);
CREATE INDEX orders_status_timestamp_idx ON orders(status, timestamp DESC);
CREATE INDEX order_items_order_id_idx ON order_items(order_id);
CREATE INDEX menu_items_category_idx ON menu_items(category);
CREATE INDEX menu_items_available_idx ON menu_items(available);
CREATE INDEX bundles_available_idx ON bundles(available);
CREATE INDEX promos_active_window_idx ON promos(active, starts_at, ends_at);
CREATE INDEX inventory_items_category_idx ON inventory_items(category);
CREATE INDEX inventory_items_status_idx ON inventory_items(status);
