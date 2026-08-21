-- ============================================================
-- GYMTRACK SUPABASE DATABASE SCHEMA (PHASE 5 MIGRATION)
-- ============================================================

-- 1. PROFILES TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  weight NUMERIC(5,2) DEFAULT 65.0,
  height NUMERIC(5,2) DEFAULT 165.0,
  age INT DEFAULT 26,
  gender TEXT DEFAULT 'female',
  workouts_per_week INT DEFAULT 4,
  calories_target INT DEFAULT 2000,
  protein_target INT DEFAULT 140,
  carbs_target INT DEFAULT 200,
  fat_target INT DEFAULT 65
);

-- 2. GLOBAL BUILT-IN EXERCISES TABLE
CREATE TABLE IF NOT EXISTS public.exercises (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  english_name TEXT,
  muscle_group TEXT NOT NULL,
  muscle_groups TEXT[],
  custom_muscle_group TEXT,
  secondary_muscles TEXT[],
  category TEXT,
  equipment TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  video_url TEXT,
  images TEXT[],
  notes TEXT,
  tips TEXT,
  search_terms TEXT[]
);

-- 3. CUSTOM USER EXERCISES TABLE
CREATE TABLE IF NOT EXISTS public.custom_exercises (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  english_name TEXT,
  muscle_group TEXT NOT NULL,
  muscle_groups TEXT[],
  custom_muscle_group TEXT,
  secondary_muscles TEXT[],
  category TEXT,
  equipment TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  video_url TEXT,
  images TEXT[],
  notes TEXT,
  tips TEXT,
  search_terms TEXT[]
);

-- 4. PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS public.programs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  day_ids TEXT[] DEFAULT '{}'
);

-- 5. WORKOUT DAYS TABLE (PROGRAM DAYS)
CREATE TABLE IF NOT EXISTS public.program_days (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  items JSONB DEFAULT '[]'::jsonb
);

-- 6. WORKOUT SESSIONS (HISTORY)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  workout_id TEXT,
  workout_name TEXT NOT NULL,
  program_name TEXT,
  date TIMESTAMPTZ NOT NULL,
  duration_sec INT DEFAULT 0,
  entries JSONB DEFAULT '[]'::jsonb
);

-- 7. GLOBAL BUILT-IN FOODS TABLE
CREATE TABLE IF NOT EXISTS public.foods (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  english_name TEXT,
  category TEXT,
  brand TEXT,
  serving_size TEXT NOT NULL,
  unit_weight_grams NUMERIC(7,2),
  serving_unit_label TEXT,
  calories NUMERIC(7,2) NOT NULL,
  protein NUMERIC(7,2) NOT NULL,
  carbs NUMERIC(7,2) NOT NULL,
  fat NUMERIC(7,2) NOT NULL,
  fiber NUMERIC(7,2) DEFAULT 0,
  notes TEXT,
  search_terms TEXT[]
);

-- 8. CUSTOM USER FOODS TABLE
CREATE TABLE IF NOT EXISTS public.custom_foods (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  english_name TEXT,
  category TEXT,
  brand TEXT,
  serving_size TEXT NOT NULL,
  unit_weight_grams NUMERIC(7,2),
  serving_unit_label TEXT,
  calories NUMERIC(7,2) NOT NULL,
  protein NUMERIC(7,2) NOT NULL,
  carbs NUMERIC(7,2) NOT NULL,
  fat NUMERIC(7,2) NOT NULL,
  fiber NUMERIC(7,2) DEFAULT 0,
  notes TEXT,
  search_terms TEXT[]
);

-- 9. NUTRITION DAYS & MEALS
CREATE TABLE IF NOT EXISTS public.nutrition_days (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  meals JSONB DEFAULT '[]'::jsonb,
  UNIQUE(user_id, date)
);

-- 10. FOOD FAVORITES
CREATE TABLE IF NOT EXISTS public.food_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, food_id)
);

-- ============================================================
-- INDEXES FOR HIGH PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_custom_exercises_user ON public.custom_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_user ON public.programs(user_id);
CREATE INDEX IF NOT EXISTS idx_program_days_user ON public.program_days(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_foods_user ON public.custom_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_days_user_date ON public.nutrition_days(user_id, date);
