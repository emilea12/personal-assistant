const express = require('express');
const { getAllNotesInWindow } = require('../vault/reader');
const { appendToDaily } = require('../vault/writer');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const window = parseInt(req.query.window) || 7;
    const notes = getAllNotesInWindow(window);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/append', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const filePath = appendToDaily(text);
    res.json({ success: true, filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
