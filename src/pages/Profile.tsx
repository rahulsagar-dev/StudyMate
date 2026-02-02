import { useNavigate } from "react-router-dom";
import { User, Mail, Calendar, Trophy, Flame, Zap, Edit2, Camera, Sparkles, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Total XP", value: "0", icon: Zap, color: "xp" },
  { label: "Current Level", value: "1", icon: Trophy, color: "level" },
  { label: "Day Streak", value: "0", icon: Flame, color: "streak" },
];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const currentXp = 0;
  const nextLevelXp = 1000;
  const progress = (currentXp / nextLevelXp) * 100;

  const userEmail = user?.email ?? "Not set up yet";
  const userInitial = user?.email ? user.email[0].toUpperCase() : "U";
  const userName = user?.email ? user.email.split("@")[0] : "New User";
  const joinDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "February 2026";

  if (!user) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <User className="h-10 w-10 text-primary/50" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Sign in to view your profile
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create an account or sign in to track your progress, earn XP, and unlock achievements.
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-gradient-primary hover:opacity-90"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In or Create Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl border border-border/50 p-8">
        <div className="flex items-start gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-display font-bold text-foreground">{userName}</h1>
              <span className="level-badge">
                <span className="text-xs opacity-80">LVL</span>
                <span className="text-lg font-bold">1</span>
              </span>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors ml-auto">
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <p className="text-level font-medium mb-4">Beginner</p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{userEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Joined {joinDate}</span>
              </div>
            </div>

            {/* Level Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Level Progress</span>
                <span className="text-sm text-foreground font-medium">
                  {currentXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-level transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {(nextLevelXp - currentXp).toLocaleString()} XP until Level 2
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border/50 p-5">
            <div
              className={`p-2.5 rounded-xl w-fit mb-3 ${
                stat.color === "xp" ? "bg-xp/10" : stat.color === "level" ? "bg-level/10" : "bg-streak/10"
              }`}
            >
              <stat.icon
                className={`h-5 w-5 ${
                  stat.color === "xp" ? "text-xp" : stat.color === "level" ? "text-level" : "text-streak"
                }`}
              />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Achievements - Empty State */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent Achievements</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-achievement/10 flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-achievement/40" />
          </div>
          <h4 className="font-medium text-foreground mb-2">No achievements yet</h4>
          <p className="text-sm text-muted-foreground max-w-sm">
            Complete tasks, quizzes, and maintain streaks to earn achievements!
          </p>
        </div>
      </div>

      {/* Account Settings Preview */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <h3 className="font-semibold text-foreground mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <p className="font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
            <button className="text-sm text-primary hover:underline">Edit</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <p className="font-medium text-foreground">Password</p>
              <p className="text-sm text-muted-foreground">••••••••</p>
            </div>
            <button className="text-sm text-primary hover:underline">Change</button>
          </div>
        </div>
      </div>
    </div>
  );
}
