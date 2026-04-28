import { useState, useCallback } from "react";
import {
  LiveKitRoom,
  useVoiceAssistant,
  useConnectionState,
  VoiceAssistantControlBar,
  RoomAudioRenderer,
  DisconnectButton,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import "@livekit/components-styles";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Loader2, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceOrb } from "./VoiceOrb";

interface TokenData {
  token: string;
  roomName: string;
  livekitUrl: string;
  userId: string;
}

// Inner component — only rendered inside LiveKitRoom context
function AgentInterface({ onEnd }: { onEnd: () => void }) {
  const { state, agent } = useVoiceAssistant();
  const connectionState = useConnectionState();

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
        </motion.div>
      </AnimatePresence>

      {/* Mic controls */}
      <div className="flex justify-center [&_button]:!bg-white/10 [&_button]:!backdrop-blur-md [&_button]:!border-white/20 [&_button]:!text-white">
        <VoiceAssistantControlBar controls={{ leave: false }} />
      </div>

      <RoomAudioRenderer />

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
      <AgentInterface onEnd={endSession} />
    </LiveKitRoom>
  );
}
