import { useMemo } from "react";
import {
  Flame, Zap, Trophy, TrendingUp, Calendar,
  Target, Award, Clock, Star, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useStudySessions } from "@/hooks/useStudySessions";
import { useStudyActivity } from "@/hooks/useStudyActivity";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakCalendar } from "@/components/streaks/StreakCalendar";
import { XPHistoryChart } from "@/components/streaks/XPHistoryChart";
import { LevelRoadmap } from "@/components/streaks/LevelRoadmap";
import { XPTransactions } from "@/components/streaks/XPTransactions";

export default function Streaks() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, getLevelTitle, getLevelProgress } = useProfile();
  const { sessions, getWeeklyXp, loading: sessionsLoading } = useStudySessions();
  const { stats: activityStats } = useStudyActivity();

  const loading = profileLoading || sessionsLoading;
  const totalXp = profile?.total_xp || 0;
  const level = profile?.current_level || 1;
  const currentStreak = profile?.current_streak || 0;
  const longestStreak = profile?.longest_streak || 0;
  const weeklyXp = getWeeklyXp();
  const levelProgress = profile ? getLevelProgress(totalXp, level) : 0;
  const levelTitle = getLevelTitle(level);

  // Today's XP
  const todayXp = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return sessions
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.xp_earned, 0);
  }, [sessions]);

  // This month XP
  const monthXp = useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return sessions
      .filter((s) => s.date.startsWith(monthPrefix))
      .reduce((sum, s) => sum + s.xp_earned, 0);
  }, [sessions]);

  return (
    <div className="space-y-6 stagger-children">
      {/* ── Streak Hero ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-streak/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {/* Flame + Streak */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "relative w-28 h-28 rounded-full flex items-center justify-center",
                currentStreak > 0
                  ? "bg-streak/15 shadow-[0_0_40px_-8px_hsl(var(--streak)/0.5)]"
                  : "bg-muted/50"
              )}
            >
              <Flame
                className={cn(
                  "h-14 w-14 transition-all",
                  currentStreak > 0 ? "text-streak streak-animate" : "text-muted-foreground"
                )}
              />
              {currentStreak > 0 && (
                <span className="absolute -bottom-1 bg-streak text-streak-foreground text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {currentStreak} days
                </span>
              )}
            </div>
          </div>

          {/* Streak Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              {!user
                ? "Sign in to track streaks"
                : currentStreak > 0
                  ? `${currentStreak}-Day Study Streak 🔥`
                  : "Start Your Streak Today"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {!user
                ? "Log in and start studying to build consistency"
                : currentStreak > 0
                  ? "Keep going! Consistency is the key to mastery."
                  : "Complete a study session to ignite your streak 💪"}
            </p>

            {/* Streak stats row */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
              <MiniStat
                icon={Flame}
                label="Current"
                value={`${currentStreak} days`}
                color="streak"
                loading={loading}
              />
              <MiniStat
                icon={TrendingUp}
                label="Longest"
                value={`${longestStreak} days`}
                color="primary"
                loading={loading}
              />
              <MiniStat
                icon={Calendar}
                label="Active Days"
                value={`${activityStats.monthPomodoros > 0 ? activityStats.monthPomodoros : 0} this month`}
                color="xp"
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── XP Overview Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <XPCard
          label="Today"
          value={todayXp}
          icon={Zap}
          color="xp"
          loading={loading}
        />
        <XPCard
          label="This Week"
          value={weeklyXp}
          icon={Target}
          color="primary"
          loading={loading}
        />
        <XPCard
          label="This Month"
          value={monthXp}
          icon={Award}
          color="achievement"
          loading={loading}
        />
        <XPCard
          label="All Time"
          value={totalXp}
          icon={Star}
          color="level"
          loading={loading}
        />
      </div>

      {/* ── Level Progress ── */}
      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">Level Progress</h3>
            <p className="text-sm text-muted-foreground">
              {loading ? "..." : `${levelTitle} · Level ${level}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="level-badge">
              <Trophy className="h-3.5 w-3.5" />
              Lv. {level}
            </div>
          </div>
        </div>

        {/* Big progress bar */}
        <div className="relative">
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-level transition-all duration-700 ease-out"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">Level {level}</span>
            <span className="text-xs text-level font-medium">{levelProgress}%</span>
            <span className="text-xs text-muted-foreground">Level {level + 1}</span>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-12 gap-6">
        {/* XP History Chart */}
        <div className="col-span-12 lg:col-span-8">
          <XPHistoryChart />
        </div>

        {/* Recent XP Transactions */}
        <div className="col-span-12 lg:col-span-4">
          <XPTransactions />
        </div>

        {/* Level Roadmap */}
        <div className="col-span-12">
          <LevelRoadmap currentLevel={level} totalXp={totalXp} />
        </div>

        {/* Streak Calendar */}
        <div className="col-span-12">
          <StreakCalendar />
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: any;
  label: string;
  value: string;
  color: "streak" | "primary" | "xp";
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
      <Icon
        className={cn(
          "h-4 w-4",
          color === "streak" && "text-streak",
          color === "primary" && "text-primary",
          color === "xp" && "text-xp"
        )}
      />
      {loading ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <span className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{value}</span>{" "}
          <span className="hidden sm:inline">{label}</span>
        </span>
      )}
    </div>
  );
}

function XPCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: any;
  color: "xp" | "primary" | "achievement" | "level";
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-border">
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "p-2.5 rounded-xl",
            color === "xp" && "bg-xp/10",
            color === "primary" && "bg-primary/10",
            color === "achievement" && "bg-achievement/10",
            color === "level" && "bg-level/10"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              color === "xp" && "text-xp",
              color === "primary" && "text-primary",
              color === "achievement" && "text-achievement",
              color === "level" && "text-level"
            )}
          />
        </div>
        <Zap className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
      {loading ? (
        <Skeleton className="h-9 w-20 mb-1" />
      ) : (
        <p className="text-3xl font-display font-bold text-foreground">
          {value.toLocaleString()}
        </p>
      )}
      <p className="text-sm text-muted-foreground mt-1">{label} XP</p>
    </div>
  );
}
