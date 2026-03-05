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

  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return new Response(
      JSON.stringify({ error: "Google Calendar credentials not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);

  // Handle OAuth callback (GET with ?code=...)
  if (req.method === "GET" && url.searchParams.has("code")) {
    const code = url.searchParams.get("code")!;
    const state = url.searchParams.get("state") || "";

    // state contains: jwt|redirect_url
    const [jwt, redirectUrl] = state.split("|");

    try {
      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: `${SUPABASE_URL}/functions/v1/google-calendar-auth`,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenRes.json();

      if (!tokenRes.ok) {
        console.error("Token exchange failed:", tokens);
        return Response.redirect(`${redirectUrl}?gcal_error=token_exchange_failed`, 302);
      }

      // Verify user from JWT
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

      if (authError || !user) {
        console.error("Auth error:", authError);
        return Response.redirect(`${redirectUrl}?gcal_error=auth_failed`, 302);
      }

      const expiryDate = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Upsert tokens
      const { error: dbError } = await supabase
        .from("google_calendar_tokens")
        .upsert(
          {
            user_id: user.id,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || "",
            token_expiry: expiryDate,
          },
          { onConflict: "user_id" }
        );

      if (dbError) {
        console.error("DB error:", dbError);
        return Response.redirect(`${redirectUrl}?gcal_error=db_failed`, 302);
      }

      return Response.redirect(`${redirectUrl}?gcal_connected=true`, 302);
    } catch (err) {
      console.error("OAuth callback error:", err);
      return Response.redirect(`${redirectUrl}?gcal_error=unknown`, 302);
    }
  }

  // Handle POST requests from frontend
  if (req.method === "POST") {
    try {
      const { action } = await req.json();

      if (action === "get_auth_url") {
        // Get user JWT from authorization header
        const authHeader = req.headers.get("authorization") || "";
        const jwt = authHeader.replace("Bearer ", "");

        const redirectUrl = url.searchParams.get("redirect") || req.headers.get("origin") || "";

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
        authUrl.searchParams.set("redirect_uri", `${SUPABASE_URL}/functions/v1/google-calendar-auth`);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.events");
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", `${jwt}|${redirectUrl}/calendar`);

        return new Response(JSON.stringify({ url: authUrl.toString() }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "check_connection") {
        const authHeader = req.headers.get("authorization") || "";
        const jwt = authHeader.replace("Bearer ", "");

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: { user } } = await supabase.auth.getUser(jwt);

        if (!user) {
          return new Response(JSON.stringify({ connected: false }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: tokenData } = await supabase
          .from("google_calendar_tokens")
          .select("token_expiry")
          .eq("user_id", user.id)
          .single();

        return new Response(
          JSON.stringify({ connected: !!tokenData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "disconnect") {
        const authHeader = req.headers.get("authorization") || "";
        const jwt = authHeader.replace("Bearer ", "");

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: { user } } = await supabase.auth.getUser(jwt);

        if (!user) {
          return new Response(JSON.stringify({ error: "Not authenticated" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await supabase
          .from("google_calendar_tokens")
          .delete()
          .eq("user_id", user.id);

        return new Response(JSON.stringify({ disconnected: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error:", err);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
