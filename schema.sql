-- =====================================================
-- MetricAccounting - Supabase Schema
-- Optimized for large data with proper indexes & RLS
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── CUSTOMERS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ma_customers (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid REFERENCES auth.users ON DELETE CASCADE,
  org_id        text UNIQUE,
  name          text NOT NULL,
  phone         text,
  email         text,
  city          text,
  state         text,
  pincode       text,
  zone          text,
  size_category text CHECK (size_category IN ('Small', 'Medium', 'Large')),
  crop_types    jsonb DEFAULT '[]',
  gstin         text,
  address       text,
  opening_balance decimal(15,2) DEFAULT 0,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_customers_user_id   ON ma_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_customers_zone      ON ma_customers(zone);
CREATE INDEX IF NOT EXISTS idx_ma_customers_state     ON ma_customers(state);
CREATE INDEX IF NOT EXISTS idx_ma_customers_name      ON ma_customers(name);
CREATE INDEX IF NOT EXISTS idx_ma_customers_org_id    ON ma_customers(org_id);
CREATE INDEX IF NOT EXISTS idx_ma_customers_is_active ON ma_customers(is_active);
-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_ma_customers_fts ON ma_customers USING gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(city,'')));

-- ─── PRODUCTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ma_products (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE,
  name        text NOT NULL,
  category    text,
  unit        text DEFAULT 'seeds',
  variants    jsonb DEFAULT '[]',   -- [{name: "TALWAR", price: 1.6}]
  description text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_products_user_id   ON ma_products(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_products_name      ON ma_products(name);
CREATE INDEX IF NOT EXISTS idx_ma_products_category  ON ma_products(category);
CREATE INDEX IF NOT EXISTS idx_ma_products_is_active ON ma_products(is_active);

-- ─── ORDERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ma_orders (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid REFERENCES auth.users ON DELETE CASCADE,
  order_no         text UNIQUE,
  customer_id      uuid REFERENCES ma_customers ON DELETE SET NULL,
  customer_name    text,   -- denormalized for performance
  order_date       date NOT NULL,
  status           text DEFAULT 'pending',  -- pending|sowing_done|dispatched|cancelled
  transport_charge decimal(12,2) DEFAULT 0,
  advance_payment  decimal(12,2) DEFAULT 0,
  foc_amount       decimal(12,2) DEFAULT 0,
  paid_amount      decimal(12,2) DEFAULT 0,
  items_total      decimal(12,2) DEFAULT 0,
  total_amount     decimal(12,2) DEFAULT 0,
  due_amount       decimal(12,2) GENERATED ALWAYS AS (total_amount - advance_payment - paid_amount - foc_amount) STORED,
  narration        text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_orders_user_id     ON ma_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_orders_customer_id ON ma_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_ma_orders_status      ON ma_orders(status);
CREATE INDEX IF NOT EXISTS idx_ma_orders_order_date  ON ma_orders(order_date DESC);
-- Compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ma_orders_user_status ON ma_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ma_orders_user_date   ON ma_orders(user_id, order_date DESC);

-- ─── ORDER ITEMS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ma_order_items (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        uuid REFERENCES ma_orders ON DELETE CASCADE NOT NULL,
  product_name    text NOT NULL,
  variant_name    text,
  price           decimal(10,4) NOT NULL,
  quantity        integer NOT NULL CHECK (quantity > 0),
  dispatch_from   date,
  dispatch_to     date,
  sowing_date     date,
  batch_id        uuid,
  dispatched_qty  integer DEFAULT 0,
  remaining_qty   integer GENERATED ALWAYS AS (quantity - dispatched_qty) STORED,
  status          text DEFAULT 'pending',  -- pending|sowing_done|dispatched
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_order_items_order_id     ON ma_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_ma_order_items_product_name ON ma_order_items(product_name);
CREATE INDEX IF NOT EXISTS idx_ma_order_items_batch_id     ON ma_order_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_ma_order_items_sowing_date  ON ma_order_items(sowing_date);
CREATE INDEX IF NOT EXISTS idx_ma_order_items_status       ON ma_order_items(status);

-- ─── PRODUCTION BATCHES ──────────────────────────────
CREATE TABLE IF NOT EXISTS ma_batches (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES auth.users ON DELETE CASCADE,
  batch_no        text UNIQUE,
  product_name    text,
  variant_name    text,
  sowing_date     date,
  total_seeds     integer,
  cocopeat_used   decimal(10,3),
  trays_used      integer,
  seeds_per_tray  integer DEFAULT 126,
  expected_plants integer,
  actual_plants   integer,
  germination_pct decimal(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_seeds > 0 THEN (actual_plants::decimal / total_seeds * 100) ELSE 0 END
  ) STORED,
  status          text DEFAULT 'sowing',  -- sowing|germinating|ready|dispatched
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_batches_user_id      ON ma_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_batches_product_name ON ma_batches(product_name);
CREATE INDEX IF NOT EXISTS idx_ma_batches_sowing_date  ON ma_batches(sowing_date DESC);
CREATE INDEX IF NOT EXISTS idx_ma_batches_status       ON ma_batches(status);

-- ─── DISPATCH ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ma_dispatch (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid REFERENCES auth.users ON DELETE CASCADE,
  dispatch_no    text UNIQUE,
  order_id       uuid REFERENCES ma_orders ON DELETE SET NULL,
  customer_id    uuid REFERENCES ma_customers ON DELETE SET NULL,
  customer_name  text,
  dispatch_date  date,
  vehicle_no     text,
  driver_name    text,
  driver_phone   text,
  status         text DEFAULT 'pending',  -- pending|in_transit|delivered
  notes          text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_dispatch_user_id     ON ma_dispatch(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_dispatch_order_id    ON ma_dispatch(order_id);
CREATE INDEX IF NOT EXISTS idx_ma_dispatch_customer_id ON ma_dispatch(customer_id);
CREATE INDEX IF NOT EXISTS idx_ma_dispatch_date        ON ma_dispatch(dispatch_date DESC);
CREATE INDEX IF NOT EXISTS idx_ma_dispatch_status      ON ma_dispatch(status);

CREATE TABLE IF NOT EXISTS ma_dispatch_items (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_id     uuid REFERENCES ma_dispatch ON DELETE CASCADE,
  order_item_id   uuid REFERENCES ma_order_items ON DELETE SET NULL,
  product_name    text,
  variant_name    text,
  quantity        integer,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_dispatch_items_dispatch_id ON ma_dispatch_items(dispatch_id);

-- ─── PAYMENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ma_payments (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES auth.users ON DELETE CASCADE,
  payment_no   text UNIQUE,
  customer_id  uuid REFERENCES ma_customers ON DELETE SET NULL,
  order_id     uuid REFERENCES ma_orders ON DELETE SET NULL,
  type         text NOT NULL CHECK (type IN ('advance','paid','foc','transport')),
  amount       decimal(12,2) NOT NULL,
  payment_date date DEFAULT CURRENT_DATE,
  method       text CHECK (method IN ('cash','bank','upi','cheque')),
  reference_no text,
  narration    text,
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_payments_user_id     ON ma_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_payments_customer_id ON ma_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_ma_payments_order_id    ON ma_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_ma_payments_type        ON ma_payments(type);
CREATE INDEX IF NOT EXISTS idx_ma_payments_date        ON ma_payments(payment_date DESC);

-- ─── EMPLOYEES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ma_employees (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE,
  emp_id      text,
  name        text NOT NULL,
  role        text,
  phone       text,
  email       text,
  department  text,
  join_date   date,
  salary      decimal(10,2),
  status      text DEFAULT 'active',  -- active|inactive
  address     text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_employees_user_id    ON ma_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_employees_department ON ma_employees(department);
CREATE INDEX IF NOT EXISTS idx_ma_employees_status     ON ma_employees(status);

-- ─── CAMPAIGNS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ma_campaigns (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE,
  name        text NOT NULL,
  type        text,   -- email|whatsapp|call|field_visit
  target_zone text,
  start_date  date,
  end_date    date,
  budget      decimal(10,2),
  status      text DEFAULT 'planned',  -- planned|active|completed|cancelled
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_campaigns_user_id ON ma_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_campaigns_status  ON ma_campaigns(status);

-- ─── QUOTES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ma_quotes (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES auth.users ON DELETE CASCADE,
  quote_no     text UNIQUE,
  customer_id  uuid REFERENCES ma_customers ON DELETE SET NULL,
  customer_name text,
  quote_date   date DEFAULT CURRENT_DATE,
  valid_until  date,
  status       text DEFAULT 'draft',  -- draft|sent|accepted|rejected|expired
  items        jsonb DEFAULT '[]',
  total_amount decimal(12,2) DEFAULT 0,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_quotes_user_id     ON ma_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_quotes_customer_id ON ma_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_ma_quotes_status      ON ma_quotes(status);

-- ─── ROW LEVEL SECURITY ──────────────────────────────
ALTER TABLE ma_customers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_batches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_dispatch   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_dispatch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_employees  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_quotes     ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users only see their own data)
CREATE POLICY "users_own_customers"  ON ma_customers  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_products"   ON ma_products   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_orders"     ON ma_orders     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_batches"    ON ma_batches    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_dispatch"   ON ma_dispatch   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_payments"   ON ma_payments   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_employees"  ON ma_employees  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_campaigns"  ON ma_campaigns  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_quotes"     ON ma_quotes     FOR ALL USING (auth.uid() = user_id);

-- Order items & dispatch items: policy via parent join
CREATE POLICY "order_items_via_order" ON ma_order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM ma_orders WHERE ma_orders.id = ma_order_items.order_id AND ma_orders.user_id = auth.uid()));

CREATE POLICY "dispatch_items_via_dispatch" ON ma_dispatch_items FOR ALL
  USING (EXISTS (SELECT 1 FROM ma_dispatch WHERE ma_dispatch.id = ma_dispatch_items.dispatch_id AND ma_dispatch.user_id = auth.uid()));

-- ─── AUTO-UPDATED TIMESTAMP FUNCTION ─────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_customers_updated_at  BEFORE UPDATE ON ma_customers  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_products_updated_at   BEFORE UPDATE ON ma_products   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_orders_updated_at     BEFORE UPDATE ON ma_orders     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_batches_updated_at    BEFORE UPDATE ON ma_batches    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_dispatch_updated_at   BEFORE UPDATE ON ma_dispatch   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_employees_updated_at  BEFORE UPDATE ON ma_employees  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_campaigns_updated_at  BEFORE UPDATE ON ma_campaigns  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_quotes_updated_at     BEFORE UPDATE ON ma_quotes     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
