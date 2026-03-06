

## Add Breathing/Ambient Effects to Pages

The FocusMode page has ambient pulsing gradient orbs in the background that give it depth. The Calendar, Study Planner, Flashcards, and Dashboard pages lack these effects and feel flat by comparison.

### What will change

**1. Create a reusable `AmbientBackground` component** (`src/components/AmbientBackground.tsx`)
- Renders 2-3 large, blurred, slowly pulsing gradient orbs (similar to FocusMode's `bg-primary/5 blur-3xl animate-pulse` pattern)
- Accepts a `variant` prop to use different color combinations per page (e.g., primary/level, xp/achievement)
- Uses `pointer-events-none` and absolute positioning so it doesn't interfere with content

**2. Apply to these pages:**
- **CalendarPage** — primary + level orbs behind the calendar grid
- **StudyPlanner** — xp + level orbs behind the timetable area
- **Dashboard** — subtle primary + xp orbs behind the stats area
- **Flashcards** — primary + achievement orbs (similar to FocusMode)

**3. Add subtle card hover glow**
- Cards on these pages get a `transition-shadow` so they gently glow on hover (`hover:shadow-primary/5`), adding interactivity without clutter

### Technical approach
- The ambient orbs use only Tailwind classes (`absolute`, `rounded-full`, `blur-3xl`, `animate-pulse`, opacity ~3-5%) — no extra dependencies
- Staggered `animation-delay` on orbs so they don't pulse in sync (using inline `style`)
- Each page wraps its content in a `relative overflow-hidden` container with the `AmbientBackground` behind it

