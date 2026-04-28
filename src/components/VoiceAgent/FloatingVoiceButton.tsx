import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Mic, X, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceAgent } from "./VoiceAgent";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/whiteboard": "Whiteboard",
  "/flashcards": "Flashcards",
  "/quizzes": "Quizzes",
  "/summarizer": "Summarizer",
  "/study-planner": "Study Planner",
  "/calendar": "Calendar",
  "/focus-mode": "Focus Mode",
  "/ai-assistant": "AI Assistant",
  "/streaks": "Streaks",
  "/achievements": "Achievements",
  "/analytics": "Analytics",
  "/profile": "Profile",
  "/settings": "Settings",
  "/store": "Store",
};

function usePageLabel() {
  const { pathname } = useLocation();
  return (
    ROUTE_LABELS[pathname] ??
    pathname
      .split("/")
      .filter(Boolean)[0]
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ??
    "StudyMate"
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

/**
 * Floating Aria voice button — opens as a docked side panel so the
 * underlying page (e.g. Whiteboard) stays interactive and visible
 * while Aria teaches.
 */
export function FloatingVoiceButton() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const pageLabel = usePageLabel();
  const isMobile = useIsMobile();

  const showFab = !open || minimized;

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {showFab && (
          <motion.button
            layoutId="voice-orb"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              setOpen(true);
              setMinimized(false);
            }}
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
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(265 90% 65% / 0.6), transparent 70%)",
                filter: "blur(12px)",
              }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
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
            {minimized && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-background animate-pulse z-10" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Docked panel — no backdrop, page stays interactive */}
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            layoutId="voice-orb"
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className={
              isMobile
                ? "fixed inset-x-2 bottom-2 z-50 max-h-[80vh] rounded-3xl overflow-hidden flex flex-col"
                : "fixed right-4 bottom-24 z-50 w-[380px] max-h-[78vh] rounded-3xl overflow-hidden flex flex-col"
            }
            style={{
              background:
                "linear-gradient(160deg, hsl(265 50% 12% / 0.92), hsl(240 60% 8% / 0.92))",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid hsl(0 0% 100% / 0.12)",
              boxShadow:
                "0 24px 80px hsl(0 0% 0% / 0.55), inset 0 1px 0 hsl(0 0% 100% / 0.08)",
            }}
          >
            {/* Subtle ambient blobs inside the panel */}
            <motion.div
              className="absolute -top-16 -left-16 w-56 h-56 rounded-full opacity-30 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, hsl(265 90% 65%), transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full opacity-30 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, hsl(220 90% 60%), transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Header */}
            <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10 z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(265 90% 65%), hsl(220 90% 60%))",
                    boxShadow: "0 4px 16px hsl(265 90% 65% / 0.5)",
                  }}
                >
                  <Mic className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white leading-tight truncate">
                    Aria
                  </h3>
                  <p className="text-[11px] text-white/60 leading-tight truncate">
                    Teaching on · {pageLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setMinimized(true)}
                  title="Minimize"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setMinimized(false);
                  }}
                  title="Close"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body — scrollable, contains VoiceAgent */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
              <VoiceAgent
                onClose={() => {
                  setOpen(false);
                  setMinimized(false);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
