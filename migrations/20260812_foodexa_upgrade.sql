-- ============================================================
-- FOODEXA upgrade migration
-- Adds permanent student identifiers, plan, pickup counter and
-- order status history support. Idempotent (safe to re-run).
-- ============================================================

-- Profiles: permanent, never-changing identifiers + plan
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS registration_id text,
  ADD COLUMN IF NOT EXISTS student_id text,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';

-- Unique indexes for searchable, stable identifiers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_registration_id_key'
  ) THEN
    CREATE UNIQUE INDEX profiles_registration_id_key ON public.profiles (registration_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_student_id_key'
  ) THEN
    CREATE UNIQUE INDEX profiles_student_id_key ON public.profiles (student_id);
  END IF;
END $$;

-- Orders: pickup counter (A–G) + confirmed timestamp
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS counter text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Orders: normalise existing statuses to the lowercase canonical set
UPDATE public.orders
  SET status = 'confirmed', order_status = 'confirmed'
  WHERE status ILIKE 'accepted' OR order_status ILIKE 'accepted';
UPDATE public.orders
  SET status = 'cancelled' WHERE status ILIKE 'canceled';
UPDATE public.orders
  SET status = 'completed' WHERE status ILIKE 'completed'
    OR status ILIKE 'collected' OR status ILIKE 'delivered';
UPDATE public.orders
  SET status = 'ready' WHERE status ILIKE 'ready for pickup';
UPDATE public.orders
  SET status = 'preparing' WHERE status ILIKE 'preparation';

-- Payments: normalise payment_status to the canonical set
UPDATE public.payments
  SET payment_status = 'captured'
  WHERE payment_status ILIKE 'paid' OR payment_status ILIKE 'authorized';

-- Order status history table (every important status change is recorded)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  user_id uuid,
  institution_id uuid,
  from_status text,
  to_status text NOT NULL,
  payment_status text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx
  ON public.order_status_history (order_id);

-- RLS for order_status_history (students see their own rows)
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_status_history' AND policyname = 'order_status_history_select_own'
  ) THEN
    CREATE POLICY order_status_history_select_own ON public.order_status_history
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
