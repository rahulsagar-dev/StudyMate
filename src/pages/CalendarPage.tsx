import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function generateDays(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < first; i++) days.push(null);
  for (let i = 1; i <= total; i++) days.push(i);
  return days;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;

  const { data: sessions = [] } = useQuery({
    queryKey: ["calendar-sessions", user?.id, year, month],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate);
      return data ?? [];
    },
    enabled: !!user,
  });

  const sessionMap = new Map(sessions.map((s) => [s.date, s]));

  const days = generateDays(year, month);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  };

  const selectedDate = selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : null;
  const selectedSession = selectedDate ? sessionMap.get(selectedDate) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground">Track your study sessions day by day</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-semibold text-foreground">
              {MONTH_NAMES[month]} {year}
            </h2>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) return <div key={i} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasSession = sessionMap.has(dateStr);
              const isToday = isCurrentMonth && day === today.getDate();
              const isSelected = day === selectedDay;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 relative",
                    isSelected && "bg-primary text-primary-foreground ring-2 ring-primary/50",
                    !isSelected && isToday && "bg-primary/15 text-primary border border-primary/30",
                    !isSelected && !isToday && "hover:bg-secondary text-foreground",
                  )}
                >
                  {day}
                  {hasSession && !isSelected && (
                    <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-xp" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Session Detail Panel */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 flex flex-col">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            {selectedDay ? `${MONTH_NAMES[month]} ${selectedDay}, ${year}` : "Select a day"}
          </h3>

          {!selectedDay ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 text-primary/40" />
              </div>
              <p className="text-sm text-muted-foreground">Click on a day to see your study sessions.</p>
            </div>
          ) : selectedSession ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Study Time</p>
                    <p className="text-lg font-semibold text-foreground">
                      {Math.floor(selectedSession.study_minutes / 60)}h {selectedSession.study_minutes % 60}m
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-xp/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-xp" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">XP Earned</p>
                    <p className="text-lg font-semibold text-foreground">{selectedSession.xp_earned} XP</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {selectedSession.tasks_completed} task{selectedSession.tasks_completed !== 1 ? "s" : ""} completed
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No study sessions on this day.</p>
              <p className="text-xs text-muted-foreground mt-1">Your study sessions will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
