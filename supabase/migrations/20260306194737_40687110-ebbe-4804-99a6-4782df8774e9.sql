
CREATE TABLE public.pomodoro_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_length integer NOT NULL DEFAULT 25,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  xp_earned integer NOT NULL DEFAULT 0,
  cycle_position integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own pomodoro sessions"
  ON public.pomodoro_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own pomodoro sessions"
  ON public.pomodoro_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pomodoro sessions"
  ON public.pomodoro_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
