
DROP FUNCTION IF EXISTS public.award_xp(uuid, integer, text, uuid);

CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer, p_source text, p_source_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_multiplier real;
  v_scope text;
  v_final_amount integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot award XP to another user';
  END IF;
  IF p_amount <= 0 OR p_amount > 1000 THEN
    RAISE EXCEPTION 'Invalid XP amount: must be between 1 and 1000';
  END IF;

  v_scope := CASE
    WHEN p_source = 'pomodoro' THEN 'pomodoro'
    WHEN p_source = 'quiz' THEN 'quiz'
    ELSE 'all'
  END;
  v_multiplier := public.get_xp_multiplier(p_user_id, v_scope);
  v_final_amount := LEAST(2000, GREATEST(1, ROUND(p_amount * v_multiplier)));

  UPDATE public.profiles
    SET total_xp = total_xp + v_final_amount,
        current_level = GREATEST(current_level, public.calculate_level(total_xp + v_final_amount)),
        updated_at = now()
    WHERE id = p_user_id;

  INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
    VALUES (p_user_id, v_final_amount, p_source, p_source_id);

  RETURN v_final_amount;
END;
$function$;

REVOKE ALL ON FUNCTION public.award_xp(uuid, integer, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, uuid) TO service_role;

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
  v_awarded INTEGER;
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  SELECT user_id, xp_reward, completed INTO v_user_id, v_xp_reward, v_completed
  FROM public.tasks WHERE id = p_task_id;

  IF auth.uid() IS NULL OR auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot complete another user task';
  END IF;

  v_xp_reward := GREATEST(1, LEAST(COALESCE(v_xp_reward, 20), 100));

  IF NOT v_completed THEN
    UPDATE public.tasks
      SET completed = true, completed_at = now()
      WHERE id = p_task_id;

    v_awarded := public.award_xp(v_user_id, v_xp_reward, 'task', p_task_id);
    PERFORM public.update_streak(v_user_id);

    INSERT INTO public.study_sessions (user_id, date, xp_earned, tasks_completed)
    VALUES (v_user_id, v_today, v_awarded, 1)
    ON CONFLICT (user_id, date) DO UPDATE
    SET xp_earned = study_sessions.xp_earned + v_awarded,
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
  v_completed BOOLEAN;
  v_awarded INTEGER;
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  SELECT user_id, completed INTO v_user_id, v_completed
  FROM public.tasks WHERE id = p_task_id;

  IF auth.uid() IS NULL OR auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user task';
  END IF;

  IF v_completed THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_awarded
      FROM public.xp_transactions
      WHERE user_id = v_user_id
        AND source = 'task'
        AND source_id = p_task_id
        AND amount > 0;

    UPDATE public.tasks
      SET completed = false, completed_at = NULL
      WHERE id = p_task_id;

    IF v_awarded > 0 THEN
      UPDATE public.profiles
        SET total_xp = GREATEST(0, total_xp - v_awarded),
            updated_at = now()
        WHERE id = v_user_id;

      INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
        VALUES (v_user_id, -v_awarded, 'task_uncomplete', p_task_id);

      UPDATE public.study_sessions
        SET xp_earned = GREATEST(0, xp_earned - v_awarded),
            tasks_completed = GREATEST(0, tasks_completed - 1)
        WHERE user_id = v_user_id AND date = v_today;
    END IF;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_focus_session_xp(p_minutes integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_today timestamptz := date_trunc('day', now());
  v_today_xp integer;
  v_base integer;
  v_multiplier real;
  v_projected integer;
  v_max_final integer;
  v_awarded integer;
  v_cap integer := 400;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_minutes IS NULL OR p_minutes < 1 OR p_minutes > 600 THEN RAISE EXCEPTION 'Invalid minutes'; END IF;

  v_base := FLOOR((p_minutes::numeric / 30) * 25)::integer;
  IF v_base <= 0 THEN RETURN jsonb_build_object('success', true, 'xp', 0); END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_today_xp
    FROM public.xp_transactions
    WHERE user_id = v_user_id AND source = 'focus_session' AND created_at >= v_today;

  IF v_today_xp >= v_cap THEN
    RETURN jsonb_build_object('success', true, 'capped', true, 'xp', 0);
  END IF;

  v_multiplier := public.get_xp_multiplier(v_user_id, 'all');
  v_max_final := v_cap - v_today_xp;
  v_projected := ROUND(v_base * v_multiplier)::integer;

  IF v_projected > v_max_final THEN
    v_base := GREATEST(1, FLOOR(v_max_final / GREATEST(v_multiplier, 0.01))::integer);
  END IF;

  v_awarded := public.award_xp(v_user_id, v_base, 'focus_session', NULL);
  PERFORM public.update_streak(v_user_id);
  RETURN jsonb_build_object('success', true, 'xp', v_awarded);
END;
$function$;
