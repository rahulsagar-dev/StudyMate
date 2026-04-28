import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const recent = (rateLimitMap.get(userId) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_GUIDE: Record<Difficulty, string> = {
  easy: "Easy: definitions, recall, and recognition of basic facts. Beginner level. Short, clear questions.",
  medium: "Medium: application and understanding. Intermediate level. Requires connecting two ideas or applying a concept to a scenario.",
  hard: "Hard: analysis, synthesis, evaluation, edge cases, multi-step reasoning, tricky distractors. Advanced level. Distractors should be plausible and require deep understanding to eliminate.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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
  const { data: claims, error: claimsErr } = await supabaseUser.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (claimsErr || !claims?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claims.user.id;

  try {
    const { content, difficulty = "medium", questionCount = 10 } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Topic or notes are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const diff = (["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium") as Difficulty;
    const count = Math.min(Math.max(parseInt(String(questionCount), 10) || 10, 3), 25);

    const systemPrompt = `You are an expert quiz designer. Create high-quality, ${diff.toUpperCase()}-difficulty quiz questions strictly about the user's topic.

DIFFICULTY GUIDANCE → ${DIFFICULTY_GUIDE[diff]}

RULES:
- Every question MUST be directly about the provided topic/notes. Never produce generic placeholders.
- Mix question types: roughly 60% "mcq" (4 options), 25% "true_false" (2 options: "True","False"), 15% "fill_blank" (1 option: the correct word/phrase).
- "correctAnswer" is the INDEX (0-based) into options.
- For fill_blank: options has ONE entry (the answer) and correctAnswer is 0. Use "___" in the question where the blank goes.
- Provide a concise "explanation" (1-2 sentences) for each question.
- Vary question wording. Never duplicate questions. Avoid trivial yes/no for hard difficulty.
- Distractors must be plausible and topic-relevant. For HARD, distractors should reflect common misconceptions.

Return ONLY a JSON object matching this schema (no markdown, no commentary):
{
  "topic": string,
  "questions": [
    { "type": "mcq" | "true_false" | "fill_blank", "question": string, "options": string[], "correctAnswer": number, "explanation": string }
  ]
}`;

    const userPrompt = `Topic / notes:\n"""${content.trim().slice(0, 6000)}"""\n\nGenerate exactly ${count} ${diff} questions.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error ${aiResp.status}`);
    }

    const aiJson = await aiResp.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "";
    let parsed: any;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      const match = String(raw).match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      throw new Error("AI returned invalid format");
    }

    const questions = parsed.questions
      .filter((q: any) => q && typeof q.question === "string" && Array.isArray(q.options))
      .slice(0, count)
      .map((q: any) => {
        const type = ["mcq", "true_false", "fill_blank"].includes(q.type) ? q.type : "mcq";
        const options = q.options.map((o: any) => String(o));
        let correctAnswer = Number(q.correctAnswer);
        if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
          correctAnswer = 0;
        }
        return {
          id: crypto.randomUUID(),
          type,
          question: String(q.question),
          options,
          correctAnswer,
          explanation: q.explanation ? String(q.explanation) : undefined,
        };
      });

    if (questions.length === 0) throw new Error("No valid questions returned");

    return new Response(
      JSON.stringify({
        id: crypto.randomUUID(),
        topic: parsed.topic || content.slice(0, 80),
        difficulty: diff,
        questions,
        createdAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-quiz error:", err);
    try {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const body = await req.clone().json().catch(() => ({}));
      await supabaseAdmin.from("ai_error_logs").insert({
        user_id: userId,
        feature: "quiz_generation",
        input_text: String(body?.content || "").substring(0, 500),
        error_message: err instanceof Error ? err.message : "Unknown error",
      });
    } catch (_) {}
    return new Response(
      JSON.stringify({ error: "Failed to generate quiz. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
