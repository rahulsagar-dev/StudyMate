import { Mic, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

export function VoiceMode() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-8">
      {/* Animated mic */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <Mic className="h-12 w-12 text-primary/60" />
          </motion.div>
        </motion.div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Voice Tutor</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Real-time conversation with AI tutor using voice
        </p>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
          Coming Soon
        </span>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-destructive/60" />
        Not connected
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button disabled size="lg" className="gap-2">
              <Radio className="h-4 w-4" /> Start Voice Session
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Voice mode will be available in next phase</TooltipContent>
      </Tooltip>

      {/* Info box */}
      <Card className="max-w-md">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p>
            This feature will enable real-time voice interaction with an AI tutor using
            a low-latency voice system powered by LiveKit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
