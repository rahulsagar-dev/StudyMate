
-- Idempotency: same event can't be rewarded twice (scoped to claim sources only)
CREATE UNIQUE INDEX IF NOT EXISTS xp_transactions_claim_unique
  ON public.xp_transactions (user_id, source, source_id)
  WHERE source_id IS NOT NULL
    AND source IN ('pomodoro','quiz','whiteboard_save');

-- ---------- claim_pomodoro_xp ----------
CREATE OR REPLACE FUNCTION public.claim_pomodoro_xp(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_xp integer;
  v_owner uuid;
  v_completed boolean;
  v_already integer;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT user_id, xp_earned, completed INTO v_owner, v_xp, v_completed
    FROM public.pomodoro_sessions WHERE id = p_session_id;
  IF v_owner IS NULL OR v_owner <> v_user_id THEN RAISE EXCEPTION 'Pomodoro session not found'; END IF;
  IF NOT v_completed OR v_xp IS NULL OR v_xp <= 0 OR v_xp > 200 THEN RAISE EXCEPTION 'Invalid pomodoro session'; END IF;
  SELECT 1 INTO v_already FROM public.xp_transactions
   WHERE user_id = v_user_id AND source = 'pomodoro' AND source_id = p_session_id;
  IF v_already IS NOT NULL THEN RETURN jsonb_build_object('success', true, 'already_claimed', true, 'xp', 0); END IF;
  PERFORM public.award_xp(v_user_id, v_xp, 'pomodoro', p_session_id);
  RETURN jsonb_build_object('success', true, 'xp', v_xp);
END;
$$;

-- ---------- claim_quiz_xp ----------
CREATE OR REPLACE FUNCTION public.claim_quiz_xp(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  v_xp := LEAST(1000, GREATEST(1, COALESCE(v_correct, 0) * 5 + 20 +
                                CASE WHEN v_correct = v_total THEN 50 ELSE 0 END));
  SELECT 1 INTO v_already FROM public.xp_transactions
   WHERE user_id = v_user_id AND source = 'quiz' AND source_id = p_attempt_id;
  IF v_already IS NOT NULL THEN RETURN jsonb_build_object('success', true, 'already_claimed', true, 'xp', 0); END IF;
  PERFORM public.award_xp(v_user_id, v_xp, 'quiz', p_attempt_id);
  PERFORM public.update_streak(v_user_id);
  RETURN jsonb_build_object('success', true, 'xp', v_xp);
END;
$$;

-- ---------- claim_whiteboard_save_xp ----------
CREATE OR REPLACE FUNCTION public.claim_whiteboard_save_xp(p_whiteboard_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner uuid;
  v_already integer;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT user_id INTO v_owner FROM public.whiteboards WHERE id = p_whiteboard_id;
  IF v_owner IS NULL OR v_owner <> v_user_id THEN RAISE EXCEPTION 'Whiteboard not found'; END IF;
  SELECT 1 INTO v_already FROM public.xp_transactions
   WHERE user_id = v_user_id AND source = 'whiteboard_save' AND source_id = p_whiteboard_id;
  IF v_already IS NOT NULL THEN RETURN jsonb_build_object('success', true, 'already_claimed', true, 'xp', 0); END IF;
  PERFORM public.award_xp(v_user_id, 15, 'whiteboard_save', p_whiteboard_id);
  RETURN jsonb_build_object('success', true, 'xp', 15);
END;
$$;

-- ---------- claim_whiteboard_ai_xp (daily cap of 5) ----------
CREATE OR REPLACE FUNCTION public.claim_whiteboard_ai_xp()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today_count integer;
  v_today timestamptz := date_trunc('day', now());
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT COUNT(*) INTO v_today_count FROM public.xp_transactions
   WHERE user_id = v_user_id AND source = 'whiteboard_ai_generate' AND created_at >= v_today;
  IF v_today_count >= 5 THEN RETURN jsonb_build_object('success', true, 'capped', true, 'xp', 0); END IF;
  PERFORM public.award_xp(v_user_id, 25, 'whiteboard_ai_generate', NULL);
  RETURN jsonb_build_object('success', true, 'xp', 25);
END;
$$;

-- ---------- claim_focus_session_xp (per-day cap 400 XP) ----------
CREATE OR REPLACE FUNCTION public.claim_focus_session_xp(p_minutes integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today timestamptz := date_trunc('day', now());
  v_today_xp integer;
  v_xp integer;
  v_cap integer := 400;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_minutes IS NULL OR p_minutes < 1 OR p_minutes > 600 THEN RAISE EXCEPTION 'Invalid minutes'; END IF;
  v_xp := FLOOR((p_minutes::numeric / 30) * 25)::integer;
  IF v_xp <= 0 THEN RETURN jsonb_build_object('success', true, 'xp', 0); END IF;
  SELECT COALESCE(SUM(amount), 0) INTO v_today_xp FROM public.xp_transactions
   WHERE user_id = v_user_id AND source = 'focus_session' AND created_at >= v_today;
  IF v_today_xp >= v_cap THEN RETURN jsonb_build_object('success', true, 'capped', true, 'xp', 0); END IF;
  v_xp := LEAST(v_xp, v_cap - v_today_xp);
  PERFORM public.award_xp(v_user_id, v_xp, 'focus_session', NULL);
  PERFORM public.update_streak(v_user_id);
  RETURN jsonb_build_object('success', true, 'xp', v_xp);
END;
$$;

-- Lock down direct award_xp access for end-users
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, uuid) FROM anon;

GRANT EXECUTE ON FUNCTION public.claim_pomodoro_xp(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_quiz_xp(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_whiteboard_save_xp(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_whiteboard_ai_xp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_focus_session_xp(integer) TO authenticated;
