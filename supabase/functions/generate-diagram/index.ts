import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DIAGRAM_PROMPTS: Record<string, string> = {
  flowchart: `You are an expert at creating flowchart diagrams. Generate a flowchart using rectangles for steps and arrows connecting them. Use a top-to-bottom layout with consistent spacing. Each rectangle should be 200px wide and 60px tall. Start at y=100 and space elements 120px apart vertically. Use strokeColor "#e2e8f0" and backgroundColor "#1e293b" for rectangles.`,
  mindmap: `You are an expert at creating mind map diagrams. Generate a mind map using ellipses for nodes and lines connecting them. Place the central topic at center (x=400, y=300) with branches radiating outward. Use ellipses 180px wide and 80px tall. Use strokeColor "#e2e8f0" and backgroundColor "#1e293b" for nodes.`,
  diagram: `You are an expert at creating educational diagrams for any subject (data structures, algorithms, processes, biology, math, etc). Pick the layout that best matches the request and follow these layout references precisely. Use strokeColor "#1e293b" and backgroundColor "#ffffff" or light fills for shapes (the canvas is white).

LAYOUT REFERENCES:
- Array: a single horizontal row of equal rectangles (60x60) with NO gap between them. Place small text labels [0], [1], [2]… ABOVE each cell (y = cell_y - 25). Put the value text inside each cell.
- Singly linked list: rectangles (80x50) spaced 60px apart horizontally. Draw EXACTLY ONE arrow from the right edge of each node to the left edge of the NEXT node — do NOT draw a reverse arrow. Add a text element "NULL" after the last node's arrow. For N nodes, there are exactly N-1 arrows total (plus optional final arrow to NULL).
- Doubly linked list: same as singly linked list but with TWO arrows between each pair of nodes (one forward, one back), placed slightly offset vertically so they don't overlap.
- Stack: vertical column of rectangles (120x50) stacked with no gap. Add a "TOP" text label to the LEFT of the topmost rectangle.
- Queue: horizontal row of rectangles (80x50) with no gap. Add "FRONT" text label to the LEFT of the first cell and "REAR" text label to the RIGHT of the last cell.
- Tree / BST / Binary tree: ellipses (60x60) arranged in horizontal levels. ROOT at center-top (e.g. x=400, y=80). LEVEL 2: two children at (x=280, y=200) and (x=520, y=200). LEVEL 3 (if 4 grandchildren): (x=200,y=320), (x=360,y=320), (x=440,y=320), (x=600,y=320). Each child must be horizontally OFFSET from its parent — never directly below. Connect every parent to its children with a "line" element going from parent center to child center. Put numeric values inside each node (e.g. "8", "3", "10").
- Graph: ellipses (60x60) placed at varied positions (not in a strict grid). Connect related nodes with line elements; you may add small text labels near edges for weights.
- Mind map: one central ellipse (180x80) at the center; 4-6 child ellipses radiating outward, each connected to the center with a line.
- Flowchart: top-down layout. Use rectangles for process steps and diamonds for decisions. Connect with downward arrows. Start at y=80, vertical spacing 100px.

GENERAL RULES:
- Every shape that has a label MUST include the "text" field — it will be auto-bound as a centered label.
- Arrows MUST set startBindingElementId and endBindingElementId so they snap to shapes.
- Give every element a unique id string.
- Use a clean, readable layout with consistent spacing — no overlapping shapes.`,
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

Generate Excalidraw-compatible elements for the following request. Return elements using the tool provided.

CRITICAL RULES:
- Every shape (rectangle, ellipse, diamond) that needs a label MUST include a "text" field with the label string. The label will be auto-bound and centered.
- For arrow/line elements: x,y is the START point. width is the HORIZONTAL DELTA (can be negative) from start to end. height is the VERTICAL DELTA (can be negative) from start to end. Example: arrow from (100,50) to (300,50) → x:100, y:50, width:200, height:0.
- Arrows connecting shapes MUST set startBindingElementId and endBindingElementId (the shape ids), and the start/end points should be at the edges of those shapes so the arrows visually touch the boxes.
- Give every element a unique id string. Reference shape ids exactly in startBindingElementId/endBindingElementId.
- Do NOT create separate "text" elements for shape labels — put the label on the shape itself via the "text" field.`;

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
        strokeColor: el.strokeColor || "#1e293b",
        backgroundColor: el.backgroundColor || "#ffffff",
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
        // points are relative to (x,y); width/height is the delta vector
        const dx = Number(el.width) || 0;
        const dy = Number(el.height) || 0;
        return {
          ...base,
          // Use 0 width/height so Excalidraw uses points for the bounding box
          width: Math.abs(dx),
          height: Math.abs(dy),
          points: [[0, 0], [dx, dy]],
          startBinding: el.startBindingElementId
            ? { elementId: el.startBindingElementId, focus: 0, gap: 8 }
            : null,
          endBinding: el.endBindingElementId
            ? { elementId: el.endBindingElementId, focus: 0, gap: 8 }
            : null,
          lastCommittedPoint: null,
          startArrowhead: null,
          endArrowhead: el.type === "arrow" ? "arrow" : null,
        };
      }

      return base;
    });

    // Register arrow bindings on their target shapes so Excalidraw snaps them
    for (const el of rawElements) {
      if ((el.type === "arrow" || el.type === "line")) {
        for (const targetId of [el.startBindingElementId, el.endBindingElementId]) {
          if (!targetId) continue;
          const target = excalidrawElements.find((e: any) => e.id === targetId);
          if (target) {
            target.boundElements = target.boundElements || [];
            if (!target.boundElements.some((b: any) => b.id === el.id)) {
              target.boundElements.push({ id: el.id, type: el.type });
            }
          }
        }
      }
    }

    // Add text labels as bound text elements for shapes
    const textElements: any[] = [];
    for (const el of rawElements) {
      if (el.text && !["text", "arrow", "line"].includes(el.type)) {
        const textId = `${el.id}_text`;
        const fontSize = el.fontSize || 18;
        const lineHeight = 1.25;
        const textHeight = fontSize * lineHeight;
        textElements.push({
          id: textId,
          type: "text",
          // Centered inside the container — Excalidraw will auto-center bound text
          x: el.x,
          y: el.y + el.height / 2 - textHeight / 2,
          width: el.width,
          height: textHeight,
          angle: 0,
          strokeColor: "#1e293b",
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
          originalText: el.text,
          fontSize,
          fontFamily: 1,
          textAlign: "center",
          verticalAlign: "middle",
          baseline: Math.round(fontSize * 0.85),
          lineHeight,
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
      JSON.stringify({ error: "Failed to generate diagram. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
