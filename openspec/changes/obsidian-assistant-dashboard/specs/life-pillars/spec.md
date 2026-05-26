## ADDED Requirements

### Requirement: Display life pillars overview panel
The system SHALL render a dedicated "Life Pillars" section on the dashboard showing all five pillars (Health, Projects, Relationships, Mindset, Spirituality) with their score and summary from the debrief.

#### Scenario: Pillars panel renders with scores
- **WHEN** a debrief has been generated
- **THEN** each pillar card shows its name, signal score as a visual bar/indicator, and one-sentence summary

#### Scenario: Pillars panel shows loading state
- **WHEN** debrief is generating
- **THEN** pillar cards show skeleton loading placeholders

### Requirement: Pillar score visualized as a fill bar
The system SHALL display each pillar's score (1-5) as a horizontal fill bar — low scores in muted tone, high scores in accent color.

#### Scenario: High score renders accent color
- **WHEN** a pillar has score 4 or 5
- **THEN** the fill bar is rendered in the accent color (e.g. green or indigo)

#### Scenario: Low score renders muted color
- **WHEN** a pillar has score 1 or 2
- **THEN** the fill bar is rendered in a muted/gray tone
