import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Sparkles, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DURATIONS = [
  { label: "25 min", value: 25 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
];

const INACTIVITY_TIMEOUT_MS = 30_000;

export default function FocusMode() {
  const { user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [pausedBySystem, setPausedBySystem] = useState(false);
  const [sessionInvalidated, setSessionInvalidated] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const wasRunningRef = useRef(false);

  const totalSeconds = selectedDuration * 60;
  const progress = hasStarted ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const clearInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, []);

  const saveSession = useCallback(async (studyMinutes: number) => {
    if (!user || studyMinutes < 1) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("study_sessions")
        .select("id, study_minutes")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("study_sessions")
          .update({ study_minutes: existing.study_minutes + studyMinutes })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("study_sessions")
          .insert({ user_id: user.id, date: today, study_minutes: studyMinutes });
      }

      const xpAmount = Math.floor((studyMinutes / 30) * 25);
      let awarded = xpAmount;
      if (xpAmount > 0) {
        const { data } = await (supabase.rpc as any)("claim_focus_session_xp", { p_minutes: studyMinutes });
        if (data && typeof data === "object" && "xp" in data) awarded = (data as any).xp ?? 0;
      }
      // streak handled inside claim_focus_session_xp

      toast.success(`Focus session saved! +${xpAmount} XP earned`);
    } catch {
      toast.error("Failed to save session");
    }
  }, [user]);

  // Timer tick
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (!sessionInvalidated) {
        saveSession(selectedDuration);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, selectedDuration, saveSession, sessionInvalidated]);

  // Visibility & blur detection
  useEffect(() => {
    const handleHidden = () => {
      if (!wasRunningRef.current && !isRunning) return;
      if (isRunning) {
        wasRunningRef.current = true;
        setIsRunning(false);
        setPausedBySystem(true);
        hiddenAtRef.current = Date.now();

        // Start 30s inactivity timeout
        clearInactivityTimeout();
        inactivityTimeoutRef.current = setTimeout(() => {
          // Invalidate session
          setSessionInvalidated(true);
          setHasStarted(false);
          setTimeLeft(selectedDuration * 60);
          setPausedBySystem(false);
          wasRunningRef.current = false;
          toast.warning("Session reset due to inactivity. Stay focused to earn rewards.");
        }, INACTIVITY_TIMEOUT_MS);
      }
    };

    const handleVisible = () => {
      clearInactivityTimeout();
      if (wasRunningRef.current) {
        wasRunningRef.current = false;
        // Don't auto-resume — user sees the resume prompt via pausedBySystem
      }
      hiddenAtRef.current = null;
    };

    const onVisibilityChange = () => {
      if (document.hidden) handleHidden();
      else handleVisible();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", handleHidden);
    window.addEventListener("focus", handleVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", handleHidden);
      window.removeEventListener("focus", handleVisible);
      clearInactivityTimeout();
    };
  }, [isRunning, selectedDuration, clearInactivityTimeout]);

  const handleStart = () => {
    if (sessionInvalidated) setSessionInvalidated(false);
    setPausedBySystem(false);
    setIsRunning(true);
    setHasStarted(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    // No partial save — rewards only on full completion
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasStarted(false);
    setPausedBySystem(false);
    setSessionInvalidated(false);
    setTimeLeft(selectedDuration * 60);
    clearInactivityTimeout();
    wasRunningRef.current = false;
  };

  const handleDurationChange = (val: number) => {
    if (isRunning || pausedBySystem) return;
    setSelectedDuration(val);
    setTimeLeft(val * 60);
    setHasStarted(false);
    setSessionInvalidated(false);
  };

  const getStatusMessage = () => {
    if (sessionInvalidated) return "Session reset due to inactivity. Stay focused to earn rewards.";
    if (pausedBySystem) return "Focus session paused — return to continue.";
    if (!hasStarted) return "Start your first focus session.";
    if (timeLeft === 0) return "Session complete! Great work.";
    return "Stay focused. You're doing great.";
  };

  const ringColor = pausedBySystem
    ? "hsl(var(--warning, 40 96% 53%))"
    : "hsl(var(--primary))";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-level/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Focus Mode</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Deep Focus</h1>
          <p className={cn(
            "text-sm",
            sessionInvalidated ? "text-destructive" : pausedBySystem ? "text-warning" : "text-muted-foreground"
          )}>
            {getStatusMessage()}
          </p>
        </div>

        {/* Integrity badge */}
        {hasStarted && !sessionInvalidated && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Session integrity active</span>
          </div>
        )}
        {sessionInvalidated && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Session invalidated</span>
          </div>
        )}

        {/* Timer Ring */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
          <div className={cn(
            "absolute inset-0 rounded-full transition-all duration-1000",
            isRunning && !pausedBySystem && "animate-pulse"
          )} style={{
            boxShadow: isRunning ? "0 0 60px -10px hsl(var(--primary) / 0.3)" : "none"
          }} />

          <svg className="absolute inset-0 w-full h-full progress-ring" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="140" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="150" cy="150" r="140"
              fill="none"
              stroke={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              className="progress-ring-circle"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>

          <div className="flex flex-col items-center gap-1">
            <span className="text-6xl sm:text-7xl font-display font-bold text-foreground tabular-nums tracking-tight">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-sm text-muted-foreground">{selectedDuration} min session</span>
          </div>
        </div>

        {/* Duration Selector */}
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => handleDurationChange(d.value)}
              disabled={isRunning || pausedBySystem}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                selectedDuration === d.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground",
                (isRunning || pausedBySystem) && "opacity-50 cursor-not-allowed"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={timeLeft === 0 && !sessionInvalidated}
              className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform glow-primary disabled:opacity-50"
            >
              <Play className="h-7 w-7 ml-1" />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform glow-primary"
            >
              <Pause className="h-7 w-7" />
            </button>
          )}
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:bg-accent hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
