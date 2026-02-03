import { cn } from "@/lib/utils";
import { Flame, Sparkles } from "lucide-react";
import { useMemo } from "react";

const CELL_SIZE = 10;
const CELL_GAP = 3;

// Generate accurate 2026 calendar data
const generateHeatmapData = () => {
  const year = 2026;
  const weeks: { date: Date; intensity: number; isCurrentYear: boolean }[][] = [];
  
  // Start from Jan 1, 2026
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  // Find the Sunday of the week containing Jan 1
  const firstSunday = new Date(startDate);
  const dayOfWeek = firstSunday.getDay();
  firstSunday.setDate(firstSunday.getDate() - dayOfWeek);
  
  let currentDate = new Date(firstSunday);
  
  while (currentDate <= endDate) {
    const week: { date: Date; intensity: number; isCurrentYear: boolean }[] = [];
    
    for (let day = 0; day < 7; day++) {
      const isCurrentYear = currentDate.getFullYear() === year;
      week.push({
        date: new Date(currentDate),
        intensity: 0,
        isCurrentYear
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    weeks.push(week);
  }
  
  return weeks;
};

// Get month labels with their week positions
const getMonthPositions = (weeks: { date: Date; intensity: number; isCurrentYear: boolean }[][]) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const positions: { month: string; weekIndex: number }[] = [];
  const seenMonths = new Set<number>();
  
  weeks.forEach((week, weekIndex) => {
    // Find the first day of this week that's in 2026
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

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

export function StudyHeatmap() {
  const heatmapData = useMemo(() => generateHeatmapData(), []);
  const monthPositions = useMemo(() => getMonthPositions(heatmapData), [heatmapData]);
  
  const currentStreak = 0;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Study Consistency</h3>
          <p className="text-sm text-muted-foreground">Your activity heatmap for 2026</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50">
            <Flame className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {currentStreak === 0 ? "No streak yet" : `${currentStreak} day streak`}
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Container */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2">
          {/* Day Labels Column */}
          <div className="flex flex-col flex-shrink-0 pt-5">
            {days.map((day, i) => (
              <div 
                key={day} 
                className="flex items-center justify-end pr-2"
                style={{ height: CELL_SIZE + CELL_GAP, marginBottom: i < 6 ? 0 : 0 }}
              >
                <span className="text-[10px] text-muted-foreground leading-none">
                  {i % 2 === 1 ? day : ""}
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
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={cn(
                        "rounded-sm transition-colors",
                        day.isCurrentYear ? getHeatmapColor(day.intensity) : "bg-transparent"
                      )}
                      style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      title={day.isCurrentYear ? `${day.date.toLocaleDateString('en-IN', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}: No activity` : ""}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & CTA */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>Start studying to build your streak!</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Less</span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <div
              key={intensity}
              className={cn("rounded-sm", getHeatmapColor(intensity))}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
            />
          ))}
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}
