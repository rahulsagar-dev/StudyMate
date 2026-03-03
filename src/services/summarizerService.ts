/**
 * Summarizer Service
 * Replace with real API when AI endpoint is available.
 */

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  wordCount: number;
}

/**
 * Generate a summary from input text.
 * TODO: Replace with real AI API call.
 */
export async function generateSummary(text: string): Promise<SummaryResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Temporary mock — clearly marked for replacement
  const words = text.trim().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  return {
    summary: sentences.length > 2
      ? sentences.slice(0, Math.ceil(sentences.length / 3)).join(". ").trim() + "."
      : "Provide more text for a meaningful summary.",
    keyPoints: sentences.slice(0, 4).map((s) => s.trim()).filter(Boolean),
    wordCount: words.length,
  };
}
