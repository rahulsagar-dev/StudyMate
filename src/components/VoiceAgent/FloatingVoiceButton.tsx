import { useState } from "react";
import { Mic, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceAgent } from "./VoiceAgent";

/**
 * Premium floating voice button — glassmorphism, breathing glow,
 * smooth morph into a full immersive voice mode overlay.
 */
export function FloatingVoiceButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button — bottom-right, next to the chat bot */}
      <AnimatePresence>
        {!open && (
          <motion.button
            layoutId="voice-orb"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setOpen(true)}
            title="Talk to Aria"
            className="fixed bottom-7 right-24 z-40 w-12 h-12 rounded-full flex items-center justify-center group"
            style={{
              background:
                "linear-gradient(135deg, hsl(265 90% 65% / 0.9), hsl(220 90% 60% / 0.9))",
              backdropFilter: "blur(12px)",
              border: "1px solid hsl(0 0% 100% / 0.2)",
              boxShadow:
                "0 8px 32px hsl(265 90% 65% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.3)",
            }}
          >
            {/* Breathing halo */}
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(265 90% 65% / 0.6), transparent 70%)",
                filter: "blur(12px)",
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 0.2, 0.6],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Rotating gradient ring */}
            <motion.span
              className="absolute -inset-0.5 rounded-full opacity-70"
              style={{
                background:
                  "conic-gradient(from 0deg, hsl(265 90% 65%), hsl(220 90% 60%), hsl(280 90% 70%), hsl(265 90% 65%))",
                filter: "blur(4px)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            <Mic className="relative h-5 w-5 text-white drop-shadow-md" />

            {/* Live indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-background animate-pulse z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Immersive voice mode overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            {/* Animated backdrop */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, hsl(265 50% 15%) 0%, hsl(240 60% 8%) 50%, hsl(0 0% 0%) 100%)",
              }}
            />

            {/* Animated mesh blobs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, hsl(265 90% 65%), transparent 70%)",
                filter: "blur(60px)",
              }}
              animate={{
                x: [0, 100, -50, 0],
                y: [0, -80, 60, 0],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, hsl(220 90% 60%), transparent 70%)",
                filter: "blur(60px)",
              }}
              animate={{
                x: [0, -100, 50, 0],
                y: [0, 80, -60, 0],
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Close button */}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </motion.button>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 text-center"
            >
              <h2 className="text-2xl font-display font-bold text-white tracking-wide">
                Aria
              </h2>
              <p className="text-xs text-white/60 mt-1">AI Voice Tutor</p>
            </motion.div>

            {/* Morphing content */}
            <motion.div
              layoutId="voice-orb"
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 25,
              }}
              className="relative z-10 w-full max-w-lg"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="rounded-3xl p-8"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(0 0% 100% / 0.05), hsl(0 0% 100% / 0.02))",
                  backdropFilter: "blur(20px)",
                  border: "1px solid hsl(0 0% 100% / 0.1)",
                  boxShadow: "0 20px 60px hsl(0 0% 0% / 0.5)",
                }}
              >
                <VoiceAgent onClose={() => setOpen(false)} />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
