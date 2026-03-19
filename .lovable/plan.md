

# AI Study Whiteboard — Implementation Plan

## Summary
Add a full-featured whiteboard page at `/whiteboard` with Excalidraw canvas, AI diagram generation via Lovable AI Gateway, Supabase persistence, and XP rewards.

## Steps

### 1. Database Migration — `whiteboards` table
Create table with columns: `id` (uuid PK), `user_id` (uuid, not null), `title` (text), `elements` (jsonb, default '[]'), `app_state` (jsonb, default '{}'), `created_at`, `updated_at`. Enable RLS with standard user-scoped policies for SELECT, INSERT, UPDATE, DELETE. Add `handle_updated_at` trigger.

### 2. Edge Function — `generate-diagram`
- File: `supabase/functions/generate-diagram/index.ts`
- Accepts `{ prompt, diagramType }` from client
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with tool calling to extract structured Excalidraw element JSON
- System prompt instructs model to return arrays of elements with `type`, `x`, `y`, `width`, `height`, `text`, `strokeColor`, etc.
- Different prompt templates per diagram type (flowchart, mindmap, diagram)
- Handles 429/402 errors, returns them to client
- Register in `config.toml` with `verify_jwt = false`

### 3. Whiteboard Page — `src/pages/Whiteboard.tsx`
- Lazy-loaded with `React.lazy()` to avoid loading Excalidraw bundle on other pages
- Layout: top toolbar + full-height Excalidraw canvas
- Toolbar buttons: Save, Load (dialog listing saved whiteboards), AI Generate (prompt dialog), Export PNG
- Excalidraw configured with `theme: "dark"`, collaboration UI disabled
- Use `excalidrawAPI` ref for `updateScene()` when injecting AI-generated elements
- Auto-save: debounced at 30s using `onChange` callback
- Load dialog: fetches user's whiteboards from Supabase, shows title + last modified

### 4. Supabase Hook — `src/hooks/useWhiteboards.ts`
- CRUD operations using `supabase` client against `whiteboards` table
- Uses React Query for caching/invalidation
- Save function upserts elements + appState
- List function for load dialog

### 5. Routing & Navigation
- Add lazy route in `App.tsx`: `const Whiteboard = React.lazy(() => import('./pages/Whiteboard'))`
- Wrap in `<Suspense>` + `<MainLayout>`
- Add "Whiteboard" to `toolsItems` in `AppSidebar.tsx` with `PenTool` icon from lucide-react

### 6. Gamification
- Award 15 XP on first save of a new whiteboard (call `award_xp` RPC with source `'whiteboard_save'`)
- Award 25 XP on AI diagram generation (call `award_xp` with source `'whiteboard_ai_generate'`)

## Technical Notes
- Excalidraw is ~1MB; code-splitting via `React.lazy` is critical
- The `@excalidraw/excalidraw` package will be installed as a dependency
- AI tool calling schema will define element properties to ensure valid Excalidraw JSON output
- The edge function uses `LOVABLE_API_KEY` (already available as a secret)

