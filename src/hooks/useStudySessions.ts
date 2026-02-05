 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 
 export interface StudySession {
   id: string;
   user_id: string;
   date: string;
   study_minutes: number;
   xp_earned: number;
   tasks_completed: number;
   created_at: string;
 }
 
 export function useStudySessions(year: number = new Date().getFullYear()) {
   const { user } = useAuth();
   const [sessions, setSessions] = useState<StudySession[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchSessions = useCallback(async () => {
     if (!user) {
       setSessions([]);
       setLoading(false);
       return;
     }
 
     try {
       setLoading(true);
       const startDate = `${year}-01-01`;
       const endDate = `${year}-12-31`;
 
       const { data, error } = await supabase
         .from("study_sessions")
         .select("*")
         .eq("user_id", user.id)
         .gte("date", startDate)
         .lte("date", endDate)
         .order("date", { ascending: true });
 
       if (error) throw error;
       setSessions(data || []);
     } catch (err) {
       console.error("Error fetching study sessions:", err);
       setError(err instanceof Error ? err.message : "Failed to fetch sessions");
     } finally {
       setLoading(false);
     }
   }, [user, year]);
 
   useEffect(() => {
     fetchSessions();
   }, [fetchSessions]);
 
   // Subscribe to real-time session updates
   useEffect(() => {
     if (!user) return;
 
     const channel = supabase
       .channel("session-changes")
       .on(
         "postgres_changes",
         { event: "*", schema: "public", table: "study_sessions", filter: `user_id=eq.${user.id}` },
         () => {
           fetchSessions();
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user, fetchSessions]);
 
   // Convert sessions to activity map for heatmap
   const getActivityMap = useCallback(() => {
     const map = new Map<string, { studyMinutes: number; xpEarned: number; tasksCompleted: number }>();
     sessions.forEach((session) => {
       map.set(session.date, {
         studyMinutes: session.study_minutes,
         xpEarned: session.xp_earned,
         tasksCompleted: session.tasks_completed,
       });
     });
     return map;
   }, [sessions]);
 
   // Get weekly XP total (last 7 days)
   const getWeeklyXp = useCallback(() => {
     const today = new Date();
     const weekAgo = new Date(today);
     weekAgo.setDate(weekAgo.getDate() - 7);
 
     return sessions
       .filter((s) => {
         const sessionDate = new Date(s.date);
         return sessionDate >= weekAgo && sessionDate <= today;
       })
       .reduce((sum, s) => sum + s.xp_earned, 0);
   }, [sessions]);
 
   return {
     sessions,
     loading,
     error,
     refetch: fetchSessions,
     getActivityMap,
     getWeeklyXp,
   };
 }