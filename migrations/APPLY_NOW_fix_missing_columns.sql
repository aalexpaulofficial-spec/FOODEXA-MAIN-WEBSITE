-- ============================================================
-- FOODEXA — APPLY NOW: Fix PGRST204 & missing columns
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- All statements are idempotent (safe to run more than once)
-- ============================================================

-- ── ORDERS TABLE ─────────────────────────────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_deadline_at   TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_type           TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id_display    TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_pickup_code        TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_code           TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS token_number          TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_token          TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_code          TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status          TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_status        TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_status        TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method        TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_amount    NUMERIC(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id     TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id   TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature    TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_ready_at    TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at               TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS accepted_at           TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preparing_at          TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ready_at              TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS completed_at          TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at          TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_by          TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canteen_id            UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS registration_id       TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name         TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone                 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes                 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number          BIGINT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_code               TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_code_data          TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS locker_number         TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_pin            TEXT;
-- student_id column: stores the UUID from our students table (not auth.users)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id            UUID;

-- ── PROFILES TABLE ───────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id          TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_id     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_created_at  TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS foodexa_plan        TEXT DEFAULT 'Free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan                TEXT DEFAULT 'Free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url          TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department          TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS semester            TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS programme           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campus_block        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diet_preference     TEXT DEFAULT 'all';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation         TEXT;

-- ── STUDENTS TABLE ───────────────────────────────────────────
-- Standalone student records: no dependency on auth.users.
-- Students are identified by (email + institution_id).
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id TEXT,           -- e.g. FDX-STU-AL2026
  registration_id TEXT,      -- e.g. FDX-REG-AL2026
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one student per email+institution (prevents duplicates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_email_institution_unique'
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT students_email_institution_unique UNIQUE (email, institution_id);
  END IF;
END;
$$;

-- Enable RLS on students but allow anon read/insert via RPCs
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Allow anon to read their own student record (filtered by client)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_students' AND tablename = 'students') THEN
    CREATE POLICY anon_select_students ON public.students FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

-- ── RLS POLICIES FOR ORDERS (allow anon access for student dashboard) ──
-- Orders: anon can SELECT orders (filtered client-side by student UUID)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_orders' AND tablename = 'orders') THEN
    CREATE POLICY anon_select_orders ON public.orders FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

-- Order Items: anon can SELECT order_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_order_items' AND tablename = 'order_items') THEN
    CREATE POLICY anon_select_order_items ON public.order_items FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

-- Menu Items: anon can SELECT menu_items (needed to display menu)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_menu_items' AND tablename = 'menu_items') THEN
    CREATE POLICY anon_select_menu_items ON public.menu_items FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

-- Institutions: anon can SELECT institutions (needed for code lookup)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_institutions' AND tablename = 'institutions') THEN
    CREATE POLICY anon_select_institutions ON public.institutions FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

-- Canteens: anon can SELECT canteens (needed for menu/counters)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_canteens' AND tablename = 'canteens') THEN
    CREATE POLICY anon_select_canteens ON public.canteens FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

-- Counters: anon can SELECT counters
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_counters' AND tablename = 'counters') THEN
    CREATE POLICY anon_select_counters ON public.counters FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_cancel_deadline      ON public.orders(cancel_deadline_at);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_type          ON public.orders(pickup_type);
CREATE INDEX IF NOT EXISTS idx_orders_token_number         ON public.orders(token_number);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code          ON public.orders(pickup_code);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id    ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id  ON public.orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_student_id           ON public.orders(student_id);
CREATE INDEX IF NOT EXISTS idx_students_email_inst         ON public.students(email, institution_id);

-- ── REALTIME ─────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;
END;
$$;

-- ══════════════════════════════════════════════════════════════
-- RPC: START STUDENT SESSION
-- Called from the frontend when a student clicks "Continue".
-- No Supabase Auth required. Creates or retrieves a student record.
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
  v_initials TEXT;
  v_year INT;
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
    -- First letter of first word + first letter of last word
    v_first_letter := UPPER(LEFT(v_name_parts[1], 1));
    v_last_letter := UPPER(LEFT(v_name_parts[array_length(v_name_parts, 1)], 1));
  ELSIF array_length(v_name_parts, 1) = 1 THEN
    -- First letter + last letter of single name
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
-- RPC: ORDER CREATION
-- Creates order + order_items atomically. SECURITY DEFINER
-- bypasses RLS so the anon client can create orders via RPC.
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
    (payload->>'canteen_id')::uuid,
    (payload->>'counter_id')::uuid,
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
      order_id, menu_item_id, name, variant, quantity, price
    ) VALUES (
      v_order_id,
      (v_item->>'id')::uuid,
      v_item->>'name',
      v_item->>'variant',
      (v_item->>'quantity')::int,
      (v_item->>'price')::numeric
    );
  END LOOP;

  -- 7. Return Result
  SELECT row_to_json(o) INTO v_result
  FROM public.orders o
  WHERE id = v_order_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'FOODEXA migration applied successfully.' AS result;
