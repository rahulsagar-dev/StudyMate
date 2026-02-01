import { BarChart3 } from "lucide-react";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function Analytics() {
  return (
    <UnderConstruction
      title="Analytics Dashboard Being Built"
      description="Deep dive into your study performance with detailed charts, insights, and personalized recommendations to optimize your learning."
      icon={<BarChart3 className="h-12 w-12 text-primary" />}
    />
  );
}
