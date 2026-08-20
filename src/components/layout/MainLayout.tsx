import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { FloatingAIButton } from "@/components/FloatingAIButton";
import { FloatingVoiceButton } from "@/components/VoiceAgent/FloatingVoiceButton";
import { MotivationPopup } from "@/components/MotivationPopup";
import { usePageTracking } from "@/hooks/usePageTracking";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  usePageTracking();

  return (
    <div className="min-h-screen bg-background flex w-full">

      <AppSidebar />
      
      <div className="flex-1 ml-16 flex flex-col">
        <TopBar />
        
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      <FloatingAIButton />
      <FloatingVoiceButton />
      <MotivationPopup />
    </div>
  );
}
