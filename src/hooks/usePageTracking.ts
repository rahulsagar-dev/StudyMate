import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";

const HEARTBEAT_KEY = "sm-analytics-last-active-day";

/**
 * Records a `page_view` on every route change and one `app_open` per
 * calendar day per browser, which is what powers day-1/7/30 return rates.
 */
export function usePageTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  // One "app_open" per day per device
  useEffect(() => {
    if (!user) return;
    const today = new Date().toLocaleDateString("en-CA");
    try {
      if (localStorage.getItem(HEARTBEAT_KEY) === today) return;
      localStorage.setItem(HEARTBEAT_KEY, today);
    } catch {
      // ignore storage failures, still log the open
    }
    trackEvent("app_open", { day: today });
  }, [user]);

  // Page views
  useEffect(() => {
    if (!user) return;
    const path = location.pathname;
    if (lastPath.current === path) return;
    lastPath.current = path;
    trackEvent("page_view", {}, path);
  }, [user, location.pathname]);
}
