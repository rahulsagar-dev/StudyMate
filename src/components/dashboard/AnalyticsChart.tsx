import { BarChart3, Sparkles } from "lucide-react";

export function AnalyticsChart() {
  // Empty state for new users
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Study Analytics</h3>
          <p className="text-sm text-muted-foreground">Track your learning progress</p>
        </div>
      </div>

      {/* Empty State */}
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
    </div>
  );
}
