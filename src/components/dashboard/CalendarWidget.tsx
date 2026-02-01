import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// Empty events for new users
const events: { id: number; title: string; type: string; time: string; date: number }[] = [];

// Generate calendar days
const generateCalendarDays = () => {
  const days = [];
  const startDay = 5; // Friday
  const totalDays = 28;

  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

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

      {/* Upcoming Events - Empty State */}
      <div className="flex-1 flex flex-col">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Upcoming</h4>
        {events.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground">No upcoming events</p>
            <p className="text-xs text-muted-foreground mt-1">Add exams & deadlines to stay on track</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border bg-secondary/50 border-border/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">Feb {event.date} • {event.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
