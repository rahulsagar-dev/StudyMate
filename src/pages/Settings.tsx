import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, Bell, Moon, Globe, Shield, HelpCircle, LogOut, Clock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePomodoro } from "@/contexts/PomodoroContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { settings: pomodoroSettings, updateSettings: updatePomodoroSettings } = usePomodoro();
  // Toggle states
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Dialog states
  const [dailyGoalOpen, setDailyGoalOpen] = useState(false);
  const [breakIntervalOpen, setBreakIntervalOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Form values
  const [dailyGoal, setDailyGoal] = useState("2");
  const [breakInterval, setBreakInterval] = useState("25");
  const [language, setLanguage] = useState("en-US");

  const handleToggle = (setting: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    toast.success(`${setting} ${value ? "enabled" : "disabled"}`);
  };

  const handleSaveDailyGoal = () => {
    setDailyGoalOpen(false);
    toast.success(`Daily goal set to ${dailyGoal} hours`);
  };

  const handleSaveBreakInterval = () => {
    setBreakIntervalOpen(false);
    toast.success(`Break interval set to ${breakInterval} minutes`);
  };

  const handleSaveLanguage = () => {
    setLanguageOpen(false);
    const langNames: Record<string, string> = {
      "en-US": "English (US)",
      "en-GB": "English (UK)",
      "es": "Spanish",
      "fr": "French",
      "de": "German",
    };
    toast.success(`Language changed to ${langNames[language]}`);
  };

  const handleExport = () => {
    setExportOpen(false);
    toast.success("Your data export has started. You'll receive it via email.");
  };

  const handleDeleteAccount = () => {
    setDeleteAccountOpen(false);
    toast.error("Account deletion initiated. Check your email to confirm.");
  };

  const handleLogout = async () => {
    setLogoutOpen(false);
    await signOut();
    toast.success("You have been logged out successfully");
    navigate("/auth");
  };

  const langNames: Record<string, string> = {
    "en-US": "English (US)",
    "en-GB": "English (UK)",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
  };

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

      {/* Preferences Section */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Preferences</h3>
        </div>
        <div className="divide-y divide-border/50">
          {/* Notifications */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-secondary">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Notifications</p>
                <p className="text-sm text-muted-foreground">Manage push and email notifications</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle("Notifications", !notifications, setNotifications)}
              className={cn(
                "w-12 h-7 rounded-full p-1 transition-colors",
                notifications ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white transition-transform",
                  notifications && "translate-x-5"
                )}
              />
            </button>
          </div>

          {/* Dark Mode */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-secondary">
                <Moon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Always enabled for optimal focus</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle("Dark Mode", !darkMode, setDarkMode)}
              className={cn(
                "w-12 h-7 rounded-full p-1 transition-colors",
                darkMode ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white transition-transform",
                  darkMode && "translate-x-5"
                )}
              />
            </button>
          </div>

          {/* Language */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-secondary">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Language</p>
                <p className="text-sm text-muted-foreground">{langNames[language]}</p>
              </div>
            </div>
            <button
              onClick={() => setLanguageOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-accent transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* Study Settings Section */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Study Settings</h3>
        </div>
        <div className="divide-y divide-border/50">
          {/* Daily Goal */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-secondary">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Daily Goal</p>
                <p className="text-sm text-muted-foreground">{dailyGoal} hours per day</p>
              </div>
            </div>
            <button
              onClick={() => setDailyGoalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-accent transition-colors"
            >
              Edit
            </button>
          </div>

          {/* Study Reminders */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-secondary">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Study Reminders</p>
                <p className="text-sm text-muted-foreground">9:00 AM, 2:00 PM, 7:00 PM</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle("Study Reminders", !studyReminders, setStudyReminders)}
              className={cn(
                "w-12 h-7 rounded-full p-1 transition-colors",
                studyReminders ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white transition-transform",
                  studyReminders && "translate-x-5"
                )}
              />
            </button>
          </div>

          {/* Break Interval */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-secondary">
                <Timer className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Break Interval</p>
                <p className="text-sm text-muted-foreground">{breakInterval} minutes (Pomodoro)</p>
              </div>
            </div>
            <button
              onClick={() => setBreakIntervalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-accent transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Security Section */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Privacy & Security</h3>
        </div>
        <div className="divide-y divide-border/50">
          {/* Two-Factor Auth */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-secondary">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Two-Factor Auth</p>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle("Two-Factor Auth", !twoFactorAuth, setTwoFactorAuth)}
              className={cn(
                "w-12 h-7 rounded-full p-1 transition-colors",
                twoFactorAuth ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white transition-transform",
                  twoFactorAuth && "translate-x-5"
                )}
              />
            </button>
          </div>

          {/* Data Export */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-secondary">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Data Export</p>
                <p className="text-sm text-muted-foreground">Download all your study data</p>
              </div>
            </div>
            <button
              onClick={() => setExportOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-accent transition-colors"
            >
              Export
            </button>
          </div>

          {/* Delete Account */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-destructive/10">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account</p>
              </div>
            </div>
            <button
              onClick={() => setDeleteAccountOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Support</h3>
        </div>
        <div className="divide-y divide-border/50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-secondary">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Help Center</p>
                <p className="text-sm text-muted-foreground">Get help with StudyMate</p>
              </div>
            </div>
            <button
              onClick={() => toast.info("Help Center coming soon!")}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-accent transition-colors"
            >
              Visit
            </button>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-secondary">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Contact Support</p>
                <p className="text-sm text-muted-foreground">Reach out to our team</p>
              </div>
            </div>
            <button
              onClick={() => toast.info("Support contact coming soon!")}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-accent transition-colors"
            >
              Contact
            </button>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-secondary">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Feedback</p>
                <p className="text-sm text-muted-foreground">Share your thoughts with us</p>
              </div>
            </div>
            <button
              onClick={() => toast.info("Feedback form coming soon!")}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-accent transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => setLogoutOpen(true)}
        className="w-full flex items-center justify-center gap-2 p-4 bg-card rounded-2xl border border-border/50 text-destructive hover:bg-destructive/5 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span className="font-medium">Log Out</span>
      </button>

      {/* Version */}
      <p className="text-center text-sm text-muted-foreground">
        StudyMate v1.0.0 • Made with ❤️ for students
      </p>

      {/* Daily Goal Dialog */}
      <Dialog open={dailyGoalOpen} onOpenChange={setDailyGoalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Set Daily Goal</DialogTitle>
            <DialogDescription>
              How many hours do you want to study each day?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="dailyGoal">Hours per day</Label>
            <Input
              id="dailyGoal"
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDailyGoalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDailyGoal}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Break Interval Dialog */}
      <Dialog open={breakIntervalOpen} onOpenChange={setBreakIntervalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Set Break Interval</DialogTitle>
            <DialogDescription>
              How long do you want to study before taking a break?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="breakInterval">Minutes</Label>
            <Select value={breakInterval} onValueChange={setBreakInterval}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBreakIntervalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBreakInterval}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Language Dialog */}
      <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Language</DialogTitle>
            <DialogDescription>
              Select your preferred language for the interface.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLanguageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLanguage}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Data Dialog */}
      <AlertDialog open={exportOpen} onOpenChange={setExportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Your Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a download of all your study data including tasks, progress, achievements, and settings. The export will be sent to your registered email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport}>Export Data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Your Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including all study progress, achievements, and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout Dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You'll need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
