import { useState } from "react";
import { CalendarDays, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { StudyTask } from "@/types/studyPlan";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/15 text-primary",
  high: "bg-destructive/15 text-destructive",
};

export default function StudyPlanner() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("30");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const handleAdd = () => {
    if (!title.trim() || !date) return;
    const task: StudyTask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      date,
      duration: parseInt(duration),
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, task].sort((a, b) => a.date.localeCompare(b.date)));
    setTitle("");
    setDate("");
    setDuration("30");
    setPriority("medium");
  };

  const toggleComplete = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <CalendarDays className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Planner</h1>
          <p className="text-sm text-muted-foreground">Organize sessions for maximum productivity</p>
        </div>
      </div>

      {/* Add Task Form */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Study Task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-secondary/50 border-border/50"
            />
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!title.trim() || !date} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </CardContent>
      </Card>

      {/* Task List */}
      {tasks.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">Plan your first study session.</p>
            <p className="text-sm text-muted-foreground/60">Add a task above to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-card ${task.completed ? "opacity-60" : ""}`}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => toggleComplete(task.id)}
              >
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.completed ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}
                >
                  {task.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              </Button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-foreground ${task.completed ? "line-through" : ""}`}>
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(task.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {task.duration} min
                </p>
              </div>
              <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
                {task.priority}
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => deleteTask(task.id)}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
