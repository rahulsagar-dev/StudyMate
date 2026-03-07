import { ArrowLeft, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Quiz, QuizAnswer } from "@/types/quiz";

interface QuizReviewProps {
  quiz: Quiz;
  answers: Record<string, QuizAnswer>;
  onBack: () => void;
  mistakesOnly?: boolean;
}

export default function QuizReview({ quiz, answers, onBack, mistakesOnly = true }: QuizReviewProps) {
  const questions = mistakesOnly
    ? quiz.questions.filter((q) => {
        const a = answers[q.id];
        if (!a || a.selected === null || a.selected === undefined) return true;
        if (typeof a.selected === "number") return a.selected !== q.correctAnswer;
        return a.selected.toLowerCase().trim() !== q.options[q.correctAnswer]?.toLowerCase().trim();
      })
    : quiz.questions;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {mistakesOnly ? "Review Mistakes" : "Full Review"}
          </h2>
          <p className="text-xs text-muted-foreground">{questions.length} question(s) to review</p>
        </div>
      </div>

      {questions.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-xp mx-auto mb-3" />
            <p className="text-foreground font-medium">No mistakes to review!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qi) => {
            const a = answers[q.id];
            const selectedIdx = a?.selected;
            const isCorrect =
              selectedIdx !== null && selectedIdx !== undefined &&
              ((typeof selectedIdx === "number" && selectedIdx === q.correctAnswer) ||
               (typeof selectedIdx === "string" && selectedIdx.toLowerCase().trim() === q.options[q.correctAnswer]?.toLowerCase().trim()));

            return (
              <Card key={q.id} className="glass-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] capitalize">{q.type.replace("_", "/")}</Badge>
                    {isCorrect ? (
                      <Badge className="bg-xp/15 text-xp border-xp/30 text-[10px]">Correct</Badge>
                    ) : (
                      <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
                        {selectedIdx === null || selectedIdx === undefined ? "Skipped" : "Wrong"}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-medium">{q.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.type === "fill_blank" ? (
                    <div className="space-y-2">
                      {selectedIdx !== null && selectedIdx !== undefined && (
                        <div className={`p-3 rounded-lg border text-sm ${isCorrect ? "border-xp/40 bg-xp/5" : "border-destructive/40 bg-destructive/5"}`}>
                          <span className="text-muted-foreground">Your answer: </span>
                          <span className={isCorrect ? "text-xp font-medium" : "text-destructive line-through"}>{String(selectedIdx)}</span>
                        </div>
                      )}
                      <div className="p-3 rounded-lg border border-xp/40 bg-xp/5 text-sm">
                        <span className="text-muted-foreground">Correct: </span>
                        <span className="text-xp font-medium">{q.options[q.correctAnswer]}</span>
                      </div>
                    </div>
                  ) : (
                    q.options.map((opt, oi) => {
                      let classes = "p-3 rounded-lg border text-sm ";
                      if (oi === q.correctAnswer) {
                        classes += "border-xp/40 bg-xp/5";
                      } else if (typeof selectedIdx === "number" && oi === selectedIdx) {
                        classes += "border-destructive/40 bg-destructive/5";
                      } else {
                        classes += "border-border/20 opacity-40";
                      }
                      return (
                        <div key={oi} className={classes}>
                          <div className="flex items-center gap-2">
                            {oi === q.correctAnswer && <CheckCircle2 className="h-4 w-4 text-xp shrink-0" />}
                            {typeof selectedIdx === "number" && oi === selectedIdx && !isCorrect && (
                              <XCircle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                            <span className="text-foreground">{opt}</span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {q.explanation && (
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border/30 flex items-start gap-2 mt-2">
                      <Lightbulb className="h-4 w-4 text-achievement shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Button onClick={onBack} variant="outline" className="w-full gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Results
      </Button>
    </div>
  );
}
