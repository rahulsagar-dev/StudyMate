# Why Aria can't generate quizzes

Edge-function logs for `generate-quiz` are empty — meaning Aria never calls it. The previous build only added a **listener** (`HybridQuizListener`) that subscribes to `quiz_attempts` INSERTs, but **nothing in the system actually inserts a row** when Aria starts a voice quiz. On top of that, the listener and the table don't agree:

**Schema vs. listener mismatch**

The existing `quiz_attempts` table is missing every column the hybrid flow needs:

| Listener expects | Exists in table? |
|---|---|
| `status` ("active" / "completed") | No |
| `questions_payload` (jsonb array) | No |
| `update` permission for the user | No (only INSERT + SELECT policies) |

So even if Aria tried to insert a row, it would fail; and even if it succeeded, the listener would never see `status === "active"`.

**No tool exposed to Aria**

The LiveKit voice agent runs server-side and has no tool/function for "create voice quiz". She has no way to populate `questions_payload` even if the column existed.

# Plan

## 1. Database migration

Add the missing columns + UPDATE policy on `quiz_attempts`:

- `status text NOT NULL DEFAULT 'completed'` (existing rows stay valid; new voice quizzes use `'active'`)
- `questions_payload jsonb` (nullable)
- New RLS policy: `Users can update own quiz attempts` (`USING auth.uid() = user_id`)

## 2. New edge function: `start-voice-quiz`

`supabase/functions/start-voice-quiz/index.ts` — JWT-validated, callable by Aria via the existing chat/agent pipeline OR directly by the client when Aria says "start a quiz on X".

Flow:
1. Validate body: `{ topic: string, difficulty?: "easy"|"medium"|"hard", questionCount?: number (3–10) }`.
2. Rate-limit per user (5/min).
3. Call Lovable AI Gateway (`google/gemini-2.5-flash`, `response_format: json_object`) with a prompt that returns:
   ```json
   { "questions": [ { "question": "...", "options": ["A","B","C","D"], "answer": "B", "explanation": "..." } ] }
   ```
4. Insert row into `quiz_attempts` with `status: "active"`, `quiz_topic`, `difficulty`, `total_questions`, `questions_payload`, `quiz_mode: "voice"`.
5. Return `{ attemptId, questions }` so Aria can read them aloud.

Add `[functions.start-voice-quiz] verify_jwt = false` to `supabase/config.toml` (we validate the JWT in code, matching the project pattern).

## 3. Wire Aria to call it

In `supabase/functions/chat/index.ts`, the system prompt already supports `[ACTION:QUIZ:topic]`. Extend the front-end action handler (`src/lib/aiActions.ts`) to:
- When it sees `[ACTION:QUIZ:<topic>]`, call `supabase.functions.invoke("start-voice-quiz", { body: { topic } })`.
- The INSERT then fires the realtime event the existing `HybridQuizListener` already handles → modal appears automatically.

For the LiveKit voice agent specifically (`livekit-token` / agent worker), the same trigger works because Aria emits the `[ACTION:QUIZ:...]` tag in her transcript, which the chat-action handler parses. No agent-worker changes required.

## 4. Fix the unrelated React warnings (cleanup)

Console shows: `Function components cannot be given refs` from `Quizzes` → `QuizSetup`. Wrap `QuizSetup` (and `Quizzes` if needed) in `React.forwardRef` or remove the stray `ref` prop being passed by a parent. Quick scan + fix.

## Technical details

- Files created: `supabase/functions/start-voice-quiz/index.ts`, one new migration.
- Files edited: `supabase/config.toml`, `src/lib/aiActions.ts`, `src/components/quiz/QuizSetup.tsx` (forwardRef fix).
- No changes needed to `HybridQuizListener.tsx` — it already handles the realtime payload correctly once the columns exist.
- Idempotent migration guarded with `IF NOT EXISTS` / `DO $$` blocks.

## Out of scope

- Changing the existing manual `Quizzes` page flow.
- Voice answer detection (Aria already grades verbally; the modal lets the student click as a fallback, which is the spec).
