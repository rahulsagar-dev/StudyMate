import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { document_id, file_url } = await req.json();
    if (!document_id || !file_url) {
      return new Response(
        JSON.stringify({ error: "document_id and file_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient
      .from("documents")
      .update({ processing_status: "processing" })
      .eq("id", document_id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(file_url);

    if (downloadError || !fileData) {
      await serviceClient
        .from("documents")
        .update({ processing_status: "error" })
        .eq("id", document_id);

      return new Response(
        JSON.stringify({ error: "Failed to download file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For TXT files, extract text directly
    // For PDF/DOCX, a real parser would be needed — placeholder for now
    let extractedText = "";
    const fileName = file_url.split("/").pop() ?? "";
    const ext = fileName.split(".").pop()?.toLowerCase();

    if (ext === "txt") {
      extractedText = await fileData.text();
    } else {
      // PDF/DOCX parsing placeholder — will need a proper parser library
      extractedText = await fileData.text();
      // Note: This will produce garbled text for binary formats.
      // Replace with actual PDF/DOCX parser when available.
    }

    const wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length;

    await serviceClient
      .from("documents")
      .update({
        extracted_text: extractedText,
        text_length: extractedText.length,
        word_count: wordCount,
        parsed_at: new Date().toISOString(),
        processing_status: "completed",
      })
      .eq("id", document_id);

    return new Response(
      JSON.stringify({
        extracted_text: extractedText,
        word_count: wordCount,
        text_length: extractedText.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("parse-document error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
