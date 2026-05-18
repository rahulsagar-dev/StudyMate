import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { AccessToken } from "npm:livekit-server-sdk@2.9.4";
import { RoomAgentDispatch, RoomConfiguration } from "npm:@livekit/protocol@1.41.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabase.auth
      .getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Optional: client passes the active whiteboard id so the agent can target it directly
    let whiteboardId: string | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.whiteboardId && typeof body.whiteboardId === "string") {
        whiteboardId = body.whiteboardId;
      }
    } catch {
      // no body, fine
    }

    // Provide both camelCase and snake_case so the Python agent works
    // regardless of which key it reads.
    const agentMetadata = JSON.stringify({
      userId,
      whiteboardId,
      user_id: userId,
      whiteboard_id: whiteboardId,
    });

    // Name of the registered Python agent worker. Defaults to "aria" so the
    // worker is always explicitly dispatched into the room. If your worker
    // registers WITHOUT an agent_name (automatic dispatch mode), set
    // LIVEKIT_AGENT_NAME to an empty string via the secret to disable explicit
    // dispatch — but the recommended setup is `agent_name="aria"` in Python.
    const agentName = (Deno.env.get("LIVEKIT_AGENT_NAME") ?? "aria").trim();

    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const livekitUrl = Deno.env.get("LIVEKIT_URL");

    if (!apiKey || !apiSecret || !livekitUrl) {
      console.error("Missing LiveKit configuration");
      return new Response(
        JSON.stringify({ error: "Server misconfigured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fresh room per session so room metadata is applied and LiveKit can dispatch the agent.
    const roomName = `study-room-${userId}-${crypto.randomUUID()}`;

    console.log("livekit-token session", {
      roomName,
      userId,
      whiteboardIdConfigured: Boolean(whiteboardId),
      agentNameConfigured: Boolean(agentName),
      metadataAttached: true,
    });

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      metadata: agentMetadata,
      ttl: "2h",
    });

    // Always attach room metadata so automatic LiveKit agents can read it from
    // ctx.job.metadata. Only add an explicit agent dispatch when a valid agent
    // name is configured; an empty dispatch breaks automatic agent pickup.
    at.roomConfig = new RoomConfiguration({
      metadata: agentMetadata,
      agents: agentName
        ? [
            new RoomAgentDispatch({
              agentName,
              metadata: agentMetadata,
            }),
          ]
        : undefined,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await at.toJwt();

    return new Response(
      JSON.stringify({
        token: jwt,
        roomName,
        livekitUrl,
        userId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("livekit-token error:", error);
    return new Response(JSON.stringify({ error: "Failed to create voice session. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
