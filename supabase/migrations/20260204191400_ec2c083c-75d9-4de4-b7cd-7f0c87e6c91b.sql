-- ============================================
-- GAMIFICATION SYSTEM DATABASE SETUP
-- ============================================

-- 1. PROFILES TABLE
-- Stores user gamification stats
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  weekly_goal_xp INTEGER NOT NULL DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. TASKS TABLE
-- Stores user tasks with XP rewards
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'General',
  xp_reward INTEGER NOT NULL DEFAULT 20,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Tasks RLS policies
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- 3. STUDY SESSIONS TABLE
-- Tracks daily study activity for heatmap
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  study_minutes INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on study_sessions
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Study sessions RLS policies
CREATE POLICY "Users can view their own study sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. XP TRANSACTIONS TABLE
-- Audit log for all XP changes
CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on xp_transactions
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- XP transactions RLS policies
CREATE POLICY "Users can view their own xp transactions"
  ON public.xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own xp transactions"
  ON public.xp_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF xp >= 50000 THEN RETURN 8;      -- Legend
  ELSIF xp >= 35000 THEN RETURN 7;   -- Grandmaster
  ELSIF xp >= 20000 THEN RETURN 6;   -- Master
  ELSIF xp >= 10000 THEN RETURN 5;   -- Expert
  ELSIF xp >= 5000 THEN RETURN 4;    -- Scholar
  ELSIF xp >= 2500 THEN RETURN 3;    -- Student
  ELSIF xp >= 1000 THEN RETURN 2;    -- Learner
  ELSE RETURN 1;                      -- Beginner
  END IF;
END;
$$;

-- Function to award XP and update level
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_source_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Update profile XP
  UPDATE public.profiles
  SET total_xp = total_xp + p_amount,
      current_level = public.calculate_level(total_xp + p_amount),
      updated_at = now()
  WHERE id = p_user_id
  RETURNING total_xp INTO new_total_xp;

  -- Log the transaction
  INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
  VALUES (p_user_id, p_amount, p_source, p_source_id);
END;
$$;

-- Function to update streak
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date DATE;
  new_streak INTEGER;
BEGIN
  SELECT last_activity_date, current_streak INTO last_date, new_streak
  FROM public.profiles WHERE id = p_user_id;

  IF last_date IS NULL OR last_date < CURRENT_DATE - 1 THEN
    -- Streak broken or first activity
    new_streak := 1;
  ELSIF last_date = CURRENT_DATE - 1 THEN
    -- Consecutive day
    new_streak := new_streak + 1;
  END IF;
  -- If last_date = CURRENT_DATE, do nothing (already active today)

  IF last_date IS NULL OR last_date < CURRENT_DATE THEN
    UPDATE public.profiles
    SET current_streak = new_streak,
        longest_streak = GREATEST(longest_streak, new_streak),
        last_activity_date = CURRENT_DATE,
        updated_at = now()
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- Function to complete a task (atomic operation)
CREATE OR REPLACE FUNCTION public.complete_task(p_task_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_xp_reward INTEGER;
  v_completed BOOLEAN;
BEGIN
  -- Get task details
  SELECT user_id, xp_reward, completed INTO v_user_id, v_xp_reward, v_completed
  FROM public.tasks WHERE id = p_task_id;

  -- Only process if not already completed
  IF NOT v_completed THEN
    -- Mark task complete
    UPDATE public.tasks
    SET completed = true, completed_at = now()
    WHERE id = p_task_id;

    -- Award XP
    PERFORM public.award_xp(v_user_id, v_xp_reward, 'task', p_task_id);

    -- Update streak
    PERFORM public.update_streak(v_user_id);

    -- Update or create study session for today
    INSERT INTO public.study_sessions (user_id, date, xp_earned, tasks_completed)
    VALUES (v_user_id, CURRENT_DATE, v_xp_reward, 1)
    ON CONFLICT (user_id, date) DO UPDATE
    SET xp_earned = study_sessions.xp_earned + v_xp_reward,
        tasks_completed = study_sessions.tasks_completed + 1;
  END IF;
END;
$$;

-- Function to uncomplete a task (reverse operation)
CREATE OR REPLACE FUNCTION public.uncomplete_task(p_task_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_xp_reward INTEGER;
  v_completed BOOLEAN;
BEGIN
  SELECT user_id, xp_reward, completed INTO v_user_id, v_xp_reward, v_completed
  FROM public.tasks WHERE id = p_task_id;

  IF v_completed THEN
    -- Mark task incomplete
    UPDATE public.tasks
    SET completed = false, completed_at = NULL
    WHERE id = p_task_id;

    -- Deduct XP
    UPDATE public.profiles
    SET total_xp = GREATEST(0, total_xp - v_xp_reward),
        current_level = public.calculate_level(GREATEST(0, total_xp - v_xp_reward)),
        updated_at = now()
    WHERE id = v_user_id;

    -- Log negative transaction
    INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
    VALUES (v_user_id, -v_xp_reward, 'task_uncomplete', p_task_id);

    -- Update study session
    UPDATE public.study_sessions
    SET xp_earned = GREATEST(0, xp_earned - v_xp_reward),
        tasks_completed = GREATEST(0, tasks_completed - 1)
    WHERE user_id = v_user_id AND date = CURRENT_DATE;
  END IF;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to profiles
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_completed ON public.tasks(user_id, completed);
CREATE INDEX idx_study_sessions_user_date ON public.study_sessions(user_id, date);
CREATE INDEX idx_xp_transactions_user_id ON public.xp_transactions(user_id);