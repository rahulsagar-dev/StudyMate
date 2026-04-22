import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, CheckCircle2, XCircle,
  Clock, Send, Lightbulb, AlertTriangle, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/hooks/useStore";
import { toast } from "sonner";
import type { Quiz, QuizMode, QuizAnswer, Confidence } from "@/types/quiz";

interface QuizPlayerProps {
  quiz: Quiz;
  mode: QuizMode;
  onComplete: (answers: Record<string, QuizAnswer>, timeTaken: number) => void;
  onBookmark: (questionId: string) => void;
  bookmarkedIds: Set<string>;
}

const CONFIDENCE_OPTIONS: { value: Confidence; label: string; emoji: string }[] = [
  { value: "low", label: "Guessing", emoji: "😬" },
  { value: "medium", label: "Somewhat Sure", emoji: "🤔" },
  { value: "high", label: "Confident", emoji: "😎" },
];

export default function QuizPlayer({ quiz, mode, onComplete, onBookmark, bookmarkedIds }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [showConfidence, setShowConfidence] = useState(false);
  const [fillAnswer, setFillAnswer] = useState("");
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeLimit] = useState(mode === "timed" ? quiz.questions.length * 30 : 0); // 30s per question
  const [hintRevealed, setHintRevealed] = useState<Record<string, boolean>>({});
  const startTimeRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());

  const { ownedQty, consume } = useStore();
  const hintTokensLeft = ownedQty("power-hint-token");

  const question = quiz.questions[currentIndex];
  const answer = answers[question.id];
  const isPractice = mode === "practice";
  const hasAnswered = answer?.selected !== null && answer?.selected !== undefined;
  const isCorrect = hasAnswered && (
    typeof answer.selected === 'number'
      ? answer.selected === question.correctAnswer
      : String(answer.selected).toLowerCase().trim() === question.options[question.correctAnswer]?.toLowerCase().trim()
  );

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeElapsed(elapsed);
      if (mode === "timed" && elapsed >= timeLimit) {
        handleSubmit();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLimit, mode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const timeRemaining = mode === "timed" ? Math.max(0, timeLimit - timeElapsed) : timeElapsed;
  const timeColor = mode === "timed" && timeRemaining < 30 ? "text-destructive" : "text-muted-foreground";

  const selectAnswer = useCallback((selected: number | string) => {
    if (hasAnswered && isPractice) return; // already answered in practice
    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { selected, timeSpent, confidence: prev[question.id]?.confidence },
    }));
    if (isPractice) {
      setShowConfidence(true);
    }
  }, [question.id, hasAnswered, isPractice]);

  const setConfidence = (confidence: Confidence) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], selected: prev[question.id]?.selected ?? null, confidence },
    }));
    setShowConfidence(false);
  };

  const navigate = (dir: number) => {
    const next = currentIndex + dir;
    if (next >= 0 && next < quiz.questions.length) {
      setCurrentIndex(next);
      setFillAnswer("");
      setFlashcardRevealed(false);
      setShowConfidence(false);
      questionStartRef.current = Date.now();
    }
  };

  const handleSubmit = () => {
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    onComplete(answers, totalTime);
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.selected !== null && answers[k]?.selected !== undefined).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  const renderQuestion = () => {
    switch (question.type) {
      case "true_false":
        return (
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((opt, oi) => {
              const selected = answer?.selected === oi;
              const showResult = isPractice && hasAnswered;
              let classes = "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 text-center font-medium ";
              if (showResult) {
                if (oi === question.correctAnswer) {
                  classes += "border-xp/60 bg-xp/10 text-xp";
                } else if (selected && !isCorrect) {
                  classes += "border-destructive/60 bg-destructive/10 text-destructive";
                } else {
                  classes += "border-border/30 text-muted-foreground opacity-50";
                }
              } else {
                classes += selected
                  ? "border-primary/60 bg-primary/10 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.15)]"
                  : "border-border/50 hover:border-primary/40 hover:bg-secondary/50 text-foreground";
              }
              return (
                <div key={oi} className={classes} onClick={() => selectAnswer(oi)}>
                  <span className="text-lg">{opt}</span>
                </div>
              );
            })}
          </div>
        );

      case "fill_blank":
        return (
          <div className="space-y-4">
            <Input
              placeholder="Type your answer..."
              value={hasAnswered && isPractice ? String(answer.selected) : fillAnswer}
              onChange={(e) => setFillAnswer(e.target.value)}
              disabled={hasAnswered && isPractice}
              className="text-lg bg-secondary/50 border-border/50 h-14"
              onKeyDown={(e) => {
                if (e.key === "Enter" && fillAnswer.trim()) selectAnswer(fillAnswer.trim());
              }}
            />
            {!hasAnswered && (
              <Button
                onClick={() => selectAnswer(fillAnswer.trim())}
                disabled={!fillAnswer.trim()}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Submit Answer
              </Button>
            )}
            {isPractice && hasAnswered && (
              <div className={`p-3 rounded-lg ${isCorrect ? "bg-xp/10 border border-xp/30" : "bg-destructive/10 border border-destructive/30"}`}>
                <p className="text-sm">
                  {isCorrect ? "✓ Correct!" : `✗ The answer is: ${question.options[question.correctAnswer]}`}
                </p>
              </div>
            )}
          </div>
        );

      case "flashcard":
        return (
          <div className="space-y-4">
            {!flashcardRevealed ? (
              <Button onClick={() => setFlashcardRevealed(true)} variant="outline" className="w-full h-20 text-lg">
                Reveal Answer
              </Button>
            ) : (
              <>
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <p className="text-foreground font-medium">{question.options[question.correctAnswer]}</p>
                  </CardContent>
                </Card>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => selectAnswer(-1)}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> I didn't know
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => selectAnswer(question.correctAnswer)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> I knew it
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      default: // mcq
        return (
          <div className="space-y-2.5">
            {question.options.map((opt, oi) => {
              const selected = answer?.selected === oi;
              const showResult = isPractice && hasAnswered;
              let classes = "p-4 rounded-xl border cursor-pointer transition-all duration-300 ";
              if (showResult) {
                if (oi === question.correctAnswer) {
                  classes += "border-xp/50 bg-xp/10";
                } else if (selected && !isCorrect) {
                  classes += "border-destructive/50 bg-destructive/10";
                } else {
                  classes += "border-border/20 opacity-50";
                }
              } else {
                classes += selected
                  ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.12)]"
                  : "border-border/40 hover:border-primary/30 hover:bg-secondary/50";
              }
              return (
                <div key={oi} className={classes} onClick={() => selectAnswer(oi)}>
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      showResult && oi === question.correctAnswer
                        ? "bg-xp/20 text-xp"
                        : showResult && selected && !isCorrect
                          ? "bg-destructive/20 text-destructive"
                          : selected
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary text-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="text-sm text-foreground">{opt}</span>
                    {showResult && oi === question.correctAnswer && <CheckCircle2 className="h-4 w-4 text-xp ml-auto shrink-0" />}
                    {showResult && selected && !isCorrect && oi === (answer.selected as number) && <XCircle className="h-4 w-4 text-destructive ml-auto shrink-0" />}
                  </div>
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">{quiz.difficulty}</Badge>
          <Badge variant="secondary" className="text-xs capitalize">{mode} mode</Badge>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-mono ${timeColor}`}>
          <Clock className="h-3.5 w-3.5" />
          {mode === "timed" ? formatTime(timeRemaining) : formatTime(timeElapsed)}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {currentIndex + 1} of {quiz.questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Dots */}
      <div className="flex gap-1.5 flex-wrap">
        {quiz.questions.map((q, i) => {
          const a = answers[q.id];
          const answered = a?.selected !== null && a?.selected !== undefined;
          const correct = answered && (typeof a.selected === 'number' ? a.selected === q.correctAnswer : String(a.selected).toLowerCase().trim() === q.options[q.correctAnswer]?.toLowerCase().trim());
          let dotClass = "w-3 h-3 rounded-full cursor-pointer transition-all ";
          if (i === currentIndex) {
            dotClass += "ring-2 ring-primary ring-offset-1 ring-offset-background ";
          }
          if (isPractice && answered) {
            dotClass += correct ? "bg-xp" : "bg-destructive";
          } else if (answered) {
            dotClass += "bg-primary";
          } else {
            dotClass += "bg-secondary";
          }
          if (bookmarkedIds.has(q.id)) {
            dotClass += " ring-1 ring-achievement";
          }
          return <div key={q.id} className={dotClass} onClick={() => { setCurrentIndex(i); setFillAnswer(""); setFlashcardRevealed(false); questionStartRef.current = Date.now(); }} />;
        })}
      </div>

      {/* Question Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] capitalize">{question.type.replace("_", "/")}</Badge>
            </div>
            <div className="flex items-center gap-1">
              {/* Hint Token button — only when user has tokens AND not yet revealed AND not yet answered */}
              {hintTokensLeft > 0 && !hintRevealed[question.id] && !hasAnswered && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-achievement hover:bg-achievement/10"
                  onClick={async () => {
                    try {
                      await consume("power-hint-token");
                      setHintRevealed((p) => ({ ...p, [question.id]: true }));
                      toast.success("Hint revealed!", { description: `${hintTokensLeft - 1} hint token(s) left.` });
                    } catch (e: any) {
                      toast.error("Could not use hint", { description: e?.message });
                    }
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Hint ({hintTokensLeft})
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onBookmark(question.id)}
              >
                {bookmarkedIds.has(question.id) ? (
                  <BookmarkCheck className="h-4 w-4 text-achievement" />
                ) : (
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <CardTitle className="text-lg font-semibold leading-relaxed mt-2">
            {question.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderQuestion()}

          {/* Hint reveal */}
          {hintRevealed[question.id] && !hasAnswered && (
            <div className="p-3 rounded-lg bg-achievement/10 border border-achievement/30 flex items-start gap-2 animate-fade-in-up">
              <Sparkles className="h-4 w-4 text-achievement shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-achievement mb-1">Hint</p>
                <p className="text-muted-foreground">
                  {question.type === "mcq" && question.options.length >= 4
                    ? `It's not "${question.options.find((_, i) => i !== question.correctAnswer)}" or "${question.options.filter((_, i) => i !== question.correctAnswer)[1]}". Two options eliminated.`
                    : question.explanation
                      ? `Think about this: ${question.explanation.split(".")[0]}.`
                      : `The answer starts with "${String(question.options[question.correctAnswer] ?? "").charAt(0).toUpperCase()}".`}
                </p>
              </div>
            </div>
          )}

          {/* Practice mode explanation */}
          {isPractice && hasAnswered && question.explanation && (
            <div className="p-3 rounded-lg bg-secondary/60 border border-border/30 flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-achievement shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{question.explanation}</p>
            </div>
          )}

          {/* Confidence rating */}
          {showConfidence && (
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/30 space-y-2 animate-fade-in-up">
              <p className="text-xs text-muted-foreground font-medium">How confident were you?</p>
              <div className="flex gap-2">
                {CONFIDENCE_OPTIONS.map((c) => (
                  <Button
                    key={c.value}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1"
                    onClick={() => setConfidence(c.value)}
                  >
                    <span>{c.emoji}</span> {c.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        {currentIndex < quiz.questions.length - 1 ? (
          <Button onClick={() => navigate(1)} className="gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="gap-2">
            {mode === "practice" ? (
              <>Finish Quiz</>
            ) : (
              <>
                <Send className="h-4 w-4" /> Submit Quiz
              </>
            )}
          </Button>
        )}
      </div>

      {/* Unanswered warning for test/timed mode */}
      {mode !== "practice" && answeredCount < quiz.questions.length && currentIndex === quiz.questions.length - 1 && (
        <div className="flex items-center gap-2 text-xs text-achievement p-2 rounded-lg bg-achievement/10 border border-achievement/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{quiz.questions.length - answeredCount} question(s) unanswered</span>
        </div>
      )}
    </div>
  );
}
