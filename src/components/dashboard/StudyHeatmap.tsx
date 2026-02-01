import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

// Generate mock heatmap data for the past 12 weeks
const generateHeatmapData = () => {
  const data: number[][] = [];
  for (let week = 0; week < 12; week++) {
    const weekData: number[] = [];
    for (let day = 0; day < 7; day++) {
      // Random intensity 0-4
      weekData.push(Math.floor(Math.random() * 5));
    }
    data.push(weekData);
  }
  return data;
};

const heatmapData = generateHeatmapData();
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const months = ["Dec", "Jan", "Feb"];

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
  // Calculate current streak
  const currentStreak = 14;
  const longestStreak = 28;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Study Consistency</h3>
          <p className="text-sm text-muted-foreground">Your GitHub-style activity heatmap</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-streak/10 rounded-lg border border-streak/20">
            <Flame className="h-4 w-4 text-streak streak-animate" />
            <span className="text-sm font-semibold text-streak">{currentStreak} day streak</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="flex gap-2">
        {/* Day Labels */}
        <div className="flex flex-col gap-1 pr-2">
          {days.map((day, i) => (
            <span key={day} className="text-xs text-muted-foreground h-3 flex items-center">
              {i % 2 === 0 ? day : ""}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1">
          {/* Month Labels */}
          <div className="flex mb-2">
            {months.map((month, i) => (
              <span
                key={month}
                className="text-xs text-muted-foreground"
                style={{ marginLeft: i === 0 ? 0 : "auto" }}
              >
                {month}
              </span>
            ))}
          </div>

          {/* Cells */}
          <div className="flex gap-1">
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((intensity, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={cn(
                      "heatmap-cell",
                      getHeatmapColor(intensity)
                    )}
                    title={`${intensity * 30} minutes studied`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">Longest streak: {longestStreak} days</span>
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
