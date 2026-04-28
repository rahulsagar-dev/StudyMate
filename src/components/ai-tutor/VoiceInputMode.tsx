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
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
        <MicOff className="h-12 w-12" />
        <p className="font-medium">Speech recognition not supported</p>
        <p className="text-sm">Try using Chrome or Edge for this feature.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] max-h-[700px]">
      <ScrollArea className="flex-1 pr-4" ref={scrollRef as any}>
        <div className="space-y-4 p-4">
          {messages.length === 0 && !transcript && (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-3">
              <Mic className="h-10 w-10 text-primary/40" />
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
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                )}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Voice input area */}
      <div className="border-t border-border p-4 space-y-3">
        {/* Live transcript */}
        {(isListening || transcript) && (
          <div className="bg-secondary/50 rounded-xl p-3 text-sm text-foreground min-h-[40px]">
            {transcript || <span className="text-muted-foreground italic">Listening...</span>}
          </div>
        )}

        <div className="flex items-center gap-3 justify-center">
          <Button
            size="lg"
            variant={isListening ? "destructive" : "default"}
            onClick={toggleListening}
            disabled={isStreaming}
            className="gap-2 rounded-full"
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
            <Button size="icon" onClick={sendTranscript} disabled={isStreaming}>
              <Send className="h-4 w-4" />
            </Button>
          )}

          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={() => setMessages([])}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
