import { cn } from "@/lib/utils";
import { Flame, Sparkles } from "lucide-react";

// Empty heatmap data for new users - full year (52 weeks)
const generateHeatmapData = () => {
  const data: number[][] = [];
  for (let week = 0; week < 52; week++) {
    const weekData: number[] = [];
    for (let day = 0; day < 7; day++) {
      weekData.push(0); // All empty
    }
    data.push(weekData);
  }
  return data;
};

const heatmapData = generateHeatmapData();
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Calculate which months to show and their approximate positions
const getMonthLabels = () => {
  const labels: { month: string; position: number }[] = [];
  // Each month is roughly 4.33 weeks, so we show month labels at appropriate positions
  const weeksPerMonth = 52 / 12;
  
  months.forEach((month, index) => {
    labels.push({
      month,
      position: Math.round(index * weeksPerMonth)
    });
  });
  
  return labels;
};

const monthLabels = getMonthLabels();

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
  // Fresh user values
  const currentStreak = 0;
  const longestStreak = 0;

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
        <div className="flex flex-col gap-1 pr-2 flex-shrink-0">
          {days.map((day, i) => (
            <span key={day} className="text-xs text-muted-foreground h-3 flex items-center">
              {i % 2 === 0 ? day : ""}
            </span>
          ))}
        </div>

        {/* Grid Container */}
        <div className="flex-1 min-w-0">
          {/* Month Labels */}
          <div className="flex mb-2 relative h-4">
            {monthLabels.map(({ month, position }, i) => (
              <span
                key={month}
                className="text-xs text-muted-foreground absolute"
                style={{ left: `${(position / 52) * 100}%` }}
              >
                {month}
              </span>
            ))}
          </div>

          {/* Cells */}
          <div className="flex gap-[3px]">
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((intensity, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={cn(
                      "heatmap-cell",
                      getHeatmapColor(intensity)
                    )}
                    title="No activity yet"
                  />
                ))}
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
              className={cn("w-3 h-3 rounded-sm", getHeatmapColor(intensity))}
            />
          ))}
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}
