import { useCallback } from "react";
import { useDataChannel } from "@livekit/components-react";

function extractElements(value: unknown): unknown[] | null {
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
  useDataChannel(
    useCallback((m) => {
    if (!m?.payload) return;
    try {
      const text = new TextDecoder().decode(m.payload);
      const parsed = JSON.parse(text);
      const elements = extractElements(parsed);
      console.log("[WhiteboardDataBridge] received from agent:", {
        topic: m.topic,
        bytes: m.payload.byteLength,
        elementCount: elements?.length ?? 0,
      });
      if (!elements || elements.length === 0) return;
      window.dispatchEvent(
        new CustomEvent("aria:whiteboard-draw", { detail: { elements } }),
      );
    } catch (err) {
      console.warn("[WhiteboardDataBridge] failed to parse payload", err);
    }
    }, []),
  );

  return null;
}
