
-- 1. ai_error_logs: restrict INSERT/SELECT to authenticated role
DROP POLICY IF EXISTS "Users can create their own error logs" ON public.ai_error_logs;
DROP POLICY IF EXISTS "Users can view their own error logs" ON public.ai_error_logs;
CREATE POLICY "Users can create their own error logs"
  ON public.ai_error_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);
CREATE POLICY "Users can view their own error logs"
  ON public.ai_error_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. oauth_states: add explicit owner-scoped policies (service role bypasses RLS anyway)
CREATE POLICY "Users can view own oauth states"
  ON public.oauth_states FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own oauth states"
  ON public.oauth_states FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own oauth states"
  ON public.oauth_states FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. Harden profile game-state trigger: remove role allowlist that could be bypassed.
-- Allow updates to game-state columns only when called via SECURITY DEFINER RPCs
-- (award_xp, update_streak, etc.) which set a session GUC marker.
CREATE OR REPLACE FUNCTION public.prevent_profile_game_state_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Block direct edits to game-state columns from any caller (including
  -- service_role). Official RPCs are SECURITY DEFINER and run as table owner,
  -- which bypasses RLS but still fires this trigger; allow them by checking
  -- session_user (the original login role) rather than current_user.
  IF session_user IN ('postgres', 'supabase_admin') THEN
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
$function$;

-- Ensure trigger is actually attached to profiles
DROP TRIGGER IF EXISTS prevent_profile_game_state_changes_trg ON public.profiles;
CREATE TRIGGER prevent_profile_game_state_changes_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_game_state_changes();
