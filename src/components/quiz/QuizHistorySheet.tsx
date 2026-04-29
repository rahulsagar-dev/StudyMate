import { useEffect, useState } from "react";
import { History, Brain, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuizAttempts } from "@/hooks/useQuizAttempts";

interface AttemptRow {
  id: string;
  quiz_topic: string;
  quiz_mode: string;
  difficulty: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  xp_earned: number;
  created_at: string;
}

export default function QuizHistorySheet() {
  const { getAttempts } = useQuizAttempts();
  const [open, setOpen] = useState(false);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getAttempts(50).then((data) => {
      setAttempts((data as any) || []);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fmtTime = (s: number) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <History className="h-4 w-4" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Quiz History</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg shimmer" />
              ))}
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No quizzes yet.</p>
              <p className="text-sm">Take your first quiz to see history!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((a) => {
                const pct = a.total_questions
                  ? Math.round((a.correct_answers / a.total_questions) * 100)
                  : 0;
                const tone =
                  pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-rose-500";
                return (
                  <Card key={a.id} className="glass-card">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">
                          {a.quiz_topic || "Untitled quiz"}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {a.quiz_mode}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {a.difficulty}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${tone}`}>
                          {a.correct_answers}/{a.total_questions} • {pct}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {fmtTime(a.time_taken)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Trophy className="h-3 w-3" /> +{a.xp_earned} XP
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
