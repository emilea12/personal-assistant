const express = require('express');
const { getAllNotesInWindow } = require('../vault/reader');
const { extractTodosFromNotes } = require('../todos/extractor');
const { extractGoalsFromNotes } = require('../goals/extractor');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const window = parseInt(req.query.window) || 7;
    const { daily, weekly, other } = getAllNotesInWindow(window);
    const allNotes = [...daily, ...weekly, ...other];
    const todos = extractTodosFromNotes(allNotes);
    const goals = extractGoalsFromNotes(weekly, todos);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
