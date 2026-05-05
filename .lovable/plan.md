## Goal
Produce a downloadable three-tier architecture block diagram for StudyMate as a Mermaid artifact, reflecting the actual codebase (React SPA → Supabase Edge Functions + external services → Postgres/Storage/Auth).

## Deliverable
A single file: `/mnt/documents/StudyMate_Three_Tier_Architecture.mmd`, surfaced as a `text/vnd.mermaid` artifact so the user can preview/download it. No app code changes.

## Diagram structure

Tier 1 — Presentation (Client, browser)
- React 18 + Vite + TS SPA
- Pages group: Dashboard, AI Assistant, Flashcards, Quizzes, Summarizer, Whiteboard, Focus Mode, Calendar, Streaks, Store, Analytics, Profile
- Shared: Layout (AppSidebar, TopBar), Contexts (Auth, Pomodoro, Activity, Cosmetics), Hooks
- Embedded libs: Excalidraw, LiveKit client, Supabase JS client

Tier 2 — Application / Logic (Supabase Edge Functions + external services)
- AI edge functions: chat (SSE), generate-flashcards, generate-quiz, generate-summary, generate-diagram, start-voice-quiz
- Integration edge functions: parse-document, google-calendar-auth, google-calendar-sync, livekit-token
- Cross-cutting concerns shown as a band: JWT verification, per-user in-memory rate limiting, input validation/caps
- External services (side nodes): Lovable AI Gateway (Gemini / GPT), Google Calendar API, LiveKit Cloud

Tier 3 — Data (Supabase managed)
- Supabase Auth (email + Google OAuth)
- Postgres with RLS: profiles, user_roles, tasks, flashcards, quizzes, quiz_attempts, summaries, documents, whiteboards, study_sessions, calendar_events, xp_transactions (SELECT-only for clients), user_inventory (SELECT-only), active_boosts (SELECT-only), achievements
- SECURITY DEFINER RPCs (sole writers for game state): award_xp, complete_task, claim/boost RPCs
- Storage: `documents` bucket, owner-scoped by `auth.uid()` folder

## Edges / flow
- Client → Edge Functions (HTTPS + JWT)
- Client → Supabase Auth (sign-in, session)
- Client → Postgres (RLS-scoped reads + limited writes via supabase-js)
- Edge Functions → Lovable AI Gateway / Google Calendar / LiveKit
- Edge Functions → Postgres (service role, via RPCs) and Storage
- RPCs are the only path that writes to xp_transactions / user_inventory / active_boosts

## Style
- `flowchart TB` with three labeled subgraphs (Tier 1, Tier 2, Tier 3)
- No emojis, no custom colors (auto light/dark theme)
- Solid arrows for primary calls, dashed arrows for external integrations

## Out of scope
- No code changes, no UI, no new pages
- Not exporting to PNG/PDF unless you ask — Mermaid artifact renders inline and is downloadable

After approval I'll write the `.mmd` file and emit the artifact tag.