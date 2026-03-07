import { useState } from "react";
import { Brain, Zap, Clock, Target, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { QuizMode, Difficulty } from "@/types/quiz";

interface QuizSetupProps {
  onStart: (content: string, mode: QuizMode, difficulty: Difficulty, questionCount: number) => void;
  loading: boolean;
}

const MODES: { id: QuizMode; label: string; description: string; icon: React.ElementType }[] = [
  { id: "practice", label: "Practice", description: "Instant feedback after each answer", icon: BookOpen },
  { id: "test", label: "Test", description: "Results shown at the end", icon: Target },
  { id: "timed", label: "Timed", description: "Race against the clock", icon: Clock },
];

const DIFFICULTIES: { id: Difficulty; label: string; color: string }[] = [
  { id: "easy", label: "Easy", color: "text-xp" },
  { id: "medium", label: "Medium", color: "text-achievement" },
  { id: "hard", label: "Hard", color: "text-destructive" },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

export default function QuizSetup({ onStart, loading }: QuizSetupProps) {
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<QuizMode>("practice");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionCount, setQuestionCount] = useState(10);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Topic Input */}
      <Card className="glass-card">
        <CardContent className="p-6 space-y-3">
          <label className="text-sm font-medium text-foreground">Topic or Notes</label>
          <Textarea
            placeholder="Enter a topic, paste your notes, or describe what you want to be quizzed on..."
            className="min-h-[120px] bg-secondary/50 border-border/50 resize-none text-foreground placeholder:text-muted-foreground"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Quiz Mode */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Quiz Mode</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <Card
                key={m.id}
                className={`cursor-pointer transition-all duration-200 ${
                  active
                    ? "border-primary/60 bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                    : "glass-card hover:border-primary/30"
                }`}
                onClick={() => setMode(m.id)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${active ? "bg-primary/20" : "bg-secondary/60"}`}>
                    <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Difficulty & Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Difficulty</h3>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <Button
                key={d.id}
                variant={difficulty === d.id ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficulty(d.id)}
                className={difficulty === d.id ? "" : `${d.color}`}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Questions</h3>
          <div className="flex gap-2">
            {QUESTION_COUNTS.map((c) => (
              <Button
                key={c}
                variant={questionCount === c ? "default" : "outline"}
                size="sm"
                onClick={() => setQuestionCount(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Start Button */}
      <Button
        onClick={() => onStart(content, mode, difficulty, questionCount)}
        disabled={!content.trim() || loading}
        size="lg"
        className="w-full gap-2 text-base"
      >
        {loading ? (
          <>
            <Zap className="h-5 w-5 animate-spin" />
            Generating Quiz...
          </>
        ) : (
          <>
            <Brain className="h-5 w-5" />
            Start Quiz
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
