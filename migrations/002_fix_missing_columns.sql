-- ============================================================
-- FOODEXA Migration 002: Add all missing columns for payment flow
-- Run this in Supabase SQL Editor
-- ============================================================

-- ==================== ORDERS TABLE ====================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_amount NUMERIC(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number BIGINT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_token TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS token_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_pickup_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_status TEXT DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_status TEXT DEFAULT 'Incoming';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_by TEXT;

-- ==================== ORDER_ITEMS TABLE ====================
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);

-- ==================== CANTEENS TABLE ====================
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS counter_code TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS counter_name TEXT;

-- ==================== PROFILES TABLE ====================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS foodexa_plan TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- ==================== MENU_ITEMS TABLE ====================
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS food_name TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS food_type TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_today_special BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS has_offer BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS regular_price NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS discount_price NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER DEFAULT 15;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS prep_time INTEGER DEFAULT 15;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS spicy_level INTEGER DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS protein NUMERIC(5,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS carbohydrates NUMERIC(5,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS fat NUMERIC(5,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS fiber NUMERIC(5,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS serving_size TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS carbs NUMERIC(5,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sugar NUMERIC(5,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sodium NUMERIC(5,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available';
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS ai_popularity_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 999;

-- ==================== ORDER_STATUS_HISTORY TABLE ====================
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID,
  institution_id UUID,
  from_status TEXT,
  to_status TEXT,
  payment_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== DATA FIXES ====================

-- Fix student_id format for existing student (must be STU-YYYY-XXXXXXXX)
UPDATE public.profiles
SET student_id = 'STU-2026-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE user_id = 'f48fdf4b-7b76-4778-b00d-b981f9e9766e'
  AND (student_id IS NULL OR student_id NOT LIKE 'STU-%');

-- Set account_created_at for existing profiles
UPDATE public.profiles SET account_created_at = created_at WHERE account_created_at IS NULL;

-- Set canteen status = 'active' (code checks this column)
UPDATE public.canteens SET status = 'active' WHERE status IS NULL;

-- ==================== REALTIME ====================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.canteens;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
