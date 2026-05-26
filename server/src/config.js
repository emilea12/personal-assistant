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
  const merged = { ...load(), ...data };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

function get(key) {
  const stored = load();
  if (key === 'vaultPath')       return process.env.VAULT_PATH        || stored.vaultPath        || '';
  if (key === 'anthropicApiKey') return process.env.ANTHROPIC_API_KEY || stored.anthropicApiKey  || '';
  if (key === 'geminiApiKey')    return process.env.GEMINI_API_KEY    || stored.geminiApiKey     || '';
  if (key === 'provider')        return stored.provider || 'anthropic';
  return stored[key];
}

function getActiveApiKey() {
  const provider = get('provider');
  return provider === 'gemini' ? get('geminiApiKey') : get('anthropicApiKey');
}

module.exports = { load, save, get, getActiveApiKey };
