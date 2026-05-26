const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const vaultPath = process.env.VAULT_PATH;

function validateVault() {
  if (!vaultPath) {
    console.error('ERROR: VAULT_PATH environment variable is not set.');
    console.error('Copy .env.example to .env and set your vault path.');
    process.exit(1);
  }
  if (!fs.existsSync(vaultPath) || !fs.statSync(vaultPath).isDirectory()) {
    console.error(`ERROR: VAULT_PATH "${vaultPath}" does not exist or is not a directory.`);
    process.exit(1);
  }
}

function windowStartDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseNote(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data: frontmatter, content } = matter(raw);
  return { filePath, frontmatter, content, raw };
}

function getDailyNotes(windowDays) {
  const start = windowStartDate(windowDays);
  const notes = [];

  for (let i = 0; i <= windowDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const filePath = path.join(vaultPath, `${dateStr}.md`);
    if (fs.existsSync(filePath)) {
      notes.push({ type: 'daily', date: dateStr, ...parseNote(filePath) });
    }
  }
  return notes;
}

function getWeeklyNotes(windowDays) {
  const start = windowStartDate(windowDays);
  const notes = [];
  let files;
  try {
    files = fs.readdirSync(vaultPath);
  } catch {
    return notes;
  }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(vaultPath, file);
    const stat = fs.statSync(filePath);
    if (stat.mtime < start) continue;

    // Match YYYY-WW.md or YYYY-WWW.md patterns
    if (/^\d{4}-W?\d{2}\.md$/.test(file)) {
      notes.push({ type: 'weekly', ...parseNote(filePath) });
      continue;
    }

    // Detect by heading
    const raw = fs.readFileSync(filePath, 'utf8');
    if (raw.includes('## Weekly Goals') || raw.includes('## Goals')) {
      // Avoid double-adding daily notes
      if (!/^\d{4}-\d{2}-\d{2}\.md$/.test(file)) {
        notes.push({ type: 'weekly', ...parseNote(filePath) });
      }
    }
  }
  return notes;
}

function getAllNotesInWindow(windowDays) {
  const start = windowStartDate(windowDays);
  const daily = getDailyNotes(windowDays);
  const weekly = getWeeklyNotes(windowDays);
  const dailyPaths = new Set(daily.map(n => n.filePath));
  const weeklyPaths = new Set(weekly.map(n => n.filePath));

  const other = [];
  let files;
  try {
    files = fs.readdirSync(vaultPath);
  } catch {
    return { daily, weekly, other };
  }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(vaultPath, file);
    if (dailyPaths.has(filePath) || weeklyPaths.has(filePath)) continue;
    const stat = fs.statSync(filePath);
    if (stat.mtime >= start) {
      other.push({ type: 'note', ...parseNote(filePath) });
    }
  }

  return { daily, weekly, other };
}

module.exports = { validateVault, getDailyNotes, getWeeklyNotes, getAllNotesInWindow };
