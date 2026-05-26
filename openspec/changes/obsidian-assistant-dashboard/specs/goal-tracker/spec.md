## ADDED Requirements

### Requirement: Extract weekly goals from weekly notes
The system SHALL extract the content under a `## Goals` or `## Weekly Goals` heading from weekly notes, treating each list item as a goal.

#### Scenario: Goals section found
- **WHEN** a weekly note contains `## Weekly Goals` with a list below it
- **THEN** each list item is returned as a goal for that week

#### Scenario: No goals section
- **WHEN** a weekly note has no Goals heading
- **THEN** an empty goals array is returned for that week with no error

### Requirement: Infer goal progress from todos and note content
The system SHALL mark a goal as "in progress" if any todo in the window references similar keywords, and "complete" if all related todos are checked off.

#### Scenario: Related todos completed
- **WHEN** a goal is "Finish project proposal" and `- [x] write project proposal` is in todos
- **THEN** that goal is marked as potentially complete

#### Scenario: No related todos
- **WHEN** a goal has no matching todos
- **THEN** its progress is "unknown"

### Requirement: Display goals with progress visualization
The system SHALL display each goal with a visual status indicator (complete / in-progress / unknown) in the dashboard Goals section.

#### Scenario: Goals panel renders
- **WHEN** the dashboard loads and weekly goals are found
- **THEN** each goal is shown with its status badge
