const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  const provider = config.get('provider');
  const vaultPath = config.get('vaultPath');
  const hasApiKey = provider === 'gemini'
    ? !!config.get('geminiApiKey')
    : !!config.get('anthropicApiKey');

  res.json({
    vaultPath: vaultPath || '',
    provider,
    hasApiKey,
    isComplete: !!(vaultPath && hasApiKey),
  });
});

router.post('/', (req, res) => {
  try {
    const { vaultPath, anthropicApiKey, geminiApiKey, provider } = req.body;
    const updates = {};

    if (provider !== undefined) {
      if (!['anthropic', 'gemini'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider' });
      }
      updates.provider = provider;
    }

    if (vaultPath !== undefined) {
      if (vaultPath && (!fs.existsSync(vaultPath) || !fs.statSync(vaultPath).isDirectory())) {
        return res.status(400).json({ error: `Path does not exist or is not a directory: ${vaultPath}` });
      }
      updates.vaultPath = vaultPath;
    }

    if (anthropicApiKey !== undefined) {
      if (anthropicApiKey && !anthropicApiKey.startsWith('sk-ant-')) {
        return res.status(400).json({ error: 'Invalid Anthropic API key (should start with sk-ant-)' });
      }
      updates.anthropicApiKey = anthropicApiKey;
    }

    if (geminiApiKey !== undefined) {
      if (geminiApiKey && geminiApiKey.length < 20) {
        return res.status(400).json({ error: 'Invalid Gemini API key' });
      }
      updates.geminiApiKey = geminiApiKey;
    }

    config.save(updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/browse', (req, res) => {
  try {
    const requestedPath = req.query.path || os.homedir();
    const resolved = path.resolve(requestedPath);

    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      return res.status(400).json({ error: 'Path not found' });
    }

    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => ({ name: e.name, path: path.join(resolved, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      current: resolved,
      parent: path.dirname(resolved) !== resolved ? path.dirname(resolved) : null,
      dirs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
