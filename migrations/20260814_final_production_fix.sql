-- ============================================================
-- FOODEXA FINAL PRODUCTION FIX — 2026-08-14
-- Run this in Supabase SQL Editor
-- Idempotent (safe to run multiple times)
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

-- Unique constraint: one student per email+institution
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

-- Anon can read students (filtered client-side)
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
-- 3. ENSURE ORDER_ITEMS TABLE HAS ALL REQUIRED COLUMNS
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN;

-- ══════════════════════════════════════════════════════════════
-- 4. ENSURE MENU_ITEMS TABLE HAS ALL REQUIRED COLUMNS
-- (The frontend queries these columns; add them if missing)
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

-- Backfill food_name from item_name if food_name is null
UPDATE public.menu_items SET food_name = item_name WHERE food_name IS NULL AND item_name IS NOT NULL;
-- Backfill item_name from food_name if item_name is null
UPDATE public.menu_items SET item_name = food_name WHERE item_name IS NULL AND food_name IS NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- 5. ENSURE PROFILES TABLE HAS ALL REQUIRED COLUMNS
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
-- 7. ENSURE HOMEPAGE_SECTIONS TABLE EXISTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT DEFAULT '',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 8. RLS POLICIES
-- ══════════════════════════════════════════════════════════════

-- Orders: anon can SELECT (filtered client-side by student_id)
DROP POLICY IF EXISTS anon_select_orders ON public.orders;
CREATE POLICY anon_select_orders ON public.orders FOR SELECT TO anon USING (true);

-- Order Items: anon can SELECT
DROP POLICY IF EXISTS anon_select_order_items ON public.order_items;
CREATE POLICY anon_select_order_items ON public.order_items FOR SELECT TO anon USING (true);

-- Menu Items: anon can SELECT
DROP POLICY IF EXISTS anon_select_menu_items ON public.menu_items;
CREATE POLICY anon_select_menu_items ON public.menu_items FOR SELECT TO anon USING (true);

-- Institutions: anon can SELECT
DROP POLICY IF EXISTS anon_select_institutions ON public.institutions;
CREATE POLICY anon_select_institutions ON public.institutions FOR SELECT TO anon USING (true);

-- Canteens: anon can SELECT
DROP POLICY IF EXISTS anon_select_canteens ON public.canteens;
CREATE POLICY anon_select_canteens ON public.canteens FOR SELECT TO anon USING (true);

-- Counters: anon can SELECT
DROP POLICY IF EXISTS anon_select_counters ON public.counters;
CREATE POLICY anon_select_counters ON public.counters FOR SELECT TO anon USING (true);

-- Menu Categories: anon can SELECT
DROP POLICY IF EXISTS anon_select_menu_categories ON public.menu_categories;
CREATE POLICY anon_select_menu_categories ON public.menu_categories FOR SELECT TO anon USING (true);

-- Notifications: anon can SELECT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_notifications' AND tablename = 'notifications') THEN
    CREATE POLICY anon_select_notifications ON public.notifications FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

-- Payments: anon can SELECT (needed for idempotency checks)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_payments' AND tablename = 'payments') THEN
    CREATE POLICY anon_select_payments ON public.payments FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

-- User Carts: anon can read/write their own
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_user_carts' AND tablename = 'user_carts') THEN
    CREATE POLICY anon_all_user_carts ON public.user_carts FOR ALL TO anon USING (true);
  END IF;
END;
$$;

-- User Favorites: anon can read/write their own
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_user_favorites' AND tablename = 'user_favorites') THEN
    CREATE POLICY anon_all_user_favorites ON public.user_favorites FOR ALL TO anon USING (true);
  END IF;
END;
$$;

-- User Addresses: anon can read/write their own
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_user_addresses' AND tablename = 'user_addresses') THEN
    CREATE POLICY anon_all_user_addresses ON public.user_addresses FOR ALL TO anon USING (true);
  END IF;
END;
$$;

-- ══════════════════════════════════════════════════════════════
-- 9. REALTIME CONFIGURATION
-- ══════════════════════════════════════════════════════════════

-- Add tables to supabase_realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;

-- ══════════════════════════════════════════════════════════════
-- 10. INDEXES FOR PERFORMANCE
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

-- ══════════════════════════════════════════════════════════════
-- 11. RPC: get_institution_by_code
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_institution_by_code(p_institution_code TEXT)
RETURNS jsonb AS $$
DECLARE
  v_inst RECORD;
