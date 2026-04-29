I found a different root problem than the earlier quiz/whiteboard UI race: the app is successfully getting a LiveKit token, but the LiveKit assistant participant is not joining the room. That is why the UI stays on `Waking Aria up…` even after you speak.

What the screenshot means:
- Your browser connected to the LiveKit room.
- The mic control is visible, so the client session started.
- `useVoiceAssistant()` has no `agent`, so the UI shows `Waking Aria up…`.
- The backend `livekit-token` function returned 200 in the logs, so the issue is likely room/agent dispatch or missing agent registration, not a button/UI issue.

Likely cause:
- The project has `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_URL` secrets.
- It does not have `LIVEKIT_AGENT_NAME` configured.
- The current `livekit-token` function only adds explicit `RoomAgentDispatch` when `LIVEKIT_AGENT_NAME` exists. Without it, the app depends on an automatic LiveKit agent worker being registered and running externally. If that worker is not registered/online, Aria never joins, so actions like quiz and whiteboard drawing never happen.

Plan to fix:

1. Improve LiveKit token diagnostics
- Update `supabase/functions/livekit-token/index.ts` to include safe server logs for:
  - room name
  - whether an explicit agent name is configured
  - whether room metadata was attached
  - any token/roomConfig creation errors
- Do not log secrets.

2. Add client-side timeout feedback
- Update `src/components/VoiceAgent/VoiceAgent.tsx` so if the room is connected but no assistant participant appears after about 12 seconds, the user sees a clear message instead of only `Waking Aria up…`.
- Example message: “Aria connected to voice, but the assistant worker did not join. Please check the LiveKit agent deployment/config.”
- Keep the existing orb design and controls.

3. Add a text-command fallback while the agent is missing
- Add a small input under the stuck state so the user can type commands like:
  - “draw a doubly linked list”
  - “quiz me on linked lists”
- Reuse the existing deterministic whiteboard and quiz-start logic by dispatching the same handling path used for voice transcripts.
- This means the app can still create the quiz/whiteboard output even when the external LiveKit voice agent is not joining.

4. Make voice command handling reusable and more reliable
- Extract the command-detection helpers from `WhiteboardDataBridge.tsx` into a small shared utility or exported handler so both LiveKit transcripts and the new fallback input use the same logic.
- Preserve the deterministic linked-list and binary-tree templates already added.
- Preserve the `start-voice-quiz` flow and existing quiz listener.

5. Deployment/config follow-up
- Deploy the updated `livekit-token` function.
- Re-check edge logs after a new voice attempt.
- If logs show `agentNameConfigured=false`, the remaining required environment fix is to configure `LIVEKIT_AGENT_NAME` to match the deployed LiveKit worker name, or ensure the automatic LiveKit worker is actually running and registered for this project.

Expected result:
- The UI will no longer silently sit on `Waking Aria up…` with no explanation.
- If the real-time voice agent joins, everything works as normal.
- If the agent does not join, the app clearly tells you the backend agent is missing and still lets you trigger quiz/whiteboard commands through the fallback input while we correct the LiveKit agent configuration.