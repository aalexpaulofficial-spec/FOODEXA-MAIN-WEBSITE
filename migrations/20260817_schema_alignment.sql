-- ============================================================
-- FOODEXA: SCHEMA ALIGNMENT + POSTGREST CACHE REFRESH
-- Run this in Supabase SQL Editor to fix "column not found" errors.
-- This is idempotent and safe to run multiple times.
-- ============================================================

-- 1. Ensure ALL required orders columns exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canteen_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canteen_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_amount NUMERIC(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number BIGINT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_token TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS token_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_status TEXT DEFAULT 'incoming';
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
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_code_data TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS locker_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id_display TEXT;

-- 2. Ensure ALL required order_items columns exist
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Item';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN;

-- 3. Ensure ALL required payments columns exist
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS items_snapshot TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS canteen_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_creation_error TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS needs_manual_order BOOLEAN DEFAULT false;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_status TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_time TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS webhook_verified BOOLEAN DEFAULT false;

-- 4. Ensure profiles columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Ensure canteens columns
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS counter_code TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS counter_name TEXT;

-- 6. Ensure menu_items columns
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS food_name TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS food_type TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS canteen_id UUID;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- 7. Create students table if it doesn't exist
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
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_email_institution_unique') THEN
    ALTER TABLE public.students ADD CONSTRAINT students_email_institution_unique UNIQUE (email, institution_id);
  END IF;
END $$;

-- 8. Create order_status_history if it doesn't exist
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID,
  institution_id UUID,
  from_status TEXT,
  to_status TEXT NOT NULL,
  payment_status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create counters table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  location TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. RLS policies (idempotent)
DO $$ BEGIN
  CREATE POLICY "anon_read_orders" ON public.orders FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "anon_insert_orders" ON public.orders FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "anon_update_orders" ON public.orders FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "anon_read_order_items" ON public.order_items FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "anon_insert_order_items" ON public.order_items FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "anon_select_students" ON public.students FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "anon_insert_students" ON public.students FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "anon_notifications" ON public.notifications FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "anon_user_carts" ON public.user_carts FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "anon_user_favorites" ON public.user_favorites FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "anon_user_addresses" ON public.user_addresses FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "History read" ON public.order_status_history FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "History insert" ON public.order_status_history FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 11. Enable RLS on tables that need it
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;

-- 12. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON public.orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_institution_id ON public.orders(institution_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON public.orders(pickup_code);
CREATE INDEX IF NOT EXISTS idx_orders_token_number ON public.orders(token_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_students_email_inst ON public.students(email, institution_id);

-- 13. Enable Realtime for key tables
DO $$
DECLARE
  tbl TEXT[];
  t TEXT;
BEGIN
  tbl := ARRAY['orders', 'order_items', 'menu_items', 'menu_categories', 'canteens', 'counters', 'notifications', 'order_status_history', 'students', 'payments'];
  FOREACH t IN ARRAY tbl
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════
-- CRITICAL: Refresh PostgREST schema cache
-- This fixes "Could not find the 'counter' column" errors
-- and all other schema cache staleness issues.
-- ══════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

SELECT 'FOODEXA schema alignment applied successfully. PostgREST cache refreshed.' AS result;
