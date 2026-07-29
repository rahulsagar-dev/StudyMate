## Goal

Get StudyMate solid enough that you can hand an invite link to 10–30 real students and nothing embarrassing happens. Focus is stability, not new features.

## What I found while checking the project

Verified by reading the code just now:

1. **No auth guard on any route.** In `src/App.tsx` every page (`/`, `/focus`, `/store`, `/analytics`, …) renders for signed-out visitors. Individual pages each do their own thing — some show a "Sign In" button, others just render empty/broken UI and fire queries that return nothing. A tester who opens the link before logging in sees a broken dashboard.
2. **No global error boundary.** One render crash anywhere = permanent white screen with no way back.
3. **Placeholder site metadata.** `index.html` still says `Lovable App` / `Lovable Generated Project`, with Lovable's own og:image. Shared invite links preview as a Lovable demo, not your product.
4. **Dead mock code.** `src/services/summarizerService.ts` is a fake "simulate network delay" summarizer that nothing imports — real summarizing goes through the edge function. It's a trap for future edits.
5. **`src/pages/StudyPlanner.tsx:286`** has a `TODO` noting planner XP is not wired into the global progression system — so planner sessions may not award XP like every other module does. Needs confirming before launch.

Everything else (XP RPCs, streaks, security findings) has been hardened in previous rounds.

## Plan

### Phase 1 — Stop the embarrassing failures
- Add a `ProtectedRoute` wrapper in `src/App.tsx`: if not authenticated and auth loading is finished, redirect to `/auth`; show a spinner while the session resolves. Leave `/auth` and `/reset-password` public.
- Add an app-level error boundary around the router with a friendly "Something went wrong — Reload" card, so a crash never leaves a white screen.
- Replace the placeholder title/description/og tags in `index.html` with real StudyMate copy.
- Delete the unused mock `summarizerService.ts`.

### Phase 2 — End-to-end flow sweep
I'll drive the running app with a headless browser using your signed-in session and walk every flow, capturing screenshots and console/network errors:

```text
signup/login -> dashboard -> task add/complete/undo (XP + undo timing)
 -> focus session (tab-blur pause, XP claim, daily cap)
 -> summarizer -> flashcards (incl. Aria realtime insert)
 -> quiz generate/play/results/XP claim
 -> study planner -> calendar -> store purchase (level must not drop)
 -> streaks/heatmap -> analytics -> profile -> settings/sign out
```

For each broken thing found I fix it in place and re-verify. Known-suspect items I'll specifically check: planner XP wiring (the TODO above), Aria voice worker fallback path, and empty/loading/error states on every page for a brand-new account with zero data.

### Phase 3 — New-user reality check
Create a fresh test account and go through it as a first-time student: does the dashboard make sense at 0 XP, are empty states inviting, does anything show `NaN`, `undefined`, or a spinner that never ends. Fix what's ugly.

### Phase 4 — Invite-test hygiene
- Publish and confirm the Supabase **Site URL** is the published URL, so password-reset and confirmation emails don't point at localhost (this bit you before).
- Confirm AI edge-function rate limits are sane for ~30 users so a few testers can't burn your AI credits.
- Quick mobile pass on the pages testers will actually use most (dashboard, focus, quiz, flashcards).

## On your other question

> is this solving a real problem, does it make things easier, can it make money later

Honest read: the *problem* is real — ADHD students abandoning study sessions is a genuine, painful, widely-felt thing, and "gamified XP + anti-cheat focus timer" is a credible answer to it. What's unproven is whether *your* execution keeps someone coming back on day 7. That's exactly what an invite-only test tells you, and it's why the plan above prioritises "nothing breaks" over "more features."

The one thing I'd add to the test: instrument retention. After Phase 2 I can add lightweight tracking of daily-active users and 7-day return rate so the invite test produces an actual answer instead of vibes. Say the word and I'll fold it in.

Monetisation is real but later: AI tutor + quiz generation are the paid tier in every comparable product (free limited generations, paid unlimited). You already have the metering hooks. Don't build billing until the invite test shows people return unprompted.

## Technical notes

- `ProtectedRoute` reads `useAuth()` and must wait on `loading` before redirecting, otherwise a page refresh bounces logged-in users to `/auth`.
- The error boundary must be a class component (React has no hook equivalent) and sit inside `BrowserRouter` so the reset button can navigate.
- Browser sweep runs against `localhost:8080` with the injected Supabase session; no production data is touched.
- No database migrations expected in Phases 1–3 unless the planner-XP check turns up a missing RPC.
