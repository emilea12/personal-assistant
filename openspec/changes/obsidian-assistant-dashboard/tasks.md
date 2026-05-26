## 1. Project Scaffold

- [x] 1.1 Install root dependencies: concurrently, dotenv
- [x] 1.2 Create server/ directory with package.json and install express, @anthropic-ai/sdk, gray-matter, cors, dotenv
- [x] 1.3 Create client/ directory and scaffold Vite + React app with Tailwind CSS
- [x] 1.4 Create root package.json start script using concurrently to boot both server and client
- [x] 1.5 Create .env.example with ANTHROPIC_API_KEY and VAULT_PATH placeholders
- [x] 1.6 Update .gitignore to exclude .env, server/data/, node_modules in all directories

## 2. Vault Reader (server)

- [x] 2.1 Create server/src/vault/reader.js — validate VAULT_PATH on module load, exit with clear error if missing
- [x] 2.2 Implement getDailyNotes(windowDays) — glob YYYY-MM-DD.md files, filter by date, parse with gray-matter
- [x] 2.3 Implement getWeeklyNotes(windowDays) — detect by filename pattern and ## Weekly Goals heading
- [x] 2.4 Implement getAllNotesInWindow(windowDays) — combine daily + weekly + any .md file with recent mtime
- [x] 2.5 Create GET /api/notes?window=7 Express route returning all notes for the window

## 3. Todo Tracker (server)

- [x] 3.1 Create server/src/todos/extractor.js — regex parse - [ ] and - [x] lines from note content, record file path and line number
- [x] 3.2 Implement todo deduplication by normalized (lowercase + trimmed) text
- [x] 3.3 Create server/src/todos/history.js — read/write server/data/todo-history.json for first-seen dates
- [x] 3.4 Implement staleness flag — stale: true if first-seen >= 3 days ago and not complete
- [x] 3.5 Create GET /api/todos?window=7 Express route returning enriched todo list

## 4. Vault Writer (server)

- [x] 4.1 Create server/src/vault/writer.js with atomicWrite(filePath, content) using temp-file + rename
- [x] 4.2 Implement toggleTodo(filePath, lineNumber, complete) — read file, flip checkbox on target line, atomic write
- [x] 4.3 Implement deleteTodo(filePath, lineNumber) — read file, remove target line, atomic write
- [x] 4.4 Implement appendToDaily(text) — resolve today's YYYY-MM-DD.md path, create if missing, append timestamped line
- [x] 4.5 Create POST /api/todos/:id/toggle, DELETE /api/todos/:id, POST /api/notes/append routes

## 5. Goal Tracker (server)

- [x] 5.1 Create server/src/goals/extractor.js — find ## Goals / ## Weekly Goals section in weekly notes, parse list items
- [x] 5.2 Implement fuzzy goal-todo matching by shared keywords for progress inference
- [x] 5.3 Create GET /api/goals?window=7 Express route returning goals with inferred progress status

## 6. AI Debrief (server)

- [x] 6.1 Create server/src/ai/debrief.js — build system prompt from all notes in window
- [x] 6.2 Define debrief JSON schema: { summary, stateOfMind, activeProjects[], pillars: { health, projects, relationships, mindset, spirituality } each with score(1-5) and summary }
- [x] 6.3 Call claude-sonnet-4-6 with prompt and parse structured JSON response
- [x] 6.4 Handle empty window gracefully — return debrief with "No notes found" message
- [x] 6.5 Create POST /api/debrief Express route accepting { window } body param

## 7. Chat Panel with Tool Use (server)

- [x] 7.1 Create server/src/ai/chat.js — build system prompt with full vault context pre-loaded
- [x] 7.2 Define Anthropic tool schemas for complete_task, delete_task, append_note
- [x] 7.3 Implement streaming POST /api/chat route using Anthropic SDK streaming API
- [x] 7.4 Handle tool_use blocks in streaming response — execute vault action, inject tool_result, continue stream
- [x] 7.5 Return action confirmations as assistant messages in the stream

## 8. React Frontend — Core Shell

- [x] 8.1 Set up Tailwind CSS dark theme config in client/tailwind.config.js
- [ ] 8.2 Create App.jsx with time window state (default: 7 days), localStorage persistence
- [ ] 8.3 Create TimeWindowToggle component — 4-button tab bar (3d / 1w / 2w / 1m)
- [ ] 8.4 Create Header component with app title and time window toggle
- [x] 8.5 Configure Vite proxy: /api → http://localhost:3001

## 9. React Frontend — Dashboard Panels

- [ ] 9.1 Create DebriefPanel component — shows summary and stateOfMind, Refresh button, loading skeleton
- [ ] 9.2 Create LifePillarsPanel component — 5 pillar cards with fill bars, score, and summary text
- [ ] 9.3 Create TodoList component — renders todos with check/delete buttons, stale badge, days-on-list count
- [ ] 9.4 Wire TodoList check/delete to POST /api/todos/:id/toggle and DELETE /api/todos/:id
- [ ] 9.5 Create GoalsPanel component — list of goals with status badge (complete / in-progress / unknown)

## 10. React Frontend — Chat Panel

- [ ] 10.1 Create ChatPanel component with message list, input field, send button, collapse toggle
- [ ] 10.2 Implement streaming fetch consumer — read SSE/chunked response and append tokens to message bubble
- [ ] 10.3 Render action confirmation messages in chat with distinct styling (e.g. green bg)
- [ ] 10.4 Add VoiceInput button in chat using Web Speech API; disable with tooltip on unsupported browsers
- [ ] 10.5 Add standalone VoiceUpdate button that calls POST /api/notes/append with transcript

## 11. Wiring and Integration

- [ ] 11.1 Wire App.jsx to fetch /api/debrief on load and on window change, pass data to DebriefPanel and LifePillarsPanel
- [ ] 11.2 Wire App.jsx to fetch /api/todos and /api/goals on load and on window change
- [ ] 11.3 Pass updated window param to all fetches when toggle changes
- [ ] 11.4 Add global error boundary and API error toasts

## 12. Final Polish

- [ ] 12.1 Verify npm start boots both server (port 3001) and client (port 5173)
- [ ] 12.2 Add loading skeletons to all panels
- [ ] 12.3 Test write-back: check/uncheck todo in dashboard, verify vault file updated
- [ ] 12.4 Test chat action: say "delete task X", verify vault file updated and chat confirms
- [ ] 12.5 Commit all files and push to GitHub
