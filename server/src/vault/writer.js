const fs = require('fs');
const path = require('path');
const os = require('os');

const vaultPath = process.env.VAULT_PATH;

function atomicWrite(filePath, content) {
  const tmp = path.join(os.tmpdir(), `pa-${Date.now()}-${path.basename(filePath)}`);
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

function toggleTodo(filePath, lineNumber, complete) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const idx = lineNumber - 1;
  if (idx < 0 || idx >= lines.length) throw new Error(`Line ${lineNumber} out of range`);
  if (complete) {
    lines[idx] = lines[idx].replace(/^(\s*)-\s*\[\s*\]/, '$1- [x]');
  } else {
    lines[idx] = lines[idx].replace(/^(\s*)-\s*\[x\]/i, '$1- [ ]');
  }
  atomicWrite(filePath, lines.join('\n'));
}

function deleteTodo(filePath, lineNumber) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const idx = lineNumber - 1;
  if (idx < 0 || idx >= lines.length) throw new Error(`Line ${lineNumber} out of range`);
  lines.splice(idx, 1);
  atomicWrite(filePath, lines.join('\n'));
}

function appendToDaily(text) {
  const today = new Date().toISOString().slice(0, 10);
  const filePath = path.join(vaultPath, `${today}.md`);
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const line = `\n[${time}] ${text}`;
  if (fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, line, 'utf8');
  } else {
    atomicWrite(filePath, `# ${today}${line}`);
  }
  return filePath;
}

module.exports = { atomicWrite, toggleTodo, deleteTodo, appendToDaily };
