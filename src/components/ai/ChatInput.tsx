import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Square, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  mode: "speech-speech" | "speech-text" | "text-text";
  isLoading: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  messageCount: number;
  messageLimit: number;
  onSend: (content: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => Promise<string | null>;
  onStopSpeaking: () => void;
}

export function ChatInput({
  mode,
  isLoading,
  isRecording,
  isSpeaking,
  messageCount,
  messageLimit,
  onSend,
  onStartRecording,
  onStopRecording,
  onStopSpeaking,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isVoiceMode = mode === "speech-speech" || mode === "speech-text";

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      const text = await onStopRecording();
      if (text) onSend(text);
    } else {
      if (isSpeaking) onStopSpeaking();
      onStartRecording();
    }
  };

  const handleELI10 = () => {
    onSend("Explain that last concept like I'm 10 years old.");
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* Status indicators */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-sm text-destructive"
            >
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              Listening... Speak now
            </motion.div>
          )}
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-sm text-primary"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              AI Speaking...
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onStopSpeaking}>
                Stop
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 items-end">
          {/* Voice button for voice modes */}
          {isVoiceMode && (
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              className={cn("shrink-0 h-10 w-10 rounded-xl", isRecording && "animate-pulse")}
              onClick={handleVoiceToggle}
              disabled={isLoading}
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          {/* Text input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isVoiceMode
                  ? "Or type your question here..."
                  : "Ask me anything about your studies..."
              }
              className="min-h-[44px] max-h-[120px] resize-none rounded-xl pr-12 text-sm"
              rows={1}
              disabled={isLoading}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 bottom-1 h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {/* ELI10 button */}
          {messageCount > 0 && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-10 w-10 rounded-xl"
              onClick={handleELI10}
              disabled={isLoading}
              title="Explain Like I'm 10"
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          {messageCount}/{messageLimit} messages · StudyMate AI may make mistakes
        </p>
      </div>
    </div>
  );
}
