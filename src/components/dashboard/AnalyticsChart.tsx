import { BarChart3, Sparkles } from "lucide-react";
import { useStudySessions } from "@/hooks/useStudySessions";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function AnalyticsChart() {
  const { user } = useAuth();
  const { sessions, loading } = useStudySessions();

  const chartData = useMemo(() => {
    if (!sessions.length) return [];

    // Parse YYYY-MM-DD as a LOCAL date (avoid UTC shift)
    const parseLocal = (s: string) => {
      const [y, m, d] = s.split("-").map(Number);
      return new Date(y, m - 1, d);
    };

    // Build last 8 weeks; week ends today (inclusive), each bucket is 7 days
    const weeks: { label: string; xp: number; minutes: number; tasks: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      const startLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endLabel = weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const weekSessions = sessions.filter((s) => {
        const d = parseLocal(s.date);
        return d >= weekStart && d <= weekEnd;
      });

      weeks.push({
        label: `${startLabel}–${endLabel}`,
        xp: weekSessions.reduce((sum, s) => sum + s.xp_earned, 0),
        minutes: weekSessions.reduce((sum, s) => sum + s.study_minutes, 0),
        tasks: weekSessions.reduce((sum, s) => sum + s.tasks_completed, 0),
      });
    }

    return weeks;
  }, [sessions]);

  const hasData = chartData.some((w) => w.xp > 0 || w.minutes > 0);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Study Analytics</h3>
          <p className="text-sm text-muted-foreground">Track your learning progress</p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <BarChart3 className="h-10 w-10 text-primary/40" />
          </div>
          <h4 className="font-medium text-foreground mb-2">No study data yet</h4>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Start completing tasks and quizzes to see your analytics here. We'll track your progress across all subjects!
          </p>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Complete your first task to get started</span>
          </div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--foreground))",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="xp" name="XP Earned" fill="hsl(var(--xp))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tasks" name="Tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
