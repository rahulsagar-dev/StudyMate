import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Settings, Calendar, BarChart3, Plus, Trash2,
  FileDown, Download, Save, History, AlertCircle, Copy, Eye, ArrowRight, ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";
import type { Subject, TimeSlot, SchedulePlan } from "@/types/studyPlan";

const STORAGE_KEY = "scheduler-plans";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DIFF_COLORS: Record<string, string> = {
  easy: "bg-success",
  moderate: "bg-warning",
  difficult: "bg-destructive",
};

const DIFF_SESSION: Record<string, { study: number; break_: number; total: number }> = {
  easy: { study: 55, break_: 5, total: 60 },
  moderate: { study: 70, break_: 5, total: 75 },
  difficult: { study: 85, break_: 5, total: 90 },
};

const DIFF_WEIGHT: Record<string, number> = { difficult: 3, moderate: 2, easy: 1 };
const DIFF_XP: Record<string, number> = { difficult: 80, moderate: 60, easy: 40 };

function loadPlans(): SchedulePlan[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function savePlans(plans: SchedulePlan[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans.slice(0, 10)));
}

function parseFreeSlots(input: string): { start: number; end: number }[] {
  const regex = /(\d{1,2}(?::\d{2})?)\s*-\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?/gi;
  const slots: { start: number; end: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    let startH = parseInt(match[1]);
    let endH = parseInt(match[2]);
    const ampm = match[3]?.toLowerCase();
    if (ampm === "pm" && startH < 12) startH += 12;
    if (ampm === "am" && startH === 12) startH = 0;
    if (!ampm && startH >= 3 && startH <= 11) startH += 12;
    if (ampm === "pm" && endH < 12) endH += 12;
    if (ampm === "am" && endH === 12) endH = 0;
    if (!ampm && endH >= 3 && endH <= 11) endH += 12;
    if (endH > startH) slots.push({ start: startH * 60, end: endH * 60 });
  }
  return slots;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function generateSchedule(subjects: Subject[], dailyHours: number, freeSlots: string): TimeSlot[] {
  const sorted = [...subjects].sort((a, b) => DIFF_WEIGHT[b.difficulty] - DIFF_WEIGHT[a.difficulty]);
  const totalWeight = sorted.reduce((s, sub) => s + DIFF_WEIGHT[sub.difficulty], 0);
  const totalWeeklyMin = dailyHours * 7 * 60;

  // Calculate sessions per subject
  const sessionCounts: { subject: Subject; count: number }[] = sorted.map((sub) => ({
    subject: sub,
    count: Math.max(1, Math.round((DIFF_WEIGHT[sub.difficulty] / totalWeight) * (totalWeeklyMin / DIFF_SESSION[sub.difficulty].total))),
  }));

  const parsedSlots = parseFreeSlots(freeSlots);
  if (parsedSlots.length === 0) {
    // Default: 3-5pm, 7-9pm
    parsedSlots.push({ start: 15 * 60, end: 17 * 60 }, { start: 19 * 60, end: 21 * 60 });
  }

  const schedule: TimeSlot[] = [];
  let subjectIndex = 0;
  let lastSubject = "";

  // Build a queue of sessions
  const sessionQueue: Subject[] = [];
  for (const sc of sessionCounts) {
    for (let i = 0; i < sc.count; i++) {
      sessionQueue.push(sc.subject);
    }
  }

  for (const day of DAYS) {
    const daySlots = parsedSlots.map((s) => ({ ...s }));
    let dayMinutes = 0;
    const maxDayMin = dailyHours * 60;

    for (const slot of daySlots) {
      let cursor = slot.start;
      while (cursor < slot.end && dayMinutes < maxDayMin && sessionQueue.length > 0) {
        // Find next subject (avoid consecutive same)
        let found = -1;
        for (let i = 0; i < sessionQueue.length; i++) {
          if (sessionQueue[i].name !== lastSubject || sessionQueue.length === 1) {
            found = i;
            break;
          }
        }
        if (found === -1) found = 0;

        const sub = sessionQueue[found];
        const sess = DIFF_SESSION[sub.difficulty];
        if (cursor + sess.total > slot.end) break;
        if (dayMinutes + sess.total > maxDayMin) break;

        schedule.push({
          day,
          startTime: formatTime(cursor),
          endTime: formatTime(cursor + sess.total),
          subject: sub.name,
          difficulty: sub.difficulty,
          durationHrs: +(sess.total / 60).toFixed(2),
          breakMin: sess.break_,
          studyMin: sess.study,
          xpReward: DIFF_XP[sub.difficulty],
        });

        cursor += sess.total;
        dayMinutes += sess.total;
        lastSubject = sub.name;
        sessionQueue.splice(found, 1);
      }
    }
  }

  return schedule;
}

export default function StudyPlanner() {
  const { toast } = useToast();
  const { addTask } = useTasks();

  // Subjects input
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "moderate" | "difficult">("moderate");
  const [validationError, setValidationError] = useState("");

  // Preferences
  const [dailyHours, setDailyHours] = useState(4);
  const [planType, setPlanType] = useState<"week" | "month">("week");
  const [freeSlots, setFreeSlots] = useState("");

  // Schedule
  const [schedule, setSchedule] = useState<TimeSlot[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  // History
  const [savedPlans, setSavedPlans] = useState<SchedulePlan[]>(loadPlans());

  const addSubject = useCallback(() => {
    const name = subjectName.trim();
    if (!name) {
      setValidationError("Subject name required");
      return;
    }
    if (subjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setValidationError("Duplicate subjects not allowed");
      return;
    }
    setValidationError("");
    setSubjects((prev) => [...prev, { id: crypto.randomUUID(), name, difficulty }]);
    setSubjectName("");
    toast({ title: "Subject added", description: `${name} (${difficulty})` });
  }, [subjectName, difficulty, subjects, toast]);

  const removeSubject = (id: string) => {
    const sub = subjects.find((s) => s.id === id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    if (sub) toast({ title: "Subject removed", description: sub.name });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(false);
    await new Promise((r) => setTimeout(r, 2000));
    const result = generateSchedule(subjects, dailyHours, freeSlots);
    setSchedule(result);
    setGenerated(true);
    setGenerating(false);
    toast({ title: "Timetable generated!", description: `${result.length} sessions scheduled` });
  };

  const saveSchedule = () => {
    const totalHrs = schedule.reduce((s, t) => s + t.durationHrs, 0);
    const totalXP = schedule.reduce((s, t) => s + t.xpReward, 0);
    const plan: SchedulePlan = {
      id: crypto.randomUUID(),
      subjects: [...subjects],
      dailyHours,
      planType,
      freeSlots,
      schedule: [...schedule],
      createdAt: new Date().toISOString(),
      totalStudyHours: +totalHrs.toFixed(1),
      weeklyHours: +totalHrs.toFixed(1),
      totalXP,
    };
    const updated = [plan, ...savedPlans].slice(0, 10);
    setSavedPlans(updated);
    savePlans(updated);
    toast({ title: "Schedule saved!", description: `${subjects.length} subjects, ${totalHrs.toFixed(1)}h` });
  };

  const loadSchedule = (plan: SchedulePlan) => {
    setSubjects(plan.subjects);
    setDailyHours(plan.dailyHours);
    setPlanType(plan.planType);
    setFreeSlots(plan.freeSlots);
    setSchedule(plan.schedule);
    setGenerated(true);
    toast({ title: "Schedule loaded" });
  };

  const deleteSchedule = (id: string) => {
    const updated = savedPlans.filter((p) => p.id !== id);
    setSavedPlans(updated);
    savePlans(updated);
    toast({ title: "Schedule deleted" });
  };

  const copySchedule = (plan: SchedulePlan) => {
    const text = plan.schedule
      .map((s) => `${s.day}: ${s.startTime}-${s.endTime} → ${s.subject} (${s.difficulty})`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const exportCSV = () => {
    const header = "Day,Start Time,End Time,Subject,Difficulty,Duration (hrs),Break (min)";
    const rows = schedule.map((s) =>
      `${s.day},${s.startTime},${s.endTime},${s.subject},${s.difficulty},${s.durationHrs},${s.breakMin}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-schedule.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported!" });
  };

  const exportPDF = () => {
    toast({ title: "PDF export feature coming soon!" });
  };

  // TODO: Later connect XP system with global user progression system
  // (levels, achievements, streaks, leaderboard)
  const syncToTasks = async () => {
    const totalXP = schedule.reduce((s, t) => s + t.xpReward, 0);
    for (const session of schedule) {
      await addTask(
        `Study: ${session.subject} (${session.startTime} - ${session.endTime})`,
        "major-project",
        session.xpReward
      );
    }
    toast({ title: "Tasks synced!", description: `${schedule.length} study tasks synced to Dashboard (+${totalXP} XP potential)` });
  };

  // Analytics
  const totalPlannedHrs = schedule.reduce((s, t) => s + t.durationHrs, 0);
  const totalScheduleXP = schedule.reduce((s, t) => s + t.xpReward, 0);
  const availableHrs = dailyHours * 7;
  const utilization = availableHrs > 0 ? Math.round((totalPlannedHrs / availableHrs) * 100) : 0;
  const subjectHours = subjects.map((sub) => {
    const sessions = schedule.filter((s) => s.subject === sub.name);
    return {
      name: sub.name,
      hours: +sessions.reduce((sum, s) => sum + s.durationHrs, 0).toFixed(1),
      xp: sessions.reduce((sum, s) => sum + s.xpReward, 0),
    };
  });

  const daySchedules = DAYS.map((day) => ({
    day,
    sessions: schedule.filter((s) => s.day === day),
    totalHrs: +schedule.filter((s) => s.day === day).reduce((sum, s) => sum + s.durationHrs, 0).toFixed(1),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-6 py-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient-primary">
            AI Study Scheduler
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate optimized study timetables based on subject difficulty and available time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                Schedule History ({savedPlans.length})
              </Button>
            </SheetTrigger>
            <SheetContent className="max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Schedule History</SheetTitle>
                <SheetDescription>Your saved study schedules</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                {savedPlans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">No saved schedules yet</p>
                  </div>
                ) : (
                  savedPlans.map((plan) => (
                    <Card key={plan.id} className="glass-card">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-foreground">
                            {plan.subjects.length} subjects · {plan.totalStudyHours}h
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {plan.planType === "week" ? "Weekly" : "Monthly"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {plan.subjects.slice(0, 3).map((s) => (
                            <Badge key={s.id} variant="secondary" className="text-xs">
                              {s.name}
                            </Badge>
                          ))}
                          {plan.subjects.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{plan.subjects.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(plan.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => loadSchedule(plan)}>
                            <Eye className="h-3 w-3" /> Load
                          </Button>
                          <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => copySchedule(plan)}>
                            <Copy className="h-3 w-3" /> Copy
                          </Button>
                          <Button size="sm" variant="ghost" className="gap-1 text-xs text-destructive" onClick={() => deleteSchedule(plan.id)}>
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={syncToTasks}
            disabled={schedule.length === 0}
          >
            <ListTodo className="h-4 w-4" />
            Sync Tasks with Dashboard
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Card A - Subjects */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-5 w-5 text-primary" />
                Subjects & Difficulty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {validationError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{validationError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Subject Name"
                  value={subjectName}
                  onChange={(e) => { setSubjectName(e.target.value); setValidationError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && addSubject()}
                  className="bg-secondary/50 border-border/50"
                />
                <Button size="icon" onClick={addSubject} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy (1hr sessions)</SelectItem>
                  <SelectItem value="moderate">Moderate (1.25hr sessions)</SelectItem>
                  <SelectItem value="difficult">Difficult (1.5hr sessions)</SelectItem>
                </SelectContent>
              </Select>
              {subjects.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {subjects.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${DIFF_COLORS[sub.difficulty]}`} />
                      <span className="text-sm text-foreground flex-1 truncate">{sub.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">{sub.difficulty}</Badge>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => removeSubject(sub.id)}>
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card B - Preferences */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-5 w-5 text-primary" />
                Study Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Daily Study Hours</label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Schedule Type</label>
                <Select value={planType} onValueChange={(v) => setPlanType(v as "week" | "month")}>
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Weekly (Mon-Sun)</SelectItem>
                    <SelectItem value="month">Monthly (4 weeks)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Free Time Slots</label>
                <Input
                  placeholder="e.g., 3-5 pm, 7-9 pm"
                  value={freeSlots}
                  onChange={(e) => setFreeSlots(e.target.value)}
                  className="bg-secondary/50 border-border/50"
                />
                <p className="text-xs text-muted-foreground/60">Enter your available time slots separated by commas.</p>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={generating || subjects.length < 2}
              >
                {generating ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Generating AI Schedule...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Generate Timetable
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Analytics Card */}
          {generated && schedule.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Study Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Weekly Hours</span>
                      <span className="text-foreground font-medium">
                        {totalPlannedHrs.toFixed(1)} / {availableHrs}h ({utilization}%)
                      </span>
                    </div>
                    <Progress value={utilization} className="h-2" />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Subject Distribution</p>
                    {subjectHours.map((sh) => (
                      <div key={sh.name} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{sh.name}</span>
                        <span className="text-muted-foreground">{sh.hours}h</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Weekly Timetable */}
        <div className="lg:col-span-2">
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-primary" />
                  Weekly Timetable
                </CardTitle>
                {generated && schedule.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={exportCSV}>
                      <FileDown className="h-3 w-3" /> CSV
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={exportPDF}>
                      <Download className="h-3 w-3" /> PDF
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={saveSchedule}>
                      <Save className="h-3 w-3" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={syncToTasks}>
                      <ListTodo className="h-3 w-3" /> Sync
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <Calendar className="h-16 w-16 text-primary/40" />
                    <div className="absolute inset-0 rounded-full shimmer opacity-30" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 animate-pulse">Generating optimized schedule...</p>
                </div>
              ) : !generated ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Your optimized timetable will appear here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {daySchedules.map((ds, dayIdx) => (
                    <div key={ds.day}>
                      {dayIdx > 0 && <Separator className="my-3" />}
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-foreground">{ds.day}</h4>
                        <Badge variant="secondary" className="text-xs">{ds.totalHrs}h</Badge>
                      </div>
                      {ds.sessions.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 pl-2">No sessions scheduled</p>
                      ) : (
                        <div className="space-y-1.5">
                          {ds.sessions.map((session, idx) => (
                            <motion.div
                              key={`${ds.day}-${idx}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 text-sm"
                            >
                              <div className={`w-2 h-2 rounded-full shrink-0 ${DIFF_COLORS[session.difficulty]}`} />
                              <span className="text-muted-foreground whitespace-nowrap">
                                {session.startTime} – {session.endTime}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                              <span className="text-foreground font-medium truncate">{session.subject}</span>
                              <div className="flex items-center gap-1 ml-auto shrink-0">
                                <Badge variant="outline" className="text-xs">{session.durationHrs}h</Badge>
                                <Badge variant="outline" className="text-xs capitalize">{session.difficulty}</Badge>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
