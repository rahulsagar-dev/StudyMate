import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  FileText,
  Layers,
  Brain,
  CalendarDays,
  Calendar,
  Trophy,
  ShoppingBag,
  Flame,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "Summarizer", url: "/summarizer", icon: FileText },
  { title: "Flashcards", url: "/flashcards", icon: Layers },
  { title: "Quizzes", url: "/quizzes", icon: Brain },
  { title: "Study Planner", url: "/study-planner", icon: CalendarDays },
  { title: "Calendar", url: "/calendar", icon: Calendar },
];

const gamificationItems = [
  { title: "Achievements", url: "/achievements", icon: Trophy },
  { title: "Store", url: "/store", icon: ShoppingBag },
  { title: "Streaks & XP", url: "/streaks", icon: Flame },
];

const utilityItems = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => (
    <NavLink
      to={item.url}
      className={cn(
        "sidebar-item group relative",
        isActive(item.url) && "active"
      )}
    >
      <item.icon className={cn(
        "h-5 w-5 shrink-0 transition-colors",
        isActive(item.url) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      )} />
      <span className={cn(
        "whitespace-nowrap transition-all duration-300",
        collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
      )}>
        {item.title}
      </span>
      {isActive(item.url) && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
      )}
    </NavLink>
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-all duration-300 ease-out",
        collapsed ? "w-16" : "w-64"
      )}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      {/* Header */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className={cn(
          "font-display font-bold text-lg text-foreground transition-all duration-300",
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          StudyMate
        </span>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {/* Main */}
        <div className="space-y-1">
          {!collapsed && (
            <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Main
            </span>
          )}
          {mainNavItems.map((item) => (
            <NavItem key={item.url} item={item} />
          ))}
        </div>

        {/* Gamification */}
        <div className="space-y-1">
          {!collapsed && (
            <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Gamification
            </span>
          )}
          {gamificationItems.map((item) => (
            <NavItem key={item.url} item={item} />
          ))}
        </div>

        {/* Utility */}
        <div className="space-y-1">
          {!collapsed && (
            <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Settings
            </span>
          )}
          {utilityItems.map((item) => (
            <NavItem key={item.url} item={item} />
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-3">
        <NavLink
          to="/profile"
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-sidebar-accent",
            isActive("/profile") && "bg-sidebar-accent"
          )}
        >
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/20">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              JD
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "flex-1 min-w-0 transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <p className="text-sm font-medium text-foreground truncate">John Doe</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-level font-semibold">Level 12</span>
              <Progress value={65} className="h-1.5 flex-1 bg-muted" />
            </div>
          </div>
        </NavLink>

        {!collapsed && (
          <button className="w-full mt-2 sidebar-item text-muted-foreground hover:text-destructive">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
