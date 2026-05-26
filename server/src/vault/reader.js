const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const config = require('../config');

function getVaultPath() {
  const vp = config.get('vaultPath');
  if (!vp) throw new Error('Vault path not configured. Open settings to set your Obsidian vault folder.');
  if (!fs.existsSync(vp) || !fs.statSync(vp).isDirectory()) {
    throw new Error(`Vault path "${vp}" does not exist. Open settings to update it.`);
  }
  return vp;
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
  const vaultPath = getVaultPath();
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
  const vaultPath = getVaultPath();
  const start = windowStartDate(windowDays);
  const notes = [];
  let files;
  try { files = fs.readdirSync(vaultPath); } catch { return notes; }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(vaultPath, file);
    const stat = fs.statSync(filePath);
    if (stat.mtime < start) continue;

    if (/^\d{4}-W?\d{2}\.md$/.test(file)) {
      notes.push({ type: 'weekly', ...parseNote(filePath) });
      continue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    if ((raw.includes('## Weekly Goals') || raw.includes('## Goals')) &&
        !/^\d{4}-\d{2}-\d{2}\.md$/.test(file)) {
      notes.push({ type: 'weekly', ...parseNote(filePath) });
    }
  }
  return notes;
}

function getAllNotesInWindow(windowDays) {
  const vaultPath = getVaultPath();
  const start = windowStartDate(windowDays);
  const daily = getDailyNotes(windowDays);
  const weekly = getWeeklyNotes(windowDays);
  const dailyPaths = new Set(daily.map(n => n.filePath));
  const weeklyPaths = new Set(weekly.map(n => n.filePath));
  const other = [];

  let files;
  try { files = fs.readdirSync(vaultPath); } catch { return { daily, weekly, other }; }

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

module.exports = { getDailyNotes, getWeeklyNotes, getAllNotesInWindow };
