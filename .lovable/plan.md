# Deep Analysis: Voice Quiz Not Showing + Whiteboard Doubly-Linked-List Missing

## What I verified from the database & code

**Quiz path — the row IS being created correctly:**

- Most recent `quiz_attempts` row: `quiz_topic="Linked Lists"`, `quiz_mode="voice"`, `total_questions=5`, `questions_payload` has 5 valid questions, inserted at 19:33:26.
- `start-voice-quiz` edge function ran successfully (logs show boot + clean shutdown, no errors, no entries in `ai_error_logs`).
- Realtime publication includes `quiz_attempts` (and `whiteboards`), replica identity is `full`. So the INSERT event WAS broadcast.
- BUT the row's current `status` is `completed` with `completed_at = 19:34:49` (~83 s after insert). Nothing in our code path sets a row from `active` straight to `completed` other than `HybridQuizListener.finishQuiz()` — which only runs after the user finishes all 5 questions.

That last point is the smoking gun: the dialog DID briefly mount and the listener ran, but something about the flow caused it to auto-complete without the user ever seeing/interacting with questions. Combined with the "Aria says she made a quiz but I see nothing" symptom, the most likely cause is one of:

1. **Race in `HybridQuizListener**`: `useEffect` re-runs whenever `user` reference changes. The effect's cleanup calls `removeChannel`, then re-subscribes. If this happens around the moment the INSERT event arrives, the event lands on the old (closed) channel and is dropped. The console log `[WhiteboardListener] Channel status: CLOSED` we see for the whiteboard channel confirms this teardown pattern is happening in the app.
2. **Status filter is too strict**: `if (!row || row.status !== "active") return;` — if Postgres later updated the row before the realtime broadcast was processed (or if the row was inserted with a default value first then updated), we'd skip it. Less likely but worth defending against.
3. **Dialog opens, but mounted BEHIND a higher z-index overlay** (FloatingVoiceButton / Sonner toast / sidebar). Then the 2 s auto-advance timer in `handleSelect` never fires because user can't click — but `finishQuiz` still gets called eventually if `handleSkip`/auto-advance triggers… Actually it won't auto-finish without interaction. So this alone doesn't explain `completed`. Rule out.

**Whiteboard "doubly linked list" path — the request is silently dropped:**
Inspecting `src/components/VoiceAgent/WhiteboardDataBridge.tsx`:

- `isWhiteboardPageDrawingCommand()` regex for drawable subjects: `array|linked\s*list|link\s*list|stack|queue|tree|binary|bst|graph|flowchart|mindmap`. "Doubly linked list" matches `linked\s*list` ✓.
- BUT — Aria's Python agent typically tries to draw via the LiveKit data channel itself. When she says "I drew it" but nothing arrives on the data channel, our fallback should kick in via `isAgentWhiteboardClaim()`. That regex requires `i('|')ve|i have|i just|i` AND (`drew|drawn|added|put|placed|created|made`). It will match.
- The fallback then schedules `generate-diagram` after 3.5 s — but it gates on `window.location.pathname.startsWith("/whiteboard")`. **If the user is on `/quizzes` or any other page when Aria "draws", the fallback is skipped entirely and nothing happens.** Console logs show user is currently on `/quizzes`. That perfectly explains "she said she drew it but it doesn't show up".
- Even if we were on `/whiteboard`, "doubly linked list" has no deterministic template (only binary tree does), so it would go through `generate-diagram` with the cleaned prompt `"doubly linked list"` (3 words → no expansion). The model has been seen to produce a singly linked list for this — minor secondary issue.

## What to change

### 1. Make `HybridQuizListener` robust to channel teardown & status quirks

- Add `console.log` for channel status + every INSERT payload received, so we can see in real-time what's happening (mirrors `WhiteboardListener` style).
- Move the channel name to a stable string (`hybrid-quiz-${user.id}`) and only re-subscribe when `user.id` actually changes (use `user?.id` in the dep array, not `user`).
- Also listen for `UPDATE` events where `status` transitions to `active` (defensive — covers any race where the row briefly appears non-active first).
- When realtime fires, if the dialog is already open (e.g. for a previous attempt) ignore duplicates by `attemptId`.
- Backfill on mount: query `quiz_attempts` for the most recent row with `status='active'` created within the last 2 minutes and open it. This guarantees that if realtime missed the event (channel race, refresh, etc.), the dialog still appears.
- Make sure the `<Dialog>` z-index sits above the floating voice button (add `z-[100]` to `DialogContent`, and a `DialogDescription` to silence the existing accessibility warning we see in the console).

### 2. Whiteboard: stop dropping draw commands when user is on another page

- Remove the `pathname.startsWith("/whiteboard")` gate inside `scheduleDiagramFallback`. Instead, when a draw command is detected from any page:
  - If on `/whiteboard`, behave as today.
  - If NOT on `/whiteboard`, navigate the user to `/whiteboard` first (via the same `window.dispatchEvent` pattern, plus a `aria:navigate` event or a small router-aware wrapper), then schedule the fallback after navigation settles.
- Add explicit `linked list` (singly + doubly) deterministic templates so we don't depend on the model:
  - `createLinkedListElements({ doubly: boolean, count })` — boxes with arrows. For doubly, draw two parallel arrows (forward + back) between every adjacent pair, plus `NULL` labels at both ends.
  - Trigger from `isLinkedListPrompt(text)` (matches `linked\s*list`, with `doubly|two[-\s]way|bidirectional` setting `doubly=true`).
- Update `cleanVoicePrompt` so a "doubly linked list" prompt expands to an explicit description with bidirectional arrows (used only if the deterministic template path is bypassed).

### 3. Quick observability

- Add console logs in `HybridQuizListener`'s subscribe callback (`status` and every INSERT/UPDATE payload).
- Add a console log in `WhiteboardDataBridge` when a draw intent is detected but skipped due to wrong route — so we can see "skipped: not on /whiteboard" in the future.

## Files to touch

- `src/components/quiz/HybridQuizListener.tsx` — channel hygiene, UPDATE listener, backfill query, dedupe by `attemptId`, `DialogDescription`, z-index.
- `src/components/VoiceAgent/WhiteboardDataBridge.tsx` — `isLinkedListPrompt` + `createLinkedListElements`, route-agnostic fallback, navigate-to-whiteboard helper, route-skip log.
- `src/pages/Whiteboard.tsx` — no logic change, but make `handleAgentDraw` retry once if `excalidrawAPI` isn't ready yet (covers the "navigate then immediately apply" race).

## Out of scope (not changing)

- The Python Aria agent itself (we only fix the front-end behavior).
- The `start-voice-quiz` edge function — it works correctly today; the failure is purely on the listener side.
- The real-time publication/replica identity — already configured correctly.

After approval, I'll implement the three file changes above. No DB migration is needed.