import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  LiveKitRoom,
  useVoiceAssistant,
  useConnectionState,
  useRoomContext,
  VoiceAssistantControlBar,
  RoomAudioRenderer,
  DisconnectButton,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import "@livekit/components-styles";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Loader2, X, AlertCircle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceOrb } from "./VoiceOrb";
import { WhiteboardDataBridge } from "./WhiteboardDataBridge";

interface TokenData {
  token: string;
  roomName: string;
  livekitUrl: string;
  userId: string;
}

// Inner component — only rendered inside LiveKitRoom context
function AgentInterface({ onEnd }: { onEnd: () => void }) {
  const { state, agent, agentTranscriptions } = useVoiceAssistant();
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const [agentTimedOut, setAgentTimedOut] = useState(false);
  const [fallbackCommand, setFallbackCommand] = useState("");
  const [textInput, setTextInput] = useState("");
  const [userMessages, setUserMessages] = useState<{ id: string; text: string }[]>([]);
  const [sending, setSending] = useState(false);

  const isConnected = connectionState === ConnectionState.Connected;

  useEffect(() => {
    if (agent || connectionState !== ConnectionState.Connected) {
      setAgentTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setAgentTimedOut(true), 12000);
    return () => window.clearTimeout(timer);
  }, [agent, connectionState]);

  const sendFallbackCommand = (event: FormEvent) => {
    event.preventDefault();
    const text = fallbackCommand.trim();
    if (!text) return;
    window.dispatchEvent(new CustomEvent("aria:voice-command", { detail: { text } }));
    setFallbackCommand("");
  };

  const sendTextToAria = async (event: FormEvent) => {
    event.preventDefault();
    const text = textInput.trim();
    if (!text || !isConnected || !localParticipant) return;
    try {
      setSending(true);
      const payload = new TextEncoder().encode(
        JSON.stringify({ type: "text_input", text })
      );
      await localParticipant.publishData(payload, { reliable: true });
      setUserMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text },
      ]);
      setTextInput("");
    } catch (err) {
      console.error("[VoiceAgent] Failed to publish text input:", err);
    } finally {
      setSending(false);
    }
  };

  const stateLabel =
    !agent && connectionState === ConnectionState.Connected
      ? "Waking Aria up…"
      : ({
          connecting: "Connecting…",
          initializing: "Waking Aria up…",
          idle: "Ready when you are",
          listening: "Listening…",
          thinking: "Thinking…",
          speaking: "Speaking…",
          disconnected: "Disconnected",
        }[state] ?? "Connected");

  // Build a merged recent timeline of user texts + Aria transcriptions
  const ariaSegments = (agentTranscriptions ?? []).map((s) => ({
    id: `aria-${s.id}`,
    role: "assistant" as const,
    text: s.text,
    time: s.firstReceivedTime ?? 0,
    final: s.final,
  }));
  const userSegments = userMessages.map((m, i) => ({
    id: m.id,
    role: "user" as const,
    text: m.text,
    time: Number(m.id.split("-")[0]) || i,
    final: true,
  }));
  const timeline = [...ariaSegments, ...userSegments]
    .sort((a, b) => a.time - b.time)
    .slice(-4);

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      {/* The orb */}
      <VoiceOrb size={220} />

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stateLabel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <p className="text-base font-medium text-white/90 tracking-wide">
            {stateLabel}
          </p>
          {agentTimedOut && (
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive max-w-md">
              Aria connected to voice, but the assistant worker did not join.
              You can still run a command below while the LiveKit agent config is checked.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {agentTimedOut && (
        <form onSubmit={sendFallbackCommand} className="w-full max-w-md flex gap-2">
          <input
            value={fallbackCommand}
            onChange={(event) => setFallbackCommand(event.target.value)}
            placeholder="Try: draw a doubly linked list"
            className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/45 outline-none focus:border-primary/60"
          />
          <button
            type="submit"
            disabled={!fallbackCommand.trim()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            aria-label="Send fallback command"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Mic controls */}
      <div className="flex justify-center [&_button]:!bg-white/10 [&_button]:!backdrop-blur-md [&_button]:!border-white/20 [&_button]:!text-white">
        <VoiceAssistantControlBar controls={{ leave: false }} />
      </div>

      <RoomAudioRenderer />

      {/* Recent exchanges + text input — only when connected */}
      {isConnected && (
        <div className="w-full max-w-md flex flex-col gap-3">
          {timeline.length > 0 && (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto px-1">
              <AnimatePresence initial={false}>
                {timeline.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm backdrop-blur-md border ${
                        m.role === "user"
                          ? "rounded-br-md text-white border-white/20"
                          : "rounded-bl-md text-white/90 border-white/10"
                      }`}
                      style={
                        m.role === "user"
                          ? { background: "linear-gradient(135deg, hsl(265 90% 55% / 0.55), hsl(220 90% 50% / 0.55))" }
                          : { background: "hsl(0 0% 100% / 0.06)" }
                      }
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <form onSubmit={sendTextToAria} className="flex gap-2">
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 rounded-xl border border-white/15 bg-white/10 backdrop-blur-md px-4 py-2.5 text-sm text-white placeholder:text-white/45 outline-none focus:border-primary/60 transition"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || sending}
              aria-label="Send message to Aria"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white disabled:opacity-50 transition"
              style={{
                background:
                  "linear-gradient(135deg, hsl(265 90% 60%), hsl(220 90% 55%))",
              }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <DisconnectButton onClick={onEnd}>
        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-all">
          <X className="h-4 w-4" /> End Session
        </span>
      </DisconnectButton>
    </div>
  );
}

interface VoiceAgentProps {
  onClose?: () => void;
}

export function VoiceAgent({ onClose }: VoiceAgentProps) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Please log in first");

      // If we're on the whiteboard, attach the most recently updated board id
      // so Aria can write directly to it instead of creating a new row.
      let whiteboardId: string | null = null;
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/whiteboard")) {
        const { data: wb } = await supabase
          .from("whiteboards")
          .select("id")
          .eq("user_id", session.user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        whiteboardId = wb?.id ?? null;
        console.log("[VoiceAgent] Attaching whiteboardId for Aria:", whiteboardId);
      }

      const { data, error: invokeError } =
        await supabase.functions.invoke<TokenData>("livekit-token", {
          method: "POST",
          body: { whiteboardId },
        });

      if (invokeError) throw invokeError;
      if (!data?.token) throw new Error("No token returned");

      setTokenData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endSession = useCallback(() => {
    setTokenData(null);
    setError(null);
    onClose?.();
  }, [onClose]);

  if (!tokenData) {
    return (
      <div className="flex flex-col items-center gap-6 py-6">
        {/* Idle orb preview */}
        <VoiceOrb size={180} state="idle" />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex items-start gap-2 p-3 rounded-xl bg-destructive/10 backdrop-blur-md border border-destructive/30 text-destructive text-sm"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={startSession}
          disabled={isLoading}
          className="relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-white overflow-hidden disabled:opacity-60 group"
          style={{
            background:
              "linear-gradient(135deg, hsl(265 90% 65%), hsl(220 90% 60%))",
            boxShadow: "0 10px 40px hsl(265 90% 65% / 0.5)",
          }}
        >
          <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Connecting…
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" /> Talk to Aria
            </>
          )}
        </motion.button>

        <p className="text-xs text-white/60 text-center max-w-sm">
          Aria knows your XP, streak, weak topics & exams — and can quiz you
          live.
        </p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={tokenData.token}
      serverUrl={tokenData.livekitUrl}
      connect
      audio
      video={false}
      onDisconnected={endSession}
      data-lk-theme="default"
    >
      <div>
        <AgentInterface onEnd={endSession} />
        <WhiteboardDataBridge />
      </div>
    </LiveKitRoom>
  );
}
