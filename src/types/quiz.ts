export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  topic: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  quizId: string;
  answers: Record<string, number>;
  score: number;
  total: number;
}
