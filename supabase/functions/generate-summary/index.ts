import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiter: user_id -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT) {
    rateLimitMap.set(userId, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return false;
}

function getModeInstruction(mode: string): string {
  switch (mode) {
    case "assignment":
      return "Create an ultra-concise summary (~15% of original length) suitable for academic assignments. Focus on core concepts and main arguments with precise language.";
    case "detailed":
      return "Create a comprehensive summary (~30% of original length) covering all major points with logical flow, detailed explanations, supporting evidence, and contextual information for study purposes.";
    case "bullet":
      return "Create a bullet point summary (~20–25% of original length) with 5–8 key points. Each bullet should capture essential concepts with important details and context.";
    default:
      return "Create a concise summary of the text.";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit
    if (isRateLimited(user.id)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { input_text, mode } = await req.json();
    if (!input_text || typeof input_text !== "string" || input_text.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: "Input text must be at least 100 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAX_INPUT_CHARS = 30000;
    if (input_text.length > MAX_INPUT_CHARS) {
      return new Response(
        JSON.stringify({ error: `Input text must be at most ${MAX_INPUT_CHARS} characters.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validModes = ["assignment", "detailed", "bullet"];
    const summaryMode = validModes.includes(mode) ? mode : "assignment";

    // Check for AI API key
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      // Log error
      const serviceClient = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await serviceClient.from("ai_error_logs").insert({
        user_id: user.id,
        feature: "summarizer",
        input_text: input_text.slice(0, 500),
        error_message: "API key not configured",
      });

      return new Response(
        JSON.stringify({ error: "AI API key not configured. Please contact support." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === AI API CALL PLACEHOLDER ===
    // When the AI model is ready, replace this block with the actual API call.
    // The system prompt and mode instruction are already prepared below.
    //
    // const systemPrompt = `You are a professional text summarizer.\n${getModeInstruction(summaryMode)}\nReturn ONLY the summary text without any prefixes like "Summary:" or additional explanations.`;
    //
    // Call your AI endpoint here with:
    //   - system: systemPrompt
    //   - user: input_text
    //
    // For now, return a structured placeholder response:

    const systemPrompt = `You are a professional text summarizer.\n${getModeInstruction(summaryMode)}\nReturn ONLY the summary text without any prefixes like "Summary:" or additional explanations.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input_text },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to your Lovable workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const summaryText: string = aiData?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!summaryText) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const originalWords = input_text.trim().split(/\s+/).length;
    const summaryWords = summaryText.trim().split(/\s+/).length;
    const compressionRatio = Math.round((summaryWords / originalWords) * 100) / 100;

    return new Response(
      JSON.stringify({
        summary: summaryText,
        word_count: summaryWords,
        compression_ratio: compressionRatio,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-summary error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
