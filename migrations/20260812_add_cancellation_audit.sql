-- ============================================================
-- FOODEXA: Cancellation audit trail
-- Adds cancelled_at / cancelled_by to orders so every cancellation
-- records WHO cancelled (student / canteen / institution / admin).
-- Idempotent (safe to re-run).
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by text;

-- Helper index for filtering cancelled orders (optional, safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'orders_cancelled_at_idx'
  ) THEN
    CREATE INDEX orders_cancelled_at_idx ON public.orders (cancelled_at);
  END IF;
END $$;
