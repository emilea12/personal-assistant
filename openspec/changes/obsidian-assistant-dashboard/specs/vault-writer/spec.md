## ADDED Requirements

### Requirement: Toggle todo completion in vault file
The system SHALL find the exact line of a todo in its source file and flip `- [ ]` to `- [x]` (or reverse) using atomic write (temp file + rename).

#### Scenario: Todo marked complete
- **WHEN** user checks a todo in the dashboard
- **THEN** the source `.md` file is updated with `- [x]` and the dashboard reflects the change

#### Scenario: Todo unchecked
- **WHEN** user unchecks a completed todo
- **THEN** the source `.md` file reverts to `- [ ]`

### Requirement: Delete a todo from vault file
The system SHALL remove the exact line of a todo from its source file when the user triggers a delete action.

#### Scenario: Todo deleted
- **WHEN** user clicks delete on a todo
- **THEN** the line is removed from the source file and the todo disappears from the dashboard list

### Requirement: Append a line to a daily note
The system SHALL append a given text as a new line to today's daily note, creating the file if it does not exist.

#### Scenario: Append to existing daily note
- **WHEN** `append_note` is called with text content
- **THEN** the text is added as a new line at the end of today's `YYYY-MM-DD.md`

#### Scenario: Create daily note if missing
- **WHEN** today's daily note does not exist
- **THEN** the file is created and the text is written as its first line

### Requirement: Atomic file writes
The system SHALL write all vault file mutations via a temp-file-then-rename pattern to prevent partial writes from corrupting notes.

#### Scenario: Write completes atomically
- **WHEN** any vault write operation is performed
- **THEN** the file is never left in a partially-written state
