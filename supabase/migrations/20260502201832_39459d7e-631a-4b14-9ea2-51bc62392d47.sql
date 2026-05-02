
-- Fix timezone: use IST (Asia/Kolkata) for all "today" calculations instead of UTC

CREATE OR REPLACE FUNCTION public.complete_task(p_task_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_xp_reward INTEGER;
  v_completed BOOLEAN;
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  SELECT user_id, xp_reward, completed INTO v_user_id, v_xp_reward, v_completed
  FROM public.tasks WHERE id = p_task_id;

  IF auth.uid() IS NULL OR auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot complete another user task';
  END IF;

  IF NOT v_completed THEN
    UPDATE public.tasks
    SET completed = true, completed_at = now()
    WHERE id = p_task_id;

    PERFORM public.award_xp(v_user_id, v_xp_reward, 'task', p_task_id);
    PERFORM public.update_streak(v_user_id);

    INSERT INTO public.study_sessions (user_id, date, xp_earned, tasks_completed)
    VALUES (v_user_id, v_today, v_xp_reward, 1)
    ON CONFLICT (user_id, date) DO UPDATE
    SET xp_earned = study_sessions.xp_earned + v_xp_reward,
        tasks_completed = study_sessions.tasks_completed + 1;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.uncomplete_task(p_task_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_xp_reward INTEGER;
  v_completed BOOLEAN;
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  SELECT user_id, xp_reward, completed INTO v_user_id, v_xp_reward, v_completed
  FROM public.tasks WHERE id = p_task_id;

  IF auth.uid() IS NULL OR auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user task';
  END IF;

  IF v_completed THEN
    UPDATE public.tasks
    SET completed = false, completed_at = NULL
    WHERE id = p_task_id;

    UPDATE public.profiles
    SET total_xp = GREATEST(0, total_xp - v_xp_reward),
        current_level = public.calculate_level(GREATEST(0, total_xp - v_xp_reward)),
        updated_at = now()
    WHERE id = v_user_id;

    INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
    VALUES (v_user_id, -v_xp_reward, 'task_uncomplete', p_task_id);

    UPDATE public.study_sessions
    SET xp_earned = GREATEST(0, xp_earned - v_xp_reward),
        tasks_completed = GREATEST(0, tasks_completed - 1)
    WHERE user_id = v_user_id AND date = v_today;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_study_activity(p_minutes integer, p_pomodoros integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_total_minutes integer;
  v_total_pomodoros integer;
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_minutes < 0 OR p_minutes > 600 THEN
    RAISE EXCEPTION 'Invalid minutes value';
  END IF;

  INSERT INTO public.study_activity (user_id, date, active_minutes, pomodoro_sessions)
  VALUES (v_user_id, v_today, p_minutes, COALESCE(p_pomodoros, 0))
  ON CONFLICT (user_id, date) DO UPDATE
  SET active_minutes = study_activity.active_minutes + EXCLUDED.active_minutes,
      pomodoro_sessions = study_activity.pomodoro_sessions + EXCLUDED.pomodoro_sessions
  RETURNING active_minutes, pomodoro_sessions INTO v_total_minutes, v_total_pomodoros;

  INSERT INTO public.study_sessions (user_id, date, study_minutes)
  VALUES (v_user_id, v_today, p_minutes)
  ON CONFLICT (user_id, date) DO UPDATE
  SET study_minutes = study_sessions.study_minutes + EXCLUDED.study_minutes;

  IF v_total_minutes >= 10 OR v_total_pomodoros >= 1 THEN
    PERFORM public.update_streak(v_user_id);
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  last_date DATE;
  new_streak INTEGER;
  v_shield_qty integer;
  v_gap integer;
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot update another user streak';
  END IF;

  SELECT last_activity_date, current_streak INTO last_date, new_streak
    FROM public.profiles WHERE id = p_user_id;

  IF last_date IS NULL THEN
    new_streak := 1;
  ELSIF last_date = v_today - 1 THEN
    new_streak := new_streak + 1;
  ELSIF last_date = v_today THEN
    RETURN;
  ELSE
    v_gap := (v_today - last_date - 1);
    SELECT quantity INTO v_shield_qty FROM public.user_inventory
      WHERE user_id = p_user_id AND item_id = 'power-streak-shield' FOR UPDATE;

    IF v_shield_qty IS NOT NULL AND v_shield_qty >= v_gap THEN
      UPDATE public.user_inventory
        SET quantity = quantity - v_gap
        WHERE user_id = p_user_id AND item_id = 'power-streak-shield';
      new_streak := new_streak + 1;
    ELSE
      new_streak := 1;
    END IF;
  END IF;

  UPDATE public.profiles
    SET current_streak = new_streak,
        longest_streak = GREATEST(longest_streak, new_streak),
        last_activity_date = v_today,
        updated_at = now()
    WHERE id = p_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_streak(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_streak integer := 0;
  v_longest integer := 0;
  v_prev_date date := NULL;
  v_run integer := 0;
  v_last date := NULL;
  r record;
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
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

  IF v_last IS NULL OR v_last < v_today - 1 THEN
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
$function$;
