-- Ensure realtime captures full row changes for quiz_attempts
ALTER TABLE public.quiz_attempts REPLICA IDENTITY FULL;

-- Add quiz_attempts to the supabase_realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'quiz_attempts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_attempts;
  END IF;
END $$;