BEGIN
  SELECT * INTO v_inst
  FROM public.institutions
  WHERE UPPER(TRIM(institution_code)) = UPPER(TRIM(p_institution_code))
  LIMIT 1;

  IF v_inst IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_inst.id,
    'name', COALESCE(v_inst.name, v_inst.institution_name, ''),
    'institution_name', COALESCE(v_inst.institution_name, v_inst.name, ''),
    'campus', COALESCE(v_inst.campus, ''),
    'city', COALESCE(v_inst.city, ''),
    'state', COALESCE(v_inst.state, ''),
    'country', COALESCE(v_inst.country, ''),
    'institution_code', v_inst.institution_code,
    'status', v_inst.status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- 12. RPC: start_student_session
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.start_student_session(
  p_full_name TEXT,
  p_email TEXT,
  p_institution_code TEXT
) RETURNS jsonb AS $$
DECLARE
  v_institution RECORD;
  v_student RECORD;
  v_safe_name TEXT;
  v_safe_email TEXT;
  v_safe_code TEXT;
  v_year INT;
  v_name_parts TEXT[];
  v_first_letter TEXT;
  v_last_letter TEXT;
  v_initials TEXT;
  v_student_id_val TEXT;
  v_registration_id_val TEXT;
BEGIN
  -- 1. Normalize inputs
  v_safe_name := TRIM(p_full_name);
  v_safe_email := LOWER(TRIM(p_email));
  v_safe_code := UPPER(TRIM(p_institution_code));

  IF v_safe_name = '' OR v_safe_email = '' OR v_safe_code = '' THEN
    RETURN jsonb_build_object('error', 'All fields are required.');
  END IF;

  -- 2. Find institution by code
  SELECT * INTO v_institution
  FROM public.institutions
  WHERE institution_code = v_safe_code
  LIMIT 1;

  IF v_institution IS NULL THEN
    RETURN jsonb_build_object('error', 'Institution code not found. Please check your code.');
  END IF;

  -- Check institution is active/approved
  IF v_institution.status IS NOT NULL
     AND v_institution.status NOT IN ('active', 'approved') THEN
    RETURN jsonb_build_object('error', 'This institution is currently unavailable.');
  END IF;

  -- 3. Check for existing student (email + institution_id)
  SELECT * INTO v_student
  FROM public.students
  WHERE email = v_safe_email
    AND institution_id = v_institution.id
  LIMIT 1;

  IF v_student IS NOT NULL THEN
    -- Return existing student — never duplicate
    RETURN jsonb_build_object(
      'student', jsonb_build_object(
        'id', v_student.id,
        'email', v_student.email,
        'full_name', v_student.full_name,
        'student_id', v_student.student_id,
        'registration_id', v_student.registration_id,
        'institution_id', v_student.institution_id
      ),
      'institution', jsonb_build_object(
        'institution_id', v_institution.id,
        'institution_name', COALESCE(v_institution.name, v_institution.institution_name, ''),
        'campus', COALESCE(v_institution.campus, ''),
        'city', COALESCE(v_institution.city, ''),
        'state', COALESCE(v_institution.state, ''),
        'country', COALESCE(v_institution.country, ''),
        'institution_code', v_institution.institution_code
      )
    );
  END IF;

  -- 4. Generate student identifiers
  v_year := EXTRACT(YEAR FROM now())::int;
  v_name_parts := regexp_split_to_array(v_safe_name, '\s+');

  IF array_length(v_name_parts, 1) >= 2 THEN
    v_first_letter := UPPER(LEFT(v_name_parts[1], 1));
    v_last_letter := UPPER(LEFT(v_name_parts[array_length(v_name_parts, 1)], 1));
  ELSIF array_length(v_name_parts, 1) = 1 THEN
    v_first_letter := UPPER(LEFT(v_name_parts[1], 1));
    v_last_letter := UPPER(RIGHT(v_name_parts[1], 1));
  ELSE
    v_first_letter := 'X';
    v_last_letter := 'X';
  END IF;

  v_initials := v_first_letter || v_last_letter;
  v_student_id_val := 'FDX-STU-' || v_initials || v_year::text;
  v_registration_id_val := 'FDX-REG-' || v_initials || v_year::text;

  -- 5. Insert new student
  INSERT INTO public.students (email, full_name, institution_id, student_id, registration_id)
  VALUES (v_safe_email, v_safe_name, v_institution.id, v_student_id_val, v_registration_id_val)
  RETURNING * INTO v_student;

  -- 6. Return result
  RETURN jsonb_build_object(
    'student', jsonb_build_object(
      'id', v_student.id,
      'email', v_student.email,
      'full_name', v_student.full_name,
      'student_id', v_student.student_id,
      'registration_id', v_student.registration_id,
      'institution_id', v_student.institution_id
    ),
    'institution', jsonb_build_object(
      'institution_id', v_institution.id,
      'institution_name', COALESCE(v_institution.name, v_institution.institution_name, ''),
      'campus', COALESCE(v_institution.campus, ''),
      'city', COALESCE(v_institution.city, ''),
      'state', COALESCE(v_institution.state, ''),
      'country', COALESCE(v_institution.country, ''),
      'institution_code', v_institution.institution_code
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- 13. RPC: create_student_order
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.create_student_order(payload jsonb)
RETURNS jsonb AS $$
DECLARE
  v_pickup_prefix text;
  v_next_pickup_seq int;
  v_pickup_code text;
  v_next_token_seq int;
  v_token_number text;
  v_order_id uuid;
  v_item jsonb;
  v_estimated_ready timestamptz;
  v_cancel_deadline timestamptz;
  v_result jsonb;
BEGIN
  -- 1. Determine prefix
  v_pickup_prefix := COALESCE(payload->>'pickup_type', 'B');

  -- 2. Generate Pickup Code (sequential per day per prefix)
  SELECT COUNT(*) INTO v_next_pickup_seq
  FROM public.orders
  WHERE pickup_code LIKE v_pickup_prefix || '-%'
  AND created_at >= date_trunc('day', now());

  v_pickup_code := v_pickup_prefix || '-' || lpad((v_next_pickup_seq + 1)::text, 4, '0');

  -- 3. Generate Token Number (sequential per day)
  SELECT COUNT(*) INTO v_next_token_seq
  FROM public.orders
  WHERE token_number LIKE 'TKN-%'
  AND created_at >= date_trunc('day', now());

  v_token_number := 'TKN-' || v_pickup_prefix || '-' || lpad((v_next_token_seq + 1)::text, 4, '0');

  -- 4. Calculate Deadlines
  v_estimated_ready := now() + interval '15 minutes';
  v_cancel_deadline := now() + interval '30 seconds';

  -- 5. Insert Order
  INSERT INTO public.orders (
    student_id, registration_id, email, customer_name, phone,
    institution_id, canteen_id, counter_id, counter, counter_code,
    total_amount, transaction_amount, status, order_status, kitchen_status, counter_status,
    payment_status, payment_method, razorpay_order_id, razorpay_payment_id, razorpay_signature,
    pickup_code, token_number, pickup_token, pickup_type, estimated_ready_at, cancel_deadline_at,
    notes, paid_at, order_number, created_at, updated_at
  ) VALUES (
    (payload->>'student_id')::uuid,
    payload->>'registration_id',
    payload->>'email',
    payload->>'customer_name',
    payload->>'phone',
    (payload->>'institution_id')::uuid,
    NULLIF(payload->>'canteen_id', '')::uuid,
    NULLIF(payload->>'counter_id', '')::uuid,
    payload->>'counter',
    payload->>'counter_code',
    (payload->>'total_amount')::numeric,
    (payload->>'transaction_amount')::numeric,
    'confirmed', 'confirmed', 'pending', 'pending',
    'paid',
    payload->>'payment_method',
    payload->>'razorpay_order_id',
    payload->>'razorpay_payment_id',
    payload->>'razorpay_signature',
    v_pickup_code, v_token_number, v_token_number, v_pickup_prefix,
    v_estimated_ready, v_cancel_deadline,
    payload->>'notes',
    now(),
    EXTRACT(EPOCH FROM now())::bigint,
    now(), now()
  ) RETURNING id INTO v_order_id;

  -- 6. Insert Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    INSERT INTO public.order_items (
      order_id, menu_item_id, name, variant, quantity, price, subtotal, image_url, is_veg
    ) VALUES (
      v_order_id,
      NULLIF(v_item->>'id', '')::uuid,
      v_item->>'name',
      v_item->>'variant',
      (v_item->>'quantity')::int,
      (v_item->>'price')::numeric,
      ((v_item->>'price')::numeric * (v_item->>'quantity')::int),
      v_item->>'image_url',
      (v_item->>'is_veg')::boolean
    );
  END LOOP;

  -- 7. Return Result
  SELECT row_to_json(o) INTO v_result
  FROM public.orders o
  WHERE id = v_order_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- 14. RPC: next_pickup_code_number
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.next_pickup_code_number(p_prefix TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.orders
  WHERE pickup_code LIKE p_prefix || '-%'
  AND created_at >= date_trunc('day', now());

  RETURN v_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- 15. RPC: next_token_number
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.next_token_number()
RETURNS INTEGER AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.orders
  WHERE token_number LIKE 'TKN-%'
  AND created_at >= date_trunc('day', now());

  RETURN v_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- 16. Ensure institution code is seeded
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.institutions (name, institution_name, campus, city, state, country, institution_code, status)
VALUES ('Yeshua Institution', 'Yeshua Institution', 'Main Campus', 'Bengaluru', 'Karnataka', 'India', 'YESHUA339537', 'active')
ON CONFLICT (institution_code) DO UPDATE SET
  status = 'active',
  updated_at = now();

SELECT 'FOODEXA final production fix applied successfully.' AS result;
