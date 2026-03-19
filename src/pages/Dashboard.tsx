import { QuickStats } from "@/components/dashboard/QuickStats";
import { StudyHeatmap } from "@/components/dashboard/StudyHeatmap";
import { TaskPanel } from "@/components/dashboard/TaskPanel";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {greeting}{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's your study overview for today
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats />

      {/* Two-Column Layout: Tasks + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskPanel />
        <CalendarWidget />
      </div>

      {/* Study Heatmap */}
      <StudyHeatmap />

      {/* Bottom Row: Analytics + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsChart />
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <ActionCard
              title="Start Quiz"
              description="Test your knowledge"
              gradient="primary"
              href="/quizzes"
            />
            <ActionCard
              title="Flashcards"
              description="Review cards"
              gradient="xp"
              href="/flashcards"
            />
            <ActionCard
              title="Summarize"
              description="AI-powered notes"
              gradient="level"
              href="/summarizer"
            />
            <ActionCard
              title="Study Plan"
              description="Organize sessions"
              gradient="achievement"
              href="/study-planner"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function ActionCard({
  title,
  description,
  gradient,
  href,
}: {
  title: string;
  description: string;
  gradient: "primary" | "xp" | "level" | "achievement";
  href: string;
}) {
  const gradientClasses = {
    primary: "bg-gradient-primary",
    xp: "bg-gradient-xp",
    level: "bg-gradient-level",
    achievement: "bg-gradient-achievement",
  };

  return (
    <a
      href={href}
      className="group p-4 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all hover:scale-[1.02]"
    >
      <div
        className={`w-8 h-8 rounded-lg ${gradientClasses[gradient]} mb-3 flex items-center justify-center`}
      >
        <div className="w-3 h-3 bg-white/30 rounded-full" />
      </div>
      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
        {title}
      </p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </a>
  );
}
