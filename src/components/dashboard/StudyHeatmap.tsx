import { cn } from "@/lib/utils";
import { Flame, Sparkles } from "lucide-react";

// Generate accurate 2026 calendar data
const generateHeatmapData = () => {
  const year = 2026;
  const startDate = new Date(year, 0, 1); // Jan 1, 2026
  const endDate = new Date(year, 11, 31); // Dec 31, 2026
  
  // Find the first Sunday on or before Jan 1
  const firstDay = new Date(startDate);
  while (firstDay.getDay() !== 0) {
    firstDay.setDate(firstDay.getDate() - 1);
  }
  
  const weeks: { date: Date; intensity: number }[][] = [];
  let currentDate = new Date(firstDay);
  
  while (currentDate <= endDate || weeks.length < 53) {
    const week: { date: Date; intensity: number }[] = [];
    for (let day = 0; day < 7; day++) {
      const isInYear = currentDate.getFullYear() === year;
      week.push({
        date: new Date(currentDate),
        intensity: 0, // Empty for new user
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
    if (currentDate > endDate && currentDate.getFullYear() > year) break;
  }
  
  return weeks;
};

// Get month labels with their starting week positions
const getMonthLabels = (weeks: { date: Date; intensity: number }[][]) => {
  const labels: { month: string; weekIndex: number }[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastMonth = -1;
  
  weeks.forEach((week, weekIndex) => {
    // Check each day in the week
    for (const day of week) {
      if (day.date.getFullYear() === 2026) {
        const month = day.date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            month: monthNames[month],
            weekIndex
          });
          lastMonth = month;
          break;
        }
      }
    }
  });
  
  return labels;
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
  const heatmapData = generateHeatmapData();
  const monthLabels = getMonthLabels(heatmapData);
  
  // Fresh user values
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

      {/* Heatmap */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {/* Day Labels */}
        <div className="flex flex-col gap-[3px] pr-2 flex-shrink-0">
          <div className="h-4" /> {/* Spacer for month labels */}
          {days.map((day, i) => (
            <div 
              key={day} 
              className="h-[11px] flex items-center"
            >
              <span className="text-[10px] text-muted-foreground w-7">
                {i % 2 === 1 ? day : ""}
              </span>
            </div>
          ))}
        </div>

        {/* Grid Container */}
        <div className="flex-1 min-w-0">
          {/* Month Labels */}
          <div className="flex h-4 mb-1">
            {monthLabels.map(({ month, weekIndex }, i) => (
              <span
                key={`${month}-${i}`}
                className="text-[10px] text-muted-foreground absolute"
                style={{ 
                  marginLeft: `${weekIndex * 14}px`,
                  position: 'relative',
                  left: 0
                }}
              >
                {month}
              </span>
            ))}
          </div>

          {/* Cells Grid */}
          <div className="flex gap-[3px] relative">
            {/* Month labels positioned absolutely */}
            <div className="absolute -top-4 left-0 flex">
              {monthLabels.map(({ month, weekIndex }, i) => (
                <span
                  key={`${month}-${i}`}
                  className="text-[10px] text-muted-foreground"
                  style={{ 
                    position: 'absolute',
                    left: `${weekIndex * 14}px`
                  }}
                >
                  {month}
                </span>
              ))}
            </div>
            
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dayIndex) => {
                  const isInYear = day.date.getFullYear() === 2026;
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={cn(
                        "w-[11px] h-[11px] rounded-sm",
                        isInYear ? getHeatmapColor(day.intensity) : "bg-transparent"
                      )}
                      title={isInYear ? `${day.date.toDateString()}: No activity yet` : ""}
                    />
                  );
                })}
              </div>
            ))}
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
              className={cn("w-[11px] h-[11px] rounded-sm", getHeatmapColor(intensity))}
            />
          ))}
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}