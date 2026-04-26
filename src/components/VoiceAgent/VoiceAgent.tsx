import { useState, useCallback } from "react";
import {
  LiveKitRoom,
  useVoiceAssistant,
  useConnectionState,
  BarVisualizer,
  VoiceAssistantControlBar,
  RoomAudioRenderer,
  DisconnectButton,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import "@livekit/components-styles";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Loader2, X, AlertCircle } from "lucide-react";

interface TokenData {
  token: string;
  roomName: string;
  livekitUrl: string;
  userId: string;
}

// Inner component — only rendered inside LiveKitRoom context
function AgentInterface({ onEnd }: { onEnd: () => void }) {
  const { state, audioTrack, agent } = useVoiceAssistant();
  const connectionState = useConnectionState();

  const stateLabel =
    !agent && connectionState === ConnectionState.Connected
      ? "Waiting for Aria to join..."
      : {
      connecting: "Joining room...",
      initializing: "Waking Aria up...",
      idle: "Aria is ready",
      listening: "Aria is listening...",
      thinking: "Aria is thinking...",
      speaking: "Aria is speaking...",
      disconnected: "Disconnected",
    }[state] ?? "Connected";

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Visualizer */}
      <div className="w-full h-32 rounded-xl bg-secondary/50 border border-border/50 flex items-center justify-center px-6">
        <BarVisualizer
          state={state}
          barCount={7}
          trackRef={audioTrack}
          className="w-full h-full"
          options={{ minHeight: 12 }}
        />
      </div>

      {/* Status */}
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{stateLabel}</p>
      </div>

      {/* Mic controls (mute/unmute) */}
      <div className="flex justify-center">
        <VoiceAssistantControlBar controls={{ leave: false }} />
      </div>

      {/* Audio renderer — required for agent audio to play */}
      <RoomAudioRenderer />

      {/* End session */}
      <DisconnectButton onClick={onEnd}>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please log in first");

      const { data, error: invokeError } = await supabase.functions.invoke<TokenData>(
        "livekit-token",
        { method: "POST" },
      );

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

  // Not connected yet — show start button
  if (!tokenData) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        {error && (
          <div className="w-full flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={startSession}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Connecting...
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" /> Talk to Aria
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center max-w-sm">
          Aria will greet you by name, check your upcoming exams, and teach at
          your level using your progress data.
        </p>
      </div>
    );
  }

  // Connected — render LiveKit room
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
