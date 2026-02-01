import { User, Mail, Calendar, Trophy, Flame, Zap, Edit2, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const achievements = [
  { name: "First Steps", icon: "🎯" },
  { name: "Week Warrior", icon: "🔥" },
  { name: "Quiz Master", icon: "🧠" },
];

const stats = [
  { label: "Total XP", value: "12,450", icon: Zap, color: "xp" },
  { label: "Current Level", value: "12", icon: Trophy, color: "level" },
  { label: "Day Streak", value: "14", icon: Flame, color: "streak" },
];

export default function Profile() {
  const currentXp = 2450;
  const nextLevelXp = 3000;
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
                JD
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-display font-bold text-foreground">John Doe</h1>
              <span className="level-badge">
                <span className="text-xs opacity-80">LVL</span>
                <span className="text-lg font-bold">12</span>
              </span>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors ml-auto">
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <p className="text-level font-medium mb-4">Knowledge Seeker</p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>john.doe@example.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Joined January 2026</span>
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
                {(nextLevelXp - currentXp).toLocaleString()} XP until Level 13
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

      {/* Recent Achievements */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent Achievements</h3>
        <div className="flex gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.name}
              className="flex-1 p-4 bg-secondary/50 rounded-xl border border-border/50 text-center"
            >
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <p className="text-sm font-medium text-foreground">{achievement.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account Settings Preview */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <h3 className="font-semibold text-foreground mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <p className="font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">john.doe@example.com</p>
            </div>
            <button className="text-sm text-primary hover:underline">Change</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <p className="font-medium text-foreground">Password</p>
              <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
            </div>
            <button className="text-sm text-primary hover:underline">Update</button>
          </div>
        </div>
      </div>
    </div>
  );
}
