import { BarChart3, Clock, Brain, Layers, Target, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import {
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";

const EMPTY_DAILY = [
  { day: "Mon", hours: 0 }, { day: "Tue", hours: 0 }, { day: "Wed", hours: 0 },
  { day: "Thu", hours: 0 }, { day: "Fri", hours: 0 }, { day: "Sat", hours: 0 }, { day: "Sun", hours: 0 },
];

const EMPTY_MONTHLY = [
  { week: "Week 1", tasks: 0, xp: 0 }, { week: "Week 2", tasks: 0, xp: 0 },
  { week: "Week 3", tasks: 0, xp: 0 }, { week: "Week 4", tasks: 0, xp: 0 },
];

function StatCard({ icon: Icon, label, value, trend, color }: {
  icon: any; label: string; value: string | number; trend?: number; color: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trend > 0 ? "bg-xp/10 text-xp" : "bg-destructive/10 text-destructive"}`}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
        {(trend === undefined || trend === 0) && (
          <span className="text-xs text-muted-foreground px-2 py-1">--</span>
        )}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function SubjectChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const hasData = data.length > 0 && total > 0;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      <h3 className="text-lg font-display font-semibold text-foreground mb-1">Study by Subject</h3>
      <p className="text-sm text-muted-foreground mb-6">XP earned per subject this month</p>

      {hasData ? (
        <div className="flex items-center gap-6">
          <div className="w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: "12px", fontSize: "12px" }}
                  itemStyle={{ color: "hsl(210, 20%, 95%)" }}
                  formatter={(value: number) => [`${value} XP`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {data.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-sm text-foreground truncate">{d.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{Math.round((d.value / total) * 100)}%</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-2">{total} XP total this month</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-32 h-32 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: 1 }]} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" stroke="none">
                  <Cell fill="hsl(220, 15%, 18%)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground">No subjects tracked yet</p>
          <p className="text-xs text-muted-foreground mt-1">Complete tasks to see subject breakdown</p>
        </div>
      )}
    </div>
  );
}

function DailyPatternChart({ data }: { data: { day: string; hours: number }[] }) {
  const hasData = data.some((d) => d.hours > 0);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      <h3 className="text-lg font-display font-semibold text-foreground mb-1">Daily Study Pattern</h3>
      <p className="text-sm text-muted-foreground mb-6">Average hours by day of week</p>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(180, 70%, 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(180, 70%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} tickFormatter={(v) => `${v}h`} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: "12px", fontSize: "12px" }}
              itemStyle={{ color: "hsl(210, 20%, 95%)" }}
              formatter={(value: number) => [`${value}h`, "Study Time"]}
            />
            <Area type="monotone" dataKey="hours" stroke="hsl(180, 70%, 50%)" strokeWidth={2} fill="url(#areaGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {!hasData && (
        <p className="text-xs text-muted-foreground text-center mt-2">Start studying to see your daily pattern</p>
      )}
    </div>
  );
}

function MonthlyProgressChart({ data }: { data: { week: string; tasks: number; xp: number }[] }) {
  const hasData = data.some((d) => d.tasks > 0 || d.xp > 0);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      <h3 className="text-lg font-display font-semibold text-foreground mb-1">Monthly Progress</h3>
      <p className="text-sm text-muted-foreground mb-6">Tasks completed and XP earned per week</p>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" vertical={false} />
            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: "12px", fontSize: "12px" }}
              itemStyle={{ color: "hsl(210, 20%, 95%)" }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", color: "hsl(220, 10%, 55%)" }}
            />
            <Bar dataKey="tasks" name="Tasks" fill="hsl(180, 70%, 50%)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="xp" name="XP Earned" fill="hsl(265, 70%, 60%)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!hasData && (
        <p className="text-xs text-muted-foreground text-center mt-2">Complete tasks to track your monthly progress</p>
      )}
    </div>
  );
}

export default function Analytics() {
  const analytics = useAnalytics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your learning progress and performance</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Study Hours"
          value={analytics.totalStudyHours}
          trend={analytics.studyHoursTrend}
          color="hsl(180, 70%, 50%)"
        />
        <StatCard
          icon={Brain}
          label="Quizzes Completed"
          value={analytics.quizzesCompleted}
          color="hsl(265, 70%, 60%)"
        />
        <StatCard
          icon={Layers}
          label="Flashcards Reviewed"
          value={analytics.flashcardsReviewed}
          color="hsl(142, 70%, 45%)"
        />
        <StatCard
          icon={Target}
          label="Average Score"
          value={analytics.averageScore > 0 ? `${analytics.averageScore}%` : "0%"}
          color="hsl(45, 90%, 55%)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubjectChart data={analytics.subjectData} />
        <DailyPatternChart data={analytics.dailyPattern.length > 0 ? analytics.dailyPattern : EMPTY_DAILY} />
      </div>

      {/* Monthly Progress */}
      <MonthlyProgressChart data={analytics.monthlyProgress.length > 0 ? analytics.monthlyProgress : EMPTY_MONTHLY} />
    </div>
  );
}
