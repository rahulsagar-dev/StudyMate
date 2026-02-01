import { useState } from "react";
import { Bot, Send, Mic, Sparkles, BookOpen, Brain, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const suggestions = [
  { icon: BookOpen, text: "Create flashcards for photosynthesis", color: "primary" },
  { icon: Brain, text: "Quiz me on World War II", color: "level" },
  { icon: FileText, text: "Summarize my biology notes", color: "xp" },
  { icon: Calendar, text: "Plan my study schedule for exams", color: "achievement" },
];

const messages = [
  {
    role: "assistant",
    content: "Hello! I'm your AI study assistant. I can help you create flashcards, generate quizzes, summarize notes, and plan your study schedule. What would you like to work on today?",
  },
];

export default function AIAssistant() {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState(messages);

  const handleSend = () => {
    if (!input.trim()) return;
    setChatMessages([...chatMessages, { role: "user", content: input }]);
    setInput("");
    // Simulate AI response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I understand you want help with that! Let me analyze your request and provide you with the best assistance. This feature is currently in demo mode.",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">AI Assistant</h1>
            <p className="text-muted-foreground">Your personal study companion</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Main Chat */}
        <div className="flex-1 bg-card rounded-2xl border border-border/50 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === "assistant"
                      ? "bg-primary/20"
                      : "bg-secondary"
                  )}
                >
                  {message.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-xs font-semibold text-foreground">JD</span>
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[70%] p-4 rounded-2xl",
                    message.role === "assistant"
                      ? "bg-secondary rounded-tl-none"
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center gap-3 bg-secondary rounded-xl p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything about your studies..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <Mic className="h-5 w-5" />
              </button>
              <button
                onClick={handleSend}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Suggestions */}
        <div className="w-80 space-y-4">
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion.text)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      suggestion.color === "primary" && "bg-primary/10",
                      suggestion.color === "level" && "bg-level/10",
                      suggestion.color === "xp" && "bg-xp/10",
                      suggestion.color === "achievement" && "bg-achievement/10"
                    )}
                  >
                    <suggestion.icon
                      className={cn(
                        "h-4 w-4",
                        suggestion.color === "primary" && "text-primary",
                        suggestion.color === "level" && "text-level",
                        suggestion.color === "xp" && "text-xp",
                        suggestion.color === "achievement" && "text-achievement"
                      )}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {suggestion.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-4">AI Usage Today</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Queries</span>
                <span className="text-sm font-medium text-foreground">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Flashcards Generated</span>
                <span className="text-sm font-medium text-xp">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quizzes Created</span>
                <span className="text-sm font-medium text-level">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
