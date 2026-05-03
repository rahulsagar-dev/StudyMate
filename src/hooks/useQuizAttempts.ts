import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Quiz, QuizAnswer, QuizMode, Confidence } from "@/types/quiz";

interface SaveAttemptParams {
  quiz: Quiz;
  answers: Record<string, QuizAnswer>;
  mode: QuizMode;
  timeTaken: number;
}

export function useQuizAttempts() {
  const { user } = useAuth();

  const calculateXP = (correct: number, total: number): number => {
    let xp = correct * 5 + 20; // 5 per correct + 20 completion
    if (correct === total) xp += 50; // perfect score bonus
    return xp;
  };

  const saveAttempt = async ({ quiz, answers, mode, timeTaken }: SaveAttemptParams) => {
    if (!user) return null;

    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    quiz.questions.forEach((q) => {
      const answer = answers[q.id];
      if (!answer || answer.selected === null || answer.selected === undefined) {
        skipped++;
      } else if (
        (typeof answer.selected === 'number' && answer.selected === q.correctAnswer) ||
        (typeof answer.selected === 'string' && answer.selected.toLowerCase().trim() === q.options[q.correctAnswer]?.toLowerCase().trim())
      ) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const xpEarned = calculateXP(correct, quiz.questions.length);

    // Save attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        quiz_topic: quiz.topic,
        quiz_mode: mode,
        difficulty: quiz.difficulty,
        score: correct,
        total_questions: quiz.questions.length,
        correct_answers: correct,
        incorrect_answers: incorrect,
        skipped_answers: skipped,
        time_taken: timeTaken,
        xp_earned: xpEarned,
      })
      .select()
      .single();

    if (attemptError || !attempt) return null;

    // Save question attempts
    const questionAttempts = quiz.questions.map((q) => {
      const answer = answers[q.id];
      const selectedStr = answer?.selected !== null && answer?.selected !== undefined
        ? typeof answer.selected === 'number'
          ? q.options[answer.selected] || String(answer.selected)
          : String(answer.selected)
        : null;
      const isCorrect = answer?.selected !== null && answer?.selected !== undefined &&
        ((typeof answer.selected === 'number' && answer.selected === q.correctAnswer) ||
         (typeof answer.selected === 'string' && answer.selected.toLowerCase().trim() === q.options[q.correctAnswer]?.toLowerCase().trim()));

      return {
        user_id: user.id,
        attempt_id: attempt.id,
        question_text: q.question,
        question_type: q.type,
        selected_answer: selectedStr,
        correct_answer: q.options[q.correctAnswer] || String(q.correctAnswer),
        is_correct: isCorrect,
        confidence: answer?.confidence || null,
        time_spent: answer?.timeSpent || 0,
      };
    });

    await supabase.from("quiz_question_attempts").insert(questionAttempts);

    // Award XP via server-validated claim (verifies attempt ownership + idempotent)
    await (supabase.rpc as any)("claim_quiz_xp", { p_attempt_id: attempt.id });

    return { ...attempt, xp_earned: xpEarned, correct, incorrect, skipped };
  };

  const toggleBookmark = async (questionText: string, correctAnswer: string, explanation?: string, topic?: string) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("quiz_bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("question_text", questionText)
      .maybeSingle();

    if (existing) {
      await supabase.from("quiz_bookmarks").delete().eq("id", existing.id);
      return false;
    } else {
      await supabase.from("quiz_bookmarks").insert({
        user_id: user.id,
        question_text: questionText,
        correct_answer: correctAnswer,
        explanation,
        topic,
      });
      return true;
    }
  };

  const getBookmarks = async () => {
    if (!user) return [];
    const { data } = await supabase
      .from("quiz_bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    return data || [];
  };

  const getAttempts = async (limit = 20) => {
    if (!user) return [];
    const { data } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  };

  return { saveAttempt, calculateXP, toggleBookmark, getBookmarks, getAttempts };
}
