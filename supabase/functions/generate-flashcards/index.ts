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

    if (!input_text || typeof input_text !== "string" || input_text.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Input text must be at least 50 characters long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAX_INPUT_CHARS = 20000;
    if (input_text.length > MAX_INPUT_CHARS) {
      return new Response(
        JSON.stringify({ error: `Input text must be at most ${MAX_INPUT_CHARS} characters.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a minute before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestedCount = Math.min(Math.max(card_count || 10, 3), 30);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert study coach who creates high-quality flashcards for active recall.
Rules:
- Generate exactly ${requestedCount} flashcards from the user's content or topic.
- Each card has a clear, specific QUESTION on the front and a concise, accurate ANSWER on the back.
- Front must be a real question or term to define — NEVER "What is described by: '...'" or quoted-sentence fillers.
- Cover the most important concepts, definitions, mechanisms, examples, and relationships.
- Answers should be 1-3 sentences, factually correct, self-contained.
- Vary card types: definitions, "why/how" questions, compare/contrast, examples, application.
- If the input is a short topic (not full content), generate cards from your own knowledge of that topic.
- Output ONLY via the provided tool. No prose.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create ${requestedCount} study flashcards from this:\n\n${input_text}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_flashcards",
              description: "Return the generated flashcards.",
              parameters: {
                type: "object",
                properties: {
                  flashcards: {
                    type: "array",
                    minItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        front: { type: "string", description: "Question or term" },
                        back: { type: "string", description: "Answer or definition" },
                      },
                      required: ["front", "back"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["flashcards"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emit_flashcards" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit reached. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    const argStr = toolCall?.function?.arguments;
    if (!argStr) {
      console.error("No tool call in AI response:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("AI did not return flashcards");
    }

    const parsed = JSON.parse(argStr);
    const flashcards = (parsed.flashcards || [])
      .filter((c: any) => c?.front && c?.back)
      .map((c: any) => ({ front: String(c.front).trim(), back: String(c.back).trim() }))
      .slice(0, requestedCount);

    if (flashcards.length === 0) {
      throw new Error("No valid flashcards generated");
    }

    return new Response(
      JSON.stringify({ flashcards, card_count: flashcards.length, source: "ai" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error generating flashcards:", err);
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
