UPDATE public.profiles p
SET current_level = sub.max_level,
    updated_at = now()
FROM (
  SELECT user_id, public.calculate_level(MAX(running_xp)::integer) AS max_level
  FROM (
    SELECT user_id,
           SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) OVER (PARTITION BY user_id ORDER BY created_at) AS running_xp
    FROM public.xp_transactions
  ) t
  GROUP BY user_id
) sub
WHERE p.id = sub.user_id AND p.current_level < sub.max_level;