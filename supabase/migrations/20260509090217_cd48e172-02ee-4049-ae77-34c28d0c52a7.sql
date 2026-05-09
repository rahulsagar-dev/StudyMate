CREATE OR REPLACE FUNCTION public.reset_stale_streak()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_last date;
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  IF v_user_id IS NULL THEN RETURN; END IF;
  SELECT last_activity_date INTO v_last FROM public.profiles WHERE id = v_user_id;
  IF v_last IS NULL OR v_last < v_today - 1 THEN
    UPDATE public.profiles
      SET current_streak = 0, updated_at = now()
      WHERE id = v_user_id AND current_streak <> 0;
  END IF;
END;
$$;