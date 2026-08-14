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

SELECT 'FOODEXA migration applied successfully.' AS result;
