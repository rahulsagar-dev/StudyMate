CREATE OR REPLACE FUNCTION public.prevent_profile_game_state_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Official RPCs are SECURITY DEFINER: inside them, current_user becomes the
  -- function owner (postgres), so they are allowed through. Direct client or
  -- service_role updates run as their own role and are blocked.
  IF current_user IN ('postgres', 'supabase_admin') THEN
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