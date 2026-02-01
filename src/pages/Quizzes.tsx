import { useState } from "react";
import { Brain, Play, Clock, Zap, Trophy, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const quizzes = [
  { id: 1, name: "Biology Basics", questions: 20, difficulty: "Medium", xp: 150, bestScore: 85 },
  { id: 2, name: "Physics Fundamentals", questions: 15, difficulty: "Hard", xp: 200, bestScore: 72 },
  { id: 3, name: "History 101", questions: 25, difficulty: "Easy", xp: 100, bestScore: 92 },
  { id: 4, name: "Chemistry Challenge", questions: 18, difficulty: "Hard", xp: 180, bestScore: null },
];

const sampleQuestions = [
  {
    question: "Which organelle is responsible for producing energy in the cell?",
    options: ["Nucleus", "Mitochondria", "Endoplasmic Reticulum", "Golgi Apparatus"],
    correct: 1,
  },
  {
    question: "What is the process called when plants convert light energy to chemical energy?",
    options: ["Respiration", "Fermentation", "Photosynthesis", "Oxidation"],
    correct: 2,
  },
];

export default function Quizzes() {
  const [activeQuiz, setActiveQuiz] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    setShowResult(true);
    setTimeout(() => {
      setShowResult(false);
      setSelectedAnswer(null);
      if (currentQuestion < sampleQuestions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      }
    }, 1500);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-xp bg-xp/10";
      case "Medium":
        return "text-achievement bg-achievement/10";
      case "Hard":
        return "text-destructive bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-level flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Quizzes</h1>
            <p className="text-muted-foreground">Test your knowledge and earn XP</p>
          </div>
        </div>
      </div>

      {activeQuiz === null ? (
        /* Quiz Selection */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-card rounded-2xl border border-border/50 p-6 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                    {quiz.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-muted-foreground">
                      {quiz.questions} questions
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        getDifficultyColor(quiz.difficulty)
                      )}
                    >
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-xp/10 rounded-lg">
                  <Zap className="h-4 w-4 text-xp" />
                  <span className="text-sm font-semibold text-xp">{quiz.xp} XP</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  {quiz.bestScore ? (
                    <>
                      <Trophy className="h-4 w-4 text-achievement" />
                      <span className="text-sm text-muted-foreground">
                        Best: <span className="text-foreground font-medium">{quiz.bestScore}%</span>
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not attempted</span>
                  )}
                </div>
                <button
                  onClick={() => setActiveQuiz(quiz.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <Play className="h-4 w-4" />
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Active Quiz */
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {sampleQuestions.length}
              </span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>2:45</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / sampleQuestions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-card rounded-2xl border border-border/50 p-8 mb-6">
            <p className="text-xl font-medium text-foreground text-center">
              {sampleQuestions[currentQuestion].question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {sampleQuestions[currentQuestion].options.map((option, index) => {
              const isCorrect = index === sampleQuestions[currentQuestion].correct;
              const isSelected = selectedAnswer === index;

              return (
                <button
                  key={index}
                  onClick={() => !showResult && handleAnswer(index)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4",
                    !showResult &&
                      "bg-card border-border/50 hover:border-primary/50 hover:bg-primary/5",
                    showResult && isCorrect && "bg-xp/10 border-xp text-xp",
                    showResult && isSelected && !isCorrect && "bg-destructive/10 border-destructive"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                      !showResult && "border-muted-foreground/30",
                      showResult && isCorrect && "border-xp bg-xp text-xp-foreground",
                      showResult && isSelected && !isCorrect && "border-destructive bg-destructive text-destructive-foreground"
                    )}
                  >
                    {showResult && isCorrect ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "font-medium",
                      !showResult && "text-foreground",
                      showResult && isCorrect && "text-xp",
                      showResult && isSelected && !isCorrect && "text-destructive"
                    )}
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Back Button */}
          <button
            onClick={() => {
              setActiveQuiz(null);
              setCurrentQuestion(0);
            }}
            className="mt-8 text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Quizzes
          </button>
        </div>
      )}
    </div>
  );
}
