import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StudyActivityDay {
  date: string;
  activeMinutes: number;
  pomodoroSessions: number;
  productivityScore: number;
}

export function useStudyActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<StudyActivityDay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Fetch last 365 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);
      const startStr = startDate.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("study_activity")
        .select("date, active_minutes, pomodoro_sessions, productivity_score")
        .eq("user_id", user.id)
        .gte("date", startStr)
        .order("date", { ascending: true });

      if (error) throw error;

      setActivities(
        (data || []).map((d: any) => ({
          date: d.date,
          activeMinutes: d.active_minutes,
          pomodoroSessions: d.pomodoro_sessions,
          productivityScore: d.productivity_score,
        }))
      );
    } catch (err) {
      console.error("Error fetching study activity:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const activityMap = useMemo(() => {
    const map = new Map<string, StudyActivityDay>();
    activities.forEach((a) => map.set(a.date, a));
    return map;
  }, [activities]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let monthMinutes = 0;
    let monthPomodoros = 0;

    activities.forEach((a) => {
      if (a.date.startsWith(thisMonth)) {
        monthMinutes += a.activeMinutes;
        monthPomodoros += a.pomodoroSessions;
      }
    });

    // Calculate streaks (a day counts if time >= 60 min OR pomodoros >= 2)
    const sorted = [...activities]
      .filter((a) => a.activeMinutes >= 60 || a.pomodoroSessions >= 2)
      .map((a) => a.date)
      .sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    const todayStr = now.toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Walk backwards from today
    const activeSet = new Set(sorted);
    let checkDate = new Date(now);

    // Start from today or yesterday
    if (!activeSet.has(todayStr) && !activeSet.has(yesterdayStr)) {
      currentStreak = 0;
    } else {
      if (!activeSet.has(todayStr)) {
        checkDate = new Date(Date.now() - 86400000);
      }
      while (true) {
        const ds = checkDate.toISOString().split("T")[0];
        if (activeSet.has(ds)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }
    }

    // Longest streak
    if (sorted.length > 0) {
      streak = 1;
      longestStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        if (diff === 1) {
          streak++;
          longestStreak = Math.max(longestStreak, streak);
        } else {
          streak = 1;
        }
      }
    }

    return {
      monthStudyTime: monthMinutes,
      monthPomodoros,
      currentStreak,
      longestStreak,
    };
  }, [activities]);

  return { activities, activityMap, stats, loading, refetch: fetchActivities };
}
