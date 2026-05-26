## ADDED Requirements

### Requirement: Time window toggle with four options
The system SHALL display a toggle/tab bar with four options: "3 days", "1 week", "2 weeks", "1 month". The selected window controls which notes are loaded for all dashboard sections.

#### Scenario: Default window is 1 week
- **WHEN** the dashboard loads for the first time
- **THEN** the "1 week" option is selected by default

#### Scenario: Switching window reruns analysis
- **WHEN** user selects a different time window
- **THEN** notes are re-fetched, todos re-extracted, debrief regenerated, and all panels update

### Requirement: Selected window persists across page refreshes
The system SHALL store the last-selected time window in `localStorage` so it is restored on next page load.

#### Scenario: Window selection persisted
- **WHEN** user selects "2 weeks" and refreshes the page
- **THEN** "2 weeks" is still selected after reload
