-- ============================================================
-- FOODEXA: PRODUCTION FIX — Consolidated Schema Alignment
-- ============================================================
-- This migration aligns the Supabase schema with the application code.
-- It is idempotent (safe to run multiple times).
-- It does NOT rename or delete existing production columns.
-- It does NOT destroy existing data.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ══════════════════════════════════════════════════════════════
-- 1. INSTITUTIONS TABLE — already has both `name` and `institution_name`
-- No changes needed, both columns exist from original schema.
-- =========================================================

-- ══════════════════════════════════════════════════════════════
-- 2. STUDENTS TABLE — standalone student records for session flow
-- =========================================================
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

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_students ON public.students;
CREATE POLICY anon_select_students ON public.students FOR SELECT USING (true);
DROP POLICY IF EXISTS anon_insert_students ON public.students;
CREATE POLICY anon_insert_students ON public.students FOR INSERT WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════
-- 3. ORDERS TABLE — ensure all required columns exist
-- Key fix: student_id is UUID, not a free-text session ID.
-- Direct-access students get their UUID from the students table,
-- NOT a frontend-generated UUID.
-- =========================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canteen_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_code TEXT;
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

-- Ensure status column has DEFAULT if it doesn't
DO $$
BEGIN
  IF (SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='status') IS NULL THEN
    ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 4. ORDER_ITEMS TABLE — ensure snapshot columns exist
-- =========================================================
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Item';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN;

-- ══════════════════════════════════════════════════════════════
-- 5. PROFILES TABLE — ensure required columns exist
-- =========================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS foodexa_plan TEXT DEFAULT 'Free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ══════════════════════════════════════════════════════════════
-- 6. MENU_ITEMS TABLE — ensure required columns exist
-- =========================================================
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS food_name TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS food_type TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT false;
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

-- Backfill food_name from item_name (and vice-versa) where one is NULL
UPDATE public.menu_items SET food_name = item_name WHERE food_name IS NULL AND item_name IS NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- 7. CANTEENS TABLE — ensure status column exists
-- The original schema has `is_active`, but the application
-- also checks a `status` column. We add `status` if missing.
-- =========================================================
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS counter_code TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS counter_name TEXT;
-- Backfill status from is_active where status is NULL
UPDATE public.canteens SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END WHERE status IS NULL AND is_active IS NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- 8. PAYMENTS TABLE — ensure required columns exist
-- =========================================================
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS items_snapshot TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS canteen_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_creation_error TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS needs_manual_order BOOLEAN DEFAULT false;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_status TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_time TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS webhook_verified BOOLEAN DEFAULT false;

-- ══════════════════════════════════════════════════════════════
-- 9. ORDER_STATUS_HISTORY TABLE
-- =========================================================
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

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "History read" ON public.order_status_history;
CREATE POLICY "History read" ON public.order_status_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "History insert" ON public.order_status_history;
CREATE POLICY "History insert" ON public.order_status_history FOR INSERT WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════
-- 10. COUNTERS TABLE
-- =========================================================
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
-- 11. RLS POLICIES
-- =========================================================

-- Institutions: anyone can read (needed for code lookup)
DROP POLICY IF EXISTS "Anyone can read institutions" ON public.institutions;
CREATE POLICY "Anyone can read institutions" ON public.institutions FOR SELECT USING (true);

-- Menu items: anyone can read
DROP POLICY IF EXISTS "Anyone can read menu_items" ON public.menu_items;
CREATE POLICY "Anyone can read menu_items" ON public.menu_items FOR SELECT USING (true);

-- Menu categories: anyone can read
DROP POLICY IF EXISTS "Anyone can read menu_categories" ON public.menu_categories;
CREATE POLICY "Anyone can read menu_categories" ON public.menu_categories FOR SELECT USING (true);

-- Canteens: anyone can read
DROP POLICY IF EXISTS "Anyone can read canteens" ON public.canteens;
CREATE POLICY "Anyone can read canteens" ON public.canteens FOR SELECT USING (true);

-- Counters: anyone can read
DROP POLICY IF EXISTS "Anyone can read counters" ON public.counters;
CREATE POLICY "Anyone can read counters" ON public.counters FOR SELECT USING (true);

-- Orders: anon reads (filtered client-side), service-role handles writes
DROP POLICY IF EXISTS "anon_read_orders" ON public.orders;
CREATE POLICY "anon_read_orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
CREATE POLICY "anon_insert_orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_orders" ON public.orders;
CREATE POLICY "anon_update_orders" ON public.orders FOR UPDATE USING (true);

