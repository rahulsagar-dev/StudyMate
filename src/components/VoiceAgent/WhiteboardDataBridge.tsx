import { useEffect } from "react";
import { useDataChannel } from "@livekit/components-react";

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
  const { message: msgDraw } = useDataChannel("whiteboard.draw");
  const { message: msgWb } = useDataChannel("whiteboard");

  useEffect(() => {
    const m = msgDraw ?? msgWb;
    if (!m?.payload) return;
    try {
      const text = new TextDecoder().decode(m.payload);
      const parsed = JSON.parse(text);
      const elements = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.elements)
          ? parsed.elements
          : null;
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
  }, [msgDraw, msgWb]);

  return null;
}
