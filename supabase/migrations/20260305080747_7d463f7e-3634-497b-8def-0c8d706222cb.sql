
-- Create flashcard_sets table
CREATE TABLE public.flashcard_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flashcard sets" ON public.flashcard_sets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcard sets" ON public.flashcard_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcard sets" ON public.flashcard_sets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcard sets" ON public.flashcard_sets FOR DELETE USING (auth.uid() = user_id);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid REFERENCES public.flashcard_sets(id) ON DELETE CASCADE NOT NULL,
  front_text text NOT NULL,
  back_text text NOT NULL,
  position integer NOT NULL DEFAULT 0
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flashcards" ON public.flashcards FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.flashcard_sets WHERE id = flashcards.set_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own flashcards" ON public.flashcards FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.flashcard_sets WHERE id = flashcards.set_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own flashcards" ON public.flashcards FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.flashcard_sets WHERE id = flashcards.set_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.flashcard_sets WHERE id = flashcards.set_id AND user_id = auth.uid()));

-- Create generation_history table
CREATE TABLE public.generation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  input_text text,
  source_type text NOT NULL DEFAULT 'text',
  source_filename text,
  output_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  card_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history" ON public.generation_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.generation_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON public.generation_history FOR DELETE USING (auth.uid() = user_id);
