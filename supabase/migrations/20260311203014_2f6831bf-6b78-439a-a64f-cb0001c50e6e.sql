
-- Calendar Events table
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'study_session',
  subject text,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  color text,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON public.calendar_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events" ON public.calendar_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON public.calendar_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON public.calendar_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Index for fast date range queries
CREATE INDEX idx_calendar_events_user_date ON public.calendar_events(user_id, date);
