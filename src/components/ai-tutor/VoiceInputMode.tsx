import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Send, Bot, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { streamChat, type ChatMessage } from "@/lib/streamChat";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { ImmersiveBackground } from "@/components/ai-tutor/ImmersiveBackground";

export function VoiceInputMode() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (e: any) => {
      if (e.error === "not-allowed") {
        toast({ title: "Microphone access denied", description: "Please allow microphone permission.", variant: "destructive" });
      }
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendTranscript = async () => {
    const text = transcript.trim();
    if (!text || isStreaming) return;

    recognitionRef.current?.stop();
    setIsListening(false);

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setTranscript("");
    setIsStreaming(true);

    let assistantContent = "";
    const upsert = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setIsStreaming(false),
        onError: (err) => { upsert(`\n\n⚠️ ${err}`); setIsStreaming(false); },
      });
    } catch {
      upsert("\n\n⚠️ Something went wrong.");
      setIsStreaming(false);
    }
  };

  if (!supported) {
    return (
      <ImmersiveBackground>
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-white/60">
          <MicOff className="h-12 w-12" />
          <p className="font-medium text-white/80">Speech recognition not supported</p>
          <p className="text-sm">Try using Chrome or Edge for this feature.</p>
        </div>
      </ImmersiveBackground>
    );
  }

  return (
    <ImmersiveBackground>
      <div className="flex flex-col h-[calc(100vh-220px)] max-h-[700px]">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef as any}>
          <div className="space-y-4 p-4">
            {messages.length === 0 && !transcript && (
              <div className="flex flex-col items-center justify-center h-40 text-white/60 gap-3">
                <Mic className="h-10 w-10 text-white/30" />
                <p className="text-sm">Click the mic button and start speaking</p>
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center shrink-0 mt-1 border border-white/10">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 text-sm backdrop-blur-md border border-white/10",
                    msg.role === "user" ? "rounded-br-md text-white" : "rounded-bl-md text-white/90"
                  )}
                  style={
                    msg.role === "user"
                      ? { background: "linear-gradient(135deg, hsl(265 90% 55% / 0.55), hsl(220 90% 50% / 0.55))" }
                      : { background: "hsl(0 0% 100% / 0.06)" }
                  }>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 border border-white/20"
                      style={{ background: "linear-gradient(135deg, hsl(265 90% 65%), hsl(220 90% 60%))" }}>
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center shrink-0 border border-white/10">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl rounded-bl-md px-4 py-3 backdrop-blur-md border border-white/10" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Voice input area */}
        <div className="border-t border-white/10 p-4 space-y-3 backdrop-blur-md" style={{ background: "hsl(0 0% 0% / 0.2)" }}>
          {/* Live transcript */}
          {(isListening || transcript) && (
            <div className="rounded-xl p-3 text-sm text-white/90 min-h-[40px] backdrop-blur-md border border-white/10"
              style={{ background: "hsl(0 0% 100% / 0.06)" }}>
              {transcript || <span className="text-white/50 italic">Listening...</span>}
            </div>
          )}

          <div className="flex items-center gap-3 justify-center">
            <Button
              size="lg"
              onClick={toggleListening}
              disabled={isStreaming}
              className="gap-2 rounded-full text-white border-0"
              style={{
                background: isListening
                  ? "linear-gradient(135deg, hsl(0 80% 55%), hsl(15 90% 55%))"
                  : "linear-gradient(135deg, hsl(265 90% 60%), hsl(220 90% 55%))",
              }}
            >
              {isListening ? (
                <>
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                    <Mic className="h-5 w-5" />
                  </motion.div>
                  Stop Listening
                </>
              ) : (
                <><Mic className="h-5 w-5" /> Start Listening</>
              )}
            </Button>

            {transcript && (
              <Button
                size="icon"
                onClick={sendTranscript}
                disabled={isStreaming}
                className="text-white border-0"
                style={{ background: "linear-gradient(135deg, hsl(265 90% 60%), hsl(220 90% 55%))" }}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}

            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setMessages([])} className="text-white/70 hover:text-white hover:bg-white/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </ImmersiveBackground>
  );
}
