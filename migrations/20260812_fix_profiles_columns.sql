-- ============================================================
-- FOODEXA: Safe migration to ensure profiles table has all required columns
-- Run this in Supabase SQL Editor if you see errors like:
--   "column profiles.diet_preference does not exist"
--   "column profiles.designation does not exist"
--   "column profiles.avatar_url does not exist"
-- ============================================================

-- Add designation column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT;

-- Add avatar_url column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add diet_preference column if missing (with safe default and check constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_diet_preference_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS diet_preference TEXT DEFAULT 'all'
      CHECK (diet_preference IN ('all', 'veg', 'non-veg'));
  ELSE
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diet_preference TEXT DEFAULT 'all';
  END IF;
END $$;

-- Verify columns exist (run this as a SELECT to confirm)
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'profiles'
-- AND column_name IN ('designation', 'avatar_url', 'diet_preference')
-- ORDER BY column_name;
