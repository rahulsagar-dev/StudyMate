-- 1. award_xp: never lower level
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
        current_level = GREATEST(current_level, public.calculate_level(total_xp + v_final_amount)),
        updated_at = now()
    WHERE id = p_user_id;

  INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
    VALUES (p_user_id, v_final_amount, p_source, p_source_id);
END;
$function$;

-- 2. purchase_store_item: do NOT lower level on spend
CREATE OR REPLACE FUNCTION public.purchase_store_item(p_item_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_item public.store_items%ROWTYPE;
  v_user_xp integer;
  v_existing_qty integer;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_item FROM public.store_items WHERE id = p_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not found: %', p_item_id; END IF;

  SELECT total_xp INTO v_user_xp FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF v_user_xp IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_user_xp < v_item.price THEN
    RAISE EXCEPTION 'Not enough XP. Need %, have %', v_item.price, v_user_xp;
  END IF;

  IF v_item.item_type IN ('theme','avatar','permanent_badge','cosmetic_vault') THEN
    SELECT quantity INTO v_existing_qty FROM public.user_inventory
      WHERE user_id = v_user_id AND item_id = p_item_id;
    IF v_existing_qty IS NOT NULL AND v_existing_qty > 0 THEN
      RAISE EXCEPTION 'Item already owned';
    END IF;
  END IF;

  -- Deduct XP but KEEP level (level is a permanent achievement)
  UPDATE public.profiles
    SET total_xp = total_xp - v_item.price,
        updated_at = now()
    WHERE id = v_user_id;

  INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
    VALUES (v_user_id, -v_item.price, 'store_purchase', NULL);

  INSERT INTO public.user_inventory (user_id, item_id, quantity)
    VALUES (v_user_id, p_item_id,
            CASE WHEN v_item.item_type = 'hint_token' THEN v_item.effect_value::int ELSE 1 END)
    ON CONFLICT (user_id, item_id) DO UPDATE
      SET quantity = public.user_inventory.quantity +
                     CASE WHEN v_item.item_type = 'hint_token' THEN v_item.effect_value::int ELSE 1 END;

  IF v_item.item_type = 'xp_multiplier' AND v_item.duration_minutes > 0 THEN
    INSERT INTO public.active_boosts (user_id, item_id, multiplier, scope, expires_at)
      VALUES (v_user_id, p_item_id, v_item.effect_value, v_item.scope,
              now() + make_interval(mins => v_item.duration_minutes));
  END IF;

  IF v_item.item_type IN ('theme','avatar') THEN
    INSERT INTO public.user_cosmetics (user_id, equipped_theme, equipped_avatar)
      VALUES (
        v_user_id,
        CASE WHEN v_item.item_type = 'theme' THEN p_item_id ELSE NULL END,
        CASE WHEN v_item.item_type = 'avatar' THEN p_item_id ELSE NULL END
      )
      ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'item_id', p_item_id,
                            'xp_spent', v_item.price, 'remaining_xp', v_user_xp - v_item.price);
END;
$function$;

-- 3. uncomplete_task: keep level when refunding XP
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

-- 4. Backfill: set every profile's current_level to highest level ever earned (lifetime positive XP)
WITH lifetime AS (
  SELECT user_id, COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0) AS earned
  FROM public.xp_transactions
  GROUP BY user_id
)
UPDATE public.profiles p
SET current_level = GREATEST(p.current_level, public.calculate_level(l.earned::int)),
    updated_at = now()
FROM lifetime l
WHERE p.id = l.user_id;