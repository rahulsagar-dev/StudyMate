import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Trash2, Bot, User, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { streamChat, type ChatMessage } from "@/lib/streamChat";
import { detectActions, stripActionTags } from "@/lib/aiActions";
import { ActionButtons } from "@/components/ai-tutor/ActionButtons";
import { useUserContext, buildContextPrompt } from "@/hooks/useUserContext";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ImmersiveBackground } from "@/components/ai-tutor/ImmersiveBackground";
import { toast } from "@/hooks/use-toast";

export function ChatMode() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userCtx = useUserContext();

  // Speech-to-text (in-line dictation into the textarea)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef("");

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSpeechSupported(false); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      const prefix = baseInputRef.current ? baseInputRef.current.replace(/\s+$/, "") + " " : "";
      setInput(prefix + text);
    };
    recognition.onerror = (e: any) => {
      if (e.error === "not-allowed") {
        toast({ title: "Microphone access denied", description: "Please allow microphone permission.", variant: "destructive" });
      }
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch {} };
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      baseInputRef.current = input;
      try { recognitionRef.current.start(); setIsListening(true); }
      catch { /* already started */ }
    }
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    let assistantContent = "";
    const controller = new AbortController();
    abortRef.current = controller;

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
        userContext: buildContextPrompt(userCtx),
        onDelta: upsert,
        onDone: () => setIsStreaming(false),
        onError: (err) => {
          upsert(`\n\n⚠️ ${err}`);
          setIsStreaming(false);
        },
        signal: controller.signal,
      });
    } catch {
      if (!controller.signal.aborted) {
        upsert("\n\n⚠️ Something went wrong. Please try again.");
      }
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <ImmersiveBackground>
      <div className="flex flex-col h-[calc(100vh-220px)] max-h-[700px]">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef as any}>
          <div className="space-y-4 p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-60 text-white/60 gap-3">
                <Bot className="h-12 w-12 text-white/30" />
                <p className="text-lg font-medium text-white/80">Ask me anything!</p>
                <p className="text-sm">I can help you study, create flashcards, add tasks, and more.</p>
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const actions = msg.role === "assistant" && !isStreaming ? detectActions(msg.content) : [];
                const displayContent = msg.role === "assistant" ? stripActionTags(msg.content) : msg.content;

                return (
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
                    <div className="max-w-[75%]">
                      <div className={cn(
                        "rounded-2xl px-4 py-3 text-sm backdrop-blur-md border",
                        msg.role === "user"
                          ? "rounded-br-md text-white border-white/10"
                          : "rounded-bl-md text-white/90 border-white/10"
                      )}
                      style={
                        msg.role === "user"
                          ? { background: "linear-gradient(135deg, hsl(265 90% 55% / 0.55), hsl(220 90% 50% / 0.55))" }
                          : { background: "hsl(0 0% 100% / 0.06)" }
                      }>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown>{displayContent}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{displayContent}</p>
                        )}
                      </div>
                      {actions.length > 0 && <ActionButtons actions={actions} />}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 border border-white/20"
                        style={{ background: "linear-gradient(135deg, hsl(265 90% 65%), hsl(220 90% 60%))" }}>
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
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

        <div className="border-t border-white/10 p-4 space-y-2 backdrop-blur-md" style={{ background: "hsl(0 0% 0% / 0.2)" }}>
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything... Try: 'Create flashcards for Biology'"
              disabled={isStreaming}
              className="min-h-[44px] max-h-[120px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
              rows={1}
            />
            {speechSupported && (
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMic}
                disabled={isStreaming}
                title={isListening ? "Stop dictation" : "Speak your message"}
                className={cn(
                  "border border-white/10 text-white hover:bg-white/10",
                  isListening && "animate-pulse"
                )}
                style={isListening ? { background: "linear-gradient(135deg, hsl(0 80% 55%), hsl(15 90% 55%))" } : undefined}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="text-white border-0"
              style={{ background: "linear-gradient(135deg, hsl(265 90% 60%), hsl(220 90% 55%))" }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMessages([]); abortRef.current?.abort(); setIsStreaming(false); }}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <Trash2 className="h-3 w-3 mr-1" /> Clear chat
            </Button>
          )}
        </div>
      </div>
    </ImmersiveBackground>
  );
}
