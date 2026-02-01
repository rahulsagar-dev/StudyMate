import { Flame } from "lucide-react";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function Streaks() {
  return (
    <UnderConstruction
      title="Streaks & XP Under Development"
      description="Watch your consistency grow! Track your daily streaks, XP progress, and compete on the global leaderboard."
      icon={<Flame className="h-12 w-12 text-primary" />}
    />
  );
}
