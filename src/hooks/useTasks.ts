 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 
export type TaskPriority = "quick-win" | "major-project" | "add-ons" | "today-exclusive";

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "quick-win", label: "Quick Win" },
  { value: "major-project", label: "Major Project" },
  { value: "add-ons", label: "Add-ons" },
  { value: "today-exclusive", label: "Today Exclusive" },
];

export interface Task {
    id: string;
    title: string;
    subject: string; // stores priority value in DB
    xp_reward: number;
    completed: boolean;
    completed_at: string | null;
    due_date: string | null;
    created_at: string;
  }
 
 export function useTasks() {
   const { user } = useAuth();
   const { toast } = useToast();
   const [tasks, setTasks] = useState<Task[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchTasks = useCallback(async () => {
     if (!user) {
       setTasks([]);
       setLoading(false);
       return;
     }
 
     try {
       setLoading(true);
       const { data, error } = await supabase
         .from("tasks")
         .select("*")
         .eq("user_id", user.id)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       setTasks(data || []);
     } catch (err) {
       console.error("Error fetching tasks:", err);
       setError(err instanceof Error ? err.message : "Failed to fetch tasks");
     } finally {
       setLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchTasks();
   }, [fetchTasks]);
 
   const addTask = async (title: string, subject: string, xpReward: number = 20) => {
     if (!user) return;
 
     try {
       const { data, error } = await supabase
         .from("tasks")
         .insert({
           user_id: user.id,
           title,
           subject,
           xp_reward: xpReward,
         })
         .select()
         .single();
 
       if (error) throw error;
       setTasks((prev) => [data, ...prev]);
       toast({ title: "Task added!", description: `${title} ready to earn ${xpReward} XP` });
     } catch (err) {
       console.error("Error adding task:", err);
       toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
     }
   };
 
   const toggleTask = async (taskId: string) => {
     const task = tasks.find((t) => t.id === taskId);
     if (!task) return;
 
     try {
       if (!task.completed) {
         // Complete the task using the database function
         const { error } = await supabase.rpc("complete_task", { p_task_id: taskId });
         if (error) throw error;
         
         setTasks((prev) =>
           prev.map((t) =>
             t.id === taskId ? { ...t, completed: true, completed_at: new Date().toISOString() } : t
           )
         );
          toast({ title: `+${task.xp_reward} XP!`, description: `Task completed: ${task.title}` });
          // Notify other hooks to refetch after a short delay to ensure DB commit
          setTimeout(() => window.dispatchEvent(new CustomEvent("xp-changed")), 500);
        } else {
         // Uncomplete the task
         const { error } = await supabase.rpc("uncomplete_task", { p_task_id: taskId });
         if (error) throw error;
         
         setTasks((prev) =>
           prev.map((t) =>
             t.id === taskId ? { ...t, completed: false, completed_at: null } : t
           )
         );
          toast({ title: "Task uncompleted", description: `${task.xp_reward} XP removed` });
          window.dispatchEvent(new CustomEvent("xp-changed"));
        }
     } catch (err) {
       console.error("Error toggling task:", err);
       toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
     }
   };
 
   const deleteTask = async (taskId: string) => {
     try {
       const { error } = await supabase.from("tasks").delete().eq("id", taskId);
       if (error) throw error;
       setTasks((prev) => prev.filter((t) => t.id !== taskId));
       toast({ title: "Task deleted" });
     } catch (err) {
       console.error("Error deleting task:", err);
       toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
     }
   };
 
   return {
     tasks,
     loading,
     error,
     addTask,
     toggleTask,
     deleteTask,
     refetch: fetchTasks,
   };
 }