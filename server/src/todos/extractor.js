const fs = require('fs');
const path = require('path');
const historyStore = require('./history');

const TODO_RE = /^(\s*)-\s*\[([ xX])\]\s+(.+)$/;

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractTodosFromNotes(notes) {
  const seen = new Map(); // normalizedText → todo entry
  const history = historyStore.load();
  const today = new Date().toISOString().slice(0, 10);

  for (const note of notes) {
    const lines = note.content.split('\n');
    lines.forEach((line, idx) => {
      const m = TODO_RE.exec(line);
      if (!m) return;
      const complete = m[2].toLowerCase() === 'x';
      const text = m[3].trim();
      const key = normalize(text);

      if (seen.has(key)) return; // keep first occurrence
      seen.set(key, {
        id: Buffer.from(key).toString('base64').slice(0, 16),
        text,
        complete,
        filePath: note.filePath,
        lineNumber: idx + 1,
        sourceFile: path.basename(note.filePath),
      });
    });
  }

  // Merge with history for staleness
  const todos = [];
  const updatedHistory = { ...history };

  for (const [key, todo] of seen) {
    if (!updatedHistory[key]) {
      updatedHistory[key] = today;
    }
    const firstSeen = updatedHistory[key];
    const daysSince = Math.floor((Date.now() - new Date(firstSeen)) / 86400000);
    todos.push({ ...todo, firstSeen, daysSince, stale: !todo.complete && daysSince >= 3 });
  }

  historyStore.save(updatedHistory);
  return todos;
}

module.exports = { extractTodosFromNotes };
