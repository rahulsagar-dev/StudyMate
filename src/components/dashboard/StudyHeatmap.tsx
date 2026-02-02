import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Generate heatmap data for the past year (52 weeks, 7 days each)
const generateHeatmapData = () => {
  const data: { date: Date; intensity: number }[] = [];
  const today = new Date();
  
  // Start from 52 weeks ago
  for (let week = 51; week >= 0; week--) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (week * 7 + (6 - day)));
      data.push({
        date,
        intensity: 0, // All empty for new users
      });
    }
  }
  return data;
};

const heatmapData = generateHeatmapData();

// Group data by weeks for display
const getWeeksData = () => {
  const weeks: { date: Date; intensity: number }[][] = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }
  return weeks;
};

const weeksData = getWeeksData();

// Get month labels with their positions
const getMonthLabels = () => {
  const labels: { month: string; weekIndex: number }[] = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastMonth = -1;

  weeksData.forEach((week, weekIndex) => {
    // Check the first day of each week
    const firstDayOfWeek = week[0];
    if (firstDayOfWeek) {
      const month = firstDayOfWeek.date.getMonth();
      if (month !== lastMonth) {
        labels.push({
          month: months[month],
          weekIndex,
        });
        lastMonth = month;
      }
    }
  });

  return labels;
};

const monthLabels = getMonthLabels();

const getHeatmapColor = (intensity: number) => {
  const colors = [
    "bg-[hsl(220,15%,15%)]", // Empty - dark gray
    "bg-[hsl(142,50%,25%)]", // Level 1 - dark green
    "bg-[hsl(142,60%,35%)]", // Level 2 - medium green
    "bg-[hsl(142,70%,45%)]", // Level 3 - bright green
    "bg-[hsl(142,75%,55%)]", // Level 4 - brightest green
  ];
  return colors[intensity] || colors[0];
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function StudyHeatmap() {
  // Calculate stats
  const totalActiveDays = heatmapData.filter(d => d.intensity > 0).length;
  
  // Calculate max streak
  let maxStreak = 0;
  let currentStreak = 0;
  heatmapData.forEach((day) => {
    if (day.intensity > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  // Count total submissions (for now just active days)
  const totalSubmissions = totalActiveDays;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-display font-bold text-foreground">{totalSubmissions}</span>
          <span className="text-sm text-muted-foreground">study sessions in the past one year</span>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Track your daily study consistency</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total active days:</span>
            <span className="font-medium text-foreground">{totalActiveDays}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Max streak:</span>
            <span className="font-medium text-foreground">{maxStreak}</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-fit">
          {/* Grid of cells */}
          <div className="flex gap-[3px]">
            {weeksData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dayIndex) => (
                  <Tooltip key={`${weekIndex}-${dayIndex}`}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "w-[11px] h-[11px] rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-foreground/50",
                          getHeatmapColor(day.intensity)
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">
                        {day.intensity === 0 
                          ? "No study sessions" 
                          : `${day.intensity} study session${day.intensity > 1 ? 's' : ''}`}
                      </p>
                      <p className="text-muted-foreground">{formatDate(day.date)}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>

          {/* Month labels at bottom */}
          <div className="flex mt-2 relative h-5">
            {monthLabels.map(({ month, weekIndex }) => (
              <span
                key={`${month}-${weekIndex}`}
                className="text-xs text-muted-foreground absolute"
                style={{ 
                  left: `${weekIndex * 14}px`,
                }}
              >
                {month}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border/50">
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
  );
}
