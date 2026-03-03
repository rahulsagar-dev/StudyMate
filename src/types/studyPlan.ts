export interface StudyTask {
  id: string;
  title: string;
  date: string;
  duration: number; // minutes
  priority: "low" | "medium" | "high";
  completed: boolean;
  createdAt: string;
}
