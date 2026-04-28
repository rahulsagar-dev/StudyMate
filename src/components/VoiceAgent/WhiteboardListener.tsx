import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WhiteboardListenerProps {
  userId: string;
  onElementsReceived: (elements: unknown[]) => void;
}

/**
 * Invisible component that listens for whiteboard updates from the AI agent
 * via Supabase Realtime. When the Python agent inserts a new whiteboard row,
 * this picks it up and pushes the Excalidraw elements to the canvas.
 */
export function WhiteboardListener({
  userId,
  onElementsReceived,
}: WhiteboardListenerProps) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`whiteboard-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whiteboards",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[WhiteboardListener] INSERT received:", payload);
          const elements = (payload.new as { elements?: unknown })?.elements;
          if (elements && Array.isArray(elements) && elements.length > 0) {
            console.log(`[WhiteboardListener] Applying ${elements.length} elements from agent`);
            onElementsReceived(elements);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "whiteboards",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[WhiteboardListener] UPDATE received:", payload);
          const elements = (payload.new as { elements?: unknown })?.elements;
          if (elements && Array.isArray(elements) && elements.length > 0) {
            console.log(`[WhiteboardListener] Applying ${elements.length} elements from agent`);
            onElementsReceived(elements);
          }
        },
      )
      .subscribe((status) => {
        console.log(`[WhiteboardListener] Channel status: ${status} (user: ${userId})`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onElementsReceived]);

  return null;
}
