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
          const { data, error } = await supabase.functions.invoke("generate-diagram", {
            body: { prompt, diagramType: inferDiagramType(prompt) },
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
