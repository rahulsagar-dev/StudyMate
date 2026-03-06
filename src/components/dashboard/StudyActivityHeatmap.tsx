import { cn } from "@/lib/utils";
import { Flame, TrendingUp, Clock, Timer, Zap, Brain } from "lucide-react";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStudyActivity } from "@/hooks/useStudyActivity";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const CELL_SIZE = 12;
const CELL_GAP = 3;

interface DayCell {
  date: Date;
  dateStr: string;
  activeMinutes: number;
  pomodoroSessions: number;
  productivityScore: number;
  isInRange: boolean;
}

const getProductivityLevel = (activeMinutes: number, pomodoroSessions: number): number => {
  // Time score: 0=none, 1=light, 2=moderate, 3=decent, 4=heavy
  const timeScore =
    activeMinutes >= 300 ? 4 :
    activeMinutes >= 180 ? 3 :
    activeMinutes >= 60 ? 2 :
    activeMinutes >= 20 ? 1 : 0;

  // Session score
  const sessionScore =
    pomodoroSessions >= 10 ? 4 :
    pomodoroSessions >= 7 ? 3 :
    pomodoroSessions >= 4 ? 2 :
    pomodoroSessions >= 1 ? 1 : 0;

  if (timeScore === 0 && sessionScore === 0) return 0;
  return Math.round((timeScore + sessionScore) / 2) || 1;
};

const LEVEL_COLORS = [
  "bg-[hsl(220,15%,15%)]",           // 0 - No activity (dark)
  "bg-[hsl(210,70%,45%)]",           // 1 - Light (blue)
  "bg-[hsl(142,60%,42%)]",           // 2 - Moderate (green)
  "bg-[hsl(45,85%,50%)]",            // 3 - Decent (yellow)
  "bg-[hsl(0,75%,50%)]",             // 4 - Heavy (red)
];

const LEVEL_LABELS = [
  "No activity",
  "Light use",
  "Moderate",
  "Decent",
  "Heavy study",
];

