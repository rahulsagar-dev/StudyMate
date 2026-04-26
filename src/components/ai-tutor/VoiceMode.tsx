import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { VoiceAgent } from "@/components/VoiceAgent/VoiceAgent";

export function VoiceMode() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 gap-6">
      {/* Animated halo */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 w-32 h-32 rounded-full bg-primary/20 blur-2xl"
        />
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30">
          <Sparkles className="h-14 w-14 text-primary-foreground" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Talk to Aria
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Real-time voice tutor. Aria knows your XP, streak, weak topics, and
          upcoming exams — and can quiz you, draw on the whiteboard, and create
          flashcards while you talk.
        </p>
      </div>

      {/* Live agent */}
      <div className="w-full max-w-md">
        <VoiceAgent />
      </div>

      {/* Info */}
      <Card className="max-w-md w-full border-border/50">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-medium text-foreground">Tip:</span> While Aria
            is speaking you can interrupt at any time — just start talking.
          </p>
          <p>
            New flashcards, summaries, quizzes and tasks she creates appear
            automatically on their respective pages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
