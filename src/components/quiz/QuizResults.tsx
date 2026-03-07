import { Trophy, Target, Clock, Zap, RotateCcw, BookOpen, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Quiz, QuizAnswer } from "@/types/quiz";

interface QuizResultsProps {
  quiz: Quiz;
  answers: Record<string, QuizAnswer>;
  timeTaken: number;
  xpEarned: number;
  onReviewMistakes: () => void;
  onRetry: () => void;
  onNewQuiz: () => void;
}

export default function QuizResults({
  quiz, answers, timeTaken, xpEarned, onReviewMistakes, onRetry, onNewQuiz,
}: QuizResultsProps) {
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;

  quiz.questions.forEach((q) => {
    const a = answers[q.id];
    if (!a || a.selected === null || a.selected === undefined) {
      skipped++;
    } else if (
      (typeof a.selected === "number" && a.selected === q.correctAnswer) ||
      (typeof a.selected === "string" && a.selected.toLowerCase().trim() === q.options[q.correctAnswer]?.toLowerCase().trim())
    ) {
      correct++;
    } else {
      incorrect++;
    }
  });

  const percentage = Math.round((correct / quiz.questions.length) * 100);
  const isPerfect = correct === quiz.questions.length;
  const isGood = percentage >= 70;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Score Hero */}
      <Card className={`glass-card overflow-hidden relative ${isPerfect ? "border-xp/40" : isGood ? "border-primary/30" : "border-border/30"}`}>
        <div className={`absolute inset-0 ${isPerfect ? "bg-gradient-to-br from-xp/5 to-transparent" : "bg-gradient-to-br from-primary/5 to-transparent"}`} />
        <CardContent className="p-8 text-center relative">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
            isPerfect ? "bg-xp/15 ring-2 ring-xp/30" : isGood ? "bg-primary/15 ring-2 ring-primary/30" : "bg-secondary ring-2 ring-border/30"
          }`}>
            <span className="text-3xl font-bold text-foreground">{percentage}%</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {isPerfect ? "Perfect Score! 🎉" : isGood ? "Great Job! 💪" : "Keep Practicing! 📚"}
          </h2>
          <p className="text-muted-foreground text-sm">
            You scored {correct} out of {quiz.questions.length} on {quiz.topic}
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 text-xp mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{correct}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Correct</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 text-destructive mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{incorrect}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Wrong</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{formatTime(timeTaken)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Time</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Zap className="h-5 w-5 text-achievement mx-auto mb-1" />
            <p className="text-xl font-bold text-xp">+{xpEarned}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">XP Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* XP Breakdown */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-medium text-foreground mb-3">XP Breakdown</h3>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Correct Answers ({correct} × 5 XP)</span>
            <span className="text-xp">+{correct * 5}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Quiz Completion</span>
            <span className="text-xp">+20</span>
          </div>
          {isPerfect && (
            <div className="flex justify-between text-xs text-achievement font-medium">
              <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> Perfect Score Bonus</span>
              <span>+50</span>
            </div>
          )}
          <div className="border-t border-border/30 pt-2 mt-2 flex justify-between text-sm font-semibold">
            <span className="text-foreground">Total</span>
            <span className="text-xp">+{xpEarned} XP</span>
          </div>
        </CardContent>
      </Card>

      {/* Score Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Accuracy</span>
          <span>{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-3" />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {incorrect > 0 && (
          <Button onClick={onReviewMistakes} variant="outline" className="flex-1 gap-2">
            <BookOpen className="h-4 w-4" />
            Review Mistakes ({incorrect})
          </Button>
        )}
        <Button onClick={onRetry} variant="outline" className="flex-1 gap-2">
          <RotateCcw className="h-4 w-4" />
          Retry Quiz
        </Button>
        <Button onClick={onNewQuiz} className="flex-1 gap-2">
          New Quiz <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
