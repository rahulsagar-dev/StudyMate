import { useState } from "react";
import { Brain, Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateQuiz } from "@/services/quizService";
import type { Quiz } from "@/types/quiz";

export default function Quizzes() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast({ title: "Empty input", description: "Enter a topic or paste notes.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setQuiz(null);
    setSelectedAnswers({});
    setSubmitted(false);
    try {
      const data = await generateQuiz(content);
      setQuiz(data);
    } catch {
      toast({ title: "Error", description: "Failed to generate quiz.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!quiz) return;
    if (Object.keys(selectedAnswers).length < quiz.questions.length) {
      toast({ title: "Incomplete", description: "Answer all questions before submitting.", variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  const score = quiz
    ? quiz.questions.filter((q) => selectedAnswers[q.id] === q.correctAnswer).length
    : 0;

  const handleRetry = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const handleNewQuiz = () => {
    setQuiz(null);
    setContent("");
    setSelectedAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
          <p className="text-sm text-muted-foreground">Test your knowledge and earn XP</p>
        </div>
      </div>

      {!quiz && !loading && (
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <Textarea
              placeholder="Enter a topic or paste your notes to generate a quiz..."
              className="min-h-[140px] bg-secondary/50 border-border/50 resize-none text-foreground placeholder:text-muted-foreground"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button onClick={handleGenerate} className="gap-2">
              <Brain className="h-4 w-4" />
              Generate Quiz
            </Button>
          </CardContent>
        </Card>
      )}

      {!quiz && !loading && (
        <Card className="glass-card">
          <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
            <Brain className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">Generate a quiz to test your knowledge.</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="glass-card">
          <CardContent className="p-10 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-muted-foreground">Generating quiz...</p>
          </CardContent>
        </Card>
      )}

      {quiz && !loading && (
        <>
          {submitted && (
            <Card className="glass-card border-primary/30">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Score: {score}/{quiz.questions.length}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {score === quiz.questions.length
                      ? "Perfect score! 🎉"
                      : score >= quiz.questions.length / 2
                        ? "Good job! Keep studying."
                        : "Keep practicing — you'll get there!"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRetry} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Retry
                  </Button>
                  <Button onClick={handleNewQuiz}>New Quiz</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {quiz.questions.map((q, qi) => {
              const selected = selectedAnswers[q.id];
              const isCorrect = selected === q.correctAnswer;

              return (
                <Card key={q.id} className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">
                      {qi + 1}. {q.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {q.options.map((opt, oi) => {
                      let optionClass = "p-3 rounded-lg border cursor-pointer transition-all duration-200 text-sm ";
                      if (submitted) {
                        if (oi === q.correctAnswer) {
                          optionClass += "border-xp/50 bg-xp/10 text-foreground";
                        } else if (oi === selected && !isCorrect) {
                          optionClass += "border-destructive/50 bg-destructive/10 text-foreground";
                        } else {
                          optionClass += "border-border/30 text-muted-foreground";
                        }
                      } else {
                        optionClass += selected === oi
                          ? "border-primary/50 bg-primary/10 text-foreground"
                          : "border-border/50 hover:border-primary/30 hover:bg-secondary/50 text-foreground";
                      }

                      return (
                        <div
                          key={oi}
                          className={optionClass}
                          onClick={() => selectAnswer(q.id, oi)}
                        >
                          <div className="flex items-center gap-2">
                            {submitted && oi === q.correctAnswer && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            )}
                            {submitted && oi === selected && !isCorrect && (
                              <XCircle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                            <span>{opt}</span>
                          </div>
                        </div>
                      );
                    })}
                    {submitted && q.explanation && (
                      <p className="text-xs text-muted-foreground mt-2 pl-1">{q.explanation}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!submitted && (
            <Button onClick={handleSubmit} className="w-full" size="lg">
              Submit Answers
            </Button>
          )}
        </>
      )}
    </div>
  );
}
