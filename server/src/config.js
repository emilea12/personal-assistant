const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/config.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const current = load();
  const merged = { ...current, ...data };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

function get(key) {
  // env vars take precedence for backwards compat
  if (key === 'vaultPath') return process.env.VAULT_PATH || load().vaultPath || '';
  if (key === 'anthropicApiKey') return process.env.ANTHROPIC_API_KEY || load().anthropicApiKey || '';
  return load()[key];
}

module.exports = { load, save, get };
