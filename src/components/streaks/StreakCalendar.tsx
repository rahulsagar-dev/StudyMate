import { useMemo } from "react";
import { useStudyActivity } from "@/hooks/useStudyActivity";
import { useStudySessions } from "@/hooks/useStudySessions";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function StreakCalendar() {
  const { activityMap } = useStudyActivity();
  const { getActivityMap } = useStudySessions();
  const sessionMap = useMemo(() => getActivityMap(), [getActivityMap]);

  // Build last 90 days calendar
  const days = useMemo(() => {
    const result: { date: string; label: string; active: boolean; minutes: number; pomodoros: number; tasks: number }[] = [];
    const now = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const activity = activityMap.get(dateStr);
      const session = sessionMap.get(dateStr);
      const minutes = Math.max(activity?.activeMinutes || 0, session?.studyMinutes || 0);
      const pomodoros = activity?.pomodoroSessions || 0;
      const tasks = session?.tasksCompleted || 0;
      const active = minutes >= 10 || tasks >= 1;
      result.push({
        date: dateStr,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" }),
        active,
        minutes,
        pomodoros,
        tasks,
      });
    }
    return result;
  }, [activityMap, sessionMap]);

  // Count current streak from calendar
  let streakCount = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].active) streakCount++;
    else if (i < days.length - 1) break; // allow today to not count yet
    else continue;
  }

  const formatTime = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-streak" />
          <h3 className="text-lg font-display font-semibold text-foreground">Streak Calendar</h3>
        </div>
        <p className="text-sm text-muted-foreground">Last 90 days</p>
      </div>

      <TooltipProvider delayDuration={100}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(14px,1fr))] gap-1">
          {days.map((day) => (
            <Tooltip key={day.date}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "aspect-square rounded-[3px] transition-all cursor-pointer border",
                    day.active
                      ? "bg-streak/60 border-streak/30 hover:bg-streak/80"
                      : "bg-muted/40 border-border/20 hover:bg-muted/60"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-popover/95 backdrop-blur-sm border border-border shadow-xl text-xs"
              >
                <p className="font-semibold text-foreground mb-1">{day.label}</p>
                {day.active ? (
                  <div className="space-y-0.5 text-muted-foreground">
                    <p>🕐 {formatTime(day.minutes)}</p>
                    <p>🍅 {day.pomodoros} sessions</p>
                    <p className="text-streak">✓ Active day</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No qualifying activity</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[2px] bg-muted/40 border border-border/20" />
          <span className="text-[10px] text-muted-foreground">Inactive</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[2px] bg-streak/60 border border-streak/30" />
          <span className="text-[10px] text-muted-foreground">Active (≥60min or ≥2 pomodoros)</span>
        </div>
      </div>
    </div>
  );
}
