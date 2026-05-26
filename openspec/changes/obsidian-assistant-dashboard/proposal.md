## Why

Managing a personal Obsidian vault produces rich daily and weekly notes, but there is no unified view to surface todos, track goal progress, or get an AI-generated debrief without manual effort. This dashboard brings that context together in one local web app so the user can act on their life data without leaving their workflow.

## What Changes

- New Express + React web application that reads from a local Obsidian vault path
- Backend that parses daily notes (`YYYY-MM-DD.md`), weekly notes, and arbitrary notes within a configurable time window
- AI debrief generation via Claude (Anthropic SDK) summarizing state of mind, active projects, and life pillars
- Interactive todo list extracted from vault notes with write-back to Obsidian files
- Goal tracking section pulled from weekly notes, with progress visualization
- Life pillars overview (Health, Projects, Relationships, Mindset, Spirituality)
- Chat panel with full vault context pre-loaded so Claude can answer questions and take actions (add/delete notes, complete tasks)
- Voice input that transcribes speech and writes updates directly to vault files
- Time window toggle (last 3 days / 1 week / 2 weeks / 1 month) that reruns all analysis on change

## Capabilities

### New Capabilities
- `vault-reader`: Parse daily notes, weekly notes, and arbitrary notes within a time window from the local filesystem
- `todo-tracker`: Extract todos from notes, track how long each has been on the list, flag recurring uncompleted ones
- `goal-tracker`: Pull weekly goals from weekly notes and visualize progress against them
- `ai-debrief`: Generate a daily debrief using Claude summarizing state of mind, active projects, and life pillars
- `life-pillars`: Overview panel for Health, Projects, Relationships, Mindset, Spirituality derived from note content
- `chat-panel`: Claude chat with full vault context pre-loaded; supports action commands (delete task, add note, complete task)
- `voice-input`: Browser microphone input transcribed and written to vault files
- `vault-writer`: Write-back capability — check off todos, delete tasks, append notes in actual Obsidian `.md` files
- `time-window-toggle`: UI toggle to switch analysis range; triggers full re-analysis on change
- `dashboard-ui`: React + Tailwind single-page dashboard composing all panels

### Modified Capabilities

## Impact

- New dependencies: `express`, `@anthropic-ai/sdk`, `react`, `react-dom`, `tailwindcss`, `vite`, `concurrently`
- Reads local filesystem path to Obsidian vault (configured via `.env`)
- Writes back to `.md` files in vault — file mutations are scoped to todo checkboxes and appending to daily note
- No external services beyond Anthropic API; fully local otherwise
- Single `npm start` launches both Express backend and Vite dev server
