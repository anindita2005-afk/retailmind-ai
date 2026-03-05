-- Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analyses ENABLE ROW LEVEL SECURITY;

-- ===================== users =====================
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- ===================== business_profiles =====================
DROP POLICY IF EXISTS "bp_select_own" ON public.business_profiles;
DROP POLICY IF EXISTS "bp_insert_own" ON public.business_profiles;
DROP POLICY IF EXISTS "bp_update_own" ON public.business_profiles;

CREATE POLICY "bp_select_own" ON public.business_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bp_insert_own" ON public.business_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bp_update_own" ON public.business_profiles FOR UPDATE USING (auth.uid() = user_id);

-- ===================== products =====================
DROP POLICY IF EXISTS "products_select_own" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "products_delete_own" ON public.products;

CREATE POLICY "products_select_own" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "products_insert_own" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "products_update_own" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "products_delete_own" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- ===================== bills =====================
DROP POLICY IF EXISTS "bills_select_own" ON public.bills;
DROP POLICY IF EXISTS "bills_insert_own" ON public.bills;
DROP POLICY IF EXISTS "bills_update_own" ON public.bills;
DROP POLICY IF EXISTS "bills_delete_own" ON public.bills;

CREATE POLICY "bills_select_own" ON public.bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bills_insert_own" ON public.bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bills_update_own" ON public.bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bills_delete_own" ON public.bills FOR DELETE USING (auth.uid() = user_id);

-- ===================== bill_items =====================
DROP POLICY IF EXISTS "bill_items_select_own" ON public.bill_items;
DROP POLICY IF EXISTS "bill_items_insert_own" ON public.bill_items;
DROP POLICY IF EXISTS "bill_items_delete_own" ON public.bill_items;

CREATE POLICY "bill_items_select_own" ON public.bill_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bills WHERE bills.id = bill_items.bill_id AND bills.user_id = auth.uid())
  );
CREATE POLICY "bill_items_insert_own" ON public.bill_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.bills WHERE bills.id = bill_items.bill_id AND bills.user_id = auth.uid())
  );
CREATE POLICY "bill_items_delete_own" ON public.bill_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.bills WHERE bills.id = bill_items.bill_id AND bills.user_id = auth.uid())
  );

-- ===================== market_analyses =====================
DROP POLICY IF EXISTS "ma_select_own" ON public.market_analyses;
DROP POLICY IF EXISTS "ma_insert_own" ON public.market_analyses;
DROP POLICY IF EXISTS "ma_delete_own" ON public.market_analyses;

CREATE POLICY "ma_select_own" ON public.market_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ma_insert_own" ON public.market_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ma_delete_own" ON public.market_analyses FOR DELETE USING (auth.uid() = user_id);

-- Auto-create users row & generate display_id on new Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_val INT;
  new_display_id TEXT;
BEGIN
  -- Generate sequential display ID e.g. RIQ-2026-0001
  SELECT COALESCE(MAX(CAST(SPLIT_PART(display_id, '-', 3) AS INT)), 0) + 1
    INTO seq_val FROM public.users;

  new_display_id := 'RIQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq_val::TEXT, 4, '0');

  INSERT INTO public.users (id, email, display_id)
  VALUES (NEW.id, NEW.email, new_display_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR each ROW EXECUTE FUNCTION public.handle_new_user();