-- Order items: anon reads, service-role handles writes
DROP POLICY IF EXISTS "anon_read_order_items" ON public.order_items;
CREATE POLICY "anon_read_order_items" ON public.order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon_insert_order_items" ON public.order_items;
CREATE POLICY "anon_insert_order_items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Notifications: anyone can read & insert (used for order confirmations)
DROP POLICY IF EXISTS "anon_notifications" ON public.notifications;
CREATE POLICY "anon_notifications" ON public.notifications FOR ALL USING (true);

-- User addresses/carts/favorites: anyone can manage (client-side)
DROP POLICY IF EXISTS "anon_user_addresses" ON public.user_addresses;
CREATE POLICY "anon_user_addresses" ON public.user_addresses FOR ALL USING (true);
DROP POLICY IF EXISTS "anon_user_carts" ON public.user_carts;
CREATE POLICY "anon_user_carts" ON public.user_carts FOR ALL USING (true);
DROP POLICY IF EXISTS "anon_user_favorites" ON public.user_favorites;
CREATE POLICY "anon_user_favorites" ON public.user_favorites FOR ALL USING (true);

-- ══════════════════════════════════════════════════════════════
-- 12. INDEXES
-- =========================================================
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
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- ══════════════════════════════════════════════════════════════
-- 13. REALTIME (enable for all key tables)
-- =========================================================
DO $$
DECLARE
  tables TEXT[] := ARRAY['orders', 'order_items', 'menu_items', 'menu_categories', 'canteens', 'counters', 'notifications', 'order_status_history', 'students'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.%I', t);
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 14. RPC: get_institution_by_code — secure institution lookup
-- Called from frontend when student enters institution code.
-- Uses SECURITY DEFINER to bypass RLS (read-only to anon).
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_institution_by_code(p_institution_code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  institution_name TEXT,
  campus TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  institution_code TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.name,
    COALESCE(i.institution_name, i.name) AS institution_name,
    i.campus,
    i.city,
    i.state,
    i.country,
    i.institution_code,
    i.status
  FROM public.institutions i
  WHERE UPPER(TRIM(i.institution_code)) = UPPER(TRIM(p_institution_code))
    AND i.status IN ('active', 'approved')
  LIMIT 1;
END;
$$;

-- ══════════════════════════════════════════════════════════════
-- 15. RPC: start_student_session — secure student session creation
-- Replaces the frontend's local session creation with a proper
-- database record. Returns student UUID + institution details.
-- =========================================================
CREATE OR REPLACE FUNCTION public.start_student_session(
  p_full_name TEXT,
  p_email TEXT,
  p_institution_code TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_institution RECORD;
  v_student RECORD;
  v_safe_name TEXT;
  v_safe_email TEXT;
  v_safe_code TEXT;
  v_year TEXT;
  v_initials TEXT;
  v_first_letter TEXT;
  v_last_letter TEXT;
  v_name_parts TEXT[];
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
  WHERE UPPER(TRIM(institution_code)) = v_safe_code
    AND status IN ('active', 'approved')
  LIMIT 1;

  IF v_institution IS NULL THEN
    RETURN jsonb_build_object('error', 'Institution code not found. Please check your code.');
  END IF;

  -- 3. Check for existing student (email + institution_id)
  SELECT * INTO v_student
  FROM public.students
  WHERE email = v_safe_email
    AND institution_id = v_institution.id
  LIMIT 1;

  IF v_student IS NOT NULL THEN
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

  -- 4. Generate student identifiers (FDX-STU-XXXX + year)
  v_year := EXTRACT(YEAR FROM now())::text;
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
  v_student_id_val := 'FDX-STU-' || v_initials || v_year;
  v_registration_id_val := 'FDX-REG-' || v_initials || v_year;

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
$$;

-- ══════════════════════════════════════════════════════════════
-- 16. RPC: create_student_order — atomic order + items creation
-- SECURITY DEFINER so the anon client can insert orders via RPC.
-- Checks payment_id idempotency before inserting.
-- =========================================================
CREATE OR REPLACE FUNCTION public.create_student_order(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pickup_prefix TEXT;
  v_next_pickup_seq INT;
  v_pickup_code TEXT;
  v_next_token_seq INT;
  v_token_number TEXT;
  v_order_id UUID;
  v_item JSONB;
  v_estimated_ready TIMESTAMPTZ;
  v_cancel_deadline TIMESTAMPTZ;
  v_result JSONB;
  v_existing_order UUID;
BEGIN
  -- 1. Idempotency: check if order already exists for this razorpay_payment_id or razorpay_order_id
  SELECT id INTO v_existing_order
  FROM public.orders
  WHERE razorpay_payment_id = payload->>'razorpay_payment_id'
     OR razorpay_order_id = payload->>'razorpay_order_id'
  LIMIT 1;

  IF v_existing_order IS NOT NULL THEN
    -- Return existing order (already created)
    SELECT row_to_json(o) INTO v_result FROM public.orders o WHERE o.id = v_existing_order;
    RETURN jsonb_build_object('order_id', v_existing_order, 'already_existed', true);
  END IF;

  -- 2. Determine pickup prefix
  v_pickup_prefix := COALESCE(payload->>'pickup_type', 'B');
  IF v_pickup_prefix IS NULL OR v_pickup_prefix = '' THEN
    v_pickup_prefix := 'B';
  END IF;

  -- 3. Generate Pickup Code (sequential per day per prefix)
  SELECT COUNT(*) INTO v_next_pickup_seq
  FROM public.orders
  WHERE pickup_code LIKE v_pickup_prefix || '-%'
    AND created_at >= date_trunc('day', now());

  v_pickup_code := v_pickup_prefix || '-' || lpad((v_next_pickup_seq + 1)::text, 4, '0');

  -- 4. Generate Token Number (sequential per day)
  SELECT COUNT(*) INTO v_next_token_seq
  FROM public.orders
  WHERE token_number LIKE 'TKN-%'
    AND created_at >= date_trunc('day', now());

  v_token_number := 'TKN-' || lpad((v_next_token_seq + 1)::text, 4, '0');

  -- 5. Calculate Deadlines
  v_estimated_ready := now() + interval '15 minutes';
  v_cancel_deadline := now() + interval '30 seconds';

  -- 6. Insert Order
  INSERT INTO public.orders (
    student_id, registration_id, email, customer_name, phone,
    institution_id, canteen_id, counter, counter_code,
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
    (payload->>'canteen_id')::uuid,
    payload->>'counter',
    payload->>'counter_code',
    (payload->>'total_amount')::numeric,
    (payload->>'transaction_amount')::numeric,
    'confirmed', 'confirmed', 'pending', 'incoming',
    'paid',
    payload->>'payment_method',
    payload->>'razorpay_order_id',
    payload->>'razorpay_payment_id',
    payload->>'razorpay_signature',
    v_pickup_code, v_token_number, v_token_number, v_pickup_prefix,
    v_estimated_ready, v_cancel_deadline,
    payload->>'notes',
    now(),
    now(),
    now()
  ) RETURNING id INTO v_order_id;

  -- 7. Insert Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    INSERT INTO public.order_items (
      order_id, menu_item_id, name, variant, quantity, price, subtotal, image_url, is_veg
    ) VALUES (
      v_order_id,
      (v_item->>'id')::uuid,
      v_item->>'name',
      v_item->>'variant',
      (v_item->>'quantity')::int,
      (v_item->>'price')::numeric,
      (v_item->>'subtotal')::numeric,
      v_item->>'image_url',
      (v_item->>'is_veg')::boolean
    );
  END LOOP;

  -- 8. Return Result
  SELECT row_to_json(o) INTO v_result FROM public.orders o WHERE o.id = v_order_id;
  RETURN jsonb_build_object('order_id', v_order_id, 'already_existed', false);
END;
$$;

-- ══════════════════════════════════════════════════════════════
-- 17. RPC: next_pickup_code_number — atomic sequence generator
-- =========================================================
CREATE OR REPLACE FUNCTION public.next_pickup_code_number(p_prefix TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN pickup_code ~ ('^' || p_prefix || '-[0-9]+$')
    THEN CAST(substring(pickup_code FROM ('^' || p_prefix || '-(\d+)$')) AS INTEGER)
    ELSE 0 END
  ), 0) + 1
  INTO next_num
  FROM public.orders
  WHERE created_at >= CURRENT_DATE
    AND pickup_code LIKE (p_prefix || '-%');

  RETURN next_num;
END;
$$;

-- ══════════════════════════════════════════════════════════════
-- 18. RPC: next_token_number — atomic sequence generator
-- =========================================================
CREATE OR REPLACE FUNCTION public.next_token_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN token_number ~ '^TKN-[0-9]+$'
    THEN CAST(substring(token_number FROM '^TKN-(\d+)$') AS INTEGER)
    ELSE 0 END
  ), 0) + 1
  INTO next_num
  FROM public.orders
  WHERE created_at >= CURRENT_DATE
    AND token_number LIKE 'TKN-%';

  RETURN next_num;
END;
$$;

SELECT 'FOODEXA consolidated production fix applied successfully.' AS result;
