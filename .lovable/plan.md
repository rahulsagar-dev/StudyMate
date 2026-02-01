
# Plan: Fresh Start - Empty State UI + Working Settings

## Overview
Transform the StudyMate app into a "fresh install" state where a new user would see empty/zero data, while making the Settings page fully functional with interactive toggles and dialogs. Feature pages (AI Assistant, Summarizer, Flashcards, Quizzes, Study Planner, Calendar, Achievements, Store, Streaks) will show "Under Construction" placeholder screens.

---

## What Will Change

### 1. Dashboard - Fresh/Empty State
The dashboard will show zero stats and empty states to simulate a new user experience:

- **QuickStats**: Reset to 0 XP, Level 1 "Beginner", 0 day streak, 0% weekly goal
- **TaskPanel**: Empty task list with a friendly "No tasks yet" message and CTA to add first task
- **StudyHeatmap**: All cells at intensity 0 (empty), 0 day streak
- **CalendarWidget**: Show "No upcoming events" empty state
- **AnalyticsChart**: Empty chart with "Start studying to see your progress" message

### 2. Settings Page - Fully Functional
Make all settings interactive with real state management:

- **Working toggle switches** that save state (Notifications, Dark Mode, Study Reminders, Two-Factor Auth)
- **Editable dialogs** for Daily Goal, Break Interval, and Language settings
- **Toast notifications** when settings are changed
- **Data Export button** with confirmation dialog
- **Delete Account** with confirmation dialog and warning
- **Working Logout button** with confirmation

### 3. Profile Page - New User State
- Reset XP to 0, Level 1 "Beginner"
- Empty achievements section with "Earn your first achievement" message
- Generic placeholder avatar

### 4. Feature Pages - Under Construction Placeholders
Replace all these pages with attractive "Under Construction" screens:

| Page | Placeholder Message |
|------|---------------------|
| AI Assistant | "AI Assistant is coming soon! Get ready to supercharge your learning." |
| Summarizer | "AI Summarizer is under construction. Soon you'll condense notes instantly." |
| Flashcards | "Flashcards feature is being built. Master subjects with spaced repetition soon!" |
| Quizzes | "Quiz Engine is in development. Test your knowledge and earn XP soon!" |
| Study Planner | "Study Planner is coming. Organize your sessions for maximum productivity." |
| Calendar | "Calendar is under construction. Track exams, deadlines, and sessions soon." |
| Achievements | "Achievements are being crafted. Unlock badges and earn rewards soon!" |
| Store | "Reward Store is coming. Spend XP on themes, avatars, and boosts soon!" |
| Streaks | "Streaks & XP tracking is under development. Watch your consistency grow soon!" |
| Analytics | "Analytics dashboard is being built. Deep dive into your performance soon!" |

### 5. Sidebar & TopBar - Fresh State
- TopBar: Show Level 1, 0 XP, 0 day streak
- Sidebar: User profile shows "New User" with Level 1

---

## Files to Create/Modify

### New Files
- `src/components/UnderConstruction.tsx` - Reusable placeholder component with icon, title, description, and optional CTA

### Modified Files
1. `src/components/dashboard/QuickStats.tsx` - Zero/empty values
2. `src/components/dashboard/TaskPanel.tsx` - Empty state UI
3. `src/components/dashboard/StudyHeatmap.tsx` - All zeros, empty state
4. `src/components/dashboard/CalendarWidget.tsx` - Empty state
5. `src/components/dashboard/AnalyticsChart.tsx` - Empty state
6. `src/pages/Settings.tsx` - Full interactivity with state, dialogs, toasts
7. `src/pages/Profile.tsx` - New user empty state
8. `src/components/layout/TopBar.tsx` - Reset gamification values
9. `src/components/layout/AppSidebar.tsx` - Reset user values
10. `src/pages/AIAssistant.tsx` - Under construction
11. `src/pages/Summarizer.tsx` - Under construction
12. `src/pages/Flashcards.tsx` - Under construction
13. `src/pages/Quizzes.tsx` - Under construction
14. `src/pages/StudyPlanner.tsx` - Under construction
15. `src/pages/CalendarPage.tsx` - Under construction
16. `src/pages/Achievements.tsx` - Under construction
17. `src/pages/Store.tsx` - Under construction
18. `src/pages/Streaks.tsx` - Under construction
19. `src/pages/Analytics.tsx` - Under construction

---

## Technical Details

### UnderConstruction Component
```text
+------------------------------------------+
|                                          |
|            [Construction Icon]           |
|                                          |
|         "Feature Name Coming Soon"       |
|                                          |
|      "Description of what's coming"      |
|                                          |
|          [Back to Dashboard]             |
|                                          |
+------------------------------------------+
```

### Settings Page Enhancements
- Use React `useState` for toggle states
- Use Radix UI `Dialog` for edit modals (Daily Goal, Break Interval, Language)
- Use `sonner` toast for feedback on changes
- Confirmation dialogs for destructive actions (Delete Account, Logout)
- Form inputs for editable values

### Empty State Design Pattern
All empty states will follow this pattern:
- Subtle icon (grayed out or in primary color at low opacity)
- Friendly headline
- Encouraging description
- Optional call-to-action button

---

## Implementation Order
1. Create `UnderConstruction.tsx` component
2. Update all feature pages to use UnderConstruction
3. Update dashboard components to empty states
4. Update TopBar and Sidebar to fresh user values
5. Rebuild Settings page with full interactivity
6. Update Profile page to new user state

This will give you a clean slate that looks professional and ready for you to provide prompts for each feature later.
