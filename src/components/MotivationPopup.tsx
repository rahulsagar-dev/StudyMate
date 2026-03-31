import { useState, useEffect } from "react";
import { X, Flame, Trophy, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserContext } from "@/hooks/useUserContext";
import { useAuth } from "@/contexts/AuthContext";

function getMotivation(ctx: ReturnType<typeof useUserContext>) {
  if (!ctx.ready) return null;

  if (ctx.currentStreak >= 7) {
    return { icon: Flame, color: "text-orange-400", msg: `🔥 ${ctx.currentStreak}-day streak! You're on fire — keep the momentum!` };
  }
  if (ctx.pendingTasks.length > 0 && ctx.completedToday === 0) {
    return { icon: Target, color: "text-primary", msg: `📋 You have ${ctx.pendingTasks.length} pending tasks. Let's knock one out today!` };
  }
  if (ctx.completedToday >= 3) {
    return { icon: Trophy, color: "text-yellow-400", msg: `🏆 ${ctx.completedToday} tasks done today — amazing productivity!` };
  }
  if (ctx.currentStreak >= 3) {
    return { icon: Flame, color: "text-orange-400", msg: `🔥 ${ctx.currentStreak}-day streak! Keep studying to maintain it.` };
  }
  if (ctx.pendingTasks.length > 3) {
    return { icon: Target, color: "text-primary", msg: `💪 ${ctx.pendingTasks.length} tasks waiting. Start with a quick win!` };
  }
  return { icon: Trophy, color: "text-primary", msg: `✨ Welcome back! Ready to learn something new today?` };
}

export function MotivationPopup() {
  const { user } = useAuth();
  const ctx = useUserContext();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || !ctx.ready) return;
    const key = `motivation_shown_${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem(key, "1");
    }, 1500);
    return () => clearTimeout(timer);
  }, [user, ctx.ready]);

  const motivation = getMotivation(ctx);
  if (!motivation) return null;

  const Icon = motivation.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="fixed top-20 right-6 z-50 max-w-sm"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl p-4 flex items-start gap-3">
            <div className={`shrink-0 mt-0.5 ${motivation.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-foreground flex-1">{motivation.msg}</p>
            <button onClick={() => setShow(false)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
