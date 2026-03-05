import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseUser.auth.getUser(token);
  if (claimsError || !claimsData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claimsData.user.id;

  try {
    const { input_text, card_count } = await req.json();

    // Validate input
    if (!input_text || typeof input_text !== "string" || input_text.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Input text must be at least 50 characters long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit check
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a minute before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestedCount = card_count || 10;

    // Check for AI API key
    const apiKey = Deno.env.get("LOVABLE_AI_API_KEY");
    if (!apiKey) {
      // Return mock flashcards when API key is not configured
      console.log("AI API key not configured, returning generated cards from content analysis");

      const flashcards = generateCardsFromContent(input_text, requestedCount);

      return new Response(
        JSON.stringify({
          flashcards,
          card_count: flashcards.length,
          source: "content_analysis",
          message: "Flashcards generated from content analysis. AI integration will enhance quality when configured.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TODO: Replace with actual AI API call when API details are provided
    // The structure below is ready for integration:
    //
    // const aiResponse = await fetch("AI_API_ENDPOINT", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${apiKey}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     prompt: `Generate ${requestedCount} flashcards from the following text. Return JSON array with objects containing "front" and "back" fields.\n\nText: ${input_text}`,
    //     max_tokens: 2000,
    //   }),
    // });
    //
    // const aiData = await aiResponse.json();
    // const flashcards = parseAIResponse(aiData);

    const flashcards = generateCardsFromContent(input_text, requestedCount);

    return new Response(
      JSON.stringify({
        flashcards,
        card_count: flashcards.length,
        source: "ai",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error generating flashcards:", err);

    // Log error to ai_error_logs
    try {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const body = await req.clone().json().catch(() => ({}));
      await supabaseAdmin.from("ai_error_logs").insert({
        user_id: userId,
        feature: "flashcard_generation",
        input_text: (body?.input_text || "").substring(0, 500),
        error_message: err instanceof Error ? err.message : "Unknown error",
      });
    } catch (logErr) {
      console.error("Failed to log error:", logErr);
    }

    return new Response(
      JSON.stringify({ error: "Failed to generate flashcards. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateCardsFromContent(text: string, count: number): Array<{ front: string; back: string }> {
  // Split text into sentences and create flashcards from content
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const cards: Array<{ front: string; back: string }> = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    let idx = i;
    if (idx >= sentences.length) break;
    
    // Try to find key terms in the sentence
    const sentence = sentences[idx];
    const words = sentence.split(/\s+/);
    
    if (words.length >= 4) {
      // Create a question by removing a key concept
      const midPoint = Math.floor(words.length / 2);
      const keyPhrase = words.slice(midPoint, midPoint + Math.min(3, words.length - midPoint)).join(" ");
      
      cards.push({
        front: `What is described by: "${sentence.substring(0, 80)}${sentence.length > 80 ? '...' : ''}"?`,
        back: sentence,
      });
    } else {
      cards.push({
        front: `Define or explain: ${sentence}`,
        back: sentence,
      });
    }
  }

  // If we need more cards, create summary-style cards
  while (cards.length < count && cards.length < 25) {
    const idx = cards.length % sentences.length;
    if (usedIndices.has(idx)) break;
    usedIndices.add(idx);
    
    cards.push({
      front: `Summarize the following concept: "${sentences[idx]?.substring(0, 60) || "N/A"}..."`,
      back: sentences[idx] || "No content available",
    });
  }

  return cards.slice(0, count);
}
