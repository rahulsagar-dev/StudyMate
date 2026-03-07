import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  mode: "speech-speech" | "speech-text" | "text-text";
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-transcribe`;
const MESSAGE_LIMIT = 50;

export function useAIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const saveMessage = useCallback(async (msg: ChatMessage) => {
    if (!user) return;
    await supabase.from("ai_assistant_chats" as any).insert({
      user_id: user.id,
      conversation_id: conversationId,
      message: msg.content,
      role: msg.role,
      mode: msg.mode,
    });
  }, [user, conversationId]);

  const streamChat = useCallback(async (
    allMessages: ChatMessage[],
    onDelta: (chunk: string) => void,
    onDone: () => void,
  ) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 429) throw new Error("Rate limited. Please wait a moment.");
      if (resp.status === 402) throw new Error("AI credits exhausted.");
      throw new Error("Failed to get AI response");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }
    onDone();
  }, []);

  const speakText = useCallback(async (text: string) => {
    setIsSpeaking(true);
    try {
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: text.slice(0, 4000) }),
      });
      if (!resp.ok) throw new Error("TTS failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      await audio.play();
    } catch (e) {
      console.error("TTS error:", e);
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const resp = await fetch(STT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: formData,
    });
    if (!resp.ok) throw new Error("Transcription failed");
    const data = await resp.json();
    return data.text || "";
  }, []);

  const sendMessage = useCallback(async (content: string, mode: ChatMessage["mode"]) => {
    if (!content.trim() || isLoading) return;
    if (messages.length >= MESSAGE_LIMIT) {
      toast({ title: "Session limit reached", description: "Start a new conversation to continue.", variant: "destructive" });
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      mode,
    };

    setMessages(prev => [...prev, userMsg]);
    saveMessage(userMsg);
    setIsLoading(true);

    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === assistantId) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { id: assistantId, role: "assistant" as const, content: assistantContent, timestamp: new Date(), mode }];
      });
    };

    try {
      await streamChat(
        [...messages, userMsg],
        (chunk) => upsertAssistant(chunk),
        () => {
          setIsLoading(false);
          const assistantMsg: ChatMessage = {
            id: assistantId,
            role: "assistant",
            content: assistantContent,
            timestamp: new Date(),
            mode,
          };
          saveMessage(assistantMsg);

          // Award XP for asking a question
          if (user) {
            supabase.rpc("award_xp", { p_user_id: user.id, p_amount: 2, p_source: "ai_chat" });
            supabase.rpc("update_streak", { p_user_id: user.id });
          }

          // Auto-speak in speech-speech mode
          if (mode === "speech-speech" && assistantContent) {
            speakText(assistantContent);
          }
        },
      );
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to get response", variant: "destructive" });
    }
  }, [messages, isLoading, user, streamChat, saveMessage, speakText]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to use voice features.", variant: "destructive" });
    }
  }, []);

  const stopRecording = useCallback(async (mode: ChatMessage["mode"]): Promise<string | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) { setIsRecording(false); resolve(null); return; }

      recorder.onstop = async () => {
        setIsRecording(false);
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        recorder.stream.getTracks().forEach(t => t.stop());
        try {
          const text = await transcribeAudio(blob);
          if (text) {
            resolve(text);
          } else {
            toast({ title: "No speech detected", description: "Please try again.", variant: "destructive" });
            resolve(null);
          }
        } catch {
          toast({ title: "Transcription failed", description: "Please try again.", variant: "destructive" });
          resolve(null);
        }
      };
      recorder.stop();
    });
  }, [transcribeAudio]);

  const clearMessages = useCallback(() => {
    stopSpeaking();
    setMessages([]);
  }, [stopSpeaking]);

  return {
    messages,
    isLoading,
    isRecording,
    isSpeaking,
    sendMessage,
    startRecording,
    stopRecording,
    stopSpeaking,
    clearMessages,
    messageCount: messages.length,
    speakText,
    messageLimit: MESSAGE_LIMIT,
  };
}
