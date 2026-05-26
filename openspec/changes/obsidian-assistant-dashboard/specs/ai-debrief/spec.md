## ADDED Requirements

### Requirement: Generate daily debrief via Claude
The system SHALL call Claude (claude-sonnet-4-6) with all note content from the current window and return a structured debrief containing: overall summary, state of mind, active projects, and per-pillar summaries.

#### Scenario: Debrief generated successfully
- **WHEN** notes exist in the time window and Anthropic API key is valid
- **THEN** a structured debrief JSON is returned with all required fields populated

#### Scenario: No notes in window
- **WHEN** the selected time window contains no notes
- **THEN** a debrief is returned with a message indicating no notes were found

### Requirement: Debrief auto-runs on page load
The system SHALL automatically trigger debrief generation when the dashboard first loads, showing a loading state during generation.

#### Scenario: Page load triggers debrief
- **WHEN** the dashboard is opened in the browser
- **THEN** a loading spinner is shown and debrief generation begins immediately

#### Scenario: Debrief reruns on window change
- **WHEN** the user changes the time window toggle
- **THEN** the debrief regenerates based on the new window's notes

### Requirement: Debrief includes life pillar analysis
The system SHALL instruct Claude to assess and return a structured summary for each life pillar: Health, Projects, Relationships, Mindset, Spirituality — with a 1-5 signal strength score and a 1-sentence summary per pillar.

#### Scenario: All pillars present in response
- **WHEN** notes mention multiple life areas
- **THEN** each pillar returns a score and summary in the debrief JSON

#### Scenario: Pillar not mentioned in notes
- **WHEN** notes contain no content related to a pillar
- **THEN** that pillar returns score 0 and summary "Not mentioned in recent notes"
