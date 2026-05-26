## ADDED Requirements

### Requirement: Voice input via browser Web Speech API
The system SHALL provide a microphone button in the chat panel and the vault-write shortcut bar that activates browser speech recognition (Web Speech API) to capture spoken input.

#### Scenario: Voice input captured and submitted
- **WHEN** user clicks the microphone button and speaks
- **THEN** the transcript appears in the text input field and can be sent as a chat message or written to vault

#### Scenario: Unsupported browser
- **WHEN** the browser does not support Web Speech API (non-Chromium)
- **THEN** the microphone button is disabled with a tooltip: "Voice input requires Chrome or Edge"

### Requirement: Write voice update to today's daily note
The system SHALL provide a dedicated "Voice Update" button that captures speech and appends the transcript as a timestamped line to today's daily note in the vault.

#### Scenario: Voice update written to vault
- **WHEN** user clicks "Voice Update", speaks, and confirms
- **THEN** a line like `[10:32] <transcript>` is appended to today's `YYYY-MM-DD.md`

#### Scenario: Today's note does not exist
- **WHEN** no daily note exists for today
- **THEN** one is created with the timestamped entry
