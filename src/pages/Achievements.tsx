import { Trophy, Lock, Flame, Clock, Target, BookOpen, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useStudySessions } from "@/hooks/useStudySessions";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  check: (stats: Stats) => boolean;
  hint: string;
}

interface Stats {
  totalStudyHours: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  totalSessions: number;
  totalTasks: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_session",
    title: "First Steps",
    description: "Complete your first study session",
    icon: <BookOpen className="h-6 w-6" />,
    check: (s) => s.totalSessions >= 1,
    hint: "Complete 1 study session to unlock",
  },
  {
    id: "streak_3",
    title: "On Fire",
    description: "Reach a 3-day study streak",
    icon: <Flame className="h-6 w-6" />,
    check: (s) => s.longestStreak >= 3,
    hint: "Study for 3 consecutive days",
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "Reach a 7-day study streak",
    icon: <Flame className="h-6 w-6" />,
    check: (s) => s.longestStreak >= 7,
    hint: "Study for 7 consecutive days",
  },
  {
    id: "streak_30",
    title: "Unstoppable",
    description: "Maintain a 30-day streak",
    icon: <Flame className="h-6 w-6" />,
    check: (s) => s.longestStreak >= 30,
    hint: "Study for 30 consecutive days",
  },
  {
    id: "hours_10",
    title: "Dedicated Learner",
    description: "Study for 10 total hours",
    icon: <Clock className="h-6 w-6" />,
    check: (s) => s.totalStudyHours >= 10,
    hint: "Accumulate 10 hours of study",
  },
  {
    id: "hours_100",
    title: "Century Club",
    description: "Study for 100 total hours",
    icon: <Clock className="h-6 w-6" />,
    check: (s) => s.totalStudyHours >= 100,
    hint: "Accumulate 100 hours of study",
  },
  {
    id: "xp_1000",
    title: "XP Hunter",
    description: "Earn 1,000 total XP",
    icon: <Zap className="h-6 w-6" />,
    check: (s) => s.totalXP >= 1000,
    hint: "Earn 1,000 XP from all activities",
  },
  {
    id: "xp_10000",
    title: "XP Legend",
    description: "Earn 10,000 total XP",
    icon: <Star className="h-6 w-6" />,
    check: (s) => s.totalXP >= 10000,
    hint: "Earn 10,000 XP from all activities",
  },
  {
    id: "tasks_10",
    title: "Task Master",
    description: "Complete 10 tasks",
    icon: <Target className="h-6 w-6" />,
    check: (s) => s.totalTasks >= 10,
    hint: "Complete 10 study tasks",
  },
];

export default function Achievements() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { sessions } = useStudySessions();

  const stats: Stats = {
    totalStudyHours: (sessions ?? []).reduce((sum, s) => sum + s.study_minutes, 0) / 60,
    currentStreak: profile?.current_streak ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
    totalXP: profile?.total_xp ?? 0,
    totalSessions: sessions?.length ?? 0,
    totalTasks: (sessions ?? []).reduce((sum, s) => sum + s.tasks_completed, 0),
  };

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(stats)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-achievement/10 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-achievement" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Achievements</h1>
            <p className="text-sm text-muted-foreground">Your journey starts now</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-achievement/10 border border-achievement/20">
          <span className="text-sm font-semibold text-achievement">{unlockedCount}/{ACHIEVEMENTS.length}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = user ? achievement.check(stats) : false;
          return (
            <div
              key={achievement.id}
              className={cn(
                "group relative rounded-2xl border p-5 transition-all duration-300",
                unlocked
                  ? "bg-card border-achievement/30 hover:border-achievement/50"
                  : "bg-card/50 border-border/30 hover:border-border/60"
              )}
            >
              {/* Lock overlay */}
              {!unlocked && (
                <div className="absolute top-3 right-3">
                  <Lock className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}

              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
                unlocked
                  ? "bg-achievement/15 text-achievement"
                  : "bg-muted/50 text-muted-foreground/30"
              )}>
                {achievement.icon}
              </div>

              <h3 className={cn(
                "font-display font-semibold mb-1 transition-colors",
                unlocked ? "text-foreground" : "text-muted-foreground/60"
              )}>
                {achievement.title}
              </h3>
              <p className={cn(
                "text-sm mb-3",
                unlocked ? "text-muted-foreground" : "text-muted-foreground/40"
              )}>
                {achievement.description}
              </p>

              {!unlocked && (
                <p className="text-xs text-muted-foreground/50 italic">{achievement.hint}</p>
              )}
              {unlocked && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-achievement/10 text-achievement text-xs font-medium">
                  <Trophy className="h-3 w-3" /> Unlocked
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
