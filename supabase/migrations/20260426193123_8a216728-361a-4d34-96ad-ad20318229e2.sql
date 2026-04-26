-- Enable Realtime on whiteboards table for INSERT/UPDATE events
ALTER TABLE public.whiteboards REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'whiteboards'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboards';
  END IF;
END $$;