import { Play, Pause, RotateCcw, SkipForward, Timer } from "lucide-react";
import { usePomodoro } from "@/contexts/PomodoroContext";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function TopBarPomodoro() {
  const { timeLeft, isRunning, phase, completedInCycle, totalToday, settings, start, pause, reset, skip, progress } = usePomodoro();

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const phaseLabel = phase === "focus" ? "Focus" : phase === "shortBreak" ? "Break" : "Long Break";
  const phaseColor = phase === "focus" ? "text-primary" : "text-success";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 transition-colors",
          isRunning ? "bg-primary/10 border-primary/30" : "bg-muted/50 hover:bg-accent"
        )}>
          <Timer className={cn("h-4 w-4", isRunning ? "text-primary animate-pulse" : "text-muted-foreground")} />
          <span className={cn("text-sm font-mono font-medium tabular-nums", isRunning ? "text-primary" : "text-foreground")}>
            {display}
          </span>
          {/* Mini progress bar */}
          <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000", phase === "focus" ? "bg-primary" : "bg-success")}
              style={{ width: `${progress}%` }}
            />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          {/* Phase & Timer */}
          <div className="text-center space-y-1">
            <p className={cn("text-xs font-medium uppercase tracking-wider", phaseColor)}>{phaseLabel}</p>
            <p className="text-4xl font-mono font-bold text-foreground tabular-nums">{display}</p>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-muted mt-2">
              <div
                className={cn("h-full rounded-full transition-all duration-1000", phase === "focus" ? "bg-primary" : "bg-success")}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            {!isRunning ? (
              <button onClick={start} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
                <Play className="h-4 w-4 ml-0.5" />
              </button>
            ) : (
              <button onClick={pause} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
                <Pause className="h-4 w-4" />
              </button>
            )}
            <button onClick={skip} className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:bg-accent hover:text-foreground transition-colors">
              <SkipForward className="h-3.5 w-3.5" />
            </button>
            <button onClick={reset} className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:bg-accent hover:text-foreground transition-colors">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
            <span>Cycle: {completedInCycle}/{settings.sessionsBeforeLongBreak}</span>
            <span>Today: {totalToday} sessions</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
