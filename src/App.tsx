import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PomodoroProvider } from "@/contexts/PomodoroContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import AIAssistant from "./pages/AIAssistant";
import Summarizer from "./pages/Summarizer";
import Flashcards from "./pages/Flashcards";
import Quizzes from "./pages/Quizzes";
import StudyPlanner from "./pages/StudyPlanner";
import CalendarPage from "./pages/CalendarPage";
import Achievements from "./pages/Achievements";
import FocusMode from "./pages/FocusMode";
import Store from "./pages/Store";
import Streaks from "./pages/Streaks";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/focus" element={<MainLayout><FocusMode /></MainLayout>} />
            <Route path="/ai-assistant" element={<MainLayout><AIAssistant /></MainLayout>} />
            <Route path="/summarizer" element={<MainLayout><Summarizer /></MainLayout>} />
            <Route path="/flashcards" element={<MainLayout><Flashcards /></MainLayout>} />
            <Route path="/quizzes" element={<MainLayout><Quizzes /></MainLayout>} />
            <Route path="/study-planner" element={<MainLayout><StudyPlanner /></MainLayout>} />
            <Route path="/calendar" element={<MainLayout><CalendarPage /></MainLayout>} />
            <Route path="/achievements" element={<MainLayout><Achievements /></MainLayout>} />
            <Route path="/store" element={<MainLayout><Store /></MainLayout>} />
            <Route path="/streaks" element={<MainLayout><Streaks /></MainLayout>} />
            <Route path="/analytics" element={<MainLayout><Analytics /></MainLayout>} />
            <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
