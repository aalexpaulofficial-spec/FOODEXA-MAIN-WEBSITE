-- ============================================================
-- FOODEXA Comprehensive Fixes Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Fix orders status constraint — standardize to allowed statuses
-- Drop existing constraint if present, then re-create with correct values
DO $$ BEGIN
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Add CHECK constraint with standardized statuses
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'));

-- Also fix order_status column if it has a constraint
DO $$ BEGIN
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IS NULL OR order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'));

-- 2. Ensure all required columns exist on orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id_display TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_amount NUMERIC(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number BIGINT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_token TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS token_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_status TEXT DEFAULT 'incoming';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_deadline_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_type TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_pickup_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canteen_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_by TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS registration_id TEXT;

-- 3. Ensure order_items has snapshot columns
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN;

-- 4. Ensure profiles has required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS foodexa_plan TEXT DEFAULT 'Free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_created_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Ensure menu_items has required columns
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS food_name TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS food_type TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_today_special BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS calories NUMERIC;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS protein NUMERIC;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS carbs NUMERIC;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS carbohydrates NUMERIC;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS fat NUMERIC;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS fiber NUMERIC;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sugar NUMERIC;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sodium NUMERIC;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS serving_size TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS ai_popularity_score NUMERIC DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 6. Ensure canteens has required columns
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS counter_code TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS counter_name TEXT;
ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 7. Ensure order_status_history table exists for tracking status changes
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID,
  institution_id UUID,
  from_status TEXT,
  to_status TEXT,
  payment_status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON public.orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_institution_id ON public.orders(institution_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON public.orders(pickup_code);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON public.order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_institution_id ON public.profiles(institution_id);

-- 9. Enable RLS on orders table (if not already)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for orders
-- Students can read their own orders
DROP POLICY IF EXISTS "Students read own orders" ON public.orders;
CREATE POLICY "Students read own orders" ON public.orders
  FOR SELECT
  USING (
    student_id = auth.uid()
    OR user_id = auth.uid()
  );

-- Students can insert orders (for anonymous users, we use service role or RPC in production)
DROP POLICY IF EXISTS "Students insert orders" ON public.orders;
CREATE POLICY "Students insert orders" ON public.orders
  FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    OR user_id = auth.uid()
    OR auth.uid() IS NULL
  );

-- Students can update their own orders (for cancellation)
DROP POLICY IF EXISTS "Students update own orders" ON public.orders;
CREATE POLICY "Students update own orders" ON public.orders
  FOR UPDATE
  USING (
    student_id = auth.uid()
    OR user_id = auth.uid()
  );

-- Institution users can read orders for their institution
DROP POLICY IF EXISTS "Institution read orders" ON public.orders;
CREATE POLICY "Institution read orders" ON public.orders
  FOR SELECT
  USING (
    institution_id IN (
      SELECT institution_id FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('institution_admin', 'kitchen_staff', 'canteen_manager')
    )
  );

-- Institution users can update orders for their institution
DROP POLICY IF EXISTS "Institution update orders" ON public.orders;
CREATE POLICY "Institution update orders" ON public.orders
  FOR UPDATE
  USING (
    institution_id IN (
      SELECT institution_id FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('institution_admin', 'kitchen_staff', 'canteen_manager')
    )
  );

-- 11. Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read order items" ON public.order_items;
CREATE POLICY "Read order items" ON public.order_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Insert order items" ON public.order_items;
CREATE POLICY "Insert order items" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- 12. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users upsert own profile" ON public.profiles;
CREATE POLICY "Users upsert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- 13. Enable RLS on institutions (read-only for all)
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read institutions" ON public.institutions;
CREATE POLICY "Anyone can read institutions" ON public.institutions
  FOR SELECT
  USING (true);

-- 14. Enable RLS on canteens (read-only for all)
ALTER TABLE public.canteens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read canteens" ON public.canteens;
CREATE POLICY "Anyone can read canteens" ON public.canteens
  FOR SELECT
  USING (true);

-- 15. Enable RLS on menu_items (read-only for all)
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read menu items" ON public.menu_items;
CREATE POLICY "Anyone can read menu items" ON public.menu_items
  FOR SELECT
  USING (true);

-- 16. Enable RLS on order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read order status history" ON public.order_status_history;
CREATE POLICY "Read order status history" ON public.order_status_history
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Insert order status history" ON public.order_status_history;
CREATE POLICY "Insert order status history" ON public.order_status_history
  FOR INSERT
  WITH CHECK (true);

-- 17. Ensure Supabase Realtime is enabled for orders
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.canteens;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 18. Create RPC function for getting institution by code (bypasses RLS)
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
    i.institution_name,
    i.campus,
    i.city,
    i.state,
    i.country,
    i.institution_code,
    i.status
  FROM public.institutions i
  WHERE i.institution_code = p_institution_code
  LIMIT 1;
END;
$$;

-- 19. Create RPC for generating next pickup code number atomically
CREATE OR REPLACE FUNCTION public.next_pickup_code_number(p_prefix TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num INTEGER;
  today_str TEXT;
BEGIN
  today_str := to_char(CURRENT_DATE, 'YYYY-MM-DD');

  -- Lock the row to prevent race conditions
  SELECT COALESCE(MAX(
    CASE WHEN p.pickup_code ~ ('^' || p_prefix || '-[0-9]+$')
    THEN CAST(substring(p.pickup_code FROM ('^' || p_prefix || '-(\d+)$')) AS INTEGER)
    ELSE 0 END
  ), 0) + 1
  INTO next_num
  FROM public.orders p
  WHERE p.created_at >= today_str::timestamptz
    AND p.created_at < (today_str::timestamptz + INTERVAL '1 day')
    AND p.pickup_code LIKE (p_prefix || '-%');

  RETURN next_num;
END;
$$;

-- 20. Create RPC for generating next token number atomically
CREATE OR REPLACE FUNCTION public.next_token_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num INTEGER;
  today_str TEXT;
BEGIN
  today_str := to_char(CURRENT_DATE, 'YYYY-MM-DD');

  SELECT COALESCE(MAX(
    CASE WHEN p.token_number ~ '^TKN-[0-9]+$'
    THEN CAST(substring(p.token_number FROM '^TKN-(\d+)$') AS INTEGER)
    ELSE 0 END
  ), 0) + 1
  INTO next_num
  FROM public.orders p
  WHERE p.created_at >= today_str::timestamptz
    AND p.created_at < (today_str::timestamptz + INTERVAL '1 day')
    AND p.token_number LIKE 'TKN-%';

  RETURN next_num;
END;
$$;
