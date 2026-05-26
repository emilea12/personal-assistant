const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  const vaultPath = config.get('vaultPath');
  const apiKey = config.get('anthropicApiKey');
  res.json({
    vaultPath: vaultPath || '',
    hasApiKey: !!apiKey,
    isComplete: !!(vaultPath && apiKey),
  });
});

router.post('/', (req, res) => {
  try {
    const { vaultPath, anthropicApiKey } = req.body;
    const updates = {};

    if (vaultPath !== undefined) {
      if (vaultPath && (!fs.existsSync(vaultPath) || !fs.statSync(vaultPath).isDirectory())) {
        return res.status(400).json({ error: `Path does not exist or is not a directory: ${vaultPath}` });
      }
      updates.vaultPath = vaultPath;
    }

    if (anthropicApiKey !== undefined) {
      if (anthropicApiKey && !anthropicApiKey.startsWith('sk-ant-')) {
        return res.status(400).json({ error: 'Invalid Anthropic API key format (should start with sk-ant-)' });
      }
      updates.anthropicApiKey = anthropicApiKey;
    }

    config.save(updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Directory browser — lists subdirectories at a given path
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
      .map(e => ({
        name: e.name,
        path: path.join(resolved, e.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const parent = path.dirname(resolved);

    res.json({
      current: resolved,
      parent: parent !== resolved ? parent : null,
      dirs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
