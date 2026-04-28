import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ImmersiveBackgroundProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared immersive dark background used across AI Assistant modes
 * (Voice Mode, Chat Mode, Voice Input) to create a consistent vibe.
 */
export function ImmersiveBackground({ children, className = "" }: ImmersiveBackgroundProps) {
  return (
    <div className={`relative overflow-hidden rounded-b-lg ${className}`}>
      {/* Dark radial base */}
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
          background: "radial-gradient(circle, hsl(265 90% 65%), transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-72 h-72 rounded-full opacity-40 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(220 90% 60%), transparent 70%)",
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

      <div className="relative z-10">{children}</div>
    </div>
  );
}
