import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_type: string;
  subject: string | null;
  date: string;
  start_time: string;
  end_time: string;
  color: string | null;
  source: string;
  created_at: string;
}

export type CalendarEventInsert = Omit<CalendarEvent, "id" | "user_id" | "created_at">;

const EVENT_TYPE_COLORS: Record<string, string> = {
  study_session: "hsl(180, 70%, 50%)",
  exam: "hsl(0, 70%, 50%)",
  assignment: "hsl(45, 90%, 55%)",
  personal: "hsl(265, 70%, 60%)",
  other: "hsl(220, 10%, 55%)",
};

export function getEventColor(event: CalendarEvent): string {
  return event.color || EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.other;
}

export function useCalendarEvents(year: number, month: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["calendar-events", user?.id, year, month],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });

  const addEvent = useMutation({
    mutationFn: async (event: CalendarEventInsert) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({ ...event, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({ title: "Event created!" });
    },
    onError: (err) => {
      toast({ title: "Failed to create event", description: err.message, variant: "destructive" });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({ title: "Event updated!" });
    },
    onError: (err) => {
      toast({ title: "Failed to update event", description: err.message, variant: "destructive" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({ title: "Event deleted" });
    },
    onError: (err) => {
      toast({ title: "Failed to delete event", description: err.message, variant: "destructive" });
    },
  });

  const addBulkEvents = useMutation({
    mutationFn: async (eventList: CalendarEventInsert[]) => {
      if (!user) throw new Error("Not authenticated");
      const rows = eventList.map((e) => ({ ...e, user_id: user.id }));
      const { error } = await supabase.from("calendar_events").insert(rows);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({ title: "Schedule synced!", description: `${vars.length} sessions added to calendar` });
    },
    onError: (err) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  // Group events by date string
  const eventsByDate = new Map<string, CalendarEvent[]>();
  events.forEach((e) => {
    const list = eventsByDate.get(e.date) || [];
    list.push(e);
    eventsByDate.set(e.date, list);
  });

  return {
    events,
    eventsByDate,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    addBulkEvents,
  };
}
