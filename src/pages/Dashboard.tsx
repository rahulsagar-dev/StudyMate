import { QuickStats } from "@/components/dashboard/QuickStats";
import { StudyHeatmap } from "@/components/dashboard/StudyHeatmap";
import { StudyActivityHeatmap } from "@/components/dashboard/StudyActivityHeatmap";
import { TaskPanel } from "@/components/dashboard/TaskPanel";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";

export default function Dashboard() {
  return (
    <div className="space-y-6 stagger-children">
      {/* Quick Stats */}
      <QuickStats />

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Heatmap - Full Width */}
        <div className="col-span-12">
          <StudyHeatmap />
        </div>

        {/* Tasks Panel */}
        <div className="col-span-12 lg:col-span-4">
          <TaskPanel />
        </div>

        {/* Calendar Widget */}
        <div className="col-span-12 lg:col-span-4">
          <CalendarWidget />
        </div>

        {/* Analytics Chart - Spans 2 columns on mobile, 4 on desktop */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-card rounded-2xl border border-border/50 p-6 h-full">
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

        {/* Analytics */}
        <div className="col-span-12">
          <AnalyticsChart />
        </div>
      </div>
    </div>
  );
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
