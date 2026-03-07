import { useState, useCallback } from "react";
import { Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateQuiz } from "@/services/quizService";
import { useQuizAttempts } from "@/hooks/useQuizAttempts";
import QuizSetup from "@/components/quiz/QuizSetup";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import QuizResults from "@/components/quiz/QuizResults";
import QuizReview from "@/components/quiz/QuizReview";
import type { Quiz, QuizMode, Difficulty, QuizAnswer } from "@/types/quiz";

type Phase = "setup" | "playing" | "results" | "review";

export default function Quizzes() {
  const { toast } = useToast();
  const { saveAttempt, calculateXP } = useQuizAttempts();

  const [phase, setPhase] = useState<Phase>("setup");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [mode, setMode] = useState<QuizMode>("practice");
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [timeTaken, setTimeTaken] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const handleStart = useCallback(async (content: string, selectedMode: QuizMode, difficulty: Difficulty, count: number) => {
    if (!content.trim()) {
      toast({ title: "Empty input", description: "Enter a topic or paste notes.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await generateQuiz(content, difficulty, count);
      setQuiz(data);
      setMode(selectedMode);
      setAnswers({});
      setBookmarkedIds(new Set());
      setPhase("playing");
    } catch {
      toast({ title: "Error", description: "Failed to generate quiz.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleComplete = useCallback(async (finalAnswers: Record<string, QuizAnswer>, time: number) => {
    if (!quiz) return;
    setAnswers(finalAnswers);
    setTimeTaken(time);

    const correct = quiz.questions.filter((q) => {
      const a = finalAnswers[q.id];
      if (!a || a.selected === null || a.selected === undefined) return false;
      if (typeof a.selected === "number") return a.selected === q.correctAnswer;
      return String(a.selected).toLowerCase().trim() === q.options[q.correctAnswer]?.toLowerCase().trim();
    }).length;

    const xp = calculateXP(correct, quiz.questions.length);
    setXpEarned(xp);

    // Save to DB
    await saveAttempt({ quiz, answers: finalAnswers, mode, timeTaken: time });

    toast({
      title: `+${xp} XP earned! 🎉`,
      description: `You scored ${correct}/${quiz.questions.length}`,
    });

    setPhase("results");
  }, [quiz, mode, saveAttempt, calculateXP, toast]);

  const handleBookmark = useCallback((questionId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const handleRetry = () => {
    setAnswers({});
    setPhase("playing");
  };

  const handleNewQuiz = () => {
    setQuiz(null);
    setAnswers({});
    setPhase("setup");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header - only show on setup */}
      {phase === "setup" && (
        <div className="flex items-center gap-3 animate-fade-in-up">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
            <p className="text-sm text-muted-foreground">Test your knowledge and earn XP</p>
          </div>
        </div>
      )}

      {phase === "setup" && <QuizSetup onStart={handleStart} loading={loading} />}

      {phase === "playing" && quiz && (
        <QuizPlayer
          quiz={quiz}
          mode={mode}
          onComplete={handleComplete}
          onBookmark={handleBookmark}
          bookmarkedIds={bookmarkedIds}
        />
      )}

      {phase === "results" && quiz && (
        <QuizResults
          quiz={quiz}
          answers={answers}
          timeTaken={timeTaken}
          xpEarned={xpEarned}
          onReviewMistakes={() => setPhase("review")}
          onRetry={handleRetry}
          onNewQuiz={handleNewQuiz}
        />
      )}

      {phase === "review" && quiz && (
        <QuizReview
          quiz={quiz}
          answers={answers}
          onBack={() => setPhase("results")}
          mistakesOnly
        />
      )}
    </div>
  );
}
