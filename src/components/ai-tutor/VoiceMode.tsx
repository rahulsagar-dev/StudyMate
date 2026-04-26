import { motion } from "framer-motion";
import { VoiceAgent } from "@/components/VoiceAgent/VoiceAgent";

export function VoiceMode() {
  return (
    <div className="relative overflow-hidden rounded-b-lg">
      {/* Immersive dark background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(265 50% 15%) 0%, hsl(240 60% 8%) 60%, hsl(0 0% 4%) 100%)",
        }}
      />

      {/* Animated mesh blobs */}
      <motion.div
        className="absolute top-10 left-10 w-72 h-72 rounded-full opacity-40 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(265 90% 65%), transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-72 h-72 rounded-full opacity-40 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(220 90% 60%), transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, -80, 40, 0], y: [0, 60, -40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center py-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-display font-bold text-white tracking-wide">
            Talk to Aria
          </h2>
          <p className="text-sm text-white/60 mt-2 max-w-md">
            Real-time voice tutor — knows your XP, streak, weak topics & exams.
            Interrupt anytime, just start talking.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-lg rounded-3xl p-8"
          style={{
            background:
              "linear-gradient(135deg, hsl(0 0% 100% / 0.05), hsl(0 0% 100% / 0.02))",
            backdropFilter: "blur(20px)",
            border: "1px solid hsl(0 0% 100% / 0.1)",
            boxShadow: "0 20px 60px hsl(0 0% 0% / 0.4)",
          }}
        >
          <VoiceAgent />
        </motion.div>
      </div>
    </div>
  );
}
