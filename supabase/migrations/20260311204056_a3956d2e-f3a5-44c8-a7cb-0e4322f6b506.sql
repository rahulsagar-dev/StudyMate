
-- Fix 1: Harden award_xp to only allow self-awarding
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer, p_source text, p_source_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  new_total_xp INTEGER;
BEGIN
  -- Security: only allow awarding XP to yourself, or from trusted internal calls
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot award XP to another user';
  END IF;

  -- Validate amount is positive and reasonable
  IF p_amount <= 0 OR p_amount > 1000 THEN
    RAISE EXCEPTION 'Invalid XP amount: must be between 1 and 1000';
  END IF;

  UPDATE public.profiles
  SET total_xp = total_xp + p_amount,
      current_level = public.calculate_level(total_xp + p_amount),
      updated_at = now()
  WHERE id = p_user_id
  RETURNING total_xp INTO new_total_xp;

  INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
  VALUES (p_user_id, p_amount, p_source, p_source_id);
END;
$$;

-- Fix 2: Harden update_streak to only allow self-updates
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  last_date DATE;
  new_streak INTEGER;
BEGIN
  -- Security: only allow updating your own streak
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot update another user streak';
  END IF;

  SELECT last_activity_date, current_streak INTO last_date, new_streak
  FROM public.profiles WHERE id = p_user_id;

  IF last_date IS NULL OR last_date < CURRENT_DATE - 1 THEN
    new_streak := 1;
  ELSIF last_date = CURRENT_DATE - 1 THEN
    new_streak := new_streak + 1;
  END IF;

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

-- Fix 3: Harden complete_task and uncomplete_task similarly
CREATE OR REPLACE FUNCTION public.complete_task(p_task_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_xp_reward INTEGER;
  v_completed BOOLEAN;
BEGIN
  SELECT user_id, xp_reward, completed INTO v_user_id, v_xp_reward, v_completed
  FROM public.tasks WHERE id = p_task_id;

  -- Security: only task owner can complete it
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
    VALUES (v_user_id, CURRENT_DATE, v_xp_reward, 1)
    ON CONFLICT (user_id, date) DO UPDATE
    SET xp_earned = study_sessions.xp_earned + v_xp_reward,
        tasks_completed = study_sessions.tasks_completed + 1;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.uncomplete_task(p_task_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_xp_reward INTEGER;
  v_completed BOOLEAN;
BEGIN
  SELECT user_id, xp_reward, completed INTO v_user_id, v_xp_reward, v_completed
  FROM public.tasks WHERE id = p_task_id;

  -- Security: only task owner can uncomplete it
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
    WHERE user_id = v_user_id AND date = CURRENT_DATE;
  END IF;
END;
$$;
