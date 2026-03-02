

# Focus Mode Integrity System

## What Changes
One file modified: `src/pages/FocusMode.tsx`

## Implementation

### 1. Tab Visibility Detection
- Use `document.visibilitychange` event listener (Page Visibility API) when `isRunning` is true
- When page becomes hidden: auto-pause the timer, set a `pausedBySystem` flag, record the timestamp of when the user left
- When page becomes visible again: do NOT auto-resume — show a "Resume" button with a message "Focus session paused — return to continue"
- Also listen to `window.blur` as a secondary signal

### 2. Inactivity Timeout (30-Second Rule)
- When the timer is paused due to tab switch, start a 30-second countdown using `setTimeout`
- If the user returns within 30 seconds: clear the timeout, show resume prompt
- If 30 seconds elapse while still hidden: auto-reset the timer, invalidate the session, set a `sessionInvalidated` flag
- On return after invalidation: show message "Session reset due to inactivity. Stay focused to earn rewards." via toast and status text
- Clear the 30-second timeout when user returns or manually resets

### 3. Reward Protection
- Remove the current `handlePause` logic that saves partial sessions on every pause
- Only call `saveSession` when `timeLeft === 0` AND `sessionInvalidated === false`
- System-paused sessions (tab switch) never save partial progress
- Manual pause still pauses but does NOT save — rewards only on full completion

### 4. New State Variables
- `pausedBySystem: boolean` — distinguishes system pause from manual pause
- `sessionInvalidated: boolean` — blocks rewards after 30s inactivity
- `inactivityTimeoutRef: useRef` — holds the 30-second timeout ID
- `hiddenAtRef: useRef<number>` — timestamp when page was hidden

### 5. Status Message Updates
The subtitle text will reflect the current state:
- Default: "Start your first focus session."
- Running: "Stay focused. You're doing great."
- System paused: "Focus session paused — return to continue."
- Invalidated: "Session reset due to inactivity. Stay focused to earn rewards."
- Completed: "Session complete! Great work."

### 6. UX Details
- When system-paused, the breathing glow stops and progress ring shows a muted/amber color
- The Play button appears to resume (same as manual pause)
- Duration selector remains disabled during a paused-by-system state
- Reset button always works regardless of state
- Encouraging tone throughout — no punitive language

