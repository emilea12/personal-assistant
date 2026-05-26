## ADDED Requirements

### Requirement: Single-page dashboard layout
The system SHALL render a single-page React application with a dark-themed layout containing: header with time window toggle, life pillars row, debrief panel, todo list, goals panel, and collapsible chat panel.

#### Scenario: Dashboard loads without errors
- **WHEN** the user opens `http://localhost:5173`
- **THEN** the full dashboard renders with all panels visible (loading states shown while data fetches)

### Requirement: Interactive todo list
The system SHALL render todos as a checklist where each item shows: task text, source file name, days on list, stale badge (if applicable), a check button, and a delete button.

#### Scenario: Todo checked off via dashboard
- **WHEN** user clicks the check button on a todo
- **THEN** the todo is visually marked complete and the vault file is updated

#### Scenario: Stale todo highlighted
- **WHEN** a todo has `stale: true`
- **THEN** it is visually distinguished with a warning badge ("X days old")

### Requirement: Debrief panel with summary and refresh button
The system SHALL show the AI debrief summary in a readable card with a "Refresh Debrief" button that re-runs generation on demand.

#### Scenario: Debrief refresh button works
- **WHEN** user clicks "Refresh Debrief"
- **THEN** a new generation is triggered and the panel updates when complete

### Requirement: Responsive layout
The system SHALL use a grid layout that works on laptop screens (1280px+); mobile is not required but layout SHALL not break below 768px.

#### Scenario: Layout at 1280px
- **WHEN** viewport is 1280px wide
- **THEN** life pillars show in a row of 5, todos and chat side by side

### Requirement: Single npm start command
The system SHALL provide a root `package.json` `start` script that boots both the Express backend and the Vite frontend with a single command.

#### Scenario: npm start boots both servers
- **WHEN** user runs `npm start` in the project root
- **THEN** Express starts on port 3001 and Vite starts on port 5173
