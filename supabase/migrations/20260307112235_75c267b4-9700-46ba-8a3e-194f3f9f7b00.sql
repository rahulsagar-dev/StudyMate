
-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_topic text NOT NULL,
  quiz_mode text NOT NULL DEFAULT 'practice',
  difficulty text NOT NULL DEFAULT 'medium',
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  incorrect_answers integer NOT NULL DEFAULT 0,
  skipped_answers integer NOT NULL DEFAULT 0,
  time_taken integer DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own quiz attempts" ON public.quiz_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Quiz question attempts table
CREATE TABLE public.quiz_question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'mcq',
  selected_answer text,
  correct_answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  confidence text,
  time_spent integer DEFAULT 0,
  answered_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.quiz_question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own question attempts" ON public.quiz_question_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own question attempts" ON public.quiz_question_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Bookmarked questions table
CREATE TABLE public.quiz_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_text text NOT NULL,
  correct_answer text NOT NULL,
  explanation text,
  topic text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, question_text)
);

ALTER TABLE public.quiz_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own bookmarks" ON public.quiz_bookmarks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bookmarks" ON public.quiz_bookmarks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON public.quiz_bookmarks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
