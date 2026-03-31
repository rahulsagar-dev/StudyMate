import { BookOpen, ListTodo, Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { AIAction } from "@/lib/aiActions";
import { motion } from "framer-motion";

const iconMap = {
  flashcards: BookOpen,
  task: ListTodo,
  quiz: Brain,
  navigate: ArrowRight,
};

interface ActionButtonsProps {
  actions: AIAction[];
  compact?: boolean;
}

export function ActionButtons({ actions, compact = false }: ActionButtonsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAction = async (action: AIAction) => {
    switch (action.id) {
      case "generate-flashcards":
        navigate("/flashcards", { state: { autoTopic: action.data?.topic } });
        toast({ title: "Opening Flashcards", description: `Topic: ${action.data?.topic || "General"}` });
        break;

      case "add-task":
        if (!user || !action.data?.title) return;
        // Optimistic instant feedback
        toast({ title: "✅ Task added!", description: action.data.title });
        supabase.from("tasks").insert({
          user_id: user.id,
          title: action.data.title,
          subject: "quick-win",
          xp_reward: 20,
        }).then(({ error }) => {
          if (error) toast({ title: "Error", description: "Failed to save task", variant: "destructive" });
          else window.dispatchEvent(new CustomEvent("xp-changed"));
        });
        break;

      case "start-quiz":
        navigate("/quizzes", { state: { autoTopic: action.data?.topic } });
        toast({ title: "Opening Quizzes", description: `Topic: ${action.data?.topic || "General"}` });
        break;
    }
  };

  if (actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-wrap gap-2 ${compact ? "mt-2" : "mt-3"}`}
    >
      {actions.map((action) => {
        const Icon = iconMap[action.icon];
        return (
          <Button
            key={action.id}
            size={compact ? "sm" : "default"}
            variant="outline"
            onClick={() => handleAction(action)}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Icon className="h-4 w-4" />
            {action.label}
          </Button>
        );
      })}
    </motion.div>
  );
}
