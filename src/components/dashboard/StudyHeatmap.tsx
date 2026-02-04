import { cn } from "@/lib/utils";
import { Flame, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CELL_SIZE = 10;
const CELL_GAP = 2;
const MONTH_GAP = 12;

interface DayData {
  date: Date;
  studyMinutes: number;
  xpEarned: number;
  tasksCompleted: number;
  isCurrentYear: boolean;
}

interface MonthGroup {
  month: number;
  monthName: string;
  weeks: DayData[][];
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
    
    const studyMinutes = Math.floor(Math.random() * 180) + 15;
    const xpEarned = Math.floor(studyMinutes * 1.5) + Math.floor(Math.random() * 50);
    const tasksCompleted = Math.floor(Math.random() * 5) + 1;
    
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    activity.set(dateKey, { studyMinutes, xpEarned, tasksCompleted });
  }
  
  return activity;
};

// Generate calendar data grouped by months
const generateMonthGroups = (activityData: Map<string, { studyMinutes: number; xpEarned: number; tasksCompleted: number }>): MonthGroup[] => {
  const year = 2026;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthGroups: MonthGroup[] = [];
  
  for (let month = 0; month < 12; month++) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks: DayData[][] = [];
    
    // Start from the Sunday of the week containing the 1st
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      const week: DayData[] = [];
      
      for (let day = 0; day < 7; day++) {
        const isCurrentMonth = currentDate.getMonth() === month && currentDate.getFullYear() === year;
        const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
        const dayActivity = activityData.get(dateKey);
        
        week.push({
          date: new Date(currentDate),
          studyMinutes: isCurrentMonth ? (dayActivity?.studyMinutes || 0) : 0,
          xpEarned: isCurrentMonth ? (dayActivity?.xpEarned || 0) : 0,
          tasksCompleted: isCurrentMonth ? (dayActivity?.tasksCompleted || 0) : 0,
          isCurrentYear: isCurrentMonth
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Only add week if it has at least one day from current month
      const hasCurrentMonthDay = week.some(d => d.isCurrentYear);
      if (hasCurrentMonthDay) {
        weeks.push(week);
      }
      
      // Stop if we've moved past the last day and completed the week
      if (currentDate > lastDay && currentDate.getDay() === 0) break;
    }
    
    monthGroups.push({
      month,
      monthName: monthNames[month],
      weeks
    });
  }
  
  return monthGroups;
};

// Calculate streaks from month groups
const calculateStreaks = (monthGroups: MonthGroup[]) => {
  const today = new Date(2026, 1, 3);
  today.setHours(0, 0, 0, 0);
  
  // Flatten all days and sort by date descending
  const allDays = monthGroups
    .flatMap(mg => mg.weeks.flat())
    .filter(d => d.isCurrentYear)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Remove duplicates (from week overlaps)
  const seenDates = new Set<string>();
  const uniqueDays = allDays.filter(d => {
    const key = d.date.toISOString().split('T')[0];
    if (seenDates.has(key)) return false;
    seenDates.add(key);
    return true;
  });
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let checkingCurrent = true;
  
  for (let i = 0; i < uniqueDays.length; i++) {
    const day = uniqueDays[i];
    const hasActivity = day.studyMinutes > 0;
    
    if (checkingCurrent) {
      if (hasActivity) {
        currentStreak++;
        tempStreak++;
      } else {
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
  // Fresh state for new users - empty activity map
  // This will later be replaced with Supabase data
  const [activityData] = useState<Map<string, { studyMinutes: number; xpEarned: number; tasksCompleted: number }>>(() => new Map());
  
  const monthGroups = useMemo(() => generateMonthGroups(activityData), [activityData]);
  const { currentStreak, longestStreak } = useMemo(() => calculateStreaks(monthGroups), [monthGroups]);
  
  const totalStudyDays = useMemo(() => 
    monthGroups.flatMap(mg => mg.weeks.flat()).filter(d => d.isCurrentYear && d.studyMinutes > 0).length
  , [monthGroups]);

  const hasActivity = totalStudyDays > 0;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg">
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
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300",
            currentStreak > 0 
              ? "bg-streak/10 border-streak/30 shadow-[0_0_12px_-3px_hsl(var(--streak)/0.4)]" 
              : "bg-muted/50 border-border/50"
          )}>
            <Flame className={cn(
              "h-4 w-4 transition-colors",
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
          <div className="flex">
            {/* Day Labels Column */}
            <div className="flex flex-col flex-shrink-0 pr-2 pt-5">
              {dayLabels.map((day, i) => (
                <div 
                  key={day} 
                  className="flex items-center justify-end"
                  style={{ height: CELL_SIZE + CELL_GAP }}
                >
                  <span className="text-[10px] text-muted-foreground/70 leading-none font-medium">
                    {i % 2 === 1 ? day : ""}
                  </span>
                </div>
              ))}
            </div>

            {/* Month Groups */}
            <div className="flex">
              {monthGroups.map((monthGroup, monthIndex) => (
                <div 
                  key={monthGroup.month} 
                  className="flex flex-col"
                  style={{ marginRight: monthIndex < 11 ? MONTH_GAP : 0 }}
                >
                  {/* Month Label */}
                  <div className="h-5 mb-2">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {monthGroup.monthName}
                    </span>
                  </div>
                  
                  {/* Weeks Grid */}
                  <div className="flex" style={{ gap: CELL_GAP }}>
                    {monthGroup.weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col" style={{ gap: CELL_GAP }}>
                        {week.map((day, dayIndex) => {
                          const intensity = getIntensityLevel(day.studyMinutes);
                          const hasData = day.studyMinutes > 0;
                          
                          if (!day.isCurrentYear) {
                            return (
                              <div
                                key={`${weekIndex}-${dayIndex}`}
                                className="rounded-[2px] bg-transparent"
                                style={{ width: CELL_SIZE, height: CELL_SIZE }}
                              />
                            );
                          }
                          
                          return (
                            <Tooltip key={`${weekIndex}-${dayIndex}`}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "rounded-[2px] transition-all duration-200 cursor-pointer",
                                    getHeatmapColor(intensity),
                                    "hover:ring-1 hover:ring-primary/60 hover:ring-offset-1 hover:ring-offset-background hover:scale-110",
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
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Legend & Motivation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-5 pt-4 border-t border-border/30">
        <div className="flex items-center gap-2 text-sm">
          {hasActivity && currentStreak > 0 ? (
            <>
              <Flame className="h-4 w-4 text-streak animate-pulse" />
              <span className="text-foreground">
                You're on a <span className="font-semibold text-streak">{currentStreak}-day</span> consistency streak 🔥 Keep going!
              </span>
            </>
          ) : hasActivity ? (
            <span className="text-muted-foreground">
              Great progress! Study today to start a new streak 💪
            </span>
          ) : (
            <span className="text-muted-foreground">
              Start studying today to build your streak! 🚀
            </span>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/70 mr-1">Less</span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <Tooltip key={intensity}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "rounded-[2px] cursor-pointer transition-transform duration-200 hover:scale-125 border border-white/[0.03]",
                    getHeatmapColor(intensity)
                  )}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-popover/95 backdrop-blur-sm">
                {intensity === 0 && "No activity"}
                {intensity === 1 && "< 30 mins"}
                {intensity === 2 && "30-60 mins"}
                {intensity === 3 && "1-2 hours"}
                {intensity === 4 && "2+ hours"}
              </TooltipContent>
            </Tooltip>
          ))}
          <span className="text-[10px] text-muted-foreground/70 ml-1">More</span>
        </div>
      </div>
    </div>
  );
}
