import { ShoppingBag } from "lucide-react";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function Store() {
  return (
    <UnderConstruction
      title="Reward Store Coming Soon"
      description="Spend your hard-earned XP on themes, avatars, power-ups, and exclusive study boosts. Learning has never been this rewarding!"
      icon={<ShoppingBag className="h-12 w-12 text-primary" />}
    />
  );
}
