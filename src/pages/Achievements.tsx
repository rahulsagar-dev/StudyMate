import { Trophy } from "lucide-react";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function Achievements() {
  return (
    <UnderConstruction
      title="Achievements Being Crafted"
      description="Unlock badges, earn rewards, and showcase your learning milestones. Every achievement brings you closer to mastery!"
      icon={<Trophy className="h-12 w-12 text-primary" />}
    />
  );
}
