import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PomodoroProvider } from "@/contexts/PomodoroContext";
import { ActivityTrackerProvider } from "@/contexts/ActivityTrackerContext";
import { CosmeticsProvider } from "@/contexts/CosmeticsContext";
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
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import HybridQuizListener from "@/components/quiz/HybridQuizListener";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Whiteboard = lazy(() => import("./pages/Whiteboard"));

const queryClient = new QueryClient();

const page = (element: JSX.Element) => (
  <ProtectedRoute>
    <MainLayout>{element}</MainLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CosmeticsProvider>
      <PomodoroProvider>
      <ActivityTrackerProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
          <HybridQuizListener />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={page(<Dashboard />)} />
            <Route path="/focus" element={page(<FocusMode />)} />
            <Route path="/ai-assistant" element={page(<AIAssistant />)} />
            <Route path="/summarizer" element={page(<Summarizer />)} />
            <Route path="/flashcards" element={page(<Flashcards />)} />
            <Route path="/quizzes" element={page(<Quizzes />)} />
            <Route path="/study-planner" element={page(<StudyPlanner />)} />
            <Route path="/calendar" element={page(<CalendarPage />)} />
            <Route path="/achievements" element={page(<Achievements />)} />
            <Route path="/store" element={page(<Store />)} />
            <Route path="/streaks" element={page(<Streaks />)} />
            <Route path="/analytics" element={page(<Analytics />)} />
            <Route path="/profile" element={page(<Profile />)} />
            <Route path="/settings" element={page(<Settings />)} />
            <Route
              path="/whiteboard"
              element={page(
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
                  <Whiteboard />
                </Suspense>
              )}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
      </ActivityTrackerProvider>
      </PomodoroProvider>
      </CosmeticsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
