import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatMessage } from "@/lib/streamChat";

export interface ChatConversationSummary {
  conversation_id: string;
  last_at: string;
  preview: string;
  message_count: number;
}

export function useChatHistory() {
  const { user } = useAuth();

  const saveMessage = useCallback(
    async (conversationId: string, role: "user" | "assistant", content: string) => {
      if (!user || !content?.trim()) return;
      await supabase.from("ai_assistant_chats").insert({
        user_id: user.id,
        conversation_id: conversationId,
        role,
        message: content,
        mode: "text-text",
      });
    },
    [user]
  );

  const listConversations = useCallback(async (): Promise<ChatConversationSummary[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from("ai_assistant_chats")
      .select("conversation_id, message, role, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!data) return [];
    const map = new Map<string, ChatConversationSummary>();
    for (const row of data as any[]) {
      const cid = row.conversation_id;
      const existing = map.get(cid);
      if (!existing) {
        map.set(cid, {
          conversation_id: cid,
          last_at: row.created_at,
          preview: row.role === "user" ? row.message : "",
          message_count: 1,
        });
      } else {
        existing.message_count += 1;
        if (!existing.preview && row.role === "user") existing.preview = row.message;
      }
    }
    // Second pass: any conversation without a user preview, fall back to first message
    for (const conv of map.values()) {
      if (!conv.preview) {
        const first = (data as any[])
          .filter((r) => r.conversation_id === conv.conversation_id)
          .pop();
        conv.preview = first?.message ?? "(empty)";
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()
    );
  }, [user]);

  const loadConversation = useCallback(
    async (conversationId: string): Promise<ChatMessage[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from("ai_assistant_chats")
        .select("role, message, created_at")
        .eq("user_id", user.id)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (!data) return [];
      return (data as any[]).map((r) => ({
        role: r.role === "assistant" ? "assistant" : "user",
        content: r.message,
      }));
    },
    [user]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!user) return;
      await supabase
        .from("ai_assistant_chats")
        .delete()
        .eq("user_id", user.id)
        .eq("conversation_id", conversationId);
    },
    [user]
  );

  return { saveMessage, listConversations, loadConversation, deleteConversation };
}
