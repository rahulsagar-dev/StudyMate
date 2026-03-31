import { useState, useRef } from "react";
import { Bot, X, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { streamChat, type ChatMessage } from "@/lib/streamChat";
import ReactMarkdown from "react-markdown";

export function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setMessage("");
    setIsStreaming(true);
    scrollToBottom();

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
      scrollToBottom();
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      <div className={cn(
        "fixed bottom-24 right-6 w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 transition-all duration-300 overflow-hidden",
        isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">StudyMate AI</h3>
              <p className="text-xs text-white/70">Your personal study assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                <Trash2 className="h-4 w-4 text-white" />
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="h-80 p-4 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                <p className="text-sm text-foreground">Hey! 👋 I'm your AI study assistant. Ask me anything!</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-2xl p-3 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-secondary text-foreground rounded-tl-none"
              )}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-tl-none p-3">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={isStreaming}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none px-2"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || isStreaming}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn("floating-button", isOpen && "rotate-0")}
      >
        {isOpen ? <X className="h-6 w-6 text-primary-foreground" /> : <Bot className="h-6 w-6 text-primary-foreground" />}
      </button>
    </>
  );
}
