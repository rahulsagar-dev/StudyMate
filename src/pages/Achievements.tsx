import { Trophy, Lock, Star, Flame, Target, BookOpen, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const achievements = [
  { id: 1, name: "First Steps", description: "Complete your first study session", icon: Star, unlocked: true, xp: 50, color: "achievement" },
  { id: 2, name: "Week Warrior", description: "Maintain a 7-day study streak", icon: Flame, unlocked: true, xp: 200, color: "streak" },
  { id: 3, name: "Quiz Master", description: "Score 100% on 5 quizzes", icon: Brain, unlocked: true, xp: 300, color: "level" },
  { id: 4, name: "Flashcard Pro", description: "Review 500 flashcards", icon: BookOpen, unlocked: false, xp: 250, progress: 65, color: "primary" },
  { id: 5, name: "Goal Crusher", description: "Complete weekly goals for a month", icon: Target, unlocked: false, xp: 500, progress: 40, color: "xp" },
  { id: 6, name: "XP Hunter", description: "Earn 10,000 total XP", icon: Zap, unlocked: false, xp: 400, progress: 82, color: "xp" },
  { id: 7, name: "Night Owl", description: "Study after midnight 10 times", icon: Star, unlocked: false, xp: 150, progress: 20, color: "level" },
  { id: 8, name: "Legendary Streak", description: "Maintain a 30-day study streak", icon: Flame, unlocked: false, xp: 1000, progress: 47, color: "streak" },
];

const stats = [
  { label: "Total Achievements", value: 3, max: 8 },
  { label: "XP from Achievements", value: "550" },
  { label: "Rarest Achievement", value: "Quiz Master" },
];

export default function Achievements() {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-achievement flex items-center justify-center">
            <Trophy className="h-6 w-6 text-achievement-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Achievements</h1>
            <p className="text-muted-foreground">
              {unlockedCount}/{achievements.length} unlocked
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border/50 p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">
              {stat.value}
              {stat.max && <span className="text-muted-foreground text-lg">/{stat.max}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={cn(
              "bg-card rounded-2xl border p-6 transition-all",
              achievement.unlocked
                ? "border-achievement/30 glow-achievement"
                : "border-border/50 opacity-75"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  achievement.unlocked
                    ? achievement.color === "achievement" && "bg-achievement/20"
                    : "bg-muted",
                  achievement.unlocked && achievement.color === "streak" && "bg-streak/20",
                  achievement.unlocked && achievement.color === "level" && "bg-level/20",
                  achievement.unlocked && achievement.color === "primary" && "bg-primary/20",
                  achievement.unlocked && achievement.color === "xp" && "bg-xp/20"
                )}
              >
                {achievement.unlocked ? (
                  <achievement.icon
                    className={cn(
                      "h-7 w-7",
                      achievement.color === "achievement" && "text-achievement",
                      achievement.color === "streak" && "text-streak",
                      achievement.color === "level" && "text-level",
                      achievement.color === "primary" && "text-primary",
                      achievement.color === "xp" && "text-xp"
                    )}
                  />
                ) : (
                  <Lock className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-xp/10 rounded-lg">
                <Zap className="h-3 w-3 text-xp" />
                <span className="text-xs font-semibold text-xp">{achievement.xp}</span>
              </div>
            </div>

            <h3 className="font-semibold text-foreground mb-1">{achievement.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>

            {!achievement.unlocked && achievement.progress && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground font-medium">{achievement.progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary rounded-full"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
              </div>
            )}

            {achievement.unlocked && (
              <div className="flex items-center gap-1 text-xs text-achievement">
                <Star className="h-3 w-3 fill-current" />
                <span>Unlocked!</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
