## ADDED Requirements

### Requirement: Extract todos from notes
The system SHALL extract all markdown checkboxes (`- [ ] task` and `- [x] task`) from every note in the current window, recording the source file path and line number.

#### Scenario: Uncompleted todos extracted
- **WHEN** a note contains `- [ ] Buy groceries`
- **THEN** it appears in the todo list as incomplete with source file reference

#### Scenario: Completed todos extracted
- **WHEN** a note contains `- [x] Call dentist`
- **THEN** it appears in the todo list as complete

### Requirement: Track first-seen date per todo
The system SHALL persist a `todo-history.json` file (gitignored) that records the first date each unique todo text was seen across runs.

#### Scenario: New todo recorded
- **WHEN** a todo text appears for the first time
- **THEN** today's date is written as its first-seen date in `todo-history.json`

#### Scenario: Existing todo preserves first-seen date
- **WHEN** a todo text has been seen before
- **THEN** its original first-seen date is preserved across re-runs

### Requirement: Flag stale todos
The system SHALL flag any incomplete todo as stale if it has appeared for 3 or more days without being completed.

#### Scenario: Stale todo flagged
- **WHEN** an incomplete todo's first-seen date is 3+ days ago
- **THEN** it is returned with `stale: true`

#### Scenario: Fresh todo not flagged
- **WHEN** an incomplete todo was first seen today or yesterday
- **THEN** it is returned with `stale: false`

### Requirement: Normalize todo text for deduplication
The system SHALL deduplicate todos by normalizing whitespace and lowercasing the text when matching across files.

#### Scenario: Same task in multiple files
- **WHEN** `- [ ] Review pull request` appears in two different daily notes
- **THEN** only one entry appears in the todo list (most recent file wins for source)
