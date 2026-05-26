## Context

The user maintains an Obsidian vault with daily notes named `YYYY-MM-DD.md`, weekly notes, and general notes. They want a local web dashboard that reads those files, derives structure from them (todos, goals, life pillar signals), and drives Claude conversations with full context already loaded. All file mutations must round-trip correctly so Obsidian stays the source of truth.

## Goals / Non-Goals

**Goals:**
- Single-repo monorepo: Express API (`server/`) + Vite React frontend (`client/`)
- `npm start` at root boots both via `concurrently`
- Vault path set once in `.env` — no UI config screen needed
- All AI calls go through Anthropic SDK server-side only (key never exposed to browser)
- Write-back to vault files is safe: only targeted line edits for todo checkboxes, append-only for new notes
- Voice input uses browser Web Speech API (no external service)

**Non-Goals:**
- Obsidian plugin — this is a standalone local web app
- Cloud sync or multi-device — local only
- Full markdown editor — read + targeted write only
- Authentication — trusted local network only

## Decisions

### Monorepo structure with concurrently
`server/` holds Express. `client/` holds Vite+React. Root `package.json` runs both with `concurrently`. Vite proxies `/api/*` to Express so no CORS issues.
Alternative: separate repos — rejected, single `npm start` requirement.

### Vault parsing: raw filesystem, no Obsidian API
Read `.md` files directly via Node `fs`. Parse frontmatter with `gray-matter`. Extract todos with regex (`- [ ]` / `- [x]`). Extract weekly goals by heading pattern (`## Goals` or `## Weekly Goals`).
Alternative: Obsidian Local REST API plugin — rejected, adds user install dependency.

### Todo staleness tracking
On each vault read, build a todo registry keyed by normalized task text. Compare against previous run stored in `server/data/todo-history.json` (gitignored). First-seen date recorded; flagged as stale if seen across multiple days without completion.

### Time window
Frontend sends `?window=7d` query param. Backend filters note files by `mtime` and filename date. Re-fetches on toggle — no caching needed at this scale.

### AI debrief and chat: single `/api/ai` router
- `POST /api/debrief` — builds a system prompt with all note content in window, calls `claude-sonnet-4-6`, returns structured JSON (summary, pillars, active projects)
- `POST /api/chat` — streaming endpoint; system prompt pre-loads vault context; tool use enables `complete_task`, `delete_task`, `append_note` actions
- `POST /api/transcribe` — receives base64 audio from browser, uses Web Speech API result (transcription happens client-side via browser API, then text is sent here to write to vault)

### Life pillars extraction
Prompt Claude to return a JSON object with scores/summaries for: Health, Projects, Relationships, Mindset, Spirituality. Derived from the same note content used for the debrief. Cached per debrief run, not re-fetched separately.

### Write-back safety
- Todo toggle: read file → find exact line → replace `- [ ]` with `- [x]` (or reverse) → write file atomically via temp file + rename
- Delete task: read file → filter out matching line → write file
- Append note: open today's daily note (create if missing) → append timestamped line

### Frontend stack
React 18 + Vite + Tailwind CSS v3. No heavy UI library — custom components keep the bundle small and the design flexible. React Query for server state. Markdown rendered with `react-markdown`.

## Risks / Trade-offs

- [Vault path hardcoded in .env] → User must set `VAULT_PATH` correctly; we validate on startup and return a clear error if missing or invalid
- [Todo matching by text] → If user edits task text slightly, history loses continuity. Mitigation: normalize whitespace + case for matching key
- [File write race condition] → Low risk for single local user; atomic rename mitigates partial writes
- [Web Speech API browser support] → Chrome/Edge only for voice input; degrade gracefully with a visible notice on unsupported browsers
- [Large vaults] → Only files within time window are read; no full vault scan on every request

## Open Questions

- Weekly note naming convention — assume `YYYY-[W]WW.md` or a `Week of YYYY-MM-DD` heading? → Implement both patterns, fall back to any file with a `## Weekly Goals` heading in window
- Should debrief auto-run on page load or require user click? → Auto-run on load, show loading state
