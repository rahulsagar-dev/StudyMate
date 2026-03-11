import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, Zap, RefreshCw, Link2, Unlink, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
import { EventFormModal } from "@/components/calendar/EventFormModal";
import { EventTooltip } from "@/components/calendar/EventTooltip";

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
  const { connected, loading: gcalLoading, syncing, connect, disconnect, syncSessions } = useGoogleCalendar();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Events
  const { events, eventsByDate, addEvent, updateEvent, deleteEvent } = useCalendarEvents(year, month);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Study sessions query
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

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); setSelectedDay(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); setSelectedDay(null); };

  const selectedDateStr = selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : null;
  const selectedSession = selectedDateStr ? sessionMap.get(selectedDateStr) : null;
  const selectedEvents = selectedDateStr ? (eventsByDate.get(selectedDateStr) || []) : [];

  const openCreateModal = (day?: number) => {
    setEditingEvent(null);
    if (day) setSelectedDay(day);
    setModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const defaultDate = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : `${year}-${String(month + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground">Track your study sessions & events</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" className="gap-2" onClick={() => openCreateModal()}>
            <Plus className="h-4 w-4" /> Add Event
          </Button>

          {user && connected ? (
            <>
              <Button variant="default" size="sm" className="gap-2" onClick={syncSessions} disabled={syncing}>
                <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                {syncing ? "Syncing..." : "Sync to Google Calendar"}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={disconnect} disabled={gcalLoading}>
                <Unlink className="h-4 w-4" />
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            </>
          ) : user ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={connect} disabled={gcalLoading}>
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Connect Google Calendar</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6">
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
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) return <div key={i} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasSession = sessionMap.has(dateStr);
              const dayEvents = eventsByDate.get(dateStr) || [];
              const isToday = isCurrentMonth && day === today.getDate();
              const isSelected = day === selectedDay;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={cn(
                    "min-h-[60px] flex flex-col items-center rounded-xl text-sm font-medium transition-all duration-200 relative p-1 gap-0.5",
                    isSelected && "bg-primary text-primary-foreground ring-2 ring-primary/50",
                    !isSelected && isToday && "bg-primary/15 text-primary border border-primary/30",
                    !isSelected && !isToday && "hover:bg-secondary text-foreground",
                  )}
                >
                  <span className="text-xs">{day}</span>
                  {/* Event dots / mini labels */}
                  {dayEvents.slice(0, 2).map((evt) => (
                    <EventTooltip key={evt.id} event={evt} onClick={() => openEditModal(evt)} />
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 2}</span>
                  )}
                  {hasSession && dayEvents.length === 0 && !isSelected && (
                    <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-xp" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              {selectedDay ? `${MONTH_NAMES[month]} ${selectedDay}, ${year}` : "Select a day"}
            </h3>
            {selectedDay && (
              <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => openCreateModal(selectedDay)}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            )}
          </div>

          {!selectedDay ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 text-primary/40" />
              </div>
              <p className="text-sm text-muted-foreground">Click on a day to see details.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto">
              {/* Events for this day */}
              {selectedEvents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Events</h4>
                  <AnimatePresence>
                    {selectedEvents.map((evt) => (
                      <motion.button
                        key={evt.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={() => openEditModal(evt)}
                        className="w-full text-left p-3 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: evt.color || "hsl(var(--primary))" }} />
                          <span className="text-sm font-medium truncate">{evt.title}</span>
                          {evt.source === "planner" && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto shrink-0">Planner</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground pl-[18px]">
                          {formatTime12(evt.start_time)} – {formatTime12(evt.end_time)}
                          {evt.subject && ` · ${evt.subject}`}
                        </p>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Study session stats */}
              {selectedSession && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Study Stats</h4>
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
              )}

              {selectedEvents.length === 0 && !selectedSession && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Calendar className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">No events or sessions.</p>
                  <Button size="sm" variant="link" className="mt-2 text-xs" onClick={() => openCreateModal(selectedDay)}>
                    Add an event
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <EventFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={(e) => addEvent.mutate(e)}
        onUpdate={(e) => updateEvent.mutate(e)}
        onDelete={(id) => deleteEvent.mutate(id)}
        editEvent={editingEvent}
        defaultDate={defaultDate}
      />
    </div>
  );
}

function formatTime12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}
