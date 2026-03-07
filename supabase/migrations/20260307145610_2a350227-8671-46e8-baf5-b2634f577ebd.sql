
CREATE TABLE public.ai_assistant_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  message text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  mode text NOT NULL DEFAULT 'text-text',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_assistant_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own chats" ON public.ai_assistant_chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own chats" ON public.ai_assistant_chats FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON public.ai_assistant_chats FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_ai_chats_user_conversation ON public.ai_assistant_chats (user_id, conversation_id, created_at);
