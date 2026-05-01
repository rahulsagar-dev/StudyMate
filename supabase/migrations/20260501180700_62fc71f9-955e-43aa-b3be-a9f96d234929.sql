
-- 1. Fix null auth bypass in SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer, p_source text, p_source_id uuid DEFAULT NULL::uuid)
 RETURNS void
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
        current_level = public.calculate_level(total_xp + v_final_amount),
        updated_at = now()
    WHERE id = p_user_id;

  INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
    VALUES (p_user_id, v_final_amount, p_source, p_source_id);
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
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot update another user streak';
  END IF;

  SELECT last_activity_date, current_streak INTO last_date, new_streak
    FROM public.profiles WHERE id = p_user_id;

  IF last_date IS NULL THEN
    new_streak := 1;
  ELSIF last_date = CURRENT_DATE - 1 THEN
    new_streak := new_streak + 1;
  ELSIF last_date = CURRENT_DATE THEN
    RETURN;
  ELSE
    v_gap := (CURRENT_DATE - last_date - 1);
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
        last_activity_date = CURRENT_DATE,
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
$function$;

-- Revoke EXECUTE from anon role on sensitive functions
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_streak(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalculate_streak(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_task(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.uncomplete_task(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_store_item(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_inventory_item(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.equip_cosmetic(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_study_activity(integer, integer) FROM anon;

-- 2. Protect game-state columns on profiles via BEFORE UPDATE trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_game_state_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow when called from a SECURITY DEFINER context (postgres / supabase_admin)
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF NEW.total_xp IS DISTINCT FROM OLD.total_xp
     OR NEW.current_level IS DISTINCT FROM OLD.current_level
     OR NEW.current_streak IS DISTINCT FROM OLD.current_streak
     OR NEW.longest_streak IS DISTINCT FROM OLD.longest_streak
     OR NEW.last_activity_date IS DISTINCT FROM OLD.last_activity_date THEN
    RAISE EXCEPTION 'Game state columns (total_xp, current_level, streaks) cannot be modified directly. Use the official RPCs.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_game_state ON public.profiles;
CREATE TRIGGER protect_profile_game_state
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_game_state_changes();

-- 3. Fix aria_memory: remove public role policy, restrict to service_role
DROP POLICY IF EXISTS "Service role can do everything" ON public.aria_memory;
CREATE POLICY "Service role manages aria memory"
  ON public.aria_memory
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Add INSERT/UPDATE/DELETE policies on active_boosts
CREATE POLICY "Users can insert own active boosts"
  ON public.active_boosts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own active boosts"
  ON public.active_boosts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own active boosts"
  ON public.active_boosts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. Realtime: restrict topic subscriptions to authenticated users on their own user_id topic
-- Topic convention: clients subscribe to user-scoped topics. We require topic to start with auth.uid()::text.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'realtime' AND tablename = 'messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can subscribe to own topics" ON realtime.messages';
    EXECUTE $p$CREATE POLICY "Authenticated users can subscribe to own topics"
      ON realtime.messages FOR SELECT TO authenticated
      USING (
        (realtime.topic() LIKE (auth.uid()::text || '%'))
        OR (realtime.topic() LIKE ('profile-changes:' || auth.uid()::text || '%'))
      )$p$;
  END IF;
END $$;
