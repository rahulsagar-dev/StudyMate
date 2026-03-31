import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserContext {
  level: number;
  totalXp: number;
  currentStreak: number;
  pendingTasks: string[];
  completedToday: number;
  topSubjects: string[];
  ready: boolean;
}

export function useUserContext(): UserContext {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<UserContext>({
    level: 1, totalXp: 0, currentStreak: 0,
    pendingTasks: [], completedToday: 0, topSubjects: [], ready: false,
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);

      const [profileRes, pendingRes, completedRes] = await Promise.all([
        supabase.from("profiles").select("current_level, total_xp, current_streak").eq("id", user.id).single(),
        supabase.from("tasks").select("title").eq("user_id", user.id).eq("completed", false).limit(10),
        supabase.from("tasks").select("id").eq("user_id", user.id).eq("completed", true).gte("completed_at", `${today}T00:00:00`),
      ]);

      const profile = profileRes.data;
      const pending = pendingRes.data || [];
      const completed = completedRes.data || [];

      setCtx({
        level: profile?.current_level ?? 1,
        totalXp: profile?.total_xp ?? 0,
        currentStreak: profile?.current_streak ?? 0,
        pendingTasks: pending.map(t => t.title),
        completedToday: completed.length,
        topSubjects: [],
        ready: true,
      });
    };
    load();
  }, [user]);

  return ctx;
}

export function buildContextPrompt(ctx: UserContext): string {
  if (!ctx.ready) return "";
  const parts = [
    `User is Level ${ctx.level} with ${ctx.totalXp} total XP.`,
    `Current streak: ${ctx.currentStreak} days.`,
    `Tasks completed today: ${ctx.completedToday}.`,
  ];
  if (ctx.pendingTasks.length > 0) {
    parts.push(`Pending tasks (${ctx.pendingTasks.length}): ${ctx.pendingTasks.slice(0, 5).join(", ")}.`);
  }
  return parts.join(" ");
}
