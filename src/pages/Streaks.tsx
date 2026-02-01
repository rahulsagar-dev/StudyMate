import { Flame, Zap, Calendar, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const weeklyXp = [
  { day: "Mon", xp: 180 },
  { day: "Tue", xp: 250 },
  { day: "Wed", xp: 120 },
  { day: "Thu", xp: 320 },
  { day: "Fri", xp: 280 },
  { day: "Sat", xp: 400 },
  { day: "Sun", xp: 250 },
];

const xpHistory = [
  { action: "Completed Biology Quiz", xp: 75, time: "2 hours ago" },
  { action: "Reviewed 20 Flashcards", xp: 40, time: "3 hours ago" },
  { action: "Finished Study Session", xp: 60, time: "5 hours ago" },
  { action: "Daily Login Bonus", xp: 25, time: "8 hours ago" },
  { action: "Completed Physics Quiz", xp: 80, time: "Yesterday" },
];

const maxXp = Math.max(...weeklyXp.map((d) => d.xp));

export default function Streaks() {
  const currentStreak = 14;
  const longestStreak = 28;
  const totalXp = 12450;
  const weeklyTotal = weeklyXp.reduce((sum, d) => sum + d.xp, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-streak to-achievement flex items-center justify-center">
          <Flame className="h-6 w-6 text-streak-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Streaks & XP</h1>
          <p className="text-muted-foreground">Track your consistency and progress</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-streak/30 p-6 glow-achievement">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-streak/10">
              <Flame className="h-6 w-6 text-streak streak-animate" />
            </div>
            <span className="text-xs text-muted-foreground">Current</span>
          </div>
          <p className="text-4xl font-display font-bold text-streak">{currentStreak}</p>
          <p className="text-sm text-muted-foreground mt-1">Day Streak</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-trophy/10">
              <Trophy className="h-6 w-6 text-achievement" />
            </div>
            <span className="text-xs text-muted-foreground">Best</span>
          </div>
          <p className="text-4xl font-display font-bold text-foreground">{longestStreak}</p>
          <p className="text-sm text-muted-foreground mt-1">Longest Streak</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-xp/10">
              <Zap className="h-6 w-6 text-xp" />
            </div>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <p className="text-4xl font-display font-bold text-xp">{totalXp.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">Total XP</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">This Week</span>
          </div>
          <p className="text-4xl font-display font-bold text-foreground">{weeklyTotal}</p>
          <p className="text-sm text-muted-foreground mt-1">XP Earned</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Weekly XP Chart */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground text-lg">Weekly XP</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Feb 8 - Feb 14</span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-4 h-48">
              {weeklyXp.map((day, index) => {
                const height = (day.xp / maxXp) * 100;
                const isToday = index === 6;

                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-muted-foreground">{day.xp}</span>
                    <div className="w-full relative" style={{ height: "160px" }}>
                      <div
                        className={cn(
                          "absolute bottom-0 w-full rounded-t-lg transition-all",
                          isToday ? "bg-gradient-primary" : "bg-primary/30"
                        )}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* XP History */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-card rounded-2xl border border-border/50 p-6 h-full">
            <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {xpHistory.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-xp/10">
                    <Zap className="h-4 w-4 text-xp" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                  <span className="text-sm font-semibold text-xp">+{item.xp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <h3 className="font-semibold text-foreground mb-4">Streak Calendar - February 2026</h3>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }, (_, i) => {
            const day = i + 1;
            const hasStreak = day <= 14;
            const isToday = day === 14;

            return (
              <div
                key={day}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all",
                  hasStreak && "bg-streak/20 text-streak",
                  isToday && "ring-2 ring-streak",
                  !hasStreak && "bg-secondary text-muted-foreground"
                )}
              >
                {hasStreak && <Flame className="h-4 w-4" />}
                {!hasStreak && day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
