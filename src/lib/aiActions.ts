import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface AIAction {
  id: string;
  label: string;
  icon: "flashcards" | "task" | "navigate" | "quiz";
  data?: Record<string, string>;
}

// Detect actions from AI response text
export function detectActions(text: string): AIAction[] {
  const actions: AIAction[] = [];
  const lower = text.toLowerCase();

  // Flashcard generation
  const flashcardMatch = text.match(/\[ACTION:FLASHCARDS(?::([^\]]*))?\]/);
  if (flashcardMatch) {
    actions.push({
      id: "generate-flashcards",
      label: "Generate Flashcards",
      icon: "flashcards",
      data: { topic: flashcardMatch[1]?.trim() || "" },
    });
  }

  // Add task
  const taskMatch = text.match(/\[ACTION:TASK(?::([^\]]*))?\]/);
  if (taskMatch) {
    actions.push({
      id: "add-task",
      label: "Add Task",
      icon: "task",
      data: { title: taskMatch[1]?.trim() || "" },
    });
  }

  // Quiz
  const quizMatch = text.match(/\[ACTION:QUIZ(?::([^\]]*))?\]/);
  if (quizMatch) {
    actions.push({
      id: "start-quiz",
      label: "Start Quiz",
      icon: "quiz",
      data: { topic: quizMatch[1]?.trim() || "" },
    });
  }

  return actions;
}

// Strip action tags from display text
export function stripActionTags(text: string): string {
  return text.replace(/\[ACTION:\w+(?::[^\]]*)?\]/g, "").trim();
}
