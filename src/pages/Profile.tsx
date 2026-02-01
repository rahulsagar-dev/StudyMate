import { User, Mail, Calendar, Trophy, Flame, Zap, Edit2, Camera, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const stats = [
  { label: "Total XP", value: "0", icon: Zap, color: "xp" },
  { label: "Current Level", value: "1", icon: Trophy, color: "level" },
  { label: "Day Streak", value: "0", icon: Flame, color: "streak" },
];

export default function Profile() {
  const currentXp = 0;
  const nextLevelXp = 1000;
  const progress = (currentXp / nextLevelXp) * 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl border border-border/50 p-8">
        <div className="flex items-start gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                U
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-display font-bold text-foreground">New User</h1>
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
                <span>Set up your email</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Joined February 2026</span>
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
              <p className="text-sm text-muted-foreground">Not set up yet</p>
            </div>
            <button className="text-sm text-primary hover:underline">Add</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <p className="font-medium text-foreground">Password</p>
              <p className="text-sm text-muted-foreground">Set up your password</p>
            </div>
            <button className="text-sm text-primary hover:underline">Set Up</button>
          </div>
        </div>
      </div>
    </div>
  );
}
