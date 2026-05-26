## ADDED Requirements

### Requirement: Read daily notes within time window
The system SHALL read all files matching `YYYY-MM-DD.md` whose date falls within the selected time window from the configured vault path.

#### Scenario: Daily notes loaded for last 7 days
- **WHEN** time window is set to "last week"
- **THEN** all `YYYY-MM-DD.md` files dated within the past 7 days are read and returned

#### Scenario: Missing daily note is skipped
- **WHEN** a date in the window has no corresponding `.md` file
- **THEN** that date is silently skipped with no error

### Requirement: Read weekly notes within time window
The system SHALL detect weekly notes by matching filenames like `YYYY-WW.md`, `YYYY-[W]WW.md`, or any file containing a `## Weekly Goals` heading, whose file modification date falls within the window.

#### Scenario: Weekly note detected by filename
- **WHEN** a file named `2025-W22.md` exists and its date falls in window
- **THEN** it is returned as a weekly note

#### Scenario: Weekly note detected by heading
- **WHEN** a file contains `## Weekly Goals` and mtime is in window
- **THEN** it is returned as a weekly note regardless of filename

### Requirement: Vault path validation on startup
The system SHALL validate that `VAULT_PATH` env var is set and points to an existing directory on startup, and SHALL return a descriptive error if not.

#### Scenario: Valid vault path
- **WHEN** `VAULT_PATH` points to an existing directory
- **THEN** server starts normally

#### Scenario: Missing vault path
- **WHEN** `VAULT_PATH` is unset or directory does not exist
- **THEN** server logs a clear error and exits with code 1

### Requirement: Parse frontmatter and body
The system SHALL parse YAML frontmatter (if present) and return both metadata and the raw markdown body for each note.

#### Scenario: Note with frontmatter
- **WHEN** a note starts with `---` YAML block
- **THEN** frontmatter is parsed separately and body is the remaining markdown

#### Scenario: Note without frontmatter
- **WHEN** a note has no `---` block
- **THEN** frontmatter is empty object and full content is the body
