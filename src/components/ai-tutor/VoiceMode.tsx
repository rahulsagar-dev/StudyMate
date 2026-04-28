import { motion } from "framer-motion";
import { VoiceAgent } from "@/components/VoiceAgent/VoiceAgent";
import { ImmersiveBackground } from "@/components/ai-tutor/ImmersiveBackground";

export function VoiceMode() {
  return (
    <ImmersiveBackground>
      <div className="flex flex-col items-center justify-center py-16 px-6">
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
    </ImmersiveBackground>
  );
}
