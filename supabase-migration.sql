-- ============================================================
-- FOODEXA Supabase Migration: Tables for Dynamic Content
-- Run this in Supabase SQL Editor
-- ============================================================

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

-- 11. Enable Realtime for all tables
DO $$
DECLARE
  tables TEXT[] := ARRAY['orders', 'order_items', 'menu_items', 'menu_categories', 'notifications', 'announcements', 'banners', 'pricing_plans', 'faq_items', 'platform_features', 'hero_stats', 'partner_universities'];
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