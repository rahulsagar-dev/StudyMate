import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingUp, Clock } from "lucide-react";

const pieData = [
  { name: "Biology", value: 35, color: "hsl(142, 70%, 45%)" },
  { name: "Physics", value: 25, color: "hsl(180, 70%, 50%)" },
  { name: "Math", value: 20, color: "hsl(265, 70%, 60%)" },
  { name: "History", value: 12, color: "hsl(45, 90%, 55%)" },
  { name: "Chemistry", value: 8, color: "hsl(25, 95%, 55%)" },
];

const barData = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.2 },
  { day: "Wed", hours: 1.8 },
  { day: "Thu", hours: 4.1 },
  { day: "Fri", hours: 2.9 },
  { day: "Sat", hours: 5.2 },
  { day: "Sun", hours: 3.8 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
        <p className="text-sm font-medium text-foreground">{payload[0].payload.day}</p>
        <p className="text-xs text-muted-foreground">{payload[0].value} hours</p>
      </div>
    );
  }
  return null;
};

export function AnalyticsChart() {
  const totalHours = barData.reduce((sum, d) => sum + d.hours, 0);
  const avgHours = (totalHours / barData.length).toFixed(1);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Study Analytics</h3>
          <p className="text-sm text-muted-foreground">Your performance this week</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-xp/10 rounded-lg border border-xp/20">
          <TrendingUp className="h-4 w-4 text-xp" />
          <span className="text-sm font-medium text-xp">+12% vs last week</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Subject Distribution */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Subject Distribution</h4>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Study Hours */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-muted-foreground">Study Hours</h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Avg: {avgHours}h/day</span>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar
                  dataKey="hours"
                  fill="hsl(180, 70%, 50%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Total Study Time</p>
          <p className="text-2xl font-display font-bold text-foreground">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Quizzes Completed</p>
          <p className="text-2xl font-display font-bold text-foreground">24</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Flashcards Reviewed</p>
          <p className="text-2xl font-display font-bold text-foreground">156</p>
        </div>
      </div>
    </div>
  );
}
