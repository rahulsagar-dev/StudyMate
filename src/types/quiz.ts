export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'flashcard';
export type QuizMode = 'practice' | 'test' | 'timed';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Confidence = 'low' | 'medium' | 'high';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  topic: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAnswer {
  selected: number | string | null;
  confidence?: Confidence;
  timeSpent?: number;
}

export interface QuizAttempt {
  quizId: string;
  answers: Record<string, QuizAnswer>;
  score: number;
  total: number;
}

export interface QuizState {
  mode: QuizMode;
  currentIndex: number;
  answers: Record<string, QuizAnswer>;
  bookmarked: Set<string>;
  startTime: number;
  timeLimit?: number;
}
