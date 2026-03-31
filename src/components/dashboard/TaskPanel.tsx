 import { useState } from "react";
 import { Check, Zap, Plus, ListTodo, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
 import { useTasks, PRIORITY_OPTIONS } from "@/hooks/useTasks";
 import { useAuth } from "@/contexts/AuthContext";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Label } from "@/components/ui/label";



export function TaskPanel() {
   const { user } = useAuth();
    const { tasks, loading, addTask, completeTask, deleteTask } = useTasks();
  const [animatingXp, setAnimatingXp] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
     const [newTaskPriority, setNewTaskPriority] = useState("quick-win");
     const [newTaskXp, setNewTaskXp] = useState("20");

     const handleCompleteTask = async (id: string) => {
     const task = tasks.find((t) => t.id === id);
     if (task && !task.completed) {
       setAnimatingXp(id);
       setTimeout(() => setAnimatingXp(null), 800);
     }
      await completeTask(id);
   };

   const handleAddTask = async () => {
     if (!newTaskTitle.trim()) return;
       await addTask(newTaskTitle.trim(), newTaskPriority, parseInt(newTaskXp));
       setNewTaskTitle("");
       setNewTaskPriority("quick-win");
       setNewTaskXp("20");
       setIsAddDialogOpen(false);
    };
 
  const completedCount = tasks.filter((t) => t.completed).length;
   const totalXp = tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.xp_reward, 0);
 
   // Show login prompt if not authenticated
   if (!user) {
     return (
       <div className="bg-card rounded-2xl border border-border/50 p-6 h-full flex flex-col">
         <div className="flex items-center justify-between mb-4">
           <div>
             <h3 className="text-lg font-display font-semibold text-foreground">Today's Tasks</h3>
             <p className="text-sm text-muted-foreground">Sign in to track tasks</p>
           </div>
         </div>
         <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
           <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
             <ListTodo className="h-8 w-8 text-primary/50" />
           </div>
           <h4 className="font-medium text-foreground mb-2">Sign in to get started</h4>
           <p className="text-sm text-muted-foreground max-w-[200px]">
             Create an account to track tasks and earn XP!
           </p>
         </div>
       </div>
     );
   }

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Today's Tasks</h3>
          <p className="text-sm text-muted-foreground">
             {loading ? "Loading..." : tasks.length === 0 ? "No tasks yet" : `${completedCount}/${tasks.length} completed • ${totalXp} XP earned`}
          </p>
        </div>
         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
           <DialogTrigger asChild>
             <button className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors">
               <Plus className="h-4 w-4 text-muted-foreground" />
             </button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[400px]">
             <DialogHeader>
               <DialogTitle>Add New Task</DialogTitle>
             </DialogHeader>
             <div className="space-y-4 pt-4">
               <div className="space-y-2">
                 <Label htmlFor="title">Task Title</Label>
                 <Input
                   id="title"
                   placeholder="e.g., Complete math homework"
                   value={newTaskTitle}
                   onChange={(e) => setNewTaskTitle(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                 />
               </div>
               <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                   </div>
                <div className="space-y-2">
                  <Label>XP Reward</Label>
                  <Select value={newTaskXp} onValueChange={setNewTaskXp}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 XP</SelectItem>
                      <SelectItem value="20">20 XP</SelectItem>
                      <SelectItem value="30">30 XP</SelectItem>
                      <SelectItem value="50">50 XP</SelectItem>
                      <SelectItem value="100">100 XP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddTask} className="w-full" disabled={!newTaskTitle.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
             </div>
           </DialogContent>
         </Dialog>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
         {loading ? (
           <div className="flex items-center justify-center h-full">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
           </div>
         ) : tasks.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <ListTodo className="h-8 w-8 text-primary/50" />
            </div>
            <h4 className="font-medium text-foreground mb-2">No tasks yet</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
              Add your first task to start earning XP!
            </p>
             <button 
               onClick={() => setIsAddDialogOpen(true)}
               className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
             >
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
                   "task-card cursor-pointer relative group",
                  task.completed && "opacity-60"
                )}
                 onClick={() => !task.completed && handleCompleteTask(task.id)}
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
                  <p className="text-xs text-muted-foreground">{PRIORITY_OPTIONS.find(o => o.value === task.subject)?.label || task.subject}</p>
                </div>

                <div className="flex items-center gap-1 px-2 py-1 bg-xp/10 rounded-full">
                  <Zap className="h-3 w-3 text-xp" />
                   <span className="text-xs font-semibold text-xp">+{task.xp_reward}</span>
                </div>
 
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     deleteTask(task.id);
                   }}
                   className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                 >
                   <Trash2 className="h-4 w-4 text-destructive" />
                 </button>

                {/* XP Animation */}
                {animatingXp === task.id && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 xp-pop">
                     <span className="text-xp font-bold">+{task.xp_reward} XP!</span>
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
