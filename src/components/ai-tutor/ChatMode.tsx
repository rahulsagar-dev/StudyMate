import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Trash2, Bot, User } from "lucide-react";
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

export function ChatMode() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userCtx = useUserContext();

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
    <div className="flex flex-col h-[calc(100vh-220px)] max-h-[700px]">
      <ScrollArea className="flex-1 pr-4" ref={scrollRef as any}>
        <div className="space-y-4 p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-3">
              <Bot className="h-12 w-12 text-primary/40" />
              <p className="text-lg font-medium">Ask me anything!</p>
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
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="max-w-[75%]">
                    <div className={cn(
                      "rounded-2xl px-4 py-3 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    )}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{displayContent}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{displayContent}</p>
                      )}
                    </div>
                    {actions.length > 0 && <ActionButtons actions={actions} />}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              );
            })}
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

      <div className="border-t border-border p-4 space-y-2">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... Try: 'Create flashcards for Biology'"
            disabled={isStreaming}
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setMessages([]); abortRef.current?.abort(); setIsStreaming(false); }}
            className="text-muted-foreground"
          >
            <Trash2 className="h-3 w-3 mr-1" /> Clear chat
          </Button>
        )}
      </div>
    </div>
  );
}