const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const generateGrid = (
  activityMap: Map<string, { activeMinutes: number; pomodoroSessions: number; productivityScore: number }>
): DayCell[][] => {
  const today = new Date();
  const weeks: DayCell[][] = [];

  // Go back 52 weeks + remaining days to fill current week
  const endDate = new Date(today);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364 - startDate.getDay()); // align to Sunday

  const current = new Date(startDate);
  let week: DayCell[] = [];

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    const activity = activityMap.get(dateStr);

    week.push({
      date: new Date(current),
      dateStr,
      activeMinutes: activity?.activeMinutes ?? 0,
      pomodoroSessions: activity?.pomodoroSessions ?? 0,
      productivityScore: activity?.productivityScore ?? 0,
      isInRange: true,
    });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    current.setDate(current.getDate() + 1);
  }

  // Push remaining partial week
  if (week.length > 0) {
    while (week.length < 7) {
      const d = new Date(current);
      week.push({
        date: d,
        dateStr: d.toISOString().split("T")[0],
        activeMinutes: 0,
        pomodoroSessions: 0,
        productivityScore: 0,
        isInRange: false,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
};

// Get month labels with position
const getMonthLabels = (weeks: DayCell[][]): { label: string; index: number }[] => {
  const labels: { label: string; index: number }[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastMonth = -1;

  weeks.forEach((week, i) => {
    // Use the first day of the week that's in range
    const firstValid = week.find((d) => d.isInRange);
    if (firstValid) {
      const m = firstValid.date.getMonth();
      if (m !== lastMonth) {
        labels.push({ label: monthNames[m], index: i });
        lastMonth = m;
      }
    }
  });

  return labels;
};

export function StudyActivityHeatmap() {
  const { user } = useAuth();
  const { activityMap, stats, loading } = useStudyActivity();

  const mappedActivity = useMemo(() => {
    const map = new Map<string, { activeMinutes: number; pomodoroSessions: number; productivityScore: number }>();
    activityMap.forEach((v, k) => map.set(k, v));
    return map;
  }, [activityMap]);

  const weeks = useMemo(() => generateGrid(mappedActivity), [mappedActivity]);
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  // Motivational message
  const motivationMessage = useMemo(() => {
    if (stats.currentStreak >= 7) return `Amazing consistency! 🔥 ${stats.currentStreak}-day streak`;
    if (stats.currentStreak >= 3) return `Great momentum! ${stats.currentStreak}-day streak 💪`;
    if (stats.longestStreak > 0 && stats.currentStreak > 0 && stats.currentStreak >= stats.longestStreak - 1)
      return "You're close to your longest streak! 🎯";
    if (stats.currentStreak > 0) return `${stats.currentStreak}-day streak — keep going! 🚀`;
    return "Start studying to build your streak! 🚀";
  }, [stats]);

  // Focus Score (simplified AI metric)
  const focusScore = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayData = activityMap.get(today);
    if (!todayData) return null;

    const timeScore = Math.min(100, (todayData.activeMinutes / 300) * 100);
    const pomScore = Math.min(100, (todayData.pomodoroSessions / 8) * 100);
    const score = Math.round((timeScore * 0.4 + pomScore * 0.6));
    
    let label = "Getting started";
    if (score >= 80) label = "Outstanding focus today";
    else if (score >= 60) label = "Great focus today";
    else if (score >= 40) label = "Good progress";
    else if (score >= 20) label = "Building momentum";

    return { score, label };
  }, [activityMap]);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-6 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-display font-semibold text-foreground">
            Study Activity Heatmap
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {user ? "Daily productivity based on time spent & Pomodoro sessions" : "Sign in to track your study activity"}
          </p>
        </div>
        {stats.currentStreak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-streak/10 border border-streak/30">
            <Flame className="h-4 w-4 text-streak" />
            <span className="text-sm font-medium text-streak">{stats.currentStreak} day streak</span>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Study Time This Month"
          value={formatTime(stats.monthStudyTime)}
          color="text-primary"
        />
        <StatCard
          icon={<Timer className="h-4 w-4" />}
          label="Pomodoro Sessions"
          value={String(stats.monthPomodoros)}
          color="text-xp"
        />
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Longest Streak"
          value={`${stats.longestStreak} days`}
          color="text-streak"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Current Streak"
          value={`${stats.currentStreak} days`}
          color="text-achievement"
        />
      </div>

      {/* Focus Score */}
      {focusScore && focusScore.score > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
          <Brain className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Focus Score Today</span>
              <span className="text-lg font-bold text-primary">{focusScore.score}%</span>
            </div>
            <p className="text-xs text-muted-foreground">{focusScore.label}</p>
            <div className="w-full h-1.5 rounded-full bg-muted mt-1.5">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${focusScore.score}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Grid */}
      <TooltipProvider delayDuration={100}>
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <div className="inline-flex min-w-max">
            {/* Day Labels */}
            <div className="flex flex-col flex-shrink-0 pr-2" style={{ paddingTop: 20 }}>
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="flex items-center justify-end"
                  style={{ height: CELL_SIZE + CELL_GAP }}
                >
                  <span className="text-[10px] text-muted-foreground/70 leading-none font-medium">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div>
              {/* Month Labels */}
              <div className="flex" style={{ height: 20, gap: CELL_GAP }}>
                {weeks.map((_, wi) => {
                  const ml = monthLabels.find((m) => m.index === wi);
                  return (
                    <div key={wi} style={{ width: CELL_SIZE }}>
                      {ml && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {ml.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cells - transposed: rows = days of week, cols = weeks */}
              <div className="flex flex-col" style={{ gap: CELL_GAP }}>
                {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                  <div key={dayOfWeek} className="flex" style={{ gap: CELL_GAP }}>
                    {weeks.map((week, wi) => {
                      const day = week[dayOfWeek];
                      if (!day || !day.isInRange) {
                        return (
                          <div
                            key={wi}
                            className="rounded-[2px] bg-transparent"
                            style={{ width: CELL_SIZE, height: CELL_SIZE }}
                          />
                        );
                      }

                      const level = getProductivityLevel(day.activeMinutes, day.pomodoroSessions);
                      const hasData = day.activeMinutes > 0 || day.pomodoroSessions > 0;

                      return (
                        <Tooltip key={wi}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "rounded-[2px] transition-all duration-200 cursor-pointer",
                                LEVEL_COLORS[level],
                                "hover:ring-1 hover:ring-primary/60 hover:ring-offset-1 hover:ring-offset-background hover:scale-125",
                                "border border-white/[0.03]"
                              )}
                              style={{ width: CELL_SIZE, height: CELL_SIZE }}
                            />
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-popover/95 backdrop-blur-sm border border-border shadow-xl"
                          >
                            <div className="text-xs">
                              <p className="font-semibold text-foreground mb-1.5">
                                {day.date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                              {hasData ? (
                                <div className="space-y-0.5 text-muted-foreground">
                                  <p>🕐 Time Spent: {formatTime(day.activeMinutes)}</p>
                                  <p>🍅 Pomodoro Sessions: {day.pomodoroSessions}</p>
                                </div>
                              ) : (
                                <p className="text-muted-foreground">No activity</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Legend & Motivation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {stats.currentStreak > 0 ? (
            <>
              <Flame className="h-3.5 w-3.5 text-streak animate-pulse" />
              <span className="text-foreground">{motivationMessage}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{motivationMessage}</span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/70 mr-1">Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <Tooltip key={level}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "rounded-[2px] cursor-pointer transition-transform duration-200 hover:scale-125 border border-white/[0.03]",
                    LEVEL_COLORS[level]
                  )}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-popover/95 backdrop-blur-sm">
                {LEVEL_LABELS[level]}
              </TooltipContent>
            </Tooltip>
          ))}
          <span className="text-[10px] text-muted-foreground/70 ml-1">More</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
      <div className={cn("mb-1", color)}>{icon}</div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}
