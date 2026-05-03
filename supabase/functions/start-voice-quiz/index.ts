import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const recent = (rateLimitMap.get(userId) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

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
    authHeader.replace("Bearer ", ""),
  );
  if (claimsErr || !claims?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claims.user.id;

  try {
    const body = await req.json();
    const topicRaw = String(body?.topic ?? "").trim();
    const difficultyRaw = String(body?.difficulty ?? "medium").toLowerCase();
    const countRaw = Number(body?.questionCount ?? 5);

    if (topicRaw.length < 2) {
      return new Response(JSON.stringify({ error: "Topic is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const difficulty = ["easy", "medium", "hard"].includes(difficultyRaw)
      ? difficultyRaw
      : "medium";
    const count = Math.min(Math.max(Number.isFinite(countRaw) ? countRaw : 5, 3), 10);

    const systemPrompt = `You are an expert voice quiz designer for a study tutor named Aria.
Generate exactly ${count} multiple-choice questions on the user's topic, ${difficulty} difficulty.

RULES:
- Each question MUST have exactly 4 short options (A-D, no letter prefix in the text).
- "answer" MUST be the EXACT string of the correct option (verbatim, no letter prefix).
- Provide a 1-sentence "explanation".
- Keep questions short and clear (good for reading aloud).
- Topic-specific. No filler.

Return ONLY this JSON object (no markdown):
{
  "topic": string,
  "questions": [
    { "question": string, "options": [string, string, string, string], "answer": string, "explanation": string }
  ]
}`;

    const userPrompt = `Topic: "${topicRaw.slice(0, 300)}"\nGenerate ${count} ${difficulty} questions.`;

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
      try {
        parsed = match ? JSON.parse(match[0]) : null;
      } catch (e) {
        console.error("AI returned malformed JSON:", raw);
        return new Response(
          JSON.stringify({ error: "AI returned malformed response.", details: "JSON parse failed" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const rawQs = Array.isArray(parsed?.questions) ? parsed.questions : [];
    const questions = rawQs
      .filter(
        (q: any) =>
          q &&
          typeof q.question === "string" &&
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          typeof q.answer === "string",
      )
      .slice(0, count)
      .map((q: any) => ({
        question: String(q.question),
        options: q.options.slice(0, 4).map((o: any) => String(o)),
        answer: String(q.answer),
        explanation: q.explanation ? String(q.explanation) : "",
      }));

    if (questions.length === 0) {
      console.error("AI returned no valid questions. Raw:", raw);
      return new Response(
        JSON.stringify({
          error: "No valid questions generated.",
          details: `AI returned ${rawQs.length} candidates, none valid. Try a different topic.`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Insert as an active voice quiz attempt — realtime listener picks it up
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("quiz_attempts")
      .insert({
        user_id: userId,
        quiz_topic: parsed?.topic ? String(parsed.topic).slice(0, 120) : topicRaw.slice(0, 120),
        quiz_mode: "voice",
        difficulty,
        total_questions: questions.length,
        status: "active",
        questions_payload: questions,
        completed_at: null,
      })
      .select("id, quiz_topic, difficulty, total_questions")
      .single();

    if (insertErr) {
      console.error("insert quiz_attempts error:", insertErr);
      return new Response(
        JSON.stringify({ error: "Failed to start quiz.", details: insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        attemptId: inserted.id,
        topic: inserted.quiz_topic,
        difficulty: inserted.difficulty,
        totalQuestions: inserted.total_questions,
        questions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("start-voice-quiz error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    try {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabaseAdmin.from("ai_error_logs").insert({
        user_id: userId,
        feature: "voice_quiz_start",
        error_message: message,
      });
    } catch (_) {}
    return new Response(
      JSON.stringify({ error: "Failed to start voice quiz.", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
