import type { Quiz, Difficulty, QuestionType } from "@/types/quiz";

/**
 * Generate a quiz from content/topic.
 * TODO: Replace with real AI API call.
 */
export async function generateQuiz(
  content: string,
  difficulty: Difficulty = "medium",
  questionCount: number = 10
): Promise<Quiz> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const id = crypto.randomUUID();
  const topic = content.slice(0, 60);

  const questionTypes: QuestionType[] = ['mcq', 'mcq', 'true_false', 'mcq', 'fill_blank', 'mcq', 'true_false', 'mcq', 'mcq', 'fill_blank'];

  const mockQuestions = [
    {
      type: 'mcq' as QuestionType,
      question: `What is the primary concept discussed in "${topic}"?`,
      options: ["Fundamental principles", "Advanced methodologies", "Historical context", "Applied techniques"],
      correctAnswer: 0,
      explanation: "The primary concept revolves around fundamental principles that form the foundation of this topic.",
    },
    {
      type: 'mcq' as QuestionType,
      question: "Which of the following best describes the key mechanism?",
      options: ["Process A through iteration", "Process B through recursion", "Process C through transformation", "Process D through abstraction"],
      correctAnswer: 2,
      explanation: "Transformation is the key mechanism that drives this concept forward.",
    },
    {
      type: 'true_false' as QuestionType,
      question: "The concept can be applied in both theoretical and practical contexts.",
      options: ["True", "False"],
      correctAnswer: 0,
      explanation: "This is true — the concept has wide applicability across both theory and practice.",
    },
    {
      type: 'mcq' as QuestionType,
      question: "What is the most common application of this concept?",
      options: ["Data analysis", "System design", "Problem solving", "Resource optimization"],
      correctAnswer: 2,
      explanation: "Problem solving is the most common and direct application.",
    },
    {
      type: 'fill_blank' as QuestionType,
      question: "The process of breaking down complex problems into smaller parts is called ___.",
      options: ["decomposition"],
      correctAnswer: 0,
      explanation: "Decomposition is the technique of breaking down complex problems into manageable parts.",
    },
    {
      type: 'mcq' as QuestionType,
      question: "Which factor has the greatest impact on outcomes?",
      options: ["Initial conditions", "Environmental variables", "Time constraints", "Resource availability"],
      correctAnswer: 1,
      explanation: "Environmental variables typically have the greatest impact on outcomes in this context.",
    },
    {
      type: 'true_false' as QuestionType,
      question: "Iterative approaches always yield better results than sequential ones.",
      options: ["True", "False"],
      correctAnswer: 1,
      explanation: "This is false — the best approach depends on the specific context and requirements.",
    },
    {
      type: 'mcq' as QuestionType,
      question: "What distinguishes this approach from traditional methods?",
      options: ["Speed of execution", "Accuracy of results", "Adaptability to change", "Cost effectiveness"],
      correctAnswer: 2,
      explanation: "Adaptability to change is the key differentiator from traditional methods.",
    },
    {
      type: 'mcq' as QuestionType,
      question: "In which scenario would this concept be most effective?",
      options: ["Static environments", "Dynamic environments", "Controlled settings", "Isolated systems"],
      correctAnswer: 1,
      explanation: "Dynamic environments benefit most from this concept's flexibility.",
    },
    {
      type: 'fill_blank' as QuestionType,
      question: "The measure of how well a system performs under varying conditions is called ___.",
      options: ["robustness"],
      correctAnswer: 0,
      explanation: "Robustness measures a system's performance consistency across varying conditions.",
    },
  ];

  const count = Math.min(questionCount, mockQuestions.length);
  const questions = mockQuestions.slice(0, count).map((q, i) => ({
    ...q,
    id: crypto.randomUUID(),
    type: questionTypes[i] || 'mcq',
  }));

  return {
    id,
    topic,
    difficulty,
    questions,
    createdAt: new Date().toISOString(),
  };
}
