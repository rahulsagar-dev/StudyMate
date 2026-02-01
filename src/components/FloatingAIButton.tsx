import { useState } from "react";
import { Bot, X, Send, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

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
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-80 p-4 overflow-y-auto space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-tl-none p-3 max-w-[80%]">
              <p className="text-sm text-foreground">
                Hey! 👋 I'm your AI study assistant. I can help you with:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Generate flashcards</li>
                <li>• Create practice quizzes</li>
                <li>• Summarize your notes</li>
                <li>• Plan your study schedule</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-tl-none p-3 max-w-[80%]">
              <p className="text-sm text-foreground">
                Try saying: "Create flashcards for photosynthesis" or "Quiz me on World War II"
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none px-2"
            />
            <button className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <Mic className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {["Show flashcards", "Generate quiz", "Study planner"].map((suggestion) => (
              <button
                key={suggestion}
                className="px-3 py-1.5 text-xs bg-secondary hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "floating-button",
          isOpen && "rotate-0"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-primary-foreground" />
        ) : (
          <Bot className="h-6 w-6 text-primary-foreground" />
        )}
      </button>
    </>
  );
}
