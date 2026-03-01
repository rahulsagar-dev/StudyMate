

# Analytics Page Implementation Plan

## Overview
Build a full Analytics page matching the reference screenshots, powered by real Supabase data from existing tables. For new users, all components show clean empty/zero states.

## No Database Changes Needed
All data can be derived from existing tables:
- `study_sessions` -- study hours, daily patterns, monthly progress
- `tasks` -- study by subject (hours per subject from completed tasks)
- `xp_transactions` -- XP trends

Quizzes and Flashcards tables don't exist yet, so those stat cards will show 0 with a note to "coming soon" or just zero state.

## Components to Build

### 1. Analytics Page (`src/pages/Analytics.tsx`)
Full rewrite replacing the UnderConstruction placeholder. Layout:
- Header with BarChart3 icon, title "Analytics", subtitle
- 4 stat cards in a grid
- 2-column row: Study by Subject (donut chart) + Daily Study Pattern (area chart)
- Full-width: Monthly Progress (bar chart)

### 2. Custom Hook (`src/hooks/useAnalytics.ts`)
Fetches and computes all analytics data:
- **Total Study Hours**: `SUM(study_minutes)` from `study_sessions`
- **Tasks by Subject**: aggregate completed tasks grouped by `subject`
- **Daily Pattern**: aggregate `study_minutes` by day-of-week from `study_sessions`
- **Monthly Progress**: aggregate `study_sessions` into 4 weekly buckets for current month (tasks completed + XP earned)
- **Trend calculations**: compare current week vs previous week for percentage changes

### 3. Stat Cards Row
4 cards matching the screenshot layout:
| Card | Data Source | Trend |
|------|-----------|-------|
| Total Study Hours | `SUM(study_minutes) / 60` | Week-over-week % |
| Quizzes Completed | 0 (no quiz table yet) | -- |
| Flashcards Reviewed | 0 (no flashcard table yet) | -- |
| Average Score | 0 (no quiz scores yet) | -- |

Each card has an icon, value, label, and trend indicator (+X% in green or -X% in red).

### 4. Study by Subject (Donut Chart)
- Uses Recharts `PieChart` with `Pie` (innerRadius for donut effect)
- Data from completed tasks grouped by subject, summing `xp_reward` or count
- Color-coded legend on the right side
- "X hours / Total this month" summary below
- Empty state: "No subjects tracked yet"

### 5. Daily Study Pattern (Area Chart)
- Uses Recharts `AreaChart` with gradient fill (cyan/teal matching theme)
- X-axis: Mon-Sun
- Y-axis: hours (0h-8h)
- Data from `study_sessions` aggregated by day-of-week for current month
- Empty state: flat line at 0

### 6. Monthly Progress (Bar Chart)
- Uses Recharts `BarChart`
- X-axis: Week 1-4
- Two bar series (tasks completed in cyan, XP earned in purple) matching screenshot
- Data from `study_sessions` grouped by week number within current month
- Empty state: empty bars

### 7. Fresh/Empty States
All charts show graceful zero states:
- Stat cards show "0" with muted trend indicators
- Donut chart shows a gray ring with "No data yet"
- Area chart shows flat line
- Bar chart shows empty grid with axis labels

## File Changes
| File | Action |
|------|--------|
| `src/hooks/useAnalytics.ts` | Create -- data fetching hook |
| `src/pages/Analytics.tsx` | Rewrite -- full analytics page |
| `src/components/dashboard/AnalyticsChart.tsx` | Keep as-is (used on Dashboard) |

## Visual Consistency
- Uses existing design tokens: `bg-card`, `border-border/50`, `rounded-2xl`, `font-display`
- Recharts colors use CSS variables: `hsl(var(--primary))`, `hsl(var(--level))`
- Responsive: cards stack on mobile, charts go full-width
- Max-width container inherited from MainLayout

