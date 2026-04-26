-- Add missing write policies to user_inventory so users can only manage their own rows
CREATE POLICY "Users can insert own inventory"
  ON public.user_inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON public.user_inventory
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory"
  ON public.user_inventory
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a short-lived opaque OAuth state table so we don't have to embed JWTs in URLs
CREATE TABLE public.oauth_states (
  state_token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  redirect_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- No client policies: only service role (in edge functions) reads/writes this table.
-- Index for cleanup
CREATE INDEX idx_oauth_states_expires_at ON public.oauth_states (expires_at);