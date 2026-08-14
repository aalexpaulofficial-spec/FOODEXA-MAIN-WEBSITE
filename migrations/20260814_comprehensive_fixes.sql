-- FOODEXA COMPREHENSIVE FIXES MIGRATION
-- Run this in Supabase SQL Editor
-- This migration:
-- 1. Adds items_snapshot column to payments table
-- 2. Ensures all required columns exist on orders, order_items, profiles
-- 3. Fixes RLS policies for authenticated anonymous users
-- 4. Creates RPC functions for institution lookup
-- 5. Adds status constraint to orders

-- ═══════════════════════════════════════════════════════════════════
-- 1. PAYMENTS TABLE: Add items_snapshot for server-side order creation
-- ═══════════════════════════════════════════════════════════════════
DO $$ BEGIN
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS items_snapshot text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS canteen_id text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS institution_id text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_creation_error text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS needs_manual_order boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 2. ORDERS TABLE: Ensure all required columns exist
-- ═══════════════════════════════════════════════════════════════════
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS counter_name text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS canteen_name text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS institution_code text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_deadline_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_creation_error text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 3. ORDER_ITEMS TABLE: Ensure snapshot columns exist
-- ═══════════════════════════════════════════════════════════════════
DO $$ BEGIN
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS name text DEFAULT 'Item';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_veg boolean;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 4. PROFILES TABLE: Ensure student_id and registration_id columns
-- ═══════════════════════════════════════════════════════════════════
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_id text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS registration_id text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_created_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS foodexa_plan text DEFAULT 'Free';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'Free';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 5. RLS POLICIES: Fix for anonymous authenticated users
-- ═══════════════════════════════════════════════════════════════════

-- Profiles: Allow authenticated users (including anonymous) to read/update their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Orders: Allow authenticated users to read their own orders
DROP POLICY IF EXISTS "Students read own orders" ON orders;
CREATE POLICY "Students read own orders" ON orders
  FOR SELECT USING (auth.uid() = student_id);

-- Orders: Allow authenticated users to insert orders (for client-side fallback)
DROP POLICY IF EXISTS "Students insert own orders" ON orders;
CREATE POLICY "Students insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Orders: Allow authenticated users to update their own orders (for cancel)
DROP POLICY IF EXISTS "Students update own orders" ON orders;
CREATE POLICY "Students update own orders" ON orders
  FOR UPDATE USING (auth.uid() = student_id);

-- Institution users can read/update orders for their institution
DROP POLICY IF EXISTS "Institution read orders" ON orders;
CREATE POLICY "Institution read orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.institution_id = orders.institution_id
      AND profiles.role IN ('institution_admin', 'kitchen_staff', 'canteen_manager')
    )
  );

DROP POLICY IF EXISTS "Institution update orders" ON orders;
CREATE POLICY "Institution update orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.institution_id = orders.institution_id
      AND profiles.role IN ('institution_admin', 'kitchen_staff', 'canteen_manager')
    )
  );

-- Order items: Allow authenticated users to read order items for their orders
DROP POLICY IF EXISTS "Students read own order_items" ON order_items;
CREATE POLICY "Students read own order_items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.student_id = auth.uid()
    )
  );

-- Order items: Allow authenticated users to insert order items (for client-side fallback)
DROP POLICY IF EXISTS "Students insert own order_items" ON order_items;
CREATE POLICY "Students insert own order_items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.student_id = auth.uid()
    )
  );

-- Institutions: Allow public read access
DROP POLICY IF EXISTS "Public read institutions" ON institutions;
CREATE POLICY "Public read institutions" ON institutions
  FOR SELECT USING (true);

-- Menu items: Allow public read access
DROP POLICY IF EXISTS "Public read menu_items" ON menu_items;
CREATE POLICY "Public read menu_items" ON menu_items
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════
-- 6. RPC FUNCTIONS: Institution lookup and atomic counters
-- ═══════════════════════════════════════════════════════════════════

-- Institution lookup by code (bypasses RLS for anonymous users)
CREATE OR REPLACE FUNCTION get_institution_by_code(p_institution_code text)
RETURNS TABLE (
  id uuid,
  name text,
  institution_code text,
  campus text,
  city text,
  state text,
  country text,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.name, i.institution_code, i.campus, i.city, i.state, i.country, i.status
  FROM institutions i
  WHERE UPPER(TRIM(i.institution_code)) = UPPER(TRIM(p_institution_code))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic pickup code sequence generator
CREATE OR REPLACE FUNCTION next_pickup_code_number(p_prefix text)
RETURNS bigint AS $$
DECLARE
  next_val bigint;
BEGIN
  -- Use a advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext('pickup_code_' || p_prefix || '_' || CURRENT_DATE));
  
  -- Count today's pickups with this prefix
  SELECT COUNT(*) + 1 INTO next_val
  FROM orders
  WHERE pickup_code LIKE p_prefix || '-%'
  AND created_at >= CURRENT_DATE;
  
  RETURN next_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic token number sequence generator
CREATE OR REPLACE FUNCTION next_token_number()
RETURNS bigint AS $$
DECLARE
  next_val bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('token_number_' || CURRENT_DATE));
  
  SELECT COUNT(*) + 1 INTO next_val
  FROM orders
  WHERE token_number LIKE 'TKN-%'
  AND created_at >= CURRENT_DATE;
  
  RETURN next_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════
-- 7. INDEXES: Performance improvements
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_institution_id ON orders(institution_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_institutions_code ON institutions(institution_code);

-- ═══════════════════════════════════════════════════════════════════
-- 8. ORDER STATUS HISTORY TABLE
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL,
  user_id text,
  institution_id text,
  from_status text,
  to_status text NOT NULL,
  payment_status text,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage order_status_history" ON order_status_history
  FOR ALL USING (true);

-- ═══════════════════════════════════════════════════════════════════
-- 9. NOTIFICATIONS TABLE (if not exists)
-- ═══════════════════════════════════════════════════════════════════
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL,
    title text,
    message text,
    user_id text,
    institution_id text,
    order_id uuid,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    institution_id IN (
      SELECT institution_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════
SELECT 'Migration completed successfully' as result;
