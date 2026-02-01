import { BarChart3, Clock, Brain, BookOpen, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

const subjectData = [
  { name: "Biology", hours: 24, color: "hsl(142, 70%, 45%)" },
  { name: "Physics", hours: 18, color: "hsl(180, 70%, 50%)" },
  { name: "Math", hours: 32, color: "hsl(265, 70%, 60%)" },
  { name: "History", hours: 12, color: "hsl(45, 90%, 55%)" },
  { name: "Chemistry", hours: 14, color: "hsl(25, 95%, 55%)" },
];

const weeklyData = [
  { week: "Week 1", hours: 18, quizzes: 8 },
  { week: "Week 2", hours: 24, quizzes: 12 },
  { week: "Week 3", hours: 20, quizzes: 10 },
  { week: "Week 4", hours: 28, quizzes: 15 },
];

const dailyData = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.2 },
  { day: "Wed", hours: 1.8 },
  { day: "Thu", hours: 4.1 },
  { day: "Fri", hours: 2.9 },
  { day: "Sat", hours: 5.2 },
  { day: "Sun", hours: 3.8 },
];

const stats = [
  { label: "Total Study Hours", value: "100", unit: "hrs", change: "+12%", trend: "up", icon: Clock },
  { label: "Quizzes Completed", value: "45", change: "+8", trend: "up", icon: Brain },
  { label: "Flashcards Reviewed", value: "680", change: "+120", trend: "up", icon: BookOpen },
  { label: "Average Score", value: "85%", change: "-2%", trend: "down", icon: BarChart3 },
];

export default function Analytics() {
  const totalHours = subjectData.reduce((sum, s) => sum + s.hours, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Deep dive into your study performance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border/50 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-xp" : "text-destructive"}`}>
                {stat.trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {stat.change}
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-foreground">
              {stat.value}
              {stat.unit && <span className="text-lg text-muted-foreground ml-1">{stat.unit}</span>}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Subject Distribution */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-card rounded-2xl border border-border/50 p-6 h-full">
            <h3 className="font-semibold text-foreground mb-6">Study by Subject</h3>
            <div className="flex items-center gap-6">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="hours"
                    >
                      {subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {subjectData.map((subject) => (
                  <div key={subject.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                      <span className="text-sm text-muted-foreground">{subject.name}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{subject.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{totalHours} hours</p>
              <p className="text-sm text-muted-foreground">Total this month</p>
            </div>
          </div>
        </div>

        {/* Daily Study Pattern */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-6">Daily Study Pattern</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(180, 70%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(180, 70%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 20%, 12%)",
                      border: "1px solid hsl(220, 15%, 18%)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(210, 20%, 95%)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="hsl(180, 70%, 50%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="col-span-12">
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-6">Monthly Progress</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 20%, 12%)",
                      border: "1px solid hsl(220, 15%, 18%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="hours" fill="hsl(180, 70%, 50%)" radius={[4, 4, 0, 0]} name="Study Hours" />
                  <Bar dataKey="quizzes" fill="hsl(265, 70%, 60%)" radius={[4, 4, 0, 0]} name="Quizzes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
