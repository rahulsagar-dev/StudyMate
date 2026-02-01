import { ChevronLeft, ChevronRight, BookOpen, FileText, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const events = [
  { id: 1, title: "Biology Exam", type: "exam", time: "10:00 AM", date: 15 },
  { id: 2, title: "Physics Study Session", type: "study", time: "2:00 PM", date: 15 },
  { id: 3, title: "Chemistry Assignment Due", type: "deadline", time: "11:59 PM", date: 17 },
  { id: 4, title: "Math Quiz", type: "exam", time: "9:00 AM", date: 20 },
];

const getEventIcon = (type: string) => {
  switch (type) {
    case "exam":
      return <Brain className="h-3 w-3" />;
    case "study":
      return <BookOpen className="h-3 w-3" />;
    case "deadline":
      return <FileText className="h-3 w-3" />;
    default:
      return <BookOpen className="h-3 w-3" />;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case "exam":
      return "bg-destructive/20 text-destructive border-destructive/30";
    case "study":
      return "bg-primary/20 text-primary border-primary/30";
    case "deadline":
      return "bg-warning/20 text-warning border-warning/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

// Generate calendar days
const generateCalendarDays = () => {
  const days = [];
  const startDay = 5; // Friday
  const totalDays = 31;

  // Add empty cells for days before month starts
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Add days
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  return days;
};

const calendarDays = generateCalendarDays();
const currentDay = 14;

export function CalendarWidget() {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-foreground">February 2026</h3>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            const hasEvent = events.some((e) => e.date === day);
            const isToday = day === currentDay;

            return (
              <div
                key={i}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors cursor-pointer",
                  day === null && "invisible",
                  isToday && "bg-primary text-primary-foreground font-semibold",
                  !isToday && day && "hover:bg-secondary",
                  !isToday && hasEvent && "text-primary"
                )}
              >
                {day}
                {hasEvent && !isToday && (
                  <div className="w-1 h-1 bg-primary rounded-full mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Upcoming</h4>
        {events.slice(0, 3).map((event) => (
          <div
            key={event.id}
            className={cn(
              "flex items-center gap-3 p-2.5 rounded-lg border",
              getEventColor(event.type)
            )}
          >
            <div className="p-1.5 rounded-md bg-current/10">
              {getEventIcon(event.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{event.title}</p>
              <p className="text-xs opacity-70">Feb {event.date} • {event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
