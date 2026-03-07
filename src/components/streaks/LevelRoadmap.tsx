import { Trophy, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVELS = [
  { level: 1, title: "Beginner", xp: 0 },
  { level: 2, title: "Learner", xp: 1000 },
  { level: 3, title: "Student", xp: 2500 },
  { level: 4, title: "Scholar", xp: 5000 },
  { level: 5, title: "Expert", xp: 10000 },
  { level: 6, title: "Master", xp: 20000 },
  { level: 7, title: "Grandmaster", xp: 35000 },
  { level: 8, title: "Legend", xp: 50000 },
];

export function LevelRoadmap({
  currentLevel,
  totalXp,
}: {
  currentLevel: number;
  totalXp: number;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-level" />
        <h3 className="text-lg font-display font-semibold text-foreground">Level Roadmap</h3>
      </div>

      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-border/50 hidden sm:block" />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {LEVELS.map((lvl) => {
            const isCompleted = currentLevel > lvl.level;
            const isCurrent = currentLevel === lvl.level;
            const isLocked = currentLevel < lvl.level;

            return (
              <div key={lvl.level} className="flex flex-col items-center text-center relative">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10",
                    isCompleted && "bg-xp/20 border-xp text-xp",
                    isCurrent && "bg-level/20 border-level text-level shadow-[0_0_16px_-4px_hsl(var(--level)/0.6)]",
                    isLocked && "bg-muted/50 border-border/50 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Trophy className="h-5 w-5" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>

                <p
                  className={cn(
                    "text-xs font-semibold mt-2",
                    isCurrent ? "text-level" : isCompleted ? "text-xp" : "text-muted-foreground"
                  )}
                >
                  Lv. {lvl.level}
                </p>
                <p
                  className={cn(
                    "text-[10px] mt-0.5",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {lvl.title}
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {lvl.xp > 0 ? `${(lvl.xp / 1000).toFixed(lvl.xp >= 1000 ? 0 : 1)}k XP` : "Start"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
