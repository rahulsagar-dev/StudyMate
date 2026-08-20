import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "sm-analytics-session";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Fire-and-forget usage event. Never throws, never blocks the UI.
 * Only records for signed-in users (RLS requires auth.uid() = user_id).
 */
export async function trackEvent(
  eventName: string,
  details: Record<string, unknown> = {},
  path?: string,
): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) return;

    await supabase.from("app_events").insert({
      user_id: userId,
      event_name: eventName.slice(0, 64),
      path: (path ?? window.location.pathname).slice(0, 256),
      session_id: getSessionId(),
      details: details as never,
    });
  } catch {
    // analytics must never break the app
  }
}
