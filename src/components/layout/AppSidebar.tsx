import { useState } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  Trophy,
  Bot,
  FileText,
  Layers,
  Brain,
  CalendarDays,
  ShoppingBag,
  Flame,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Target,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EquippedAvatar } from "@/components/EquippedAvatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const LEVEL_THRESHOLDS = [0, 1000, 2500, 5000, 10000, 20000, 35000, 50000];
function getLevelProgress(xp: number, level: number) {
  const curr = LEVEL_THRESHOLDS[Math.max(0, level - 1)] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? curr;
  if (next <= curr) return 100;
  return Math.min(100, Math.max(0, ((xp - curr) / (next - curr)) * 100));
}

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Focus Mode", url: "/focus", icon: Target, sparkle: true },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Achievements", url: "/achievements", icon: Trophy },
];

const toolsItems = [
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "Summarizer", url: "/summarizer", icon: FileText },
  { title: "Flashcards", url: "/flashcards", icon: Layers },
  { title: "Quizzes", url: "/quizzes", icon: Brain },
  { title: "Study Planner", url: "/study-planner", icon: CalendarDays },
  { title: "Whiteboard", url: "/whiteboard", icon: PenTool },
];

const gamificationItems = [
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
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const level = profile?.current_level ?? 1;
  const xp = profile?.total_xp ?? 0;
  const levelProgress = getLevelProgress(xp, level);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const NavItem = ({ item }: { item: { title: string; url: string; icon: any; sparkle?: boolean } }) => (
    <NavLink
      to={item.url}
      className={cn(
        "sidebar-item group relative",
        isActive(item.url) && "active"
      )}
    >
      <div className="relative">
        <item.icon className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive(item.url) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )} />
        {item.sparkle && !collapsed && (
          <Sparkles className="absolute -top-1 -right-1 h-2.5 w-2.5 text-achievement" />
        )}
      </div>
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

  const userEmail = user?.email ?? "New User";
  const userInitial = user?.email ? user.email[0].toUpperCase() : "U";

  const sections = [
    { label: "Main", items: mainNavItems },
    { label: "Tools", items: toolsItems },
    { label: "Rewards", items: gamificationItems },
    { label: "Settings", items: utilityItems },
  ];

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

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            {!collapsed && (
              <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {section.label}
              </span>
            )}
            {section.items.map((item) => (
              <NavItem key={item.url} item={item} />
            ))}
          </div>
        ))}
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
          <EquippedAvatar
            fallbackInitial={userInitial}
            fallbackUrl="/placeholder.svg"
            className="h-9 w-9 shrink-0 ring-2 ring-primary/20"
          />
          <div className={cn(
            "flex-1 min-w-0 transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <p className="text-sm font-medium text-foreground truncate">
              {user ? userEmail.split("@")[0] : "New User"}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-level font-semibold">Level {level}</span>
              <Progress value={levelProgress} className="h-1.5 flex-1 bg-muted" />
            </div>
          </div>
        </NavLink>

        {!collapsed && (
          user ? (
            <button
              onClick={handleLogout}
              className="w-full mt-2 sidebar-item text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          ) : (
            <NavLink
              to="/auth"
              className="w-full mt-2 sidebar-item text-muted-foreground hover:text-primary"
            >
              <LogOut className="h-5 w-5" />
              <span>Login</span>
            </NavLink>
          )
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
