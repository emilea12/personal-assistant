function extractGoalsFromNotes(weeklyNotes, todos) {
  const goals = [];

  for (const note of weeklyNotes) {
    const lines = note.content.split('\n');
    let inGoals = false;

    for (const line of lines) {
      if (/^##\s+(Weekly\s+)?Goals\s*$/i.test(line)) {
        inGoals = true;
        continue;
      }
      if (inGoals && /^##/.test(line)) break; // next heading ends section
      if (inGoals) {
        const m = /^[-*]\s+(.+)$/.exec(line.trim());
        if (m) {
          const goalText = m[1].trim();
          const progress = inferProgress(goalText, todos);
          goals.push({ text: goalText, progress, sourceFile: note.filePath });
        }
      }
    }
  }

  return goals;
}

function inferProgress(goalText, todos) {
  const goalWords = goalText.toLowerCase().split(/\W+/).filter(w => w.length > 3);

  const related = todos.filter(todo => {
    const todoWords = todo.text.toLowerCase().split(/\W+/);
    return goalWords.some(gw => todoWords.includes(gw));
  });

  if (related.length === 0) return 'unknown';
  if (related.every(t => t.complete)) return 'complete';
  return 'in-progress';
}

module.exports = { extractGoalsFromNotes };
