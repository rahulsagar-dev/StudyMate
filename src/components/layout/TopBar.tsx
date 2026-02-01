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
        <p className="text-sm text-muted-foreground">Welcome back, let's continue learning!</p>
      </div>

      {/* Right - Stats & Actions */}
      <div className="flex items-center gap-4">
        {/* Today's XP */}
        <div className="flex items-center gap-2 px-4 py-2 bg-xp/10 rounded-lg border border-xp/20">
          <Zap className="h-4 w-4 text-xp" />
          <div>
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-sm font-semibold text-xp">+250 XP</p>
          </div>
        </div>

        {/* Yesterday's XP */}
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg border border-border/50">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Yesterday</p>
            <p className="text-sm font-medium text-foreground">180 XP</p>
          </div>
        </div>

        {/* Level Badge */}
        <div className="level-badge">
          <span className="text-xs opacity-80">LVL</span>
          <span className="text-lg font-bold">12</span>
        </div>

        {/* Store */}
        <button className="relative p-2.5 rounded-lg bg-secondary hover:bg-accent transition-colors group">
          <ShoppingBag className="h-5 w-5 text-muted-foreground group-hover:text-achievement transition-colors" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-achievement text-achievement-foreground text-xs font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-lg bg-secondary hover:bg-accent transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </button>
      </div>
    </header>
  );
}
