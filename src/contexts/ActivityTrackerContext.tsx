import { createContext, useContext, useEffect, useRef, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const BATCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const LOCAL_KEY = "active-time-pending";

interface ActivityTrackerState {
  flushNow: () => Promise<void>;
}

const ActivityTrackerContext = createContext<ActivityTrackerState | undefined>(undefined);

export function ActivityTrackerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const activeSecondsRef = useRef(0);
  const isActiveRef = useRef(true);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const batchRef = useRef<NodeJS.Timeout | null>(null);

  // Restore pending seconds from localStorage
  useEffect(() => {
    try {
      const pending = Number(localStorage.getItem(LOCAL_KEY) || 0);
      if (pending > 0) activeSecondsRef.current = pending;
    } catch {}
  }, []);

  // Track active/inactive
  useEffect(() => {
    const setActive = () => { isActiveRef.current = true; };
    const setInactive = () => { isActiveRef.current = false; };

    const onVisChange = () => {
      if (document.hidden) setInactive();
      else setActive();
    };

    document.addEventListener("visibilitychange", onVisChange);
    window.addEventListener("focus", setActive);
    window.addEventListener("blur", setInactive);

    return () => {
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("focus", setActive);
      window.removeEventListener("blur", setInactive);
    };
  }, []);

  // Tick every second when active
  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (isActiveRef.current) {
        activeSecondsRef.current += 1;
        // Cache to localStorage every 30s
        if (activeSecondsRef.current % 30 === 0) {
          localStorage.setItem(LOCAL_KEY, String(activeSecondsRef.current));
        }
      }
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const flush = useCallback(async () => {
    if (!user || activeSecondsRef.current < 60) return; // min 1 minute
    const minutes = Math.floor(activeSecondsRef.current / 60);
    activeSecondsRef.current = activeSecondsRef.current % 60; // keep remainder
    localStorage.setItem(LOCAL_KEY, String(activeSecondsRef.current));

    const today = new Date().toISOString().split("T")[0];

    // Calculate productivity score
    const timeScore = minutes >= 300 ? 4 : minutes >= 180 ? 3 : minutes >= 60 ? 2 : minutes >= 20 ? 1 : 0;

    try {
      const { data: existing } = await supabase
        .from("study_activity")
        .select("id, active_minutes, pomodoro_sessions")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        const newMinutes = existing.active_minutes + minutes;
        const tScore = newMinutes >= 300 ? 4 : newMinutes >= 180 ? 3 : newMinutes >= 60 ? 2 : newMinutes >= 20 ? 1 : 0;
        const pScore = existing.pomodoro_sessions >= 10 ? 4 : existing.pomodoro_sessions >= 7 ? 3 : existing.pomodoro_sessions >= 4 ? 2 : existing.pomodoro_sessions >= 1 ? 1 : 0;
        const prodScore = Math.round((tScore + pScore) / 2);

        await supabase
          .from("study_activity")
          .update({ active_minutes: newMinutes, productivity_score: prodScore })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("study_activity")
          .insert({
            user_id: user.id,
            date: today,
            active_minutes: minutes,
            productivity_score: timeScore,
          });
      }
    } catch (err) {
      console.error("Failed to flush activity:", err);
    }
  }, [user]);

  // Batch flush every 5 minutes
  useEffect(() => {
    batchRef.current = setInterval(flush, BATCH_INTERVAL_MS);
    return () => {
      if (batchRef.current) clearInterval(batchRef.current);
    };
  }, [flush]);

  // Flush on unload
  useEffect(() => {
    const onUnload = () => {
      localStorage.setItem(LOCAL_KEY, String(activeSecondsRef.current));
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  return (
    <ActivityTrackerContext.Provider value={{ flushNow: flush }}>
      {children}
    </ActivityTrackerContext.Provider>
  );
}

export function useActivityTracker() {
  const ctx = useContext(ActivityTrackerContext);
  if (!ctx) throw new Error("useActivityTracker must be used within ActivityTrackerProvider");
  return ctx;
}
