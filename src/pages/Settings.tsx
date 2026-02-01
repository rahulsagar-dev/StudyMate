import { Settings as SettingsIcon, Bell, Moon, Globe, Shield, HelpCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const settingSections = [
  {
    title: "Preferences",
    items: [
      { icon: Bell, label: "Notifications", description: "Manage push and email notifications", toggle: true, enabled: true },
      { icon: Moon, label: "Dark Mode", description: "Always enabled for optimal focus", toggle: true, enabled: true },
      { icon: Globe, label: "Language", description: "English (US)", action: "Change" },
    ],
  },
  {
    title: "Study Settings",
    items: [
      { icon: SettingsIcon, label: "Daily Goal", description: "2 hours per day", action: "Edit" },
      { icon: Bell, label: "Study Reminders", description: "9:00 AM, 2:00 PM, 7:00 PM", toggle: true, enabled: true },
      { icon: SettingsIcon, label: "Break Interval", description: "25 minutes (Pomodoro)", action: "Edit" },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      { icon: Shield, label: "Two-Factor Auth", description: "Add extra security to your account", toggle: true, enabled: false },
      { icon: Shield, label: "Data Export", description: "Download all your study data", action: "Export" },
      { icon: Shield, label: "Delete Account", description: "Permanently delete your account", action: "Delete", danger: true },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help Center", description: "Get help with StudyMate", action: "Visit" },
      { icon: HelpCircle, label: "Contact Support", description: "Reach out to our team", action: "Contact" },
      { icon: HelpCircle, label: "Feedback", description: "Share your thoughts with us", action: "Send" },
    ],
  },
];

export default function Settings() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
          <SettingsIcon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Customize your StudyMate experience</p>
        </div>
      </div>

      {/* Settings Sections */}
      {settingSections.map((section) => (
        <div key={section.title} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">{section.title}</h3>
          </div>
          <div className="divide-y divide-border/50">
            {section.items.map((item) => (
              <div key={item.label} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    item.danger ? "bg-destructive/10" : "bg-secondary"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5",
                      item.danger ? "text-destructive" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      item.danger ? "text-destructive" : "text-foreground"
                    )}>
                      {item.label}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>

                {item.toggle !== undefined ? (
                  <button
                    className={cn(
                      "w-12 h-7 rounded-full p-1 transition-colors",
                      item.enabled ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full bg-white transition-transform",
                        item.enabled && "translate-x-5"
                      )}
                    />
                  </button>
                ) : (
                  <button
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      item.danger
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-secondary text-foreground hover:bg-accent"
                    )}
                  >
                    {item.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button className="w-full flex items-center justify-center gap-2 p-4 bg-card rounded-2xl border border-border/50 text-destructive hover:bg-destructive/5 transition-colors">
        <LogOut className="h-5 w-5" />
        <span className="font-medium">Log Out</span>
      </button>

      {/* Version */}
      <p className="text-center text-sm text-muted-foreground">
        StudyMate v1.0.0 • Made with ❤️ for students
      </p>
    </div>
  );
}
