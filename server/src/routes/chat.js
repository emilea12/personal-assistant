const express = require('express');
const { getAllNotesInWindow } = require('../vault/reader');
const { streamChat } = require('../ai/chat');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { messages, window: windowDays = 7 } = req.body;
    const notes = getAllNotesInWindow(parseInt(windowDays));
    const { daily, weekly, other } = notes;
    const allNotes = [...daily, ...weekly, ...other];
    const noteContext = allNotes
      .map(n => `--- ${n.filePath.split('/').pop()} ---\n${n.content}`)
      .join('\n\n');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of streamChat(messages, noteContext)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
