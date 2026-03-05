-- ============================================================
-- RetailIQ: Supabase Schema Migration
-- Uses auth.users as the identity source (Supabase Auth)
-- ============================================================

-- 1. business_profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_display             TEXT UNIQUE NOT NULL DEFAULT 'RIQ-TEMP',
  business_name               TEXT NOT NULL DEFAULT '',
  gst_number                  TEXT UNIQUE NOT NULL DEFAULT '',
  business_registration_number TEXT NOT NULL DEFAULT '',
  pan_number                  TEXT,
  email                       TEXT NOT NULL DEFAULT '',
  phone                       TEXT,
  address                     TEXT,
  city                        TEXT,
  state                       TEXT,
  pincode                     TEXT,
  gst_verified                BOOLEAN DEFAULT FALSE,
  pan_verified                BOOLEAN DEFAULT FALSE,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. products
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '',
  sku         TEXT,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost        NUMERIC(12,2),
  stock_qty   INTEGER DEFAULT 0,
  unit        TEXT DEFAULT 'pcs',
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_user ON public.products(user_id);

-- 3. bills
CREATE TABLE IF NOT EXISTS public.bills (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_number      TEXT NOT NULL DEFAULT '',
  customer_name    TEXT NOT NULL,
  customer_gst     TEXT,
  customer_email   TEXT,
  customer_address TEXT,
  subtotal         NUMERIC(14,2) NOT NULL DEFAULT 0,
  gst_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  gst_rate         NUMERIC(5,2) DEFAULT 18,
  total            NUMERIC(14,2) NOT NULL DEFAULT 0,
  status           TEXT DEFAULT 'draft' CHECK (status IN ('draft','paid','cancelled')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bills_user ON public.bills(user_id);

-- 4. bill_items
CREATE TABLE IF NOT EXISTS public.bill_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id      UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 1,
  unit_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount       NUMERIC(14,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON public.bill_items(bill_id);

-- 5. market_analyses
CREATE TABLE IF NOT EXISTS public.market_analyses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query      TEXT NOT NULL,
  category   TEXT,
  result     JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analyses_user ON public.market_analyses(user_id);

-- ============================================================
-- Enable Row Level Security
-- ============================================================
ALTER TABLE public.business_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analyses     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================
DROP POLICY IF EXISTS "own_profile"    ON public.business_profiles;
DROP POLICY IF EXISTS "own_products"   ON public.products;
DROP POLICY IF EXISTS "own_bills"      ON public.bills;
DROP POLICY IF EXISTS "own_bill_items" ON public.bill_items;
DROP POLICY IF EXISTS "own_analyses"   ON public.market_analyses;

CREATE POLICY "own_profile"  ON public.business_profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "own_products" ON public.products FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_bills"    ON public.bills FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_bill_items" ON public.bill_items FOR ALL
  USING (bill_id IN (SELECT id FROM public.bills WHERE user_id = auth.uid()));

CREATE POLICY "own_analyses" ON public.market_analyses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
