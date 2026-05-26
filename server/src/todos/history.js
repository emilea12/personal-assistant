const fs = require('fs');
const path = require('path');

const historyPath = path.join(__dirname, '../../data/todo-history.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  const dir = path.dirname(historyPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(historyPath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { load, save };
