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

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_cancel_deadline      ON public.orders(cancel_deadline_at);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_type          ON public.orders(pickup_type);
CREATE INDEX IF NOT EXISTS idx_orders_token_number         ON public.orders(token_number);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code          ON public.orders(pickup_code);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id    ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id  ON public.orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_student_id           ON public.orders(student_id);

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

-- ── RPC: ORDER CREATION ─────────────────────────────────────────
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

  -- 2. Generate Pickup Code
  SELECT COUNT(*) INTO v_next_pickup_seq
  FROM public.orders
  WHERE pickup_code LIKE v_pickup_prefix || '-%'
  AND created_at >= date_trunc('day', now());
  
  v_pickup_code := v_pickup_prefix || '-' || lpad((v_next_pickup_seq + 1)::text, 4, '0');

  -- 3. Generate Token Number
  SELECT COUNT(*) INTO v_next_token_seq
  FROM public.orders
  WHERE token_number LIKE 'TKN-%'
  AND created_at >= date_trunc('day', now());
  
  v_token_number := 'TKN-' || lpad((v_next_token_seq + 1)::text, 4, '0');

  -- 4. Calculate Deadlines
  v_estimated_ready := now() + interval '15 minutes';
  v_cancel_deadline := now() + interval '30 seconds';

  -- 5. Insert Order
  INSERT INTO public.orders (
    student_id, registration_id, email, customer_name, phone,
    institution_id, canteen_id, counter_id, counter, counter_code,
    total_amount, transaction_amount, status, order_status, kitchen_status, counter_status,
    payment_status, payment_method, razorpay_order_id, razorpay_payment_id, razorpay_signature,
    pickup_code, token_number, pickup_type, estimated_ready_at, cancel_deadline_at,
    notes, qr_code, qr_pickup_code, locker_number, pickup_pin
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
    v_pickup_code, v_token_number, v_pickup_prefix,
    v_estimated_ready, v_cancel_deadline,
    payload->>'notes',
    payload->>'qr_code',
    payload->>'qr_pickup_code',
    payload->>'locker_number',
    payload->>'pickup_pin'
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
