import { useNavigate } from "react-router-dom";
import { User, Mail, Calendar, Trophy, Flame, Zap, Edit2, Camera, LogIn, Save, X, BookOpen, Clock, Target, Sparkles, Award, Crown, ShieldCheck, Rocket, Star, Gem, Brain } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EquippedAvatar } from "@/components/EquippedAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useStudySessions } from "@/hooks/useStudySessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ProfilePhotoPicker } from "@/components/ProfilePhotoPicker";

const PROFILE_ACHIEVEMENTS = [
  { id: "first_session", title: "First Steps", icon: <BookOpen className="h-5 w-5" />, check: (s: any) => s.totalSessions >= 1 },
  { id: "sessions_25", title: "Regular", icon: <BookOpen className="h-5 w-5" />, check: (s: any) => s.totalSessions >= 25 },
  { id: "sessions_100", title: "Centurion", icon: <Award className="h-5 w-5" />, check: (s: any) => s.totalSessions >= 100 },
  { id: "streak_3", title: "On Fire", icon: <Flame className="h-5 w-5" />, check: (s: any) => s.longestStreak >= 3 },
  { id: "streak_7", title: "Week Warrior", icon: <Flame className="h-5 w-5" />, check: (s: any) => s.longestStreak >= 7 },
  { id: "streak_14", title: "Fortnight Focus", icon: <ShieldCheck className="h-5 w-5" />, check: (s: any) => s.longestStreak >= 14 },
  { id: "streak_30", title: "Unstoppable", icon: <Flame className="h-5 w-5" />, check: (s: any) => s.longestStreak >= 30 },
  { id: "streak_100", title: "Streak Legend", icon: <Crown className="h-5 w-5" />, check: (s: any) => s.longestStreak >= 100 },
  { id: "hours_10", title: "Dedicated Learner", icon: <Clock className="h-5 w-5" />, check: (s: any) => s.totalStudyHours >= 10 },
  { id: "hours_50", title: "Half Century", icon: <Clock className="h-5 w-5" />, check: (s: any) => s.totalStudyHours >= 50 },
  { id: "hours_100", title: "Century Club", icon: <Clock className="h-5 w-5" />, check: (s: any) => s.totalStudyHours >= 100 },
  { id: "hours_500", title: "Time Lord", icon: <Calendar className="h-5 w-5" />, check: (s: any) => s.totalStudyHours >= 500 },
  { id: "xp_500", title: "Spark", icon: <Sparkles className="h-5 w-5" />, check: (s: any) => s.totalXP >= 500 },
  { id: "xp_1000", title: "XP Hunter", icon: <Zap className="h-5 w-5" />, check: (s: any) => s.totalXP >= 1000 },
  { id: "xp_5000", title: "Power Player", icon: <Rocket className="h-5 w-5" />, check: (s: any) => s.totalXP >= 5000 },
  { id: "xp_10000", title: "XP Legend", icon: <Star className="h-5 w-5" />, check: (s: any) => s.totalXP >= 10000 },
  { id: "xp_50000", title: "Mythic", icon: <Gem className="h-5 w-5" />, check: (s: any) => s.totalXP >= 50000 },
  { id: "tasks_10", title: "Task Master", icon: <Target className="h-5 w-5" />, check: (s: any) => s.totalTasks >= 10 },
  { id: "tasks_50", title: "Productivity Beast", icon: <Target className="h-5 w-5" />, check: (s: any) => s.totalTasks >= 50 },
  { id: "tasks_200", title: "Task Annihilator", icon: <Brain className="h-5 w-5" />, check: (s: any) => s.totalTasks >= 200 },
  { id: "level_3", title: "Student", icon: <Award className="h-5 w-5" />, check: (s: any) => s.currentLevel >= 3 },
  { id: "level_5", title: "Scholar", icon: <Award className="h-5 w-5" />, check: (s: any) => s.currentLevel >= 5 },
  { id: "level_8", title: "Legend", icon: <Crown className="h-5 w-5" />, check: (s: any) => s.currentLevel >= 8 },
];

