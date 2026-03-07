import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useStudySessions } from "@/hooks/useStudySessions";
import { TrendingUp } from "lucide-react";

export function XPHistoryChart() {
  const { sessions } = useStudySessions();

  const chartData = useMemo(() => {
    // Last 30 days
    const days: { date: string; label: string; xp: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayXp = sessions
        .filter((s) => s.date === dateStr)
        .reduce((sum, s) => sum + s.xp_earned, 0);
      days.push({ date: dateStr, label, xp: dayXp });
    }
    return days;
  }, [sessions]);

  const totalLast30 = chartData.reduce((s, d) => s + d.xp, 0);

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">XP History</h3>
          <p className="text-sm text-muted-foreground">Last 30 days</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-xp/10 border border-xp/20">
          <TrendingUp className="h-4 w-4 text-xp" />
          <span className="text-sm font-medium text-xp">{totalLast30.toLocaleString()} XP</span>
        </div>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(220, 10%, 55%)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(220, 10%, 55%)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 20%, 12%)",
                border: "1px solid hsl(220, 15%, 18%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(210, 20%, 95%)" }}
              itemStyle={{ color: "hsl(142, 70%, 45%)" }}
              formatter={(value: number) => [`${value} XP`, "Earned"]}
            />
            <Area
              type="monotone"
              dataKey="xp"
              stroke="hsl(142, 70%, 45%)"
              strokeWidth={2}
              fill="url(#xpGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
