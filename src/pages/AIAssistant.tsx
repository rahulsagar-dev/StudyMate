import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Mic, MessageSquare, Type, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatMessages } from "@/components/ai/ChatMessages";
import { ChatInput } from "@/components/ai/ChatInput";
import { useAIChat, type ChatMessage } from "@/hooks/useAIChat";
import { cn } from "@/lib/utils";

type Mode = ChatMessage["mode"];

const MODES: { value: Mode; label: string; icon: typeof Mic; description: string }[] = [
  { value: "speech-speech", label: "Speech ↔ Speech", icon: Mic, description: "Talk with your AI tutor" },
  { value: "speech-text", label: "Speech → Text", icon: MessageSquare, description: "Speak, get written answers" },
  { value: "text-text", label: "Text → Text", icon: Type, description: "Traditional AI chat" },
];

export default function AIAssistant() {
  const [mode, setMode] = useState<Mode>("speech-speech");
  const {
    messages,
    isLoading,
    isRecording,
    isSpeaking,
    sendMessage,
    startRecording,
    stopRecording,
    stopSpeaking,
    clearMessages,
    messageCount,
    messageLimit,
  } = useAIChat();

  const handleSend = (content: string) => sendMessage(content, mode);
  const handleStopRecording = () => stopRecording(mode);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                AI Study Assistant
                <Badge variant="secondary" className="text-[10px] font-normal gap-1">
                  <Sparkles className="h-3 w-3" /> AI Tutor
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">Your personal study companion</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={clearMessages}>
              <Trash2 className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>

        {/* Mode selector */}
        <div className="flex gap-1.5 bg-muted p-1 rounded-xl">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                mode === m.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <m.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        isSpeaking={isSpeaking}
        onSpeak={mode !== "text-text" ? (text) => {
          const { speakText } = useAIChatActions();
          speakText(text);
        } : undefined}
      />

      {/* Input */}
      <ChatInput
        mode={mode}
        isLoading={isLoading}
        isRecording={isRecording}
        isSpeaking={isSpeaking}
        messageCount={messageCount}
        messageLimit={messageLimit}
        onSend={handleSend}
        onStartRecording={startRecording}
        onStopRecording={handleStopRecording}
        onStopSpeaking={stopSpeaking}
      />
    </div>
  );
}
