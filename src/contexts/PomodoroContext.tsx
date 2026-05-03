import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { toLocalDateKey } from "@/lib/utils";

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

type PomodoroPhase = "focus" | "shortBreak" | "longBreak";

interface PomodoroState {
  settings: PomodoroSettings;
  updateSettings: (s: Partial<PomodoroSettings>) => void;
  timeLeft: number;
  isRunning: boolean;
  phase: PomodoroPhase;
  completedInCycle: number;
  totalToday: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  progress: number;
}

const SETTINGS_KEY = "pomodoro-settings";
const TIMER_STATE_KEY = "pomodoro-timer-state";

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

const XP_PER_SESSION = 10;
const XP_CYCLE_BONUS = 50;

const PomodoroContext = createContext<PomodoroState | undefined>(undefined);

function loadSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function phaseDuration(phase: PomodoroPhase, settings: PomodoroSettings): number {
  if (phase === "focus") return settings.focusMinutes * 60;
  if (phase === "shortBreak") return settings.shortBreakMinutes * 60;
  return settings.longBreakMinutes * 60;
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings);
  const [phase, setPhase] = useState<PomodoroPhase>("focus");
  const [timeLeft, setTimeLeft] = useState(() => phaseDuration("focus", loadSettings()));
  const [isRunning, setIsRunning] = useState(false);
  const [completedInCycle, setCompletedInCycle] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Persist timer state to localStorage for page refresh resilience
  useEffect(() => {
    if (isRunning) {
      localStorage.setItem(TIMER_STATE_KEY, JSON.stringify({
        phase, timeLeft, completedInCycle, isRunning: true, savedAt: Date.now(),
      }));
    }
  }, [timeLeft, phase, completedInCycle, isRunning]);

  // Restore timer state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIMER_STATE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (!state.isRunning) return;
      const elapsed = Math.floor((Date.now() - state.savedAt) / 1000);
      const remaining = state.timeLeft - elapsed;
      if (remaining > 0) {
        setPhase(state.phase);
        setTimeLeft(remaining);
        setCompletedInCycle(state.completedInCycle);
        setIsRunning(true);
      } else {
        localStorage.removeItem(TIMER_STATE_KEY);
      }
    } catch {
      localStorage.removeItem(TIMER_STATE_KEY);
    }
  }, []);

  // Fetch today's session count
  useEffect(() => {
    if (!user) return;
    const today = toLocalDateKey(new Date());
    supabase
      .from("pomodoro_sessions")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("created_at", `${today}T00:00:00`)
      .then(({ count }) => {
        if (count !== null) setTotalToday(count);
      });
  }, [user]);

  const completePhase = useCallback(async () => {
    setIsRunning(false);
    localStorage.removeItem(TIMER_STATE_KEY);

    if (phase === "focus") {
      const newCompleted = completedInCycle + 1;
      setCompletedInCycle(newCompleted);
      setTotalToday((t) => t + 1);

      // Award XP
      let xp = XP_PER_SESSION;
      const isCycleComplete = newCompleted >= settings.sessionsBeforeLongBreak;
      if (isCycleComplete) xp += XP_CYCLE_BONUS;

      if (user) {
        // Save session to DB
        const { data: insertedSession } = await supabase
          .from("pomodoro_sessions")
          .insert({
            user_id: user.id,
            session_length: settings.focusMinutes,
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: xp,
            cycle_position: newCompleted,
          })
          .select("id")
          .single();

        // Award XP via server-validated claim RPC
        if (insertedSession?.id) {
          await (supabase.rpc as any)("claim_pomodoro_xp", { p_session_id: insertedSession.id });
        }
        await supabase.rpc("update_streak", { p_user_id: user.id });

        // Update study_sessions for today
        const today = toLocalDateKey(new Date());
        const { data: existing } = await supabase
          .from("study_sessions")
          .select("id, study_minutes, xp_earned")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle();

        if (existing) {
          await supabase.from("study_sessions").update({
            study_minutes: existing.study_minutes + settings.focusMinutes,
            xp_earned: existing.xp_earned + xp,
          }).eq("id", existing.id);
        } else {
          await supabase.from("study_sessions").insert({
            user_id: user.id,
            date: today,
            study_minutes: settings.focusMinutes,
            xp_earned: xp,
          });
        }

        // Update study_activity for pomodoro count
        const { data: activityRow } = await supabase
          .from("study_activity")
          .select("id, active_minutes, pomodoro_sessions")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle();

        if (activityRow) {
          const newSessions = activityRow.pomodoro_sessions + 1;
          const tScore = activityRow.active_minutes >= 300 ? 4 : activityRow.active_minutes >= 180 ? 3 : activityRow.active_minutes >= 60 ? 2 : activityRow.active_minutes >= 20 ? 1 : 0;
          const pScore = newSessions >= 10 ? 4 : newSessions >= 7 ? 3 : newSessions >= 4 ? 2 : newSessions >= 1 ? 1 : 0;
          await supabase.from("study_activity").update({
            pomodoro_sessions: newSessions,
            productivity_score: Math.round((tScore + pScore) / 2),
          }).eq("id", activityRow.id);
        } else {
          const pScore = 1;
          await supabase.from("study_activity").insert({
            user_id: user.id,
            date: today,
            pomodoro_sessions: 1,
            productivity_score: pScore,
          });
        }
      }

      if (isCycleComplete) {
        toast.success(`Pomodoro Streak! +${XP_PER_SESSION} XP + ${XP_CYCLE_BONUS} Bonus XP 🎉`);
        setCompletedInCycle(0);
        setPhase("longBreak");
        setTimeLeft(settings.longBreakMinutes * 60);
      } else {
        toast.success(`Pomodoro Complete! +${XP_PER_SESSION} XP`);
        setPhase("shortBreak");
        setTimeLeft(settings.shortBreakMinutes * 60);
      }
    } else {
      // Break ended
      toast.info("Break over! Time to focus 🧠");
      setPhase("focus");
      setTimeLeft(settings.focusMinutes * 60);
    }
  }, [phase, completedInCycle, settings, user]);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          completePhase();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, completePhase]);

  const updateSettings = useCallback((partial: Partial<PomodoroSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      // If not running, update timeLeft to match new focus duration
      if (!isRunning && phase === "focus") {
        setTimeLeft(next.focusMinutes * 60);
      }
      return next;
    });
  }, [isRunning, phase]);

  const start = () => setIsRunning(true);
  const pause = () => {
    setIsRunning(false);
    localStorage.removeItem(TIMER_STATE_KEY);
  };
  const reset = () => {
    setIsRunning(false);
    setPhase("focus");
    setTimeLeft(settings.focusMinutes * 60);
    setCompletedInCycle(0);
    localStorage.removeItem(TIMER_STATE_KEY);
  };
  const skip = () => {
    setIsRunning(false);
    localStorage.removeItem(TIMER_STATE_KEY);
    if (phase === "focus") {
      // Skip focus without awarding XP
      const nextPhase = completedInCycle + 1 >= settings.sessionsBeforeLongBreak ? "longBreak" : "shortBreak";
      setPhase(nextPhase);
      setTimeLeft(phaseDuration(nextPhase, settings));
    } else {
      setPhase("focus");
      setTimeLeft(settings.focusMinutes * 60);
    }
  };

  const totalDuration = phaseDuration(phase, settings);
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

  return (
    <PomodoroContext.Provider value={{
      settings, updateSettings, timeLeft, isRunning, phase, completedInCycle, totalToday,
      start, pause, reset, skip, progress,
    }}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider");
  return ctx;
}
