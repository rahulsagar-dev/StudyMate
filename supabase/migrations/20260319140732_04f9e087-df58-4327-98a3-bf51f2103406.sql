
CREATE TABLE public.whiteboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Whiteboard',
  elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  app_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whiteboards" ON public.whiteboards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own whiteboards" ON public.whiteboards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own whiteboards" ON public.whiteboards FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own whiteboards" ON public.whiteboards FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER handle_whiteboards_updated_at
  BEFORE UPDATE ON public.whiteboards
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
