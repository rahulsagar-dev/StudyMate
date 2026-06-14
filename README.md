# 🎓 StudyMate

> An ADHD-friendly, gamified study platform that turns learning into an addictive, rewarding experience.

StudyMate combines AI-powered learning tools, spaced repetition, focus tracking, and a deep gamification engine (XP, levels, streaks, cosmetics) to help students stay engaged and actually finish what they start.

---

## ✨ Features

### 🤖 AI Learning Tools
- **AI Tutor (Chat + Voice)** — Streaming chat (SSE) and real-time voice mode powered by LiveKit. The tutor can emit *Smart-Action Tags* (`[ACTION:FLASHCARDS:...]`, `[ACTION:TASK:...]`, `[ACTION:QUIZ:...]`) to trigger UI actions directly from the conversation.
- **Summarizer** — 3 modes (brief / detailed / bullet) for notes and documents.
- **Flashcard Generator** — Auto-creates 3D-flip flashcards from pasted text or uploaded PDF/DOCX.
- **Quiz Engine** — MCQ quizzes with Practice & Test modes, mistake review, analytics, and XP rewards.
- **AI Study Planner** — Weighted difficulty algorithm that schedules sessions (1–1.5h blocks, 40–80 XP each).
- **AI Whiteboard** — Excalidraw-based canvas with AI diagram generation.
- **Document Parser** — Extracts text from PDF and DOCX uploads.

### 🎮 Gamification Engine
- **XP & Levels** — Tiered progression: `{1:0, 2:1000, 3:2500, 4:5000, 5:10000, 6:20000, 7:35000, 8:50000}`.
- **Streaks** — IST-timezone daily streaks; activity ≥10 min OR ≥1 pomodoro counts.
- **Store & Cosmetics** — Spend XP on avatars, themes, and boosts that multiply XP gain.
- **Achievements** — Unlockable milestones.
- **Anti-cheat** — All XP awarded through `SECURITY DEFINER` RPCs with server-side clamping. Clients cannot mutate game-state columns directly.

### 🎯 Focus Mode (Pomodoro+)
- 25 / 45 / 60 minute sessions with strict integrity tracking.
- Tab switch or window blur instantly pauses the timer.
- Hidden > 30s invalidates the session (no XP awarded).
- Reward formula: `floor(minutes / 30) · 25` XP (cap 400 XP/day, server-enforced).

### 📅 Productivity
- **Task Management** — 4-tier priority system, 1.5s undo on completion, configurable XP (1–100 per task).
- **Calendar** — Google Calendar OAuth sync, dashboard widget.
- **Study Heatmap** — 53-week GitHub-style contribution grid (Sunday-start, multi-hue gradient).
- **Analytics Dashboard** — XP history, study time, productivity score.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **React 18** + **Vite 5** + **TypeScript 5** |
| Styling | **Tailwind CSS v3** + **shadcn/ui** (dark glassmorphism) |
| Animation | Framer Motion |
| Backend | **Supabase** (Postgres + Auth + Edge Functions + Realtime + Storage) |
| AI | **Lovable AI Gateway** (Gemini / GPT) |
| Voice | **LiveKit** (real-time agent rooms) |
| Whiteboard | **Excalidraw** |
| Charts | Recharts |
| Testing | Vitest |

---

## 🏗️ Architecture

```
src/
├── components/        # UI components (feature-grouped)
│   ├── ai-tutor/      # Chat + Voice modes
│   ├── quiz/          # Quiz player, results, review
│   ├── dashboard/     # Heatmap, stats, widgets
│   ├── streaks/       # Level roadmap, XP charts
│   ├── VoiceAgent/    # LiveKit integration
│   └── ui/            # shadcn primitives
├── contexts/          # Auth, Pomodoro, ActivityTracker, Cosmetics
├── hooks/             # useProfile, useTasks, useQuizAttempts, ...
├── lib/               # aiActions, streamChat, utils
├── pages/             # Route-level components (one per major feature)
├── services/          # quizService, summarizerService
└── integrations/
    └── supabase/      # Generated client & types

supabase/
├── functions/         # Edge functions (chat, generate-*, parse-document, livekit-token, ...)
└── migrations/        # SQL schema + RLS + RPCs
```

**Design rules:**
- Major features get **dedicated pages** — never modals/overlays for robust features.
- All XP mutations flow through `SECURITY DEFINER` RPCs (`award_xp`, `complete_task`, `claim_quiz_xp`, `claim_pomodoro_xp`, `claim_focus_session_xp`).
- A trigger (`prevent_profile_game_state_changes`) blocks direct writes to game-state columns on `profiles`.
- Roles live in a separate `user_roles` table (never on profiles) — checked via `has_role()` security-definer function.

---

## 🧮 Key Algorithms

### XP Progression (Tiered)
```ts
LEVEL_THRESHOLDS = { 1:0, 2:1000, 3:2500, 4:5000, 5:10000, 6:20000, 7:35000, 8:50000 }
progress% = clamp(0, 100, (xp - T[L]) / (T[L+1] - T[L]) · 100)
```
Server recomputes `current_level` on every `award_xp` call — level can never decrease.

### Quiz XP
```ts
xp = clamp(1, 1000, correct · 5 + 20 + (correct === total ? 50 : 0))
```

### Focus Session XP
```ts
xp = floor(minutes / 30) · 25   // daily cap: 400 XP
```

### Smart-Action Tag (regex)
```ts
/\[ACTION:\w+(?::[^\]]*)?\]/g
```

### Productivity Score (per day)
```ts
timeScore = minutes >= 300 ? 4 : minutes >= 180 ? 3 : minutes >= 60 ? 2 : minutes >= 20 ? 1 : 0
pomoScore = pomos   >= 10  ? 4 : pomos   >= 7   ? 3 : pomos   >= 4  ? 2 : pomos   >= 1  ? 1 : 0
productivity = round((timeScore + pomoScore) / 2)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm (install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Local Setup
```sh
# 1. Clone
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install
npm i

# 3. Run dev server
npm run dev
```

The app auto-connects to the configured Supabase project. Edge function secrets (Lovable AI, LiveKit, Google OAuth) are managed in the Supabase dashboard.

### Build
```sh
npm run build      # production bundle
npm run preview    # preview the build
npm test           # run vitest
```

---

## 🔐 Security

- Row-Level Security enforced on every user table.
- All sensitive mutations behind `SECURITY DEFINER` RPCs with server-side validation and clamping.
- OAuth redirect URLs validated against an allow-list.
- JWT verification on protected edge functions.
- Generic error messages on auth-adjacent endpoints (no info leak).
- Anti-cheat: tab-switch / blur detection on focus sessions.

---

## 📦 Deployment

Built and hosted on **Lovable**. Open the project and click **Share → Publish**.

To self-host: connect the project to GitHub (Lovable → GitHub → Connect), then deploy the repo to any static host (Vercel, Netlify, Cloudflare Pages). Edge functions remain on Supabase.

### Custom Domain
Project → Settings → Domains → Connect Domain. See [docs](https://docs.lovable.dev/features/custom-domain).

---

## 📄 License

Private project. All rights reserved.

---

Built with ❤️ using [Lovable](https://lovable.dev).
