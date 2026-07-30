import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, BookOpen, CheckCircle, Timer, Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface XPTransaction {
  id: string;
  amount: number;
  source: string;
  created_at: string;
}

const SOURCE_META: Record<string, { icon: any; label: string; color: string }> = {
  pomodoro: { icon: Timer, label: "Pomodoro", color: "text-streak" },
  task: { icon: CheckCircle, label: "Task", color: "text-xp" },
  quiz: { icon: Brain, label: "Quiz", color: "text-level" },
  flashcard: { icon: BookOpen, label: "Flashcard", color: "text-primary" },
  bonus: { icon: Sparkles, label: "Bonus", color: "text-achievement" },
};

export function XPTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("xp_transactions")
        .select("id, amount, source, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);
      setTransactions(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-xp" />
        <h3 className="text-lg font-display font-semibold text-foreground">Recent XP</h3>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Zap className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No XP earned yet</p>
            <p className="text-xs mt-1">Complete tasks to earn XP</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const meta = SOURCE_META[tx.source] || {
              icon: Zap,
              label: tx.source,
              color: "text-muted-foreground",
            };
            const Icon = meta.icon;
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className={cn("p-1.5 rounded-lg bg-secondary/80", meta.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(tx.created_at)}</p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold whitespace-nowrap",
                    tx.amount >= 0 ? "text-xp" : "text-destructive"
                  )}
                >
                  {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
