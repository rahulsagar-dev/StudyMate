import { CalendarDays } from "lucide-react";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function StudyPlanner() {
  return (
    <UnderConstruction
      title="Study Planner Coming Soon"
      description="Organize your study sessions for maximum productivity. Plan your week, set goals, and stay on track with smart reminders."
      icon={<CalendarDays className="h-12 w-12 text-primary" />}
    />
  );
}
