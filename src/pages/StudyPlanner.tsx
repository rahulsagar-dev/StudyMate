import { CalendarDays, Plus, Clock, BookOpen, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const sessions = [
  { id: 1, subject: "Biology", topic: "Cell Division", time: "9:00 AM - 10:30 AM", duration: "1.5h", status: "completed" },
  { id: 2, subject: "Physics", topic: "Electromagnetic Waves", time: "11:00 AM - 12:30 PM", duration: "1.5h", status: "current" },
  { id: 3, subject: "Mathematics", topic: "Integration", time: "2:00 PM - 3:30 PM", duration: "1.5h", status: "upcoming" },
  { id: 4, subject: "Chemistry", topic: "Organic Compounds", time: "4:00 PM - 5:00 PM", duration: "1h", status: "upcoming" },
];

const weeklyGoals = [
  { subject: "Biology", target: 10, completed: 7 },
  { subject: "Physics", target: 8, completed: 5 },
  { subject: "Mathematics", target: 12, completed: 9 },
  { subject: "Chemistry", target: 6, completed: 4 },
];

export default function StudyPlanner() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-achievement flex items-center justify-center">
            <CalendarDays className="h-6 w-6 text-achievement-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Study Planner</h1>
            <p className="text-muted-foreground">Organize your study sessions for maximum productivity</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Add Session
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Today's Schedule */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground text-lg">Today's Schedule</h3>
              <span className="text-sm text-muted-foreground">February 14, 2026</span>
            </div>

            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all",
                    session.status === "completed" && "bg-xp/5 border-xp/20 opacity-60",
                    session.status === "current" && "bg-primary/5 border-primary/30 ring-2 ring-primary/20",
                    session.status === "upcoming" && "bg-secondary border-border/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      session.status === "completed" && "bg-xp/10",
                      session.status === "current" && "bg-primary/10",
                      session.status === "upcoming" && "bg-muted"
                    )}
                  >
                    <BookOpen
                      className={cn(
                        "h-5 w-5",
                        session.status === "completed" && "text-xp",
                        session.status === "current" && "text-primary",
                        session.status === "upcoming" && "text-muted-foreground"
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{session.subject}</h4>
                      {session.status === "current" && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{session.topic}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{session.time}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {session.duration}
                    </div>
                  </div>

                  {session.status === "current" && (
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                      Start Session
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Goals */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="h-5 w-5 text-achievement" />
              <h3 className="font-semibold text-foreground">Weekly Goals</h3>
            </div>

            <div className="space-y-4">
              {weeklyGoals.map((goal) => (
                <div key={goal.subject} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{goal.subject}</span>
                    <span className="text-muted-foreground">
                      {goal.completed}/{goal.target} hours
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary transition-all"
                      style={{ width: `${(goal.completed / goal.target) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Study Tips */}
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-4">Study Tips</h3>
            <div className="space-y-3">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-foreground">
                  💡 Take a 5-minute break every 25 minutes using the Pomodoro technique
                </p>
              </div>
              <div className="p-3 bg-xp/5 rounded-lg border border-xp/20">
                <p className="text-sm text-foreground">
                  🎯 Review your Physics notes before tomorrow's quiz
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
