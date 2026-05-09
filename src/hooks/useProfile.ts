 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 
 export interface Profile {
   id: string;
   username: string | null;
   avatar_url: string | null;
   total_xp: number;
   current_level: number;
   current_streak: number;
   longest_streak: number;
   last_activity_date: string | null;
   weekly_goal_xp: number;
   created_at: string;
   updated_at: string;
 }
 
 const LEVEL_TITLES: Record<number, string> = {
   1: "Beginner",
   2: "Learner",
   3: "Student",
   4: "Scholar",
   5: "Expert",
   6: "Master",
   7: "Grandmaster",
   8: "Legend",
 };
 
 const LEVEL_THRESHOLDS: Record<number, number> = {
   1: 0,
   2: 1000,
   3: 2500,
   4: 5000,
   5: 10000,
   6: 20000,
   7: 35000,
   8: 50000,
 };
 
 export function useProfile() {
   const { user } = useAuth();
   const [profile, setProfile] = useState<Profile | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchProfile = useCallback(async () => {
     if (!user) {
       setProfile(null);
       setLoading(false);
       return;
     }
 
      try {
        setLoading(true);
        // Reset streak server-side if last activity is older than yesterday
        await supabase.rpc("reset_stale_streak");
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
 
       if (error) throw error;
       setProfile(data);
     } catch (err) {
       console.error("Error fetching profile:", err);
       setError(err instanceof Error ? err.message : "Failed to fetch profile");
     } finally {
       setLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchProfile();
   }, [fetchProfile]);
 
   // Subscribe to real-time profile updates
   useEffect(() => {
     if (!user) return;
 
     const channel = supabase
       .channel("profile-changes")
       .on(
         "postgres_changes",
         { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
         (payload) => {
           setProfile(payload.new as Profile);
         }
       )
       .subscribe();
 
      return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Listen for cross-hook XP change events
  useEffect(() => {
    const handler = () => fetchProfile();
    window.addEventListener("xp-changed", handler);
    return () => window.removeEventListener("xp-changed", handler);
  }, [fetchProfile]);

   const getLevelTitle = (level: number) => LEVEL_TITLES[level] || "Unknown";
 
   const getLevelProgress = (xp: number, level: number) => {
     const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
     const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[8];
     const xpInCurrentLevel = xp - currentThreshold;
     const xpNeededForNext = nextThreshold - currentThreshold;
     return Math.max(0, Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNext) * 100)));
   };
 
   return {
     profile,
     loading,
     error,
     refetch: fetchProfile,
     getLevelTitle,
     getLevelProgress,
   };
 }