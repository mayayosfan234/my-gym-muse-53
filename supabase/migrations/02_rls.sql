-- ============================================================
-- GYMTRACK SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_favorites ENABLE ROW LEVEL SECURITY;

-- 1. GLOBAL BUILT-IN TABLES (PUBLIC READ FOR ALL AUTHENTICATED/ANON)
CREATE POLICY "Public read exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Public read foods" ON public.foods FOR SELECT USING (true);

-- 2. USER PROFILES
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. CUSTOM EXERCISES
CREATE POLICY "Users view own custom exercises" ON public.custom_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own custom exercises" ON public.custom_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own custom exercises" ON public.custom_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own custom exercises" ON public.custom_exercises FOR DELETE USING (auth.uid() = user_id);

-- 4. PROGRAMS
CREATE POLICY "Users view own programs" ON public.programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own programs" ON public.programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own programs" ON public.programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own programs" ON public.programs FOR DELETE USING (auth.uid() = user_id);

-- 5. PROGRAM DAYS
CREATE POLICY "Users view own program days" ON public.program_days FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own program days" ON public.program_days FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own program days" ON public.program_days FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own program days" ON public.program_days FOR DELETE USING (auth.uid() = user_id);

-- 6. WORKOUT SESSIONS (HISTORY)
CREATE POLICY "Users view own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- 7. CUSTOM FOODS
CREATE POLICY "Users view own custom foods" ON public.custom_foods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own custom foods" ON public.custom_foods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own custom foods" ON public.custom_foods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own custom foods" ON public.custom_foods FOR DELETE USING (auth.uid() = user_id);

-- 8. NUTRITION DAYS
CREATE POLICY "Users view own nutrition days" ON public.nutrition_days FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own nutrition days" ON public.nutrition_days FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own nutrition days" ON public.nutrition_days FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own nutrition days" ON public.nutrition_days FOR DELETE USING (auth.uid() = user_id);

-- 9. FOOD FAVORITES
CREATE POLICY "Users view own favorites" ON public.food_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own favorites" ON public.food_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.food_favorites FOR DELETE USING (auth.uid() = user_id);
