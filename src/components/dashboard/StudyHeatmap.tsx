import { cn } from "@/lib/utils";
import { Flame, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CELL_SIZE = 11;
const CELL_GAP = 3;

interface DayData {
  date: Date;
  studyMinutes: number;
  xpEarned: number;
  tasksCompleted: number;
  isCurrentYear: boolean;
}

// Generate mock activity data for demonstration
const generateMockActivity = (): Map<string, { studyMinutes: number; xpEarned: number; tasksCompleted: number }> => {
  const activity = new Map();
  const today = new Date(2026, 1, 3); // Current date: Feb 3, 2026
  
  // Generate some realistic activity patterns
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip some days randomly for realistic gaps
    if (Math.random() > 0.7) continue;
    
    const studyMinutes = Math.floor(Math.random() * 180) + 15; // 15-195 mins
    const xpEarned = Math.floor(studyMinutes * 1.5) + Math.floor(Math.random() * 50);
    const tasksCompleted = Math.floor(Math.random() * 5) + 1;
    
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    activity.set(dateKey, { studyMinutes, xpEarned, tasksCompleted });
  }
  
  return activity;
};

// Generate accurate 2026 calendar data
const generateHeatmapData = (activityData: Map<string, { studyMinutes: number; xpEarned: number; tasksCompleted: number }>) => {
  const year = 2026;
  const weeks: DayData[][] = [];
  
  // Start from Jan 1, 2026
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  // Find the Sunday of the week containing Jan 1
  const firstSunday = new Date(startDate);
  const dayOfWeek = firstSunday.getDay();
  firstSunday.setDate(firstSunday.getDate() - dayOfWeek);
  
  let currentDate = new Date(firstSunday);
  
  while (currentDate <= endDate || weeks.length < 53) {
    const week: DayData[] = [];
    
    for (let day = 0; day < 7; day++) {
      const isCurrentYear = currentDate.getFullYear() === year;
      const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
      const dayActivity = activityData.get(dateKey);
      
      week.push({
        date: new Date(currentDate),
        studyMinutes: dayActivity?.studyMinutes || 0,
        xpEarned: dayActivity?.xpEarned || 0,
        tasksCompleted: dayActivity?.tasksCompleted || 0,
        isCurrentYear
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    weeks.push(week);
    
    if (weeks.length >= 53) break;
  }
  
  return weeks;
};

// Get month labels with their week positions
const getMonthPositions = (weeks: DayData[][]) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const positions: { month: string; weekIndex: number }[] = [];
  const seenMonths = new Set<number>();
  
  weeks.forEach((week, weekIndex) => {
    for (const day of week) {
      if (day.isCurrentYear && day.date.getDate() <= 7) {
        const month = day.date.getMonth();
        if (!seenMonths.has(month)) {
          seenMonths.add(month);
          positions.push({
            month: monthNames[month],
            weekIndex
          });
        }
        break;
      }
    }
  });
  
  return positions;
};

// Calculate streaks
const calculateStreaks = (weeks: DayData[][]) => {
  const today = new Date(2026, 1, 3);
  today.setHours(0, 0, 0, 0);
  
  // Flatten and sort by date descending
  const allDays = weeks
    .flat()
    .filter(d => d.isCurrentYear)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let checkingCurrent = true;
  
  for (let i = 0; i < allDays.length; i++) {
    const day = allDays[i];
    const hasActivity = day.studyMinutes > 0;
    
    if (checkingCurrent) {
      if (hasActivity) {
        currentStreak++;
        tempStreak++;
      } else {
        // Allow today to be skipped if checking current streak
        const isToday = day.date.getTime() === today.getTime();
        if (!isToday) {
          checkingCurrent = false;
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      }
    } else {
      if (hasActivity) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  
  return { currentStreak, longestStreak };
};

const getIntensityLevel = (studyMinutes: number): number => {
  if (studyMinutes === 0) return 0;
  if (studyMinutes < 30) return 1;
  if (studyMinutes < 60) return 2;
  if (studyMinutes < 120) return 3;
  return 4;
};

const getHeatmapColor = (intensity: number) => {
  const colors = [
    "bg-heatmap-0",
    "bg-heatmap-1",
    "bg-heatmap-2",
    "bg-heatmap-3",
    "bg-heatmap-4",
  ];
  return colors[intensity] || colors[0];
};

const formatStudyTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function StudyHeatmap() {
  const [activityData] = useState(() => generateMockActivity());
  
  const heatmapData = useMemo(() => generateHeatmapData(activityData), [activityData]);
  const monthPositions = useMemo(() => getMonthPositions(heatmapData), [heatmapData]);
  const { currentStreak, longestStreak } = useMemo(() => calculateStreaks(heatmapData), [heatmapData]);
  
  const totalStudyDays = useMemo(() => 
    heatmapData.flat().filter(d => d.isCurrentYear && d.studyMinutes > 0).length
  , [heatmapData]);

  const hasActivity = totalStudyDays > 0;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Study Consistency</h3>
          <p className="text-sm text-muted-foreground">
            {hasActivity 
              ? `${totalStudyDays} study sessions in 2026`
              : "Your activity heatmap for 2026"
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Current Streak */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
            currentStreak > 0 
              ? "bg-streak/10 border-streak/30" 
              : "bg-muted/50 border-border/50"
          )}>
            <Flame className={cn(
              "h-4 w-4",
              currentStreak > 0 ? "text-streak" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-medium",
              currentStreak > 0 ? "text-streak" : "text-muted-foreground"
            )}>
              {currentStreak > 0 ? `${currentStreak} day streak` : "No streak yet"}
            </span>
          </div>
          
          {/* Longest Streak */}
          {longestStreak > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Best: {longestStreak} days
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Container */}
      <TooltipProvider delayDuration={100}>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2">
            {/* Day Labels Column */}
            <div className="flex flex-col flex-shrink-0 pt-5">
              {dayLabels.map((day, i) => (
                <div 
                  key={day} 
                  className="flex items-center justify-end pr-2"
                  style={{ height: CELL_SIZE + CELL_GAP }}
                >
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {i === 1 || i === 3 || i === 5 ? day : ""}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid with Month Labels */}
            <div className="flex flex-col">
              {/* Month Labels Row */}
              <div className="flex relative h-5 mb-0">
                {monthPositions.map(({ month, weekIndex }) => (
                  <span
                    key={month}
                    className="text-[10px] text-muted-foreground absolute"
                    style={{ left: weekIndex * (CELL_SIZE + CELL_GAP) }}
                  >
                    {month}
                  </span>
                ))}
              </div>

              {/* Cells Grid */}
              <div className="flex" style={{ gap: CELL_GAP }}>
                {heatmapData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col" style={{ gap: CELL_GAP }}>
                    {week.map((day, dayIndex) => {
                      const intensity = getIntensityLevel(day.studyMinutes);
                      const hasData = day.studyMinutes > 0;
                      
                      if (!day.isCurrentYear) {
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className="bg-transparent"
                            style={{ width: CELL_SIZE, height: CELL_SIZE }}
                          />
                        );
                      }
                      
                      return (
                        <Tooltip key={`${weekIndex}-${dayIndex}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "rounded-sm transition-all cursor-pointer",
                                getHeatmapColor(intensity),
                                "hover:ring-2 hover:ring-primary/50 hover:ring-offset-1 hover:ring-offset-background"
                              )}
                              style={{ width: CELL_SIZE, height: CELL_SIZE }}
                            />
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            className="bg-popover border border-border shadow-lg"
                          >
                            <div className="text-xs">
                              <p className="font-medium text-foreground mb-1">
                                {day.date.toLocaleDateString('en-IN', { 
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                              {hasData ? (
                                <div className="space-y-0.5 text-muted-foreground">
                                  <p>📚 {formatStudyTime(day.studyMinutes)} study</p>
                                  <p>⚡ {day.xpEarned} XP earned</p>
                                  <p>✅ {day.tasksCompleted} tasks completed</p>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-sm">
          {hasActivity && currentStreak > 0 ? (
            <>
              <Flame className="h-4 w-4 text-streak" />
              <span className="text-foreground">
                You're on a <span className="font-semibold text-streak">{currentStreak}-day</span> consistency streak 🔥 Keep going!
              </span>
            </>
          ) : hasActivity ? (
            <>
              <span className="text-muted-foreground">
                Great progress! Study today to start a new streak 💪
              </span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">
                Start studying today to build your streak! 🚀
              </span>
            </>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Less</span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <Tooltip key={intensity}>
              <TooltipTrigger asChild>
                <div
                  className={cn("rounded-sm cursor-pointer", getHeatmapColor(intensity))}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {intensity === 0 && "No activity"}
                {intensity === 1 && "< 30 mins"}
                {intensity === 2 && "30-60 mins"}
                {intensity === 3 && "1-2 hours"}
                {intensity === 4 && "2+ hours"}
              </TooltipContent>
            </Tooltip>
          ))}
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}
