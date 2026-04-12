import { useNavigate } from "react-router-dom";
import { User, Mail, Calendar, Trophy, Flame, Zap, Edit2, Camera, LogIn, Save, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 1000, 3: 2500, 4: 5000, 5: 10000, 6: 20000, 7: 35000, 8: 50000,
};

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, getLevelTitle, getLevelProgress, refetch } = useProfile();
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [saving, setSaving] = useState(false);

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
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">{userInitial}</AvatarFallback>
            </Avatar>
          </div>

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

      {/* Achievements - Empty State */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent Achievements</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-achievement/10 flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-achievement/40" />
          </div>
          <h4 className="font-medium text-foreground mb-2">No achievements yet</h4>
          <p className="text-sm text-muted-foreground max-w-sm">Complete tasks, quizzes, and maintain streaks to earn achievements!</p>
        </div>
      </div>

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
