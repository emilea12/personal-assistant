const express = require('express');
const { getAllNotesInWindow } = require('../vault/reader');
const { extractTodosFromNotes } = require('../todos/extractor');
const { toggleTodo, deleteTodo } = require('../vault/writer');

const router = express.Router();

function getAllNotesList(window) {
  const { daily, weekly, other } = getAllNotesInWindow(window);
  return [...daily, ...weekly, ...other];
}

router.get('/', (req, res) => {
  try {
    const window = parseInt(req.query.window) || 7;
    const notes = getAllNotesList(window);
    const todos = extractTodosFromNotes(notes);
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/toggle', express.json(), (req, res) => {
  try {
    const { filePath, lineNumber, complete } = req.body;
    if (!filePath || lineNumber == null) return res.status(400).json({ error: 'filePath and lineNumber required' });
    toggleTodo(filePath, lineNumber, complete);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', express.json(), (req, res) => {
  try {
    const { filePath, lineNumber } = req.body;
    if (!filePath || lineNumber == null) return res.status(400).json({ error: 'filePath and lineNumber required' });
    deleteTodo(filePath, lineNumber);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
