import { CalendarEvent, getEventColor } from "@/hooks/useCalendarEvents";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

function formatTime12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const TYPE_LABELS: Record<string, string> = {
  study_session: "Study Session",
  exam: "Exam",
  assignment: "Assignment",
  personal: "Personal",
  other: "Other",
};

interface Props {
  event: CalendarEvent;
  onClick: () => void;
}

export function EventTooltip({ event, onClick }: Props) {
  const color = getEventColor(event);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80 leading-tight"
            style={{ backgroundColor: color, color: "#fff" }}
          >
            {event.title}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px] space-y-1 bg-popover border-border/50">
          <p className="font-semibold text-sm">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatTime12(event.start_time)} – {formatTime12(event.end_time)}
          </p>
          <p className="text-xs text-muted-foreground">{TYPE_LABELS[event.event_type] || event.event_type}</p>
          {event.subject && <p className="text-xs text-muted-foreground">Subject: {event.subject}</p>}
          {event.source === "planner" && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Planner</Badge>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
