import { useEffect, useRef } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  DataPacket_Kind,
  Participant,
  RemoteParticipant,
  TrackPublication,
  TranscriptionSegment,
} from "livekit-client";

export function extractElements(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.elements)) return record.elements;
  if (Array.isArray(record.excalidrawElements)) return record.excalidrawElements;
  if (Array.isArray(record.diagram)) return record.diagram;
  return (
    extractElements(record.payload) ??
    extractElements(record.data) ??
    extractElements(record.scene)
  );
}

export function isWhiteboardDiagramCommand(text: string): boolean {
  const normalized = text.toLowerCase();
  // Don't trigger for flashcard/quiz/summary requests
  if (/flashcard|flash card|quiz|summary|summari[sz]e|note/.test(normalized)) return false;
  const mentionsWhiteboard = /white\s*board|canvas|board/.test(normalized);
  const asksForDrawing = /draw|diagram|flow\s*chart|flowchart|mind\s*map|mindmap|chart|sketch|show|visuali[sz]e|put|add|create|make/.test(normalized);
  return mentionsWhiteboard && asksForDrawing;
}

export function isWhiteboardPageDrawingCommand(text: string): boolean {
  const normalized = text.toLowerCase();
  // Don't trigger whiteboard for flashcard/quiz/summary requests
  if (/flashcard|flash card|quiz|summary|summari[sz]e|note/.test(normalized)) return false;
  const asksForDrawing = /draw|diagram|flow\s*chart|flowchart|mind\s*map|mindmap|chart|sketch|show|visuali[sz]e|put|add|create|make/.test(normalized);
  const drawableSubject = /array|linked\s*list|link\s*list|stack|queue|tree|b[io]n+ary|bst|graph|flow\s*chart|flowchart|mind\s*map|mindmap/.test(normalized);
  return asksForDrawing && drawableSubject;
}

export function isBinaryTreePrompt(text: string): boolean {
  const normalized = text.toLowerCase();
  return /\b(?:b[io]n+ary|bst|tree)\b/.test(normalized) && !/linked\s*list|link\s*list/.test(normalized);
}

export function isLinkedListPrompt(text: string): boolean {
  const normalized = text.toLowerCase();
  return /linked\s*list|link\s*list/.test(normalized);
}

export function isDoublyLinkedListPrompt(text: string): boolean {
  const normalized = text.toLowerCase();
  return isLinkedListPrompt(normalized) && /\b(doubly|double|two[\s-]?way|bidirectional|two[\s-]?direction)\b/.test(normalized);
}

export function isQuizPrompt(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    /\b(quiz|test)\b.*\b(me|on|about|over|of|with)\b/.test(normalized) ||
    /\b(start|give|make|create|do|take|run|ask|begin)\b.*\bquiz\b/.test(normalized) ||
    /\bask\s+me\b.*\b(question|about|on)\b/.test(normalized)
  );
}

