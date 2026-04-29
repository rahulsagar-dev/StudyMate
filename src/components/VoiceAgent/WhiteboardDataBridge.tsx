import { useEffect, useRef } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { supabase } from "@/integrations/supabase/client";
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
  const mentionsWhiteboard = /white\s*board|canvas|board/.test(normalized);
  const asksForDrawing = /draw|diagram|flow\s*chart|flowchart|mind\s*map|mindmap|chart|sketch|show|visuali[sz]e|put|add|create|make/.test(normalized);
  return mentionsWhiteboard && asksForDrawing;
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

  useEffect(() => {
    const dispatchElements = (elements: unknown[], source: string) => {
      lastDrawDataAt.current = Date.now();
      window.dispatchEvent(
        new CustomEvent("aria:whiteboard-draw", { detail: { elements, source } }),
      );
    };

    const scheduleDiagramFallback = (prompt: string, reason: string) => {
      if (typeof window === "undefined" || !window.location.pathname.startsWith("/whiteboard")) return;
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
        if (isLocalUser && isWhiteboardDiagramCommand(text)) {
          lastUserWhiteboardPrompt.current = { text, at: Date.now() };
          scheduleDiagramFallback(text, "user-whiteboard-command");
          continue;
        }

        const recentUserPrompt = lastUserWhiteboardPrompt.current;
        if (
          !isLocalUser &&
          isAgentWhiteboardClaim(text) &&
          (!recentUserPrompt || Date.now() - recentUserPrompt.at < 60_000)
        ) {
          scheduleDiagramFallback(recentUserPrompt?.text ?? text, "agent-claimed-whiteboard-draw");
        }
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    return () => {
      if (pendingFallbackTimer.current) window.clearTimeout(pendingFallbackTimer.current);
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
    };
  }, [room]);

  return null;
}
