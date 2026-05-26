## ADDED Requirements

### Requirement: Chat with Claude using vault context pre-loaded
The system SHALL maintain a chat panel where every conversation is initialized with a system prompt containing the full note content from the current time window, so Claude has complete context without the user needing to explain anything.

#### Scenario: Chat opened with vault context
- **WHEN** the user sends their first message
- **THEN** Claude's response reflects awareness of the vault notes without the user providing background

#### Scenario: Context updates on window change
- **WHEN** the user changes the time window and then sends a chat message
- **THEN** the new message is sent with the updated window's note content as context

### Requirement: Chat supports action commands
The system SHALL detect tool calls from Claude for the following actions and execute them: `complete_task`, `delete_task`, `append_note`. Results SHALL be shown inline in the chat as a confirmation message.

#### Scenario: User says "delete that task"
- **WHEN** the user says "delete the task about buying groceries" in chat
- **THEN** Claude calls `delete_task`, the task is removed from the vault file, and chat confirms success

#### Scenario: User says "add a note"
- **WHEN** the user says "add a note: called mom today"
- **THEN** Claude calls `append_note`, the line is appended to today's daily note, and chat confirms

#### Scenario: User says "mark that done"
- **WHEN** the user refers to a task and says to mark it done
- **THEN** Claude calls `complete_task`, the `- [ ]` is flipped to `- [x]` in the vault file, and chat confirms

### Requirement: Chat panel is collapsible
The system SHALL allow the chat panel to be toggled open/closed so it does not consume screen space when not in use.

#### Scenario: Chat panel toggled closed
- **WHEN** user clicks the chat toggle button
- **THEN** the chat panel collapses and other dashboard content expands

### Requirement: Streaming responses
The system SHALL stream Claude's chat responses token-by-token to the browser so the user sees output immediately.

#### Scenario: Long response streams progressively
- **WHEN** Claude generates a long response
- **THEN** text appears incrementally in the chat bubble rather than all at once
