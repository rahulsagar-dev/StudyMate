
CREATE TABLE public.study_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  active_minutes integer NOT NULL DEFAULT 0,
  pomodoro_sessions integer NOT NULL DEFAULT 0,
  productivity_score integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.study_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own study activity"
  ON public.study_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own study activity"
  ON public.study_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own study activity"
  ON public.study_activity FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