const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 1000, 3: 2500, 4: 5000, 5: 10000, 6: 20000, 7: 35000, 8: 50000,
};

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, getLevelTitle, getLevelProgress, refetch } = useProfile();
  const { sessions } = useStudySessions();
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);

  if (!user) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <User className="h-10 w-10 text-primary/50" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Sign in to view your profile</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Create an account or sign in to track your progress, earn XP, and unlock achievements.</p>
          <Button onClick={() => navigate("/auth")} className="bg-gradient-primary hover:opacity-90">
            <LogIn className="mr-2 h-4 w-4" /> Sign In or Create Account
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl border border-border/50 p-8 animate-pulse">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-muted" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-64 bg-muted rounded mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalXp = profile?.total_xp ?? 0;
  const level = profile?.current_level ?? 1;
  const streak = profile?.current_streak ?? 0;
  const longestStreak = profile?.longest_streak ?? 0;
  const progress = getLevelProgress(totalXp, level);
  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[8];
  const levelTitle = getLevelTitle(level);

  const userEmail = user.email ?? "Not set up yet";
  const userInitial = profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  const userName = profile?.username || user.email?.split("@")[0] || "New User";
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const stats = [
    { label: "Total XP", value: totalXp.toLocaleString(), icon: Zap, color: "xp" },
    { label: "Current Level", value: String(level), icon: Trophy, color: "level" },
    { label: "Day Streak", value: String(streak), icon: Flame, color: "streak" },
  ];

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ username: newUsername.trim() }).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update username", variant: "destructive" });
    } else {
      toast({ title: "Username updated!" });
      setEditing(false);
      refetch();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl border border-border/50 p-8">
        <div className="flex items-start gap-6">
          <button
            type="button"
            onClick={() => setPhotoPickerOpen(true)}
            className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            aria-label="Change profile photo"
          >
            <EquippedAvatar
              fallbackInitial={userInitial}
              fallbackUrl={profile?.avatar_url}
              className="h-24 w-24 ring-4 ring-primary/20"
            />
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary border-2 border-card flex items-center justify-center shadow-lg">
              <Camera className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    className="h-9 w-48"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
                  />
                  <Button size="sm" onClick={handleSaveUsername} disabled={saving}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-display font-bold text-foreground">{userName}</h1>
                  <span className="level-badge">
                    <span className="text-xs opacity-80">LVL</span>
                    <span className="text-lg font-bold">{level}</span>
                  </span>
                  <button
                    className="p-2 rounded-lg hover:bg-secondary transition-colors ml-auto"
                    onClick={() => { setNewUsername(profile?.username || ""); setEditing(true); }}
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>

            <p className="text-level font-medium mb-4">{levelTitle}</p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>{userEmail}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Joined {joinDate}</span></div>
            </div>

            {/* Level Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Level Progress</span>
                <span className="text-sm text-foreground font-medium">
                  {(totalXp - currentThreshold).toLocaleString()} / {(nextThreshold - currentThreshold).toLocaleString()} XP
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-level transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {level >= 8 ? "Max level reached! 🎉" : `${(nextThreshold - totalXp).toLocaleString()} XP until Level ${level + 1}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border/50 p-5">
            <div className={`p-2.5 rounded-xl w-fit mb-3 ${stat.color === "xp" ? "bg-xp/10" : stat.color === "level" ? "bg-level/10" : "bg-streak/10"}`}>
              <stat.icon className={`h-5 w-5 ${stat.color === "xp" ? "text-xp" : stat.color === "level" ? "text-level" : "text-streak"}`} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Extra Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <p className="text-sm text-muted-foreground mb-1">Longest Streak</p>
          <p className="text-2xl font-display font-bold text-foreground">{longestStreak} days</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <p className="text-sm text-muted-foreground mb-1">Weekly XP Goal</p>
          <p className="text-2xl font-display font-bold text-foreground">{(profile?.weekly_goal_xp ?? 500).toLocaleString()} XP</p>
        </div>
      </div>

      {/* Recent Achievements */}
      {(() => {
        const stats = {
          totalStudyHours: (sessions ?? []).reduce((sum, s) => sum + s.study_minutes, 0) / 60,
          longestStreak: profile?.longest_streak ?? 0,
          totalXP: profile?.total_xp ?? 0,
          totalSessions: sessions?.length ?? 0,
          totalTasks: (sessions ?? []).reduce((sum, s) => sum + s.tasks_completed, 0),
          currentLevel: profile?.current_level ?? 1,
        };
        const unlocked = PROFILE_ACHIEVEMENTS.filter((a) => a.check(stats));
        const recent = unlocked.slice(-6).reverse();
        return (
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent Achievements</h3>
              <button onClick={() => navigate("/achievements")} className="text-sm text-primary hover:underline">
                View all ({unlocked.length}/{PROFILE_ACHIEVEMENTS.length})
              </button>
            </div>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-achievement/10 flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-achievement/40" />
                </div>
                <h4 className="font-medium text-foreground mb-2">No achievements yet</h4>
                <p className="text-sm text-muted-foreground max-w-sm">Complete tasks, quizzes, and maintain streaks to earn achievements!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {recent.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-achievement/5 border border-achievement/20">
                    <div className="w-10 h-10 rounded-lg bg-achievement/15 text-achievement flex items-center justify-center shrink-0">
                      {a.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      <p className="text-xs text-achievement">Unlocked</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Account Settings */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <h3 className="font-semibold text-foreground mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <p className="font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <p className="font-medium text-foreground">Password</p>
              <p className="text-sm text-muted-foreground">••••••••</p>
            </div>
            <button className="text-sm text-primary hover:underline" onClick={() => navigate("/settings")}>Change</button>
          </div>
        </div>
      </div>
    </div>
  );
}
