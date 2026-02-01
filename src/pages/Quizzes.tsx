import { Brain } from "lucide-react";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function Quizzes() {
  return (
    <UnderConstruction
      title="Quiz Engine In Development"
      description="Test your knowledge and earn XP! Take quizzes, track your progress, and compete with friends on the leaderboard."
      icon={<Brain className="h-12 w-12 text-primary" />}
    />
  );
}
