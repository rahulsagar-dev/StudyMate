import { Calendar } from "lucide-react";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function CalendarPage() {
  return (
    <UnderConstruction
      title="Calendar Under Construction"
      description="Track exams, deadlines, and study sessions all in one place. Sync with your favorite calendar apps and never miss an important date."
      icon={<Calendar className="h-12 w-12 text-primary" />}
    />
  );
}
