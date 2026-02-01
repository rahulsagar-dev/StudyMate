import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { FloatingAIButton } from "@/components/FloatingAIButton";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <AppSidebar />
      
      <div className="flex-1 ml-16 flex flex-col">
        <TopBar />
        
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      <FloatingAIButton />
    </div>
  );
}
