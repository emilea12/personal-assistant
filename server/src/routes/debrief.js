const express = require('express');
const { getAllNotesInWindow } = require('../vault/reader');
const { generateDebrief } = require('../ai/debrief');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const window = parseInt(req.body.window) || 7;
    const notes = getAllNotesInWindow(window);
    const debrief = await generateDebrief(notes);
    res.json(debrief);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
