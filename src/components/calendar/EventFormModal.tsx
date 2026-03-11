import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { CalendarEvent, CalendarEventInsert } from "@/hooks/useCalendarEvents";

const EVENT_TYPES = [
  { value: "study_session", label: "Study Session" },
  { value: "exam", label: "Exam" },
  { value: "assignment", label: "Assignment" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

const COLOR_OPTIONS = [
  { value: "auto", label: "Auto (by type)" },
  { value: "hsl(180, 70%, 50%)", label: "Cyan" },
  { value: "hsl(142, 70%, 45%)", label: "Green" },
  { value: "hsl(265, 70%, 60%)", label: "Purple" },
  { value: "hsl(45, 90%, 55%)", label: "Yellow" },
  { value: "hsl(0, 70%, 50%)", label: "Red" },
  { value: "hsl(25, 95%, 55%)", label: "Orange" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: CalendarEventInsert) => void;
  onUpdate?: (event: Partial<CalendarEvent> & { id: string }) => void;
  onDelete?: (id: string) => void;
  editEvent?: CalendarEvent | null;
  defaultDate?: string;
}

export function EventFormModal({ open, onOpenChange, onSave, onUpdate, onDelete, editEvent, defaultDate }: Props) {
  const { toast } = useToast();
  const isEditing = !!editEvent;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [eventType, setEventType] = useState("study_session");
  const [subject, setSubject] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDescription(editEvent.description || "");
      setDate(editEvent.date);
      setStartTime(editEvent.start_time.slice(0, 5));
      setEndTime(editEvent.end_time.slice(0, 5));
      setEventType(editEvent.event_type);
      setSubject(editEvent.subject || "");
      setColor(editEvent.color || "auto");
    } else {
      setTitle("");
      setDescription("");
      setDate(defaultDate || new Date().toISOString().split("T")[0]);
      setStartTime("09:00");
      setEndTime("10:00");
      setEventType("study_session");
      setSubject("");
      setColor("auto");
    }
  }, [editEvent, defaultDate, open]);

  const validate = (): boolean => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return false;
    }
    if (!date) {
      toast({ title: "Date is required", variant: "destructive" });
      return false;
    }
    if (!startTime || !endTime) {
      toast({ title: "Start and end times are required", variant: "destructive" });
      return false;
    }
    if (endTime <= startTime) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    const payload: CalendarEventInsert = {
      title: title.trim(),
      description: description.trim() || null,
      date,
      start_time: startTime,
      end_time: endTime,
      event_type: eventType,
      subject: subject.trim() || null,
      color: color || null,
      source: "manual",
    };

    if (isEditing && onUpdate) {
      onUpdate({ id: editEvent!.id, ...payload });
    } else {
      onSave(payload);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (editEvent && onDelete) {
      onDelete(editEvent.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Event" : "Add Event"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the event details below." : "Create a new calendar event."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="evt-title">Title *</Label>
            <Input id="evt-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Study Data Structures" className="bg-secondary/50 border-border/50" maxLength={120} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evt-desc">Description</Label>
            <Textarea id="evt-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes…" className="bg-secondary/50 border-border/50 resize-none" rows={2} maxLength={500} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="evt-date">Date *</Label>
              <Input id="evt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-secondary/50 border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="evt-start">Start Time *</Label>
              <Input id="evt-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-secondary/50 border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evt-end">End Time *</Label>
              <Input id="evt-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-secondary/50 border-border/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="evt-subject">Subject / Topic</Label>
              <Input id="evt-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Optional" className="bg-secondary/50 border-border/50" maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        {c.value && <span className="w-3 h-3 rounded-full inline-block" style={{ background: c.value }} />}
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {isEditing && editEvent?.source !== "planner" && (
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )}
          {isEditing && editEvent?.source === "planner" && (
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </Button>
          )}
          {!isEditing && <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>{isEditing ? "Update" : "Save Event"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
