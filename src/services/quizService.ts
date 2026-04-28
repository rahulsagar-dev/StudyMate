import { supabase } from "@/integrations/supabase/client";
import type { Quiz, Difficulty } from "@/types/quiz";

/**
 * Generate a quiz from content/topic via the AI edge function.
 */
export async function generateQuiz(
  content: string,
  difficulty: Difficulty = "medium",
  questionCount: number = 10
): Promise<Quiz> {
  const { data, error } = await supabase.functions.invoke("generate-quiz", {
    body: { content, difficulty, questionCount },
  });

  if (error) {
    console.error("generateQuiz error:", error);
    throw new Error(error.message || "Failed to generate quiz");
  }
  if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("No questions returned");
  }

  return {
    id: data.id ?? crypto.randomUUID(),
    topic: data.topic ?? content.slice(0, 60),
    difficulty: (data.difficulty as Difficulty) ?? difficulty,
    questions: data.questions,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
}
