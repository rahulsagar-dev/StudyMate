import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const events = [
  { id: 1, title: "Biology Exam", type: "exam", date: 15, time: "10:00 AM" },
  { id: 2, title: "Physics Study Group", type: "study", date: 15, time: "2:00 PM" },
  { id: 3, title: "Chemistry Assignment", type: "deadline", date: 17, time: "11:59 PM" },
  { id: 4, title: "Math Quiz", type: "exam", date: 20, time: "9:00 AM" },
  { id: 5, title: "History Project Due", type: "deadline", date: 22, time: "5:00 PM" },
  { id: 6, title: "Study Session", type: "study", date: 25, time: "3:00 PM" },
];

const generateCalendarDays = () => {
  const days = [];
  const startDay = 5;
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

const getEventColor = (type: string) => {
  switch (type) {
    case "exam":
      return "bg-destructive text-destructive-foreground";
    case "study":
      return "bg-primary text-primary-foreground";
    case "deadline":
      return "bg-achievement text-achievement-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Calendar</h1>
            <p className="text-muted-foreground">Track your exams, deadlines, and study sessions</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Add Event
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Calendar Grid */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">February 2026</h2>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                </button>
                <button className="px-4 py-2 bg-secondary rounded-lg text-sm font-medium text-foreground">
                  Today
                </button>
                <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, i) => {
                const dayEvents = events.filter((e) => e.date === day);
                const isToday = day === currentDay;

                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-24 p-2 rounded-xl border transition-all",
                      day === null && "invisible",
                      isToday && "border-primary bg-primary/5",
                      !isToday && day && "border-border/50 hover:border-border"
                    )}
                  >
                    {day && (
                      <>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isToday ? "text-primary" : "text-foreground"
                          )}
                        >
                          {day}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded truncate",
                                getEventColor(event.type)
                              )}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} more
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-xl bg-secondary/50 border border-border/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Feb {event.date} • {event.time}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        getEventColor(event.type)
                      )}
                    >
                      {event.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 mt-6">
            <h3 className="font-semibold text-foreground mb-4">Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm text-muted-foreground">Exams</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Study Sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-achievement" />
                <span className="text-sm text-muted-foreground">Deadlines</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
