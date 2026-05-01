-- Helper: log study activity and update streak when threshold met
CREATE OR REPLACE FUNCTION public.log_study_activity(p_minutes integer, p_pomodoros integer DEFAULT 0)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_total_minutes integer;
  v_total_pomodoros integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_minutes < 0 OR p_minutes > 600 THEN
    RAISE EXCEPTION 'Invalid minutes value';
  END IF;

  -- Upsert today's activity
  INSERT INTO public.study_activity (user_id, date, active_minutes, pomodoro_sessions)
  VALUES (v_user_id, CURRENT_DATE, p_minutes, COALESCE(p_pomodoros, 0))
  ON CONFLICT (user_id, date) DO UPDATE
  SET active_minutes = study_activity.active_minutes + EXCLUDED.active_minutes,
      pomodoro_sessions = study_activity.pomodoro_sessions + EXCLUDED.pomodoro_sessions
  RETURNING active_minutes, pomodoro_sessions INTO v_total_minutes, v_total_pomodoros;

  -- Mirror to study_sessions so frontend hooks see consistent data
  INSERT INTO public.study_sessions (user_id, date, study_minutes)
  VALUES (v_user_id, CURRENT_DATE, p_minutes)
  ON CONFLICT (user_id, date) DO UPDATE
  SET study_minutes = study_sessions.study_minutes + EXCLUDED.study_minutes;

  -- Qualifying activity: ≥10 min OR ≥1 pomodoro triggers streak update
  IF v_total_minutes >= 10 OR v_total_pomodoros >= 1 THEN
    PERFORM public.update_streak(v_user_id);
  END IF;
END;
$$;

-- Ensure unique constraint exists for the upserts above
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'study_activity_user_date_unique'
  ) THEN
    BEGIN
      ALTER TABLE public.study_activity ADD CONSTRAINT study_activity_user_date_unique UNIQUE (user_id, date);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'study_sessions_user_date_unique'
  ) THEN
    BEGIN
      ALTER TABLE public.study_sessions ADD CONSTRAINT study_sessions_user_date_unique UNIQUE (user_id, date);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

-- Backfill: recalculate streak for users based on existing activity history
CREATE OR REPLACE FUNCTION public.recalculate_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_streak integer := 0;
  v_longest integer := 0;
  v_prev_date date := NULL;
  v_run integer := 0;
  v_last date := NULL;
  r record;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOR r IN
    SELECT DISTINCT date FROM (
      SELECT date FROM public.study_activity
        WHERE user_id = p_user_id AND (active_minutes >= 10 OR pomodoro_sessions >= 1)
      UNION
      SELECT date FROM public.study_sessions
        WHERE user_id = p_user_id AND (study_minutes >= 10 OR tasks_completed >= 1 OR xp_earned > 0)
    ) d
    ORDER BY date ASC
  LOOP
    IF v_prev_date IS NULL OR r.date = v_prev_date + 1 THEN
      v_run := v_run + 1;
    ELSE
      v_run := 1;
    END IF;
    IF v_run > v_longest THEN v_longest := v_run; END IF;
    v_prev_date := r.date;
    v_last := r.date;
  END LOOP;

  -- Current streak: only valid if last activity is today or yesterday
  IF v_last IS NULL OR v_last < CURRENT_DATE - 1 THEN
    v_streak := 0;
  ELSE
    v_streak := v_run;
  END IF;

  UPDATE public.profiles
    SET current_streak = v_streak,
        longest_streak = GREATEST(longest_streak, v_longest),
        last_activity_date = v_last,
        updated_at = now()
    WHERE id = p_user_id;
END;
$$;

-- Run backfill for the existing test user
SELECT public.recalculate_streak('7293c68c-a1bf-4192-8304-5b71d352aebd');