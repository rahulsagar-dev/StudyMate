import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, XCircle, Mic, SkipForward, Sparkles, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface VoiceQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface ActiveQuiz {
  attemptId: string;
  topic: string;
  difficulty: string;
  totalQuestions: number;
  questions: VoiceQuestion[];
}

const normalize = (s: string) =>
  String(s ?? "").toLowerCase().replace(/^[a-d]\)\s*/i, "").trim();

function rowToActiveQuiz(row: any): ActiveQuiz | null {
  if (!row) return null;
  const rawQs = Array.isArray(row.questions_payload) ? row.questions_payload : [];
  const questions: VoiceQuestion[] = rawQs
    .filter((q: any) => q && q.question && Array.isArray(q.options) && q.answer)
    .map((q: any) => ({
      question: String(q.question),
      options: q.options.map((o: any) => String(o)),
      answer: String(q.answer),
      explanation: q.explanation ? String(q.explanation) : undefined,
    }));
  if (questions.length === 0) return null;
  return {
    attemptId: row.id,
    topic: row.quiz_topic || "Voice Quiz",
    difficulty: row.difficulty || "medium",
    totalQuestions: row.total_questions || questions.length,
    questions,
  };
}

export default function HybridQuizListener() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const location = useLocation();
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const advanceTimer = useRef<number | null>(null);
  const seenAttemptIds = useRef<Set<string>>(new Set());
  const activeQuizRef = useRef<ActiveQuiz | null>(null);

  useEffect(() => {
    activeQuizRef.current = activeQuiz;
  }, [activeQuiz]);

  const openQuiz = useCallback(
    (quiz: ActiveQuiz, source: string) => {
      if (seenAttemptIds.current.has(quiz.attemptId)) {
        console.log("[HybridQuizListener] dedupe — already opened", quiz.attemptId);
        return;
      }
      if (activeQuizRef.current && !finished) {
        console.log("[HybridQuizListener] another quiz already in progress, ignoring", quiz.attemptId);
        return;
      }
      seenAttemptIds.current.add(quiz.attemptId);
      console.log(`[HybridQuizListener] opening quiz (${source})`, {
        attemptId: quiz.attemptId,
        topic: quiz.topic,
        questions: quiz.questions.length,
      });

      setActiveQuiz(quiz);
      setCurrentIdx(0);
      setSelectedOption(null);
      setShowFeedback(false);
      setCorrect(0);
      setIncorrect(0);
      setFinished(false);
      setXpEarned(0);

      toast.info("🎙️ Aria started a voice quiz", {
        description: `${quiz.topic} — ${quiz.questions.length} questions`,
      });

      if (location.pathname !== "/quizzes") {
        navigate("/quizzes");
      }
    },
    [finished, location.pathname, navigate],
  );

  // Subscribe to realtime INSERT + UPDATE on quiz_attempts (defensive: covers
  // the race where a row briefly appears non-active before being flipped).
  useEffect(() => {
    if (!userId) return;

    const channelName = `hybrid-quiz-${userId}`;
    console.log(`[HybridQuizListener] subscribing on ${channelName}`);

    const handleRow = (payload: any, evt: string) => {
      const row = payload?.new;
      console.log(`[HybridQuizListener] ${evt} payload`, {
        id: row?.id,
        status: row?.status,
        topic: row?.quiz_topic,
      });
      if (!row || row.status !== "active") return;
      const quiz = rowToActiveQuiz(row);
      if (!quiz) {
        console.warn("[HybridQuizListener] row had no valid questions", row?.id);
        return;
      }
      openQuiz(quiz, `realtime:${evt}`);
    };

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "quiz_attempts", filter: `user_id=eq.${userId}` },
        (payload) => handleRow(payload, "INSERT"),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "quiz_attempts", filter: `user_id=eq.${userId}` },
        (payload) => handleRow(payload, "UPDATE"),
      )
      .subscribe((status) => {
        console.log(`[HybridQuizListener] channel status: ${status}`);
      });

    // Backfill: if realtime missed the event (channel race, refresh, etc.),
    // open the most recent active quiz from the last 2 minutes.
    (async () => {
      const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("id, quiz_topic, difficulty, total_questions, questions_payload, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) {
        console.warn("[HybridQuizListener] backfill query failed", error);
        return;
      }
      if (data && data.length > 0) {
        const quiz = rowToActiveQuiz(data[0]);
        if (quiz) openQuiz(quiz, "backfill");
      }
    })();

    return () => {
      console.log(`[HybridQuizListener] removing channel ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [userId, openQuiz]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  const finishQuiz = useCallback(
    async (finalCorrect: number, finalIncorrect: number) => {
      if (!activeQuiz || !user) return;
      const total = activeQuiz.questions.length;
      let xp = finalCorrect * 5 + 20;
      if (finalCorrect === total) xp += 50;

      await supabase
        .from("quiz_attempts")
        .update({
          status: "completed",
          score: finalCorrect,
          correct_answers: finalCorrect,
          incorrect_answers: finalIncorrect,
          skipped_answers: total - finalCorrect - finalIncorrect,
          xp_earned: xp,
          completed_at: new Date().toISOString(),
        })
        .eq("id", activeQuiz.attemptId)
        .eq("user_id", user.id);

      try {
        await (supabase.rpc as any)("claim_quiz_xp", { p_attempt_id: activeQuiz.attemptId });
      } catch (e) {
        console.error("claim_quiz_xp failed", e);
      }

      setXpEarned(xp);
      setFinished(true);
    },
    [activeQuiz, user],
  );

  const goNext = useCallback(
    (newCorrect: number, newIncorrect: number) => {
      if (!activeQuiz) return;
      const next = currentIdx + 1;
      if (next >= activeQuiz.questions.length) {
        finishQuiz(newCorrect, newIncorrect);
      } else {
        setCurrentIdx(next);
        setSelectedOption(null);
        setShowFeedback(false);
      }
    },
    [activeQuiz, currentIdx, finishQuiz],
  );

  const handleSelect = useCallback(
    async (option: string) => {
      if (!activeQuiz || !user || showFeedback) return;
      const q = activeQuiz.questions[currentIdx];
      const isCorrect = normalize(option) === normalize(q.answer);

      setSelectedOption(option);
      setShowFeedback(true);

      const newCorrect = correct + (isCorrect ? 1 : 0);
      const newIncorrect = incorrect + (isCorrect ? 0 : 1);
      setCorrect(newCorrect);
      setIncorrect(newIncorrect);

      try {
        await supabase.from("quiz_question_attempts").insert({
          user_id: user.id,
          attempt_id: activeQuiz.attemptId,
          question_text: q.question,
          question_type: "mcq",
          selected_answer: option,
          correct_answer: q.answer,
          is_correct: isCorrect,
        });
        await supabase
          .from("quiz_attempts")
          .update({ correct_answers: newCorrect, incorrect_answers: newIncorrect })
          .eq("id", activeQuiz.attemptId)
          .eq("user_id", user.id);
      } catch (e) {
        console.error("save answer failed", e);
      }

      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
      advanceTimer.current = window.setTimeout(() => goNext(newCorrect, newIncorrect), 2000);
    },
    [activeQuiz, currentIdx, user, showFeedback, correct, incorrect, goNext],
  );

  const handleSkip = () => {
    if (!activeQuiz) return;
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    goNext(correct, incorrect);
  };

  const handleClose = () => {
    setActiveQuiz(null);
    setFinished(false);
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
  };

  if (!activeQuiz) return null;

  const q = activeQuiz.questions[currentIdx];
  const progress = ((currentIdx + (showFeedback ? 1 : 0)) / activeQuiz.questions.length) * 100;
  const total = activeQuiz.questions.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <Dialog open={!!activeQuiz} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl glass-card border-border/50 p-0 overflow-hidden z-[100]">
        {!finished ? (
          <div className="p-6 space-y-5 animate-fade-in-up">
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mic className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-semibold">{activeQuiz.topic}</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Voice quiz with Aria
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {activeQuiz.difficulty}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">Live</Badge>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Question {currentIdx + 1} of {activeQuiz.questions.length}</span>
                <span>{correct} ✓ · {incorrect} ✗</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card className="glass-card">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-lg font-semibold leading-relaxed text-foreground">{q.question}</h3>

                <div className="space-y-2.5">
                  {q.options.map((opt, oi) => {
                    const isSelected = selectedOption === opt;
                    const isAnswer = normalize(opt) === normalize(q.answer);
                    let classes = "p-4 rounded-xl border cursor-pointer transition-all duration-300 ";
                    if (showFeedback) {
                      if (isAnswer) classes += "border-xp/50 bg-xp/10";
                      else if (isSelected) classes += "border-destructive/50 bg-destructive/10";
                      else classes += "border-border/20 opacity-50";
                    } else {
                      classes += isSelected
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/40 hover:border-primary/30 hover:bg-secondary/50";
                    }
                    return (
                      <div key={oi} className={classes} onClick={() => handleSelect(opt)}>
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              showFeedback && isAnswer
                                ? "bg-xp/20 text-xp"
                                : showFeedback && isSelected
                                ? "bg-destructive/20 text-destructive"
                                : isSelected
                                ? "bg-primary/20 text-primary"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="text-sm text-foreground flex-1">{opt}</span>
                          {showFeedback && isAnswer && (
                            <CheckCircle2 className="h-4 w-4 text-xp shrink-0" />
                          )}
                          {showFeedback && isSelected && !isAnswer && (
                            <XCircle className="h-4 w-4 text-destructive shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {showFeedback && q.explanation && (
                  <div className="p-3 rounded-lg bg-secondary/60 border border-border/30 flex items-start gap-2 animate-fade-in-up">
                    <Sparkles className="h-4 w-4 text-achievement shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{q.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Mic className="h-3 w-3" />
                Answer by voice or click an option
              </p>
              <Button variant="outline" size="sm" onClick={handleSkip} className="gap-1.5">
                <SkipForward className="h-3.5 w-3.5" />
                Skip to next
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-5 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto rounded-full bg-xp/15 ring-2 ring-xp/30 flex items-center justify-center">
              <Trophy className="h-10 w-10 text-xp" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold mb-1">
                {correct} out of {total} correct
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                {percentage}% — {activeQuiz.topic}
              </DialogDescription>
            </div>
            <div className="flex justify-center gap-3">
              <Card className="glass-card flex-1 max-w-[120px]">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-xp">+{xpEarned}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">XP Earned</p>
                </CardContent>
              </Card>
              <Card className="glass-card flex-1 max-w-[120px]">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{percentage}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</p>
                </CardContent>
              </Card>
            </div>
            <Button onClick={handleClose} className="w-full">Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
