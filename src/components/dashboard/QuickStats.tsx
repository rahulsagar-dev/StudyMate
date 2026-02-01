import { Zap, Trophy, Flame, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Total XP",
    value: "12,450",
    icon: Zap,
    color: "xp",
    change: "+250 today",
  },
  {
    label: "Current Level",
    value: "12",
    subtitle: "Knowledge Seeker",
    icon: Trophy,
    color: "level",
    progress: 65,
  },
  {
    label: "Day Streak",
    value: "14",
    icon: Flame,
    color: "streak",
    change: "Best: 28 days",
  },
  {
    label: "Weekly Goal",
    value: "78%",
    icon: Target,
    color: "primary",
    progress: 78,
  },
];

export function QuickStats() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            "bg-card rounded-2xl border border-border/50 p-5 transition-all duration-300 hover:border-border animate-fade-in-up",
          )}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className={cn(
                "p-2.5 rounded-xl",
                stat.color === "xp" && "bg-xp/10",
                stat.color === "level" && "bg-level/10",
                stat.color === "streak" && "bg-streak/10",
                stat.color === "primary" && "bg-primary/10"
              )}
            >
              <stat.icon
                className={cn(
                  "h-5 w-5",
                  stat.color === "xp" && "text-xp",
                  stat.color === "level" && "text-level",
                  stat.color === "streak" && "text-streak streak-animate",
                  stat.color === "primary" && "text-primary"
                )}
              />
            </div>
            {stat.change && (
              <span className="text-xs text-muted-foreground">{stat.change}</span>
            )}
          </div>

          <div>
            <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            {stat.subtitle && (
              <p className={cn(
                "text-xs font-medium mt-1",
                stat.color === "level" && "text-level"
              )}>
                {stat.subtitle}
              </p>
            )}
          </div>

          {stat.progress !== undefined && (
            <div className="mt-3">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    stat.color === "level" && "bg-gradient-level",
                    stat.color === "primary" && "bg-gradient-primary"
                  )}
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
