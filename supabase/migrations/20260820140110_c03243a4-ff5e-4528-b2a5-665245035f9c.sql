CREATE TABLE public.app_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_name text NOT NULL,
  path text,
  session_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.app_events TO authenticated;
GRANT ALL ON public.app_events TO service_role;

ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events"
  ON public.app_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND length(event_name) <= 64 AND length(COALESCE(path, '')) <= 256);

CREATE POLICY "Users can read their own events"
  ON public.app_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX app_events_user_created_idx ON public.app_events (user_id, created_at DESC);
CREATE INDEX app_events_created_idx ON public.app_events (created_at DESC);
CREATE INDEX app_events_name_idx ON public.app_events (event_name);

CREATE VIEW public.daily_active_users
WITH (security_invoker = true) AS
SELECT
  (created_at AT TIME ZONE 'Asia/Kolkata')::date AS day,
  COUNT(DISTINCT user_id) AS active_users,
  COUNT(*) AS events
FROM public.app_events
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON public.daily_active_users TO authenticated;
GRANT SELECT ON public.daily_active_users TO service_role;

CREATE VIEW public.user_retention
WITH (security_invoker = true) AS
WITH days AS (
  SELECT user_id, (created_at AT TIME ZONE 'Asia/Kolkata')::date AS day
  FROM public.app_events
  GROUP BY 1, 2
), first_day AS (
  SELECT user_id, MIN(day) AS signup_day, MAX(day) AS last_active_day, COUNT(*) AS active_days
  FROM days GROUP BY 1
)
SELECT
  f.user_id,
  f.signup_day,
  f.last_active_day,
  f.active_days,
  (f.last_active_day - f.signup_day) AS lifespan_days,
  EXISTS (SELECT 1 FROM days d WHERE d.user_id = f.user_id AND d.day = f.signup_day + 1) AS returned_d1,
  EXISTS (SELECT 1 FROM days d WHERE d.user_id = f.user_id AND d.day >= f.signup_day + 7 AND d.day < f.signup_day + 14) AS returned_d7,
  EXISTS (SELECT 1 FROM days d WHERE d.user_id = f.user_id AND d.day >= f.signup_day + 30 AND d.day < f.signup_day + 37) AS returned_d30
FROM first_day f;

GRANT SELECT ON public.user_retention TO authenticated;
GRANT SELECT ON public.user_retention TO service_role;