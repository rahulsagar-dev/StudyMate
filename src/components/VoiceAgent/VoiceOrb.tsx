import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useVoiceAssistant } from "@livekit/components-react";

/**
 * Premium animated voice orb — reactive to AI agent audio levels.
 * Uses Web Audio API to analyze the agent's audio track in real time.
 */
interface VoiceOrbProps {
  size?: number;
  state?: "idle" | "listening" | "thinking" | "speaking" | "connecting";
}

export function VoiceOrb({ size = 240, state: externalState }: VoiceOrbProps) {
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const state = externalState ?? agentState ?? "idle";

  const [intensity, setIntensity] = useState(0);
  const rafRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Hook into the agent's audio track for live amplitude
  useEffect(() => {
    if (!audioTrack?.publication?.track?.mediaStreamTrack) return;

    const stream = new MediaStream([audioTrack.publication.track.mediaStreamTrack]);
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setIntensity(Math.min(1, avg / 128));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctx.close().catch(() => {});
    };
  }, [audioTrack]);

  // Idle breathing fallback
  useEffect(() => {
    if (audioTrack) return;
    let t = 0;
    const id = setInterval(() => {
      t += 0.08;
      setIntensity(0.15 + Math.sin(t) * 0.1);
    }, 60);
    return () => clearInterval(id);
  }, [audioTrack]);

  const isActive = state === "speaking" || state === "listening";
  const scale = 1 + intensity * 0.18;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer particle rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-primary/20"
          style={{ width: size, height: size }}
          animate={{
            scale: [1, 1.3 + i * 0.15, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 0.6,
          }}
        />
      ))}

      {/* Outer glow halo — reactive */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 1.2,
          height: size * 1.2,
          background:
            "radial-gradient(circle, hsl(265 90% 65% / 0.4) 0%, hsl(220 90% 60% / 0.2) 40%, transparent 70%)",
          filter: "blur(30px)",
        }}
        animate={{
          scale: scale * 1.1,
          opacity: 0.6 + intensity * 0.4,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
      />

      {/* Mid gradient ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.95,
          height: size * 0.95,
          background:
            "conic-gradient(from 0deg, hsl(265 90% 65%), hsl(220 90% 60%), hsl(280 90% 70%), hsl(200 90% 60%), hsl(265 90% 65%))",
          filter: "blur(8px)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Core orb — glassmorphism */}
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: size * 0.78,
          height: size * 0.78,
          background:
            "radial-gradient(circle at 30% 30%, hsl(265 100% 80% / 0.9), hsl(220 100% 50% / 0.7) 60%, hsl(240 80% 20%) 100%)",
          boxShadow:
            "inset 0 0 60px hsl(265 100% 80% / 0.4), 0 0 80px hsl(265 90% 65% / 0.5)",
          backdropFilter: "blur(20px)",
        }}
        animate={{
          scale,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        {/* Inner shine */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 25%, hsl(0 0% 100% / 0.5) 0%, transparent 40%)",
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Reactive inner waves */}
        {isActive && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-white/30"
                animate={{
                  scale: [0.6, 1.1, 0.6],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.4,
                }}
              />
            ))}
          </>
        )}

        {/* Particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const r = (size * 0.78) / 2 - 12;
            return (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/70"
                style={{
                  left: "50%",
                  top: "50%",
                  marginLeft: -2,
                  marginTop: -2,
                }}
                animate={{
                  x: Math.cos(angle) * r * (0.6 + intensity * 0.4),
                  y: Math.sin(angle) * r * (0.6 + intensity * 0.4),
                  opacity: [0.3, 0.9, 0.3],
                  scale: [0.5, 1 + intensity, 0.5],
                }}
                transition={{
                  duration: 2 + (i % 3) * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
