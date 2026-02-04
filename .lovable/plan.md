

# Study Consistency Heatmap Refinement Plan

## Overview
This plan addresses four key refinements to make the heatmap feel cleaner, more scannable, and present a proper "fresh state" for new users.

---

## Changes Summary

### 1. Increase Horizontal Spacing Between Months
- Increase `MONTH_GAP` from `6` to `12` pixels
- This creates clearer visual separation between month blocks, making the calendar easier to scan

### 2. Add Vertical Gap Between Month Labels and Grid
- Increase the spacing between month labels (Jan, Feb, etc.) and the first row of cells
- Change from `mb-0.5` (2px) to `mb-2` (8px) for better visual hierarchy

### 3. Fresh State for New Users
- Replace the `generateMockActivity()` function with a "fresh start" mode
- Add an `isNewUser` prop or state that defaults to `true`
- When `isNewUser` is true:
  - Render all cells as empty/neutral (dark gray - `bg-heatmap-0`)
  - Show "No streak yet" in streak indicator
  - Display welcoming subtitle: "Your activity heatmap for 2026"
  - Show motivational message: "Start studying today to build your streak! 🚀"
- When user has activity (future Supabase integration):
  - Dynamically activate cells based on real data
  - Update streak counters in real-time

### 4. Streak Indicators in Fresh State
- Keep streak badges visible but styled as inactive
- "No streak yet" with muted styling (already implemented)
- Hide "Best: X days" badge when `longestStreak === 0` (already implemented)

---

## Technical Implementation

### File to Modify
`src/components/dashboard/StudyHeatmap.tsx`

### Constant Changes
```text
Current:
  MONTH_GAP = 6

New:
  MONTH_GAP = 12
```

### Month Label Spacing
```text
Current:
  <div className="h-5 mb-0.5">

New:
  <div className="h-5 mb-2">
```

### Fresh State Logic
Replace the mock activity generator with an empty map for new users:

```text
Current:
  const [activityData] = useState(() => generateMockActivity());

New:
  // For fresh users, start with empty activity
  // This will later be replaced with Supabase data
  const [activityData] = useState<Map<string, {...}>>(() => new Map());
```

This approach:
- Renders all 2026 calendar cells as neutral gray (`bg-heatmap-0`)
- Shows "No streak yet" badge
- Displays "Start studying today to build your streak! 🚀" message
- Keeps the legend and UI fully functional
- Ready for future real-time updates from Supabase

---

## Visual Result

| Element | Before | After |
|---------|--------|-------|
| Month gap | 6px | 12px |
| Label to grid gap | 2px | 8px |
| Initial cells | Random mock data | All empty/neutral |
| Streak badge | Shows mock streak | "No streak yet" |
| Motivational text | Based on mock | "Start studying today..." |

---

## Future Considerations
Once Supabase integration is complete, the `activityData` state will be populated from the database, and the heatmap will automatically:
- Fill cells based on actual study sessions
- Update streak counters in real-time
- Trigger when tasks are completed or XP is earned

