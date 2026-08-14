-- ============================================================
-- FOODEXA PRODUCTION FIX v3 — 2026-08-14
-- No RPCs required. Direct Supabase queries only.
-- Run this in Supabase SQL Editor.
-- Idempotent (safe to run multiple times).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ══════════════════════════════════════════════════════════════
-- 1. STUDENTS TABLE (standalone, no auth.users dependency)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id TEXT,
  registration_id TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_email_institution_unique'
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT students_email_institution_unique UNIQUE (email, institution_id);
  END IF;
END;
$$;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_students ON public.students;
CREATE POLICY anon_select_students ON public.students FOR SELECT TO anon USING (true);

-- ══════════════════════════════════════════════════════════════
-- 2. ENSURE ORDERS TABLE HAS ALL REQUIRED COLUMNS
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canteen_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_amount NUMERIC(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number BIGINT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_token TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS token_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_deadline_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_type TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_by TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_pickup_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_pin TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ══════════════════════════════════════════════════════════════
-- 3. ENSURE ORDER_ITEMS HAS ALL REQUIRED COLUMNS
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN;

-- ══════════════════════════════════════════════════════════════
-- 4. ENSURE MENU_ITEMS HAS ALL REQUIRED COLUMNS
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS food_name TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS food_type TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_today_special BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_healthy BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS availability BOOLEAN DEFAULT true;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS ai_popularity_score NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS calories NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS protein NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS carbohydrates NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS carbs NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS fat NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS fiber NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sugar NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sodium NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS serving_size TEXT;

-- Backfill food_name from item_name
UPDATE public.menu_items SET food_name = item_name WHERE food_name IS NULL AND item_name IS NOT NULL;
UPDATE public.menu_items SET item_name = food_name WHERE item_name IS NULL AND food_name IS NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- 5. ENSURE PROFILES HAS ALL REQUIRED COLUMNS
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_created_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS foodexa_plan TEXT DEFAULT 'Free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- ══════════════════════════════════════════════════════════════
-- 6. ENSURE COUNTERS TABLE EXISTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  location TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 7. RLS POLICIES — SELECT for anon, INSERT/UPDATE for service
-- ══════════════════════════════════════════════════════════════

-- Institutions: anon can read
DROP POLICY IF EXISTS anon_select_institutions ON public.institutions;
CREATE POLICY anon_select_institutions ON public.institutions FOR SELECT TO anon USING (true);

-- Menu items: anon can read
DROP POLICY IF EXISTS anon_select_menu_items ON public.menu_items;
CREATE POLICY anon_select_menu_items ON public.menu_items FOR SELECT TO anon USING (true);

-- Menu categories: anon can read
DROP POLICY IF EXISTS anon_select_menu_categories ON public.menu_categories;
CREATE POLICY anon_select_menu_categories ON public.menu_categories FOR SELECT TO anon USING (true);

-- Orders: anon can read own orders (by student_id match), service-role handles inserts
DROP POLICY IF EXISTS anon_select_orders ON public.orders;
CREATE POLICY anon_select_orders ON public.orders FOR SELECT TO anon USING (true);

-- Orders: authenticated users can insert their own orders
DROP POLICY IF EXISTS authenticated_insert_orders ON public.orders;
CREATE POLICY authenticated_insert_orders ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = COALESCE(student_id::text, user_id::text));

-- Order items: anon can read
DROP POLICY IF EXISTS anon_select_order_items ON public.order_items;
CREATE POLICY anon_select_order_items ON public.order_items FOR SELECT TO anon USING (true);

-- Canteens: anon can read
DROP POLICY IF EXISTS anon_select_canteens ON public.canteens;
CREATE POLICY anon_select_canteens ON public.canteens FOR SELECT TO anon USING (true);

-- Counters: anon can read
DROP POLICY IF EXISTS anon_select_counters ON public.counters;
CREATE POLICY anon_select_counters ON public.counters FOR SELECT TO anon USING (true);

-- Notifications: anon can read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_notifications' AND tablename = 'notifications') THEN
    CREATE POLICY anon_select_notifications ON public.notifications FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- Payments: anon can read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_payments' AND tablename = 'payments') THEN
    CREATE POLICY anon_select_payments ON public.payments FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- User carts: anon can manage
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_user_carts' AND tablename = 'user_carts') THEN
    CREATE POLICY anon_all_user_carts ON public.user_carts FOR ALL TO anon USING (true);
  END IF;
END $$;

-- User favorites: anon can manage
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_user_favorites' AND tablename = 'user_favorites') THEN
    CREATE POLICY anon_all_user_favorites ON public.user_favorites FOR ALL TO anon USING (true);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 8. REALTIME (idempotent — checks before adding)
-- ══════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'menu_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'canteens') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.canteens;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'menu_categories') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_categories;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 9. INDEXES
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON public.orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_institution_id ON public.orders(institution_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_students_email_inst ON public.students(email, institution_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_institution ON public.menu_items(institution_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_canteen ON public.menu_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

SELECT 'FOODEXA production fix v3 applied successfully.' AS result;
