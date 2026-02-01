import { useState } from "react";
import { Check, Circle, Zap, Plus, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  subject: string;
  xp: number;
  completed: boolean;
}

// Start with empty task list for new users
const initialTasks: Task[] = [];

export function TaskPanel() {
  const [tasks, setTasks] = useState(initialTasks);
  const [animatingXp, setAnimatingXp] = useState<string | null>(null);

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.completed) {
      setAnimatingXp(id);
      setTimeout(() => setAnimatingXp(null), 800);
    }
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalXp = tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.xp, 0);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Today's Tasks</h3>
          <p className="text-sm text-muted-foreground">
            {tasks.length === 0 ? "No tasks yet" : `${completedCount}/${tasks.length} completed • ${totalXp} XP earned`}
          </p>
        </div>
        <button className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors">
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <ListTodo className="h-8 w-8 text-primary/50" />
            </div>
            <h4 className="font-medium text-foreground mb-2">No tasks yet</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
              Add your first task to start earning XP!
            </p>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4" />
              Add Task
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "task-card cursor-pointer relative",
                  task.completed && "opacity-60"
                )}
                onClick={() => toggleTask(task.id)}
              >
                <button
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    task.completed
                      ? "bg-xp border-xp"
                      : "border-muted-foreground hover:border-primary"
                  )}
                >
                  {task.completed && <Check className="h-3 w-3 text-xp-foreground" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium text-foreground truncate",
                    task.completed && "line-through"
                  )}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.subject}</p>
                </div>

                <div className="flex items-center gap-1 px-2 py-1 bg-xp/10 rounded-full">
                  <Zap className="h-3 w-3 text-xp" />
                  <span className="text-xs font-semibold text-xp">+{task.xp}</span>
                </div>

                {/* XP Animation */}
                {animatingXp === task.id && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 xp-pop">
                    <span className="text-xp font-bold">+{task.xp} XP!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Bar - only show if there are tasks */}
      {tasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Daily progress</span>
            <span className="text-xs font-medium text-foreground">{Math.round((completedCount / tasks.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-xp transition-all duration-500 rounded-full"
              style={{ width: `${(completedCount / tasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
