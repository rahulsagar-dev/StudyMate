-- Allow users to update their own quiz attempts (needed for hybrid voice quiz progress)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='quiz_attempts'
      AND policyname='Users can update own quiz attempts'
  ) THEN
    CREATE POLICY "Users can update own quiz attempts" ON public.quiz_attempts
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;