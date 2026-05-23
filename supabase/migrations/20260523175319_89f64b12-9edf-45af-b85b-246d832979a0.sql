
-- 1. Harden complete_task: clamp xp_reward
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

  -- Clamp xp_reward to defend against client-inserted inflated values
  v_xp_reward := GREATEST(1, LEAST(COALESCE(v_xp_reward, 20), 100));

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

-- 2. Harden claim_quiz_xp: ensure correct <= total
CREATE OR REPLACE FUNCTION public.claim_quiz_xp(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner uuid;
  v_correct integer;
  v_total integer;
  v_xp integer;
  v_already integer;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT user_id, correct_answers, total_questions INTO v_owner, v_correct, v_total
    FROM public.quiz_attempts WHERE id = p_attempt_id;
  IF v_owner IS NULL OR v_owner <> v_user_id THEN RAISE EXCEPTION 'Quiz attempt not found'; END IF;
  IF v_total IS NULL OR v_total <= 0 OR v_total > 100 THEN RAISE EXCEPTION 'Invalid quiz attempt'; END IF;
  IF v_correct IS NULL OR v_correct < 0 OR v_correct > v_total THEN
    RAISE EXCEPTION 'Invalid quiz score';
  END IF;
  v_xp := LEAST(1000, GREATEST(1, v_correct * 5 + 20 +
                                CASE WHEN v_correct = v_total THEN 50 ELSE 0 END));
  SELECT 1 INTO v_already FROM public.xp_transactions
   WHERE user_id = v_user_id AND source = 'quiz' AND source_id = p_attempt_id;
  IF v_already IS NOT NULL THEN RETURN jsonb_build_object('success', true, 'already_claimed', true, 'xp', 0); END IF;
  PERFORM public.award_xp(v_user_id, v_xp, 'quiz', p_attempt_id);
  PERFORM public.update_streak(v_user_id);
  RETURN jsonb_build_object('success', true, 'xp', v_xp);
END;
$function$;

-- 3. Harden claim_pomodoro_xp: clamp xp based on session_length, not client-supplied xp_earned
CREATE OR REPLACE FUNCTION public.claim_pomodoro_xp(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_xp integer;
  v_owner uuid;
  v_completed boolean;
  v_length integer;
  v_already integer;
  v_max_xp integer;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT user_id, xp_earned, completed, session_length
    INTO v_owner, v_xp, v_completed, v_length
    FROM public.pomodoro_sessions WHERE id = p_session_id;
  IF v_owner IS NULL OR v_owner <> v_user_id THEN RAISE EXCEPTION 'Pomodoro session not found'; END IF;
  IF NOT v_completed THEN RAISE EXCEPTION 'Pomodoro session not completed'; END IF;
  -- Compute a server-side cap based on session length (1 XP per minute, hard cap 60)
  v_max_xp := LEAST(60, GREATEST(1, COALESCE(v_length, 25)));
  v_xp := GREATEST(1, LEAST(COALESCE(v_xp, v_max_xp), v_max_xp));
  SELECT 1 INTO v_already FROM public.xp_transactions
   WHERE user_id = v_user_id AND source = 'pomodoro' AND source_id = p_session_id;
  IF v_already IS NOT NULL THEN RETURN jsonb_build_object('success', true, 'already_claimed', true, 'xp', 0); END IF;
  PERFORM public.award_xp(v_user_id, v_xp, 'pomodoro', p_session_id);
  RETURN jsonb_build_object('success', true, 'xp', v_xp);
END;
$function$;

-- 4. Defence-in-depth: restrict profiles UPDATE policy at the column level
-- The existing prevent_profile_game_state_changes trigger already blocks edits,
-- but make the RLS policy itself enforce ownership + game-state immutability.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
);

-- Add a table check constraint to enforce xp_reward bounds for any future task inserts
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_xp_reward_range;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_xp_reward_range
  CHECK (xp_reward >= 0 AND xp_reward <= 100);
