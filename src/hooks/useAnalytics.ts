import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubjectData {
  name: string;
  value: number;
  color: string;
}

export interface DailyPatternData {
  day: string;
  hours: number;
}

export interface MonthlyProgressData {
  week: string;
  tasks: number;
  xp: number;
}

export interface AnalyticsData {
  totalStudyHours: number;
  studyHoursTrend: number;
  quizzesCompleted: number;
  flashcardsReviewed: number;
  averageScore: number;
  subjectData: SubjectData[];
  dailyPattern: DailyPatternData[];
  monthlyProgress: MonthlyProgressData[];
  loading: boolean;
}

const SUBJECT_COLORS = [
  "hsl(180, 70%, 50%)",   // primary cyan
  "hsl(265, 70%, 60%)",   // level purple
  "hsl(142, 70%, 45%)",   // xp green
  "hsl(45, 90%, 55%)",    // achievement gold
  "hsl(25, 95%, 55%)",    // streak orange
  "hsl(340, 65%, 55%)",   // pink
  "hsl(200, 70%, 55%)",   // blue
  "hsl(160, 60%, 45%)",   // teal
];

export function useAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [xpTx, setXpTx] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const now = new Date();
      // Rolling 30-day window so analytics doesn't go blank right after a month rollover
      const windowStart = new Date(now);
      windowStart.setDate(windowStart.getDate() - 29);
      windowStart.setHours(0, 0, 0, 0);
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const startOfMonth = fmt(windowStart);
      const endStr = fmt(now);
      const startISO = windowStart.toISOString();

      const [sessionsRes, tasksRes, quizRes, setsRes, xpRes] = await Promise.all([
        supabase
          .from("study_sessions")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startOfMonth)
          .lte("date", endStr),
        supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .eq("completed", true),
        supabase
          .from("quiz_attempts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("flashcard_sets" as any)
          .select("id")
          .eq("user_id", user.id),
        supabase
          .from("xp_transactions")
          .select("amount, source, created_at")
          .eq("user_id", user.id)
          .gte("created_at", startISO),
      ]);

      setSessions(sessionsRes.data || []);
      setTasks(tasksRes.data || []);
      setQuizAttempts(quizRes.data || []);
      setXpTx(xpRes.data || []);

      const setIds = ((setsRes.data as any[]) || []).map((s: any) => s.id);
      if (setIds.length > 0) {
        const { count } = await supabase
          .from("flashcards" as any)
          .select("*", { count: "exact", head: true })
          .in("set_id", setIds);
        setFlashcardCount(count || 0);
      } else {
        setFlashcardCount(0);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for cross-hook XP change events
  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener("xp-changed", handler);
    return () => window.removeEventListener("xp-changed", handler);
  }, [fetchData]);

  const analytics = useMemo<AnalyticsData>(() => {
    // Total study hours this month
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.study_minutes || 0), 0);
    const totalStudyHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Trend: compare first half vs second half of available data
    const mid = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(0, mid).reduce((s, r) => s + (r.study_minutes || 0), 0);
    const secondHalf = sessions.slice(mid).reduce((s, r) => s + (r.study_minutes || 0), 0);
    const studyHoursTrend = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

    // Subject/source breakdown from XP transactions this month
    const SOURCE_LABELS: Record<string, string> = {
      quiz: "Quizzes",
      pomodoro: "Focus Sessions",
      flashcard: "Flashcards",
      summary: "Summaries",
      store_purchase: "Store",
      task_uncomplete: "Adjustments",
    };
    const subjectMap = new Map<string, number>();

    // Tasks contribute by their subject name (rolling 30-day window)
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 29);
    windowStart.setHours(0, 0, 0, 0);
    tasks.forEach((t) => {
      if (!t.completed_at) return;
      if (new Date(t.completed_at) < windowStart) return;
      const key = t.subject || "General";
      subjectMap.set(key, (subjectMap.get(key) || 0) + (t.xp_reward || 0));
    });

    // Non-task XP sources
    xpTx.forEach((tx) => {
      const amt = tx.amount || 0;
      if (amt <= 0) return;
      if (tx.source === "task") return; // already covered above by subject
      const label = SOURCE_LABELS[tx.source] || (tx.source ? tx.source.replace(/_/g, " ") : "Other");
      subjectMap.set(label, (subjectMap.get(label) || 0) + amt);
    });

    const subjectData: SubjectData[] = Array.from(subjectMap.entries())
      .filter(([, v]) => v > 0)
      .map(([name, value], i) => ({
        name,
        value,
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    // Daily pattern (aggregate by day-of-week)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayTotals = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);
    sessions.forEach((s) => {
      const [yy, mm, dd] = s.date.split("-").map(Number);
      const d = new Date(yy, mm - 1, dd);
      const dayIndex = d.getDay();
      dayTotals[dayIndex] += s.study_minutes || 0;
      dayCounts[dayIndex]++;
    });
    const reorder = [1, 2, 3, 4, 5, 6, 0];
    const dailyPattern: DailyPatternData[] = reorder.map((i) => ({
      day: dayNames[i],
      hours: Math.round((dayCounts[i] > 0 ? dayTotals[i] / dayCounts[i] : 0) / 60 * 10) / 10,
    }));

    // Weekly progress: 4 rolling 7-day buckets ending today
    const weekBuckets: { tasks: number; xp: number; label: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 3; i >= 0; i--) {
      const end = new Date(today);
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      let t = 0, x = 0;
      sessions.forEach((s) => {
        const [yy, mm, dd] = s.date.split("-").map(Number);
        const d = new Date(yy, mm - 1, dd);
        if (d >= start && d <= end) {
          t += s.tasks_completed || 0;
          x += s.xp_earned || 0;
        }
      });
      weekBuckets.push({ tasks: t, xp: x, label: `${startLabel}–${endLabel}` });
    }
    const monthlyProgress: MonthlyProgressData[] = weekBuckets.map((w) => ({
      week: w.label,
      tasks: w.tasks,
      xp: w.xp,
    }));

    // Quiz stats
    const quizzesCompleted = quizAttempts.length;
    const avgScore = quizAttempts.length > 0
      ? Math.round(
          quizAttempts.reduce((sum, q) => {
            const total = q.total_questions || 0;
            const correct = q.correct_answers ?? q.score ?? 0;
            return sum + (total > 0 ? (correct / total) * 100 : 0);
          }, 0) / quizAttempts.length
        )
      : 0;

    return {
      totalStudyHours,
      studyHoursTrend,
      quizzesCompleted,
      flashcardsReviewed: flashcardCount,
      averageScore: avgScore,
      subjectData,
      dailyPattern,
      monthlyProgress,
      loading,
    };
  }, [sessions, tasks, quizAttempts, flashcardCount, xpTx, loading]);

  return analytics;
}
