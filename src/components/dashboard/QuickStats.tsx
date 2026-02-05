 import { Zap, Trophy, Flame, Target, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
 import { useProfile } from "@/hooks/useProfile";
 import { useStudySessions } from "@/hooks/useStudySessions";
 import { useAuth } from "@/contexts/AuthContext";
 import { Skeleton } from "@/components/ui/skeleton";

export function QuickStats() {
   const { user } = useAuth();
   const { profile, loading: profileLoading, getLevelTitle, getLevelProgress } = useProfile();
   const { getWeeklyXp, loading: sessionsLoading } = useStudySessions();
 
   const loading = profileLoading || sessionsLoading;
   const weeklyXp = getWeeklyXp();
   const weeklyGoal = profile?.weekly_goal_xp || 500;
   const weeklyProgress = Math.min(100, Math.round((weeklyXp / weeklyGoal) * 100));
 
   const stats = [
     {
       label: "Total XP",
       value: profile?.total_xp?.toLocaleString() || "0",
       icon: Zap,
       color: "xp",
       change: !user ? "Sign in to start" : profile?.total_xp === 0 ? "Start earning!" : `+${weeklyXp} this week`,
     },
     {
       label: "Current Level",
       value: String(profile?.current_level || 1),
       subtitle: getLevelTitle(profile?.current_level || 1),
       icon: Trophy,
       color: "level",
       progress: profile ? getLevelProgress(profile.total_xp, profile.current_level) : 0,
     },
     {
       label: "Day Streak",
       value: String(profile?.current_streak || 0),
       icon: Flame,
       color: "streak",
       change: !user ? "Sign in to start" : profile?.current_streak === 0 ? "Start today!" : `Best: ${profile?.longest_streak || 0} days`,
     },
     {
       label: "Weekly Goal",
       value: `${weeklyProgress}%`,
       icon: Target,
       color: "primary",
       progress: weeklyProgress,
       subtitle: `${weeklyXp}/${weeklyGoal} XP`,
     },
   ];
 
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  stat.color === "streak" && "text-streak",
                  stat.color === "primary" && "text-primary"
                )}
              />
            </div>
            {stat.change && (
              <span className="text-xs text-muted-foreground">{stat.change}</span>
            )}
          </div>

          <div>
             {loading ? (
               <Skeleton className="h-9 w-16 mb-1" />
             ) : (
               <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
             )}
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            {stat.subtitle && (
              <p className={cn(
                "text-xs font-medium mt-1",
                 stat.color === "level" && "text-level",
                 stat.color === "primary" && "text-muted-foreground"
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
