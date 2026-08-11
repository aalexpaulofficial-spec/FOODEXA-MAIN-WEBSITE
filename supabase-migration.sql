-- ============================================================
-- FOODEXA Supabase Migration: Tables for Dynamic Content
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0. CORE TABLES: Required by the main website, student registration, and live portal.
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  institution_name TEXT,
  campus TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  country TEXT DEFAULT 'India',
  institution_code TEXT NOT NULL UNIQUE,
  institution_email TEXT,
  contact_person TEXT,
  phone_number TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  department TEXT,
  semester TEXT,
  programme TEXT,
  campus_block TEXT,
  designation TEXT,
  avatar_url TEXT,
  diet_preference TEXT DEFAULT 'all' CHECK (diet_preference IN ('all', 'veg', 'non-veg')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  counter TEXT DEFAULT '',
  counter_name TEXT DEFAULT '',
  counter_id UUID,
  category TEXT DEFAULT '',
  image_url TEXT,
  prep_time TEXT,
  rating NUMERIC(3,2) DEFAULT 4.5,
  popular BOOLEAN DEFAULT false,
  nutrition TEXT,
  is_available BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  offer_price NUMERIC(10,2),
  offer_label TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  role TEXT,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  institution_code TEXT,
  counter TEXT DEFAULT '',
  items JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  order_id TEXT UNIQUE,
  pickup_code TEXT,
  qr_code TEXT,
  qr_code_data TEXT,
  locker_number TEXT,
  category_id UUID,
  counter_id UUID,
  payment_status TEXT DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  variant TEXT DEFAULT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Update',
  message TEXT NOT NULL DEFAULT '',
  type TEXT DEFAULT 'announcement',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.institution_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name TEXT NOT NULL,
  campus TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  institution_email TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  role TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  institution_website TEXT,
  student_population TEXT,
  food_courts INTEGER DEFAULT 1,
  vendors INTEGER DEFAULT 1,
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  institution_name TEXT,
  campus_student_count TEXT,
  preferred_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.institutions (name, institution_name, campus, city, state, country, institution_code, status)
VALUES ('Yeshua Institution', 'Yeshua Institution', 'Main Campus', 'Bengaluru', 'Karnataka', 'India', 'YESHUA339537', 'active')
ON CONFLICT (institution_code) DO UPDATE SET
  status = 'active',
  updated_at = now();

-- 1. BANNERS: Hero section banners controlled by Institution Dashboard
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  cta_label TEXT DEFAULT 'Learn More',
  cta_link TEXT DEFAULT '#',
  is_active BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ANNOUNCEMENTS: Campus announcements/notifications
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRICING PLANS: Dynamic pricing from Supabase
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_user TEXT NOT NULL DEFAULT '',
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  annual_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  popular BOOLEAN DEFAULT false,
  features JSONB DEFAULT '[]'::jsonb,
  cta_label TEXT DEFAULT 'Get Started',
  currency TEXT DEFAULT 'INR',
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. FAQ ITEMS: Dynamic FAQ from Supabase
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_published BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PLATFORM FEATURES: Feature descriptions for marketing page
CREATE TABLE IF NOT EXISTS public.platform_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  icon_name TEXT DEFAULT 'Sparkles',
  badge TEXT DEFAULT '',
  highlights JSONB DEFAULT '[]'::jsonb,
  graphic_type TEXT DEFAULT 'lx_ai',
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. HERO STATS: Live statistics for hero section
CREATE TABLE IF NOT EXISTS public.hero_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PARTNER UNIVERSITIES: Trusted partner logos/text
CREATE TABLE IF NOT EXISTS public.partner_universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  campus TEXT DEFAULT '',
  location TEXT DEFAULT '',
  short_name TEXT DEFAULT '',
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Add columns to existing orders table for full lifecycle
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_code_data TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 9. Add columns to existing menu_items table if missing
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS counter_id UUID;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS offer_price NUMERIC(10,2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS offer_label TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 10. Add columns to existing menu_categories table
ALTER TABLE public.menu_categories ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
ALTER TABLE public.menu_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.menu_categories ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- 11. PAYMENTS: Razorpay payment records
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  order_id TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'created',
  razorpay_status TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_name TEXT,
  transaction_time TIMESTAMPTZ,
  webhook_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. CANTEENS: Campus canteens / food courts linked to institutions
CREATE TABLE IF NOT EXISTS public.canteens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_ordering_enabled BOOLEAN DEFAULT false,
  prep_time_minutes INTEGER DEFAULT 10,
  rating NUMERIC(3,2) DEFAULT 4.5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canteens_institution ON public.canteens(institution_id);
CREATE INDEX IF NOT EXISTS idx_canteens_active ON public.canteens(is_active);

-- 15. USER_ADDRESSES: Saved delivery / pickup spots from database
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON public.user_addresses(user_id, is_default);

-- 16. USER_FAVORITES: User saved favorite menu items
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_favorites_unique ON public.user_favorites(user_id, menu_item_id);

-- 17. USER_CARTS: Persisted cart per user
CREATE TABLE IF NOT EXISTS public.user_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_carts_unique ON public.user_carts(user_id, menu_item_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_order ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 12. Add Razorpay columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 18. Add avatar_url, diet_preference, and designation to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diet_preference TEXT DEFAULT 'all' CHECK (diet_preference IN ('all', 'veg', 'non-veg'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT;
-- Add canteen_id to menu_items if missing
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE SET NULL;

-- 13. Enable Realtime for all tables
DO $$
DECLARE
  tables TEXT[] := ARRAY['orders', 'order_items', 'menu_items', 'menu_categories', 'notifications', 'announcements', 'banners', 'pricing_plans', 'faq_items', 'platform_features', 'hero_stats', 'partner_universities', 'canteens', 'user_addresses', 'user_favorites', 'user_carts'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
  END LOOP;
END $$;

-- 12. Seed initial data for marketing content
INSERT INTO public.hero_stats (value, label, "order") VALUES
  ('250,000+', 'Daily Campus Meals', 1),
  ('180+', 'Institutions Registered', 2),
  ('4.2 Mins', 'Avg Express Pickup', 3),
  ('99.98%', 'Uptime Reliability', 4)
ON CONFLICT DO NOTHING;

INSERT INTO public.partner_universities (name, campus, location, short_name, "order") VALUES
  ('CHRIST (Deemed to be University)', 'Kengeri Campus', 'Bengaluru', 'CHRIST', 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.pricing_plans (name, target_user, monthly_price, annual_price, description, popular, features, cta_label, "order") VALUES
  ('Student Pass', 'For All Campus Students', 0, 0, 'Full access to LX AI companion, express queue jumping, and group cart order splitting at no cost to students.', false, '["Unlimited access to LX AI Assistant","Express queue jump pre-ordering","Group cart creation & split billing","Allergen & macro dietary filters","Campus smart locker access","Earn FOODEXA student perks & rewards"]'::jsonb, 'Get Started Free', 1),
  ('Vendor Launch', 'For On-Campus Cafes, Food Trucks & Franchises', 79, 65, 'Everything local vendors need to digitize operations, eliminate lines, and increase peak order volume by 35%.', true, '["FOODEXA Merchant KDS & POS App","LX AI order scheduling & load balancing","Real-time inventory & shortage toggles","Direct campus card & digital wallet payments","Analytics dashboard (sales, peak rush, prep times)","Dedicated hardware setup & 24/7 priority support"]'::jsonb, 'Start Vendor Onboarding', 2),
  ('Campus Enterprise', 'For Universities & Dining Services Management', 499, 399, 'Custom campus-wide deployment with locker hub integration, dining hall POS sync, and centralized analytics.', false, '["Full campus-wide white-labeled FOODEXA deployment","Smart Heated/Cooled Locker Hub hardware network","University Student ID & Meal Plan API integration","Custom LX AI dining assistant instance for campus","FERPA & SOC2 compliant enterprise security","Dedicated Campus Success Manager & On-site support"]'::jsonb, 'Book University Demo', 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (question, answer, category, "order") VALUES
  ('What is LX and how does it power FOODEXA?', 'LX is FOODEXA''s official AI companion built specifically for campus dining. Powered by Google Gemini under the hood, LX understands student preferences, diet needs, class schedules, budget limits, and real-time vendor wait times to deliver personalized meal recommendations and smart queue predictions.', 'general', 1),
  ('Is FOODEXA free for students to use?', 'Yes! FOODEXA is 100% free for students. There are no subscription fees to use LX AI, place express pre-orders, split group cart bills, or pick up from smart lockers.', 'students', 2),
  ('How does the Express Queue Jump work?', 'Instead of standing in a 20-minute line during rush hours, you place your order via FOODEXA while walking from class or studying in the library. LX calculates your walk time and schedules the kitchen to prepare your food right as you arrive.', 'students', 3),
  ('Can food trucks and local cafes integrate with FOODEXA?', 'Absolutely. FOODEXA provides a lightweight KDS (Kitchen Display System) app that runs on standard tablets. Vendors can set up in less than 30 minutes.', 'vendors', 4),
  ('Does FOODEXA integrate with our existing University Student ID and Meal Plan cards?', 'Yes. FOODEXA seamlessly connects with campus card systems (Atrium, Transact, CBORD, TouchNet) allowing students to pay using their meal plan dollars, flex points, or linked credit/debit cards seamlessly.', 'universities', 5),
  ('What hardware is needed for Smart Locker Hubs?', 'FOODEXA offers modular, temperature-controlled locker units with dual-zone heating (140°F) and cooling (38°F). We handle full white-glove installation, network configuration, and ongoing maintenance.', 'universities', 6)
ON CONFLICT DO NOTHING;

INSERT INTO public.platform_features (title, subtitle, description, icon_name, badge, highlights, graphic_type, "order") VALUES
  ('LX AI Student Companion', 'Conversational Dining Intelligence', 'LX understands campus locations, class schedules, budget limits, and dietary restrictions to deliver instant personalized meal recommendations.', 'Sparkles', 'Powered by LX', '["Natural language meal discovery (e.g. \"high protein under $8\")","Allergen & macro safety guardrails","Context-aware prep time estimations between classes","Evolves with student preferences over time"]'::jsonb, 'lx_ai', 1),
  ('Pre-Ordering & Express Queue Jump', 'Eliminate 25-Minute Lunch Wait Times', 'Students order in advance between lectures and skip long cafeteria lines with dedicated express pickup lanes and dynamic batch scheduling.', 'Zap', 'Express Pickup', '["Smart arrival time estimation based on campus walking distance","Real-time order prep tracking bar with push alerts","Dynamic kitchen load balancing during peak lunch hours","Zero standing line bottleneck"]'::jsonb, 'app_mock', 2),
  ('Group Carts & Automated Split Bills', 'Seamless Multi-Student Orders', 'Dormmates, study groups, and student clubs can pool orders together into a single cart with instant transparent split.', 'Users', 'Dorm & Club Favorites', '["Shared real-time cart via 4-digit join codes","Individual item billing without spreadsheet chaos","Single pooled delivery or locker drop-off","Club budget & event order management"]'::jsonb, 'group_cart', 3),
  ('Smart Heated & Cooled Locker Hubs', '24/7 Secure Contactless Pickup', 'Temperature-controlled smart locker pods installed across campus buildings allow safe, contactless pickup anytime with a simple QR tap.', 'ShieldCheck', 'Hardware Sync', '["DUAL-ZONE climate control (Heated 140°F / Cooled 38°F)","NFC Student ID or QR code unlock in 1 second","Automatic UV-C sanitization cycle after each pick","Zero food waste or misplaced order mixups"]'::jsonb, 'locker', 4),
  ('Campus Kitchen Display System (KDS)', 'Enterprise Merchant Operations', 'High-speed POS integration and digital kitchen touchscreens built specifically for fast-paced university dining halls and food trucks.', 'LayoutGrid', 'Vendor Engine', '["Predictive prep queue sorting powered by LX","One-tap stock & ingredient shortage toggles","Direct integration with university campus card systems","Automated sales analytics & peak hour heatmaps"]'::jsonb, 'kds', 5)
ON CONFLICT DO NOTHING;
