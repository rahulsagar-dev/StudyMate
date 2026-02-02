import { Link } from "react-router-dom";
import { Zap, TrendingUp, ShoppingBag, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  return (
    <header className={cn(
      "h-16 bg-card/50 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-6",
      className
    )}>
      {/* Left - Page Title (dynamic) */}
      <div>
        <h1 className="text-xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome! Let's start your learning journey</p>
      </div>

      {/* Right - Stats & Actions */}
      <div className="flex items-center gap-4">
        {/* Today's XP */}
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border border-border/50">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-sm font-medium text-muted-foreground">0 XP</p>
          </div>
        </div>

        {/* Yesterday's XP */}
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg border border-border/50">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Yesterday</p>
            <p className="text-sm font-medium text-foreground">0 XP</p>
          </div>
        </div>

        {/* Level Badge */}
        <div className="level-badge">
          <span className="text-xs opacity-80">LVL</span>
          <span className="text-lg font-bold">1</span>
        </div>

        {/* Store */}
        <Link 
          to="/store"
          className="relative p-2.5 rounded-lg bg-secondary hover:bg-accent transition-colors group"
        >
          <ShoppingBag className="h-5 w-5 text-muted-foreground group-hover:text-achievement transition-colors" />
        </Link>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-lg bg-secondary hover:bg-accent transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