export function extractQuizTopic(text: string): string {
  const normalized = text.toLowerCase().trim();
  const patterns = [
    // "quiz/test me on X", "quiz/test me about X", "quiz me of X", "quiz me with X"
    /(?:quiz|test)\s+me\s+(?:on|about|over|of|with|regarding)\s+(.+?)(?:\s+please|[.?!]|$)/,
    // "take/give/make/create/do/run/start/ask a quiz of/on/about me on X"  → grab last "on/about/of X"
    /(?:start|give|make|create|do|take|run|ask|begin)\s+(?:me\s+)?(?:a\s+)?(?:quick\s+)?quiz\s+(?:of\s+me\s+)?(?:on|about|over|of|with|regarding)\s+(.+?)(?:\s+please|[.?!]|$)/,
    // bare "quiz on X"
    /\bquiz\s+(?:on|about|over|of|with|regarding)\s+(.+?)(?:\s+please|[.?!]|$)/,
    // "ask me about X"
    /\bask\s+me\s+(?:questions?\s+)?(?:on|about|regarding)\s+(.+?)(?:\s+please|[.?!]|$)/,
  ];
  for (const re of patterns) {
    const m = normalized.match(re);
    if (m && m[1]) {
      return m[1]
        .trim()
        .replace(/^(the|a|an)\s+/, "")
        .replace(/[.?!,]+$/, "");
    }
  }
  return normalized
    .replace(/\b(hey|hi|okay|ok)\s+aria\b/g, "")
    .replace(/\b(please|can you|could you|would you)\b/g, "")
    .replace(/\b(start|give|make|create|do|take|run|ask|begin)\s+(me\s+)?(a\s+)?(quick\s+)?\b/g, "")
    .replace(/\b(a|an|the)\s+quiz\b/g, "")
    .replace(/\b(quiz|test)\s+me\b/g, "")
    .replace(/\b(quiz|test)\b/g, "")
    .replace(/\b(on|about|over|of|with|regarding|me)\b/g, "")
    .replace(/[.?!,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isAgentWhiteboardClaim(text: string): boolean {
  const normalized = text.toLowerCase();
  return /white\s*board|canvas|board/.test(normalized) && /i('|’)ve|i have|i just|i/.test(normalized) && /drew|drawn|added|put|placed|created|made/.test(normalized);
}

export function inferDiagramType(text: string): "flowchart" | "mindmap" | "diagram" {
  const normalized = text.toLowerCase();
  if (/flow\s*chart|flowchart|process|steps?|sequence/.test(normalized)) return "flowchart";
  if (/mind\s*map|mindmap|brainstorm|branches|concept map/.test(normalized)) return "mindmap";
  return "diagram";
}

/**
 * Strips voice filler words and command verbs so the AI receives just
 * the subject of what to draw. If the cleaned subject is too short, it
 * gets expanded into a more descriptive prompt so the diagram model has
 * enough information to lay out a useful figure.
 */
export function cleanVoicePrompt(raw: string): string {
  let text = ` ${raw.toLowerCase()} `;

  // Remove common filler phrases (longer phrases first to avoid partial leftovers)
  const fillerPhrases = [
    "hey aria", "hi aria", "okay aria", "ok aria", "aria",
    "on the whiteboard", "on the white board", "on the canvas", "on the board",
    "to the whiteboard", "to the white board", "to the canvas", "to the board",
    "for me", "please", "can you", "could you", "would you", "will you",
    "i want you to", "i need you to", "i'd like you to",
    "show me", "draw me", "make me",
    "draw", "sketch", "show", "make", "put", "add", "create", "build",
    "visualize", "visualise", "display", "render", "generate",
    "a diagram of", "a picture of", "an image of",
  ];
  for (const phrase of fillerPhrases) {
    text = text.split(` ${phrase} `).join(" ");
  }

  let cleaned = text.replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim();
  const cleanedLower = cleaned.toLowerCase();

  if (isBinaryTreePrompt(cleanedLower)) {
    return `A binary tree with 7 nodes arranged in 3 levels: 1 root at the top, 2 children below it offset left and right, and 4 grandchildren at the bottom. Each parent connects to its two children with lines. Place numeric values inside each node.`;
  }

  // If the cleaned subject is too thin, expand it with a one-line description
  // so the diagram generator has something concrete to lay out.
  if (cleaned.split(/\s+/).filter(Boolean).length < 3) {
    const subject = cleaned || raw.trim();
    const lower = subject.toLowerCase();
    if (/array/.test(lower)) {
      cleaned = `An array of 6 cells with index labels 0-5 above each cell and example values inside`;
    } else if (/linked\s*list/.test(lower)) {
      cleaned = `A singly linked list of 4 nodes with arrows between them and NULL after the last node`;
    } else if (/stack/.test(lower)) {
      cleaned = `A stack with 4 stacked rectangles and a TOP label on the top element`;
    } else if (/queue/.test(lower)) {
      cleaned = `A queue with 4 horizontal cells and FRONT and REAR labels at the ends`;
    } else if (/tree|bst|binary/.test(lower)) {
      cleaned = `A binary tree with 7 nodes arranged in 3 levels: 1 root at the top, 2 children below it offset left and right, and 4 grandchildren at the bottom. Each parent connects to its two children with lines. Place numeric values inside each node.`;
    } else if (/graph/.test(lower)) {
      cleaned = `A graph with 5 labeled nodes connected by lines representing edges`;
    } else if (/mind\s*map/.test(lower)) {
      cleaned = `A mind map with a central topic "${subject}" and 4 branches radiating outward`;
    } else if (/flow\s*chart|flowchart/.test(lower)) {
      cleaned = `A top-down flowchart with start, two process steps, a decision diamond, and an end`;
    } else {
      cleaned = `A clear labeled diagram of ${subject} with shapes and connecting lines`;
    }
  }

  return cleaned;
}

export function createBinaryTreeElements(): unknown[] {
  const prefix = `binary_tree_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const base = (id: string, type: string, x: number, y: number, width: number, height: number) => ({
    id: `${prefix}_${id}`,
    type,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: "#1e293b",
    backgroundColor: type === "ellipse" ? "#f8fafc" : "transparent",
    fillStyle: "solid",
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
  });
  const nodes = [
    { id: "n8", label: "8", x: 370, y: 60 },
    { id: "n3", label: "3", x: 250, y: 190 },
    { id: "n10", label: "10", x: 490, y: 190 },
    { id: "n1", label: "1", x: 170, y: 320 },
    { id: "n6", label: "6", x: 330, y: 320 },
    { id: "n9", label: "9", x: 450, y: 320 },
    { id: "n14", label: "14", x: 610, y: 320 },
  ];
  const line = (id: string, from: typeof nodes[number], to: typeof nodes[number]) => {
    const ax = from.x + 30;
    const ay = from.y + 60;
    const bx = to.x + 30;
    const by = to.y;
    const x = Math.min(ax, bx);
    const y = Math.min(ay, by);
    return {
      ...base(id, "line", x, y, Math.abs(bx - ax), Math.abs(by - ay)),
      points: [[ax - x, ay - y], [bx - x, by - y]],
      startBinding: null,
      endBinding: null,
      lastCommittedPoint: null,
      startArrowhead: null,
      endArrowhead: null,
    };
  };
  const text = (id: string, label: string, x: number, y: number) => ({
    ...base(`${id}_text`, "text", x + 14, y + 18, 32, 24),
    text: label,
    fontSize: 18,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    baseline: 18,
    containerId: null,
  });

  return [
    line("l8_3", nodes[0], nodes[1]),
    line("l8_10", nodes[0], nodes[2]),
    line("l3_1", nodes[1], nodes[3]),
    line("l3_6", nodes[1], nodes[4]),
    line("l10_9", nodes[2], nodes[5]),
    line("l10_14", nodes[2], nodes[6]),
    ...nodes.map((node) => base(node.id, "ellipse", node.x, node.y, 60, 60)),
    ...nodes.map((node) => text(node.id, node.label, node.x, node.y)),
  ];
}

export function createLinkedListElements(opts: { doubly: boolean; count?: number } = { doubly: false }): unknown[] {
  const doubly = !!opts.doubly;
  const count = Math.max(3, Math.min(opts.count ?? 4, 6));
  const prefix = `linked_list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const nodeWidth = 90;
  const nodeHeight = 60;
  const gap = 60;
  const startX = 80;
  const baseY = 180;

  const base = (id: string, type: string, x: number, y: number, width: number, height: number) => ({
    id: `${prefix}_${id}`,
    type,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: "#1e293b",
    backgroundColor: type === "rectangle" ? "#f8fafc" : "transparent",
    fillStyle: "solid",
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
  });

  const text = (id: string, label: string, x: number, y: number, width: number, fontSize = 16) => ({
    ...base(id, "text", x, y, width, fontSize + 6),
    text: label,
    fontSize,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    baseline: fontSize - 2,
    containerId: null,
  });

  const arrow = (id: string, fromX: number, fromY: number, toX: number, toY: number) => {
    const x = Math.min(fromX, toX);
    const y = Math.min(fromY, toY);
    return {
      ...base(id, "arrow", x, y, Math.abs(toX - fromX), Math.abs(toY - fromY)),
      points: [[fromX - x, fromY - y], [toX - x, toY - y]],
      startBinding: null,
      endBinding: null,
      lastCommittedPoint: null,
      startArrowhead: null,
      endArrowhead: "arrow",
    };
  };

  const elements: unknown[] = [];

  // Title
  elements.push(text("title", doubly ? "Doubly Linked List" : "Singly Linked List", startX, 90, nodeWidth * count + gap * (count - 1), 20));

  // Nodes (rectangles + value labels)
  for (let i = 0; i < count; i++) {
    const x = startX + i * (nodeWidth + gap);
    elements.push(base(`n${i}`, "rectangle", x, baseY, nodeWidth, nodeHeight));
    elements.push(text(`n${i}_v`, String((i + 1) * 10), x, baseY + nodeHeight / 2 - 10, nodeWidth, 18));
  }

  // Arrows between adjacent nodes
  for (let i = 0; i < count - 1; i++) {
    const fromX = startX + i * (nodeWidth + gap) + nodeWidth;
    const toX = startX + (i + 1) * (nodeWidth + gap);
    if (doubly) {
      // forward arrow (slightly above center)
      elements.push(arrow(`a_fwd_${i}`, fromX, baseY + nodeHeight / 2 - 8, toX, baseY + nodeHeight / 2 - 8));
      // back arrow (slightly below center)
      elements.push(arrow(`a_back_${i}`, toX, baseY + nodeHeight / 2 + 8, fromX, baseY + nodeHeight / 2 + 8));
    } else {
      elements.push(arrow(`a_${i}`, fromX, baseY + nodeHeight / 2, toX, baseY + nodeHeight / 2));
    }
  }

  // NULL labels
  if (doubly) {
    elements.push(text("null_left", "NULL", startX - gap, baseY + nodeHeight / 2 - 10, gap - 10, 16));
    elements.push(arrow("a_null_left", startX, baseY + nodeHeight / 2 + 8, startX - gap + 30, baseY + nodeHeight / 2 + 8));
    const lastX = startX + (count - 1) * (nodeWidth + gap) + nodeWidth;
    elements.push(text("null_right", "NULL", lastX + 10, baseY + nodeHeight / 2 - 10, gap - 10, 16));
    elements.push(arrow("a_null_right", lastX, baseY + nodeHeight / 2 - 8, lastX + gap - 30, baseY + nodeHeight / 2 - 8));
  } else {
    const lastX = startX + (count - 1) * (nodeWidth + gap) + nodeWidth;
    elements.push(text("null_right", "NULL", lastX + 10, baseY + nodeHeight / 2 - 10, gap - 10, 16));
  }

  // Head label
  elements.push(text("head_label", "HEAD", startX, baseY - 30, nodeWidth, 14));
  if (doubly) {
    const lastX = startX + (count - 1) * (nodeWidth + gap);
    elements.push(text("tail_label", "TAIL", lastX, baseY - 30, nodeWidth, 14));
  }

  return elements;
}

/**
 * Bridges LiveKit data messages from the Python agent (Aria) to the
 * Whiteboard page via a window event. Mounted inside <LiveKitRoom>.
 *
 * The Python agent should publish JSON like { elements: [...] } on either
 * the topic "whiteboard.draw" or "whiteboard". Both shapes are accepted:
 *   - { elements: [...] }
 *   - [ ...elements ]
 */
export function WhiteboardDataBridge() {
  const room = useRoomContext();
  const processedSegmentIds = useRef<Set<string>>(new Set());
  const pendingFallbackTimer = useRef<number | null>(null);
  const lastDrawDataAt = useRef(0);
  const lastUserWhiteboardPrompt = useRef<{ text: string; at: number } | null>(null);
  const fallbackInFlight = useRef(false);
  const quizInFlight = useRef(false);

  useEffect(() => {
    const ensureWhiteboardRoute = () => {
      if (typeof window === "undefined") return;
      if (!window.location.pathname.startsWith("/whiteboard")) {
        console.log("[WhiteboardDataBridge] navigating to /whiteboard for incoming draw");
        // Use history API directly so we don't need access to react-router here
        window.history.pushState({}, "", "/whiteboard");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    };

    const handleVoiceCommand = (text: string, isLocalUser: boolean) => {
      if (!text) return;

      // Quiz intent — user asks Aria to start a quiz
      if (isLocalUser && isQuizPrompt(text) && !quizInFlight.current) {
        const topic = extractQuizTopic(text);
        console.log("[WhiteboardDataBridge] detected voice quiz prompt:", { text, topic });
        if (!topic || topic.length < 2) {
          toast.info("What topic should I quiz you on?", {
            description: "Try: \"quiz me on photosynthesis\"",
          });
          return;
        }
        quizInFlight.current = true;
        const loadingId = toast.loading(`Generating a quiz on "${topic}"…`);
        (async () => {
          try {
            const { data, error } = await supabase.functions.invoke("start-voice-quiz", {
              body: { topic, difficulty: "medium", questionCount: 5 },
            });
            if (error) throw error;
            const details = (data as any)?.error;
            if (details) throw new Error(details);
            console.log("[WhiteboardDataBridge] voice quiz started:", data);
            toast.success("Quiz ready!", { id: loadingId, description: `Topic: ${topic}` });
          } catch (err: any) {
            console.warn("[WhiteboardDataBridge] start-voice-quiz failed", err);
            const msg =
              err?.context?.body
                ? (() => { try { return JSON.parse(err.context.body)?.details || JSON.parse(err.context.body)?.error; } catch { return null; } })()
                : null;
            toast.error("Couldn't generate quiz", {
              id: loadingId,
              description: msg || err?.message || "Please try again in a moment.",
            });
          } finally {
            window.setTimeout(() => { quizInFlight.current = false; }, 4000);
          }
        })();
        return;
      }


      if (isLocalUser && (isWhiteboardDiagramCommand(text) || isWhiteboardPageDrawingCommand(text))) {
        lastUserWhiteboardPrompt.current = { text, at: Date.now() };
        if (tryDeterministicTemplate(text)) return;
        scheduleDiagramFallback(text, "user-whiteboard-command");
        return;
      }

      const recentUserPrompt = lastUserWhiteboardPrompt.current;
      if (
        !isLocalUser &&
        isAgentWhiteboardClaim(text) &&
        (!recentUserPrompt || Date.now() - recentUserPrompt.at < 60_000)
      ) {
        if (recentUserPrompt?.text && tryDeterministicTemplate(recentUserPrompt.text)) return;
        scheduleDiagramFallback(recentUserPrompt?.text ?? text, "agent-claimed-whiteboard-draw");
      }
    };

    const dispatchElements = (elements: unknown[], source: string) => {
      ensureWhiteboardRoute();
      lastDrawDataAt.current = Date.now();
      const fire = () => window.dispatchEvent(
        new CustomEvent("aria:whiteboard-draw", { detail: { elements, source } }),
      );
      // give the route + Excalidraw API time to mount when we just navigated
      fire();
      window.setTimeout(fire, 400);
      window.setTimeout(fire, 1200);
    };

    const scheduleDiagramFallback = (prompt: string, reason: string) => {
      if (typeof window === "undefined") return;
      if (pendingFallbackTimer.current) return;

      const scheduledAt = Date.now();
      console.log("[WhiteboardDataBridge] queued diagram fallback:", { reason, prompt });

      pendingFallbackTimer.current = window.setTimeout(async () => {
        pendingFallbackTimer.current = null;
        if (lastDrawDataAt.current >= scheduledAt || fallbackInFlight.current) return;

        fallbackInFlight.current = true;
        try {
          const cleanedPrompt = cleanVoicePrompt(prompt);
          console.log("[WhiteboardDataBridge] sending to generate-diagram:", {
            originalPrompt: prompt,
            cleanedPrompt,
            diagramType: "diagram",
          });
          const { data, error } = await supabase.functions.invoke("generate-diagram", {
            body: { prompt: cleanedPrompt, diagramType: "diagram" },
          });
          if (error) throw error;
          const elements = extractElements(data);
          if (!elements?.length) throw new Error("No fallback diagram elements returned");
          console.log("[WhiteboardDataBridge] applying generated fallback diagram:", {
            reason,
            elementCount: elements.length,
          });
          dispatchElements(elements, "voice-transcription-fallback");
        } catch (err) {
          console.warn("[WhiteboardDataBridge] fallback diagram generation failed", err);
        } finally {
          fallbackInFlight.current = false;
        }
      }, 3500);
    };

    /** Returns true if a deterministic template was dispatched. */
    const tryDeterministicTemplate = (prompt: string): boolean => {
      if (isLinkedListPrompt(prompt)) {
        const doubly = isDoublyLinkedListPrompt(prompt);
        console.log("[WhiteboardDataBridge] deterministic linked list:", { doubly, prompt });
        dispatchElements(createLinkedListElements({ doubly, count: 4 }), "voice-linked-list-template");
        return true;
      }
      if (isBinaryTreePrompt(prompt)) {
        console.log("[WhiteboardDataBridge] deterministic binary tree:", { prompt });
        dispatchElements(createBinaryTreeElements(), "voice-binary-tree-template");
        return true;
      }
      return false;
    };

    const handleData = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: DataPacket_Kind,
      topic?: string,
    ) => {
      try {
        const text = new TextDecoder().decode(payload);
        const parsed = JSON.parse(text);
        const elements = extractElements(parsed);
        console.log("[WhiteboardDataBridge] received from agent:", {
          topic,
          from: participant?.identity,
          bytes: payload.byteLength,
          elementCount: elements?.length ?? 0,
        });
        if (!elements || elements.length === 0) return;
        dispatchElements(elements, "livekit-data-channel");
      } catch (err) {
        console.warn("[WhiteboardDataBridge] failed to parse payload", err);
      }
    };

    const handleTranscription = (
      segments: TranscriptionSegment[],
      participant?: Participant,
      _publication?: TrackPublication,
    ) => {
      for (const segment of segments) {
        if (!segment.final || processedSegmentIds.current.has(segment.id)) continue;
        processedSegmentIds.current.add(segment.id);
        if (processedSegmentIds.current.size > 100) processedSegmentIds.current.clear();

        const text = segment.text?.trim();
        if (!text) continue;

        const isLocalUser = participant?.identity === room.localParticipant.identity;

        handleVoiceCommand(text, isLocalUser);
      }
    };

    const handleFallbackCommand = (event: Event) => {
      const text = (event as CustomEvent<{ text?: string }>).detail?.text?.trim();
      if (text) handleVoiceCommand(text, true);
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    window.addEventListener("aria:voice-command", handleFallbackCommand);
    return () => {
      if (pendingFallbackTimer.current) window.clearTimeout(pendingFallbackTimer.current);
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
      window.removeEventListener("aria:voice-command", handleFallbackCommand);
    };
  }, [room]);

  return null;
}
