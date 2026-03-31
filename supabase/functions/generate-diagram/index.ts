import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DIAGRAM_PROMPTS: Record<string, string> = {
  flowchart: `You are an expert at creating flowchart diagrams. Generate a flowchart using rectangles for steps and arrows connecting them. Use a top-to-bottom layout with consistent spacing. Each rectangle should be 200px wide and 60px tall. Start at y=100 and space elements 120px apart vertically. Use strokeColor "#e2e8f0" and backgroundColor "#1e293b" for rectangles.`,
  mindmap: `You are an expert at creating mind map diagrams. Generate a mind map using ellipses for nodes and lines connecting them. Place the central topic at center (x=400, y=300) with branches radiating outward. Use ellipses 180px wide and 80px tall. Use strokeColor "#e2e8f0" and backgroundColor "#1e293b" for nodes.`,
  diagram: `You are an expert at creating general diagrams. Generate a clear diagram using appropriate shapes (rectangles, ellipses, diamonds) with arrows or lines connecting them. Use a clean layout with consistent spacing. Use strokeColor "#e2e8f0" and backgroundColor "#1e293b" for shapes.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing configuration");

    const { prompt, diagramType = "diagram" } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `${DIAGRAM_PROMPTS[diagramType] || DIAGRAM_PROMPTS.diagram}

Generate Excalidraw-compatible elements for the following request. Return elements using the tool provided. Each element needs: type, x, y, width, height, and text (for text/shape labels). For arrows, include startBinding and endBinding with elementId, focus, and gap. Give each element a unique id string.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_diagram",
              description: "Create an array of Excalidraw elements for a diagram",
              parameters: {
                type: "object",
                properties: {
                  elements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        type: {
                          type: "string",
                          enum: ["rectangle", "ellipse", "diamond", "arrow", "line", "text"],
                        },
                        x: { type: "number" },
                        y: { type: "number" },
                        width: { type: "number" },
                        height: { type: "number" },
                        text: { type: "string", description: "Text content for text elements or shape labels" },
                        strokeColor: { type: "string", description: "Hex color for stroke" },
                        backgroundColor: { type: "string", description: "Hex color for fill" },
                        fillStyle: { type: "string", enum: ["solid", "hachure", "cross-hatch"] },
                        fontSize: { type: "number" },
                        startBindingElementId: { type: "string", description: "Element ID this arrow starts from" },
                        endBindingElementId: { type: "string", description: "Element ID this arrow ends at" },
                      },
                      required: ["id", "type", "x", "y", "width", "height"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["elements"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_diagram" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No diagram elements returned from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const rawElements = parsed.elements || [];

    // Transform raw elements into proper Excalidraw format
    const excalidrawElements = rawElements.map((el: any) => {
      const base = {
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        angle: 0,
        strokeColor: el.strokeColor || "#e2e8f0",
        backgroundColor: el.backgroundColor || "transparent",
        fillStyle: el.fillStyle || "solid",
        strokeWidth: 2,
        roughness: 0,
        opacity: 100,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 100000),
        isDeleted: false,
        groupIds: [],
        boundElements: [],
        locked: false,
      };

      if (el.type === "text") {
        return {
          ...base,
          text: el.text || "",
          fontSize: el.fontSize || 16,
          fontFamily: 1,
          textAlign: "center",
          verticalAlign: "middle",
          baseline: 0,
        };
      }

      if (el.type === "arrow" || el.type === "line") {
        return {
          ...base,
          points: [[0, 0], [el.width, el.height]],
          startBinding: el.startBindingElementId
            ? { elementId: el.startBindingElementId, focus: 0, gap: 5 }
            : null,
          endBinding: el.endBindingElementId
            ? { elementId: el.endBindingElementId, focus: 0, gap: 5 }
            : null,
          lastCommittedPoint: null,
          startArrowhead: null,
          endArrowhead: el.type === "arrow" ? "arrow" : null,
        };
      }

      return base;
    });

    // Add text labels as bound text elements for shapes
    const textElements: any[] = [];
    for (const el of rawElements) {
      if (el.text && !["text", "arrow", "line"].includes(el.type)) {
        const textId = `${el.id}_text`;
        textElements.push({
          id: textId,
          type: "text",
          x: el.x + 10,
          y: el.y + el.height / 2 - 10,
          width: el.width - 20,
          height: 20,
          angle: 0,
          strokeColor: "#e2e8f0",
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
          roughness: 0,
          opacity: 100,
          seed: Math.floor(Math.random() * 100000),
          version: 1,
          versionNonce: Math.floor(Math.random() * 100000),
          isDeleted: false,
          groupIds: [],
          boundElements: [],
          locked: false,
          text: el.text,
          fontSize: el.fontSize || 16,
          fontFamily: 1,
          textAlign: "center",
          verticalAlign: "middle",
          baseline: 0,
          containerId: el.id,
        });

        // Update the parent shape to reference the bound text
        const shape = excalidrawElements.find((e: any) => e.id === el.id);
        if (shape) {
          shape.boundElements = [{ id: textId, type: "text" }];
        }
      }
    }

    const allElements = [...excalidrawElements, ...textElements];

    return new Response(JSON.stringify({ elements: allElements }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diagram error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
