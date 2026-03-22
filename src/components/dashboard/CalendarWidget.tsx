import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarEvents, getEventColor } from "@/hooks/useCalendarEvents";

const generateCalendarDays = (year: number, month: number) => {
  const days: (number | null)[] = [];
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CalendarWidget() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const { events, eventsByDate, isLoading } = useCalendarEvents(currentYear, currentMonth);
  const calendarDays = generateCalendarDays(currentYear, currentMonth);

  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();
  const todayDay = isCurrentMonth ? today.getDate() : null;

  const goToPreviousMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return eventsByDate.get(dateStr) || [];
  };

  // Get upcoming events (today and future, sorted by date)
  const upcomingEvents = events
    .filter((e) => {
      const eventDate = new Date(e.date);
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return eventDate >= todayDate;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
    .slice(0, 3);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-foreground">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={goToPreviousMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const hasEvent = dayEvents.length > 0;
            const isToday = day === todayDay;
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
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full" style={{ backgroundColor: getEventColor(e) }} />
                    ))}
                  </div>
                )}
                {hasEvent && isToday && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full bg-primary-foreground/70" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="flex-1 flex flex-col">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Upcoming</h4>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground">No upcoming events</p>
            <p className="text-xs text-muted-foreground mt-1">Add exams & deadlines to stay on track</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border bg-secondary/50 border-border/50"
              >
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: getEventColor(event) }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {event.start_time.slice(0, 5)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
