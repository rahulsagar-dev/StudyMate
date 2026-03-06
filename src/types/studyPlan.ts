export interface Subject {
  id: string;
  name: string;
  difficulty: "easy" | "moderate" | "difficult";
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  difficulty: "easy" | "moderate" | "difficult";
  durationHrs: number;
  breakMin: number;
  studyMin: number;
  xpReward: number;
}

export interface SchedulePlan {
  id: string;
  subjects: Subject[];
  dailyHours: number;
  planType: "week" | "month";
  freeSlots: string;
  schedule: TimeSlot[];
  createdAt: string;
  totalStudyHours: number;
  weeklyHours: number;
  totalXP: number;
}
