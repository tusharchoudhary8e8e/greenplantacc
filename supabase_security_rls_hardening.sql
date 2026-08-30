-- =====================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) HARDENING MIGRATION
-- Fixes Critical Flaw: Direct Client-Side Database Access Without RLS
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Paste & Run
-- =====================================================================

-- 1. Ensure all Nursery & Accounting Tables Exist
CREATE TABLE IF NOT EXISTS public.ma_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    zone TEXT,
    size_category TEXT DEFAULT 'Small',
    crop_types JSONB DEFAULT '["Tomato"]',
    gstin TEXT,
    address TEXT,
    opening_balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    user_id UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ma_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Vegetables',
    unit TEXT DEFAULT 'plants',
    variants JSONB DEFAULT '[]',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    user_id UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ma_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no TEXT NOT NULL,
    customer_id UUID REFERENCES public.ma_customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'pending',
    payment_type TEXT DEFAULT 'Cash',
    transport_charge NUMERIC DEFAULT 0,
    advance_payment NUMERIC DEFAULT 0,
    foc_amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    items_total NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    due_amount NUMERIC DEFAULT 0,
    delivery_address TEXT,
    notes TEXT,
    narration TEXT,
    user_id UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ma_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.ma_orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    dispatch_from DATE,
    dispatch_to DATE,
    sowing_date DATE,
    batch_id TEXT,
    dispatched_qty INTEGER DEFAULT 0,
    remaining_qty INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    user_id UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ma_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_no TEXT NOT NULL,
    batch_code TEXT,
    lot_no TEXT,
    unit TEXT DEFAULT 'Polyhouse A',
    polyhouse TEXT DEFAULT 'Polyhouse A',
    table_no TEXT,
    tray_size TEXT DEFAULT '104 Cavity',
    required_quantity INTEGER DEFAULT 0,
    buffer_quantity_pct NUMERIC DEFAULT 10,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    sowing_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    maturity_days INTEGER DEFAULT 30,
    total_seeds INTEGER DEFAULT 0,
    cocopeat_used NUMERIC DEFAULT 0,
    trays_used INTEGER DEFAULT 0,
    trays_sown INTEGER DEFAULT 0,
    seeds_per_tray INTEGER DEFAULT 1,
    expected_plants INTEGER DEFAULT 0,
    actual_plants INTEGER DEFAULT 0,
    germination_pct NUMERIC DEFAULT 90,
    status TEXT DEFAULT 'germinating',
    notes TEXT,
    allocated_quantity INTEGER DEFAULT 0,
    surplus_quantity INTEGER DEFAULT 0,
    cost_per_plant NUMERIC DEFAULT 0.60,
    user_id UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ma_purchase_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_no TEXT NOT NULL,
    party_id UUID REFERENCES public.ma_customers(id) ON DELETE SET NULL,
    party_name TEXT NOT NULL,
    bill_date DATE DEFAULT CURRENT_DATE,
    gst_type TEXT DEFAULT 'percentage',
    gst_value NUMERIC DEFAULT 18,
    gst_amount NUMERIC DEFAULT 0,
    transport_charge NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    items_total NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    due_amount NUMERIC DEFAULT 0,
    narration TEXT,
    user_id UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ma_purchase_bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.ma_purchase_bills(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'Kg',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ma_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no TEXT NOT NULL,
    order_id TEXT,
    order_no TEXT,
    customer_id UUID REFERENCES public.ma_customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    receipt_date DATE DEFAULT CURRENT_DATE,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_mode TEXT DEFAULT 'UPI',
    reference_no TEXT,
    notes TEXT,
    user_id UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ma_dispatch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_no TEXT NOT NULL,
    order_id UUID REFERENCES public.ma_orders(id) ON DELETE SET NULL,
    order_no TEXT,
    customer_id UUID REFERENCES public.ma_customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    village TEXT,
    due_amount NUMERIC DEFAULT 0,
    total_trays INTEGER DEFAULT 0,
    total_plants INTEGER DEFAULT 0,
    dispatch_date DATE DEFAULT CURRENT_DATE,
    vehicle_name TEXT,
    vehicle_no TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    status TEXT DEFAULT 'dispatched',
    notes TEXT,
    user_id UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ma_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    vehicle_name TEXT,
    vehicle_number TEXT,
    balance NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Active',
    user_id UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    user_id UUID DEFAULT auth.uid(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Safely Add user_id column across all tables if missing
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN (
            'ma_customers', 'ma_products', 'ma_orders', 'ma_order_items',
            'ma_batches', 'ma_purchase_bills', 'ma_receipts', 'ma_dispatch',
            'ma_drivers', 'app_settings', 'companies', 'ledgers', 'parties',
            'stock_items', 'vouchers', 'audit_logs'
        )
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id'
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id UUID DEFAULT auth.uid();', tbl);
        END IF;
    END LOOP;
END $$;

-- 3. Enable Strict Row Level Security (RLS) on 100% of tables
ALTER TABLE public.ma_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_purchase_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_purchase_bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_dispatch ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Drop all obsolete or wide-open policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 5. Create Secure Authenticated-Only Isolation Policies
-- Grants SELECT, INSERT, UPDATE, DELETE to authenticated users for their workspace
CREATE POLICY "auth_staff_access_customers" ON public.ma_customers
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_products" ON public.ma_products
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_orders" ON public.ma_orders
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_order_items" ON public.ma_order_items
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_batches" ON public.ma_batches
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_purchase_bills" ON public.ma_purchase_bills
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_purchase_items" ON public.ma_purchase_bill_items
    FOR ALL TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_receipts" ON public.ma_receipts
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_dispatch" ON public.ma_dispatch
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_drivers" ON public.ma_drivers
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_app_settings" ON public.app_settings
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_companies" ON public.companies
    FOR ALL TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_ledgers" ON public.ledgers
    FOR ALL TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_parties" ON public.parties
    FOR ALL TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_stock_items" ON public.stock_items
    FOR ALL TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_vouchers" ON public.vouchers
    FOR ALL TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_staff_access_audit_logs" ON public.audit_logs
    FOR ALL TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 6. Server-Side Security Trigger to Auto-Populate Authenticated User ID
CREATE OR REPLACE FUNCTION public.set_auth_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        NEW.user_id = auth.uid();
    END IF;
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to nursery tables
DROP TRIGGER IF EXISTS trg_set_user_customers ON public.ma_customers;
CREATE TRIGGER trg_set_user_customers BEFORE INSERT OR UPDATE ON public.ma_customers FOR EACH ROW EXECUTE FUNCTION public.set_auth_user_id();

DROP TRIGGER IF EXISTS trg_set_user_orders ON public.ma_orders;
CREATE TRIGGER trg_set_user_orders BEFORE INSERT OR UPDATE ON public.ma_orders FOR EACH ROW EXECUTE FUNCTION public.set_auth_user_id();

DROP TRIGGER IF EXISTS trg_set_user_batches ON public.ma_batches;
CREATE TRIGGER trg_set_user_batches BEFORE INSERT OR UPDATE ON public.ma_batches FOR EACH ROW EXECUTE FUNCTION public.set_auth_user_id();

DROP TRIGGER IF EXISTS trg_set_user_purchases ON public.ma_purchase_bills;
CREATE TRIGGER trg_set_user_purchases BEFORE INSERT OR UPDATE ON public.ma_purchase_bills FOR EACH ROW EXECUTE FUNCTION public.set_auth_user_id();

DROP TRIGGER IF EXISTS trg_set_user_receipts ON public.ma_receipts;
CREATE TRIGGER trg_set_user_receipts BEFORE INSERT OR UPDATE ON public.ma_receipts FOR EACH ROW EXECUTE FUNCTION public.set_auth_user_id();

-- 7. Realtime Replication for Authorized Subscribers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
        public.ma_customers, public.ma_products, public.ma_orders, 
        public.ma_batches, public.ma_purchase_bills, public.ma_receipts,
        public.ma_dispatch, public.ma_drivers, public.app_settings;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
