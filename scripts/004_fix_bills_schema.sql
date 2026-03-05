-- ============================================================
-- Migration 004: Fix bills & bill_items schema
-- Adds missing columns that the API code expects
-- ============================================================

-- Add missing columns to bills
ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS customer_phone   TEXT,
  ADD COLUMN IF NOT EXISTS bill_date        DATE NOT NULL DEFAULT CURRENT_DATE;

-- bill_items: the old schema used product_name/quantity/unit_price
-- Add the new columns the API expects (keep old ones for compatibility)
ALTER TABLE public.bill_items
  ADD COLUMN IF NOT EXISTS product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS name        TEXT,
  ADD COLUMN IF NOT EXISTS unit        TEXT DEFAULT 'pcs',
  ADD COLUMN IF NOT EXISTS qty         NUMERIC(10,3) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_rate    NUMERIC(5,2)  DEFAULT 18,
  ADD COLUMN IF NOT EXISTS gst_amount  NUMERIC(14,2) NOT NULL DEFAULT 0;

-- Back-fill name from product_name if present
UPDATE public.bill_items SET name = product_name WHERE name IS NULL AND product_name IS NOT NULL;

-- Make name NOT NULL after back-fill (safe because all rows now have it)
ALTER TABLE public.bill_items ALTER COLUMN name SET DEFAULT '';
