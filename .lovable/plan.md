## What's actually broken

I traced the full quiz pipeline. **There are three real bugs on our side**, plus one external cause we cannot fix from this codebase.

### External (not fixable from here)
The screenshot shows: *"Aria connected to voice, but the assistant worker did not join."* That's the **Python LiveKit agent** failing to register/dispatch — it lives in a separate deployment (Render/Railway/etc.), not in this repo (`find . -name "*.py"` returns nothing). The `livekit-token` edge function correctly dispatches the worker named `aria` (logs confirm `agentNameConfigured: true, metadataAttached: true`), so the LiveKit handshake from our side is fine. The Python worker process is just down or the `agent_name="aria"` registration doesn't match. **You'll need to restart / check logs of the Python agent host.**

### Bugs on our side (fix in this app)

**Bug 1 — Typed messages bypass the client-side intent router**
`VoiceAgent.tsx`'s connected-state input (`sendTextToAria`) only publishes a `text_input` packet over the LiveKit data channel. When the Python worker is offline (current situation) AND when it's online but the user wants a client-handled action (quiz/whiteboard), nothing fires. The fallback (timed-out) input correctly dispatches `aria:voice-command`; the regular one doesn't.

**Evidence:** Edge function logs show **zero calls** to `start-voice-quiz` despite the user typing "take a quiz of me on table".

**Fix:** Make `sendTextToAria` ALSO dispatch `window.dispatchEvent(new CustomEvent("aria:voice-command", { detail: { text } }))` so `WhiteboardDataBridge` evaluates intents (quiz, whiteboard) for typed text too. The LiveKit publish stays for when the worker is online.

**Bug 2 — `extractQuizTopic` returns junk for common phrasings**
The regexes in `WhiteboardDataBridge.tsx` only match:
- "quiz me on X" / "test me about X"
- "start/give/make/create/do (a) quiz on X"
- "quiz on X"

They miss natural phrasings like:
- "take a quiz of me on table" → falls through to fallback, returns `"take of table"`
- "quiz me of X" / "ask me about X" / "test me with X"

The fallback strip-list is also weak: it doesn't remove "take", "ask", "of", "with".

**Fix:** Add patterns for `take/give/do/run/ask...quiz...(of|me|on|about|with) X`, and broaden the fallback cleanup to strip `take|ask|of|with`. Always trim short stop-words and bail with a clear toast if topic ends up < 2 chars.

**Bug 3 — Generic "Failed to start voice quiz" hides real errors**
`start-voice-quiz/index.ts` catches everything and returns `"Failed to start voice quiz."` with no specifics. When AI returns malformed JSON, no questions, etc., we get no signal in the toast or in `ai_error_logs` beyond the message string. Worse, the client (`WhiteboardDataBridge`) only `console.warn`s the failure — **the user sees nothing**.

**Fix:**
- Edge function: include the original error class/message (sanitized) in the response payload field `details` so the toast can show "AI returned no valid questions" vs "AI rate limit".
- Client: surface a toast in both success and failure paths so the user knows the quiz request was received and what happened.

---

## Files to change

1. **`src/components/VoiceAgent/VoiceAgent.tsx`** — in `sendTextToAria`, dispatch `aria:voice-command` before/alongside the LiveKit publish.

2. **`src/components/VoiceAgent/WhiteboardDataBridge.tsx`**
   - Extend `extractQuizTopic` regex set + fallback stop-word list.
   - In the quiz handler: show `toast.loading` → `toast.success`/`toast.error` so the user sees status. Bail with a friendly toast if topic is empty/too short.

3. **`supabase/functions/start-voice-quiz/index.ts`** — return `{ error, details }` with the actual failure reason (parse error / no questions / insert error). Keep the friendly top-level message.

## Out of scope (cannot fix here)

- Restarting / fixing the Python LiveKit agent worker — that's hosted outside this repo. After our fixes, **typed quiz commands will work even while the Python worker is down**, because the client routes intents directly to the edge function. Voice (mic) commands still need the worker to be live to produce transcripts.

## Verification

- Type "take a quiz of me on table" in the connected text input → quiz dialog opens with topic "table".
- Type "quiz me on photosynthesis" → opens with topic "photosynthesis".
- Type "give me a quiz" (no topic) → friendly toast: "What topic should I quiz you on?"
- Edge function logs should show new `start-voice-quiz` invocations after the fix.
