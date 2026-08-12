-- ============================================================
-- FOODEXA: Add missing columns to orders and order_items
-- Idempotent (safe to re-run).
-- ============================================================

-- orders: add missing columns for payment, canteen, tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS registration_id TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS canteen_id UUID,
  ADD COLUMN IF NOT EXISTS counter_code TEXT,
  ADD COLUMN IF NOT EXISTS transaction_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS order_number BIGINT,
  ADD COLUMN IF NOT EXISTS pickup_token TEXT,
  ADD COLUMN IF NOT EXISTS token_number TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS kitchen_status TEXT DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS counter_status TEXT DEFAULT 'Incoming',
  ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'razorpay',
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS transaction_reference TEXT;

-- order_items: add subtotal
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0;
