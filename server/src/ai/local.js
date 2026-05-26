const config = require('../config');
const { toggleTodo, deleteTodo, appendToDaily } = require('../vault/writer');

function getLocalConfig() {
  return {
    url: config.get('localApiUrl'),
    model: config.get('localModel'),
  };
}

// ── Tool definitions (OpenAI format) ──────────────────────────────────────

const tools = [
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Mark a todo task as complete or incomplete in the vault file.',
      parameters: {
        type: 'object',
        properties: {
          filePath:   { type: 'string',  description: 'Absolute path to the file' },
          lineNumber: { type: 'number',  description: 'Line number of the task' },
          complete:   { type: 'boolean', description: 'true to mark complete' },
          taskText:   { type: 'string',  description: 'Task text for confirmation' },
        },
        required: ['filePath', 'lineNumber', 'complete'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_task',
      description: 'Delete a todo task line from the vault file.',
      parameters: {
        type: 'object',
        properties: {
          filePath:   { type: 'string', description: 'Absolute path to the file' },
          lineNumber: { type: 'number', description: 'Line number of the task' },
          taskText:   { type: 'string', description: 'Task text for confirmation' },
        },
        required: ['filePath', 'lineNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'append_note',
      description: "Append a line of text to today's daily note.",
      parameters: {
        type: 'object',
        properties: { text: { type: 'string', description: 'Text to append' } },
        required: ['text'],
      },
    },
  },
];

function executeTool(name, input) {
  if (name === 'complete_task') {
    toggleTodo(input.filePath, input.lineNumber, input.complete);
    return { success: true, message: `Task "${input.taskText || ''}" marked ${input.complete ? 'complete' : 'incomplete'}.` };
  }
  if (name === 'delete_task') {
    deleteTodo(input.filePath, input.lineNumber);
    return { success: true, message: `Task "${input.taskText || ''}" deleted.` };
  }
  if (name === 'append_note') {
    const filePath = appendToDaily(input.text);
    return { success: true, message: `Note appended to ${filePath}.` };
  }
  return { success: false, message: `Unknown tool: ${name}` };
}

// ── Debrief ────────────────────────────────────────────────────────────────

async function generateDebriefLocal(noteContext, prompt) {
  const { url, model } = getLocalConfig();
  const res = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a personal assistant analyzing private journal notes. Be warm and insightful. Return ONLY valid JSON.' },
        { role: 'user', content: prompt },
      ],
      stream: false,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Local AI error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Streaming helpers ──────────────────────────────────────────────────────

async function* streamCompletion(url, body) {
  const res = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, stream: true }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Local AI error ${res.status}: ${err.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') return;
      try { yield JSON.parse(raw); } catch { /* ignore */ }
    }
  }
}

// ── Streaming chat ─────────────────────────────────────────────────────────

async function* streamChatLocal(messages, noteContext) {
  const { url, model } = getLocalConfig();

  const systemMsg = { role: 'system', content: `You are a personal assistant with full access to the user's Obsidian vault notes. You already know everything in their recent notes — they do not need to explain context. Be concise, warm, and action-oriented. When the user asks you to complete, delete, or add tasks/notes, use the provided tools. Always confirm what action was taken.\n\nVAULT CONTEXT:\n${noteContext || 'No notes loaded.'}` };

  const history = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content || '' }));

  const requestBody = { model, messages: [systemMsg, ...history], tools };

  // Accumulate tool call chunks across the stream
  const toolAccum = {}; // index → { id, name, arguments }
  let hasToolCalls = false;

  for await (const chunk of streamCompletion(url, requestBody)) {
    const delta = chunk.choices?.[0]?.delta;
    if (!delta) continue;

    if (delta.content) {
      yield { type: 'text', text: delta.content };
    }

    if (delta.tool_calls) {
      hasToolCalls = true;
      for (const tc of delta.tool_calls) {
        if (!toolAccum[tc.index]) {
          toolAccum[tc.index] = { id: tc.id || `tc-${tc.index}`, name: '', arguments: '' };
        }
        if (tc.function?.name)      toolAccum[tc.index].name      += tc.function.name;
        if (tc.function?.arguments) toolAccum[tc.index].arguments += tc.function.arguments;
      }
    }
  }

  if (!hasToolCalls) return;

  // Execute tools and stream the follow-up
  const toolCalls = Object.values(toolAccum);
  const toolResultMessages = [];

  for (const tc of toolCalls) {
    let input = {};
    try { input = JSON.parse(tc.arguments); } catch { /* malformed args */ }
    const result = executeTool(tc.name, input);
    yield { type: 'action', message: result.message };
    toolResultMessages.push({
      role: 'tool',
      tool_call_id: tc.id,
      content: JSON.stringify(result),
    });
  }

  const assistantToolCallMsg = {
    role: 'assistant',
    tool_calls: toolCalls.map(tc => ({
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: tc.arguments },
    })),
  };

  const followUpBody = {
    model,
    messages: [systemMsg, ...history, assistantToolCallMsg, ...toolResultMessages],
  };

  for await (const chunk of streamCompletion(url, followUpBody)) {
    const text = chunk.choices?.[0]?.delta?.content;
    if (text) yield { type: 'text', text };
  }
}

// ── Connectivity test ──────────────────────────────────────────────────────

async function testConnection(apiUrl) {
  const res = await fetch(`${apiUrl}/models`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.data || []).map(m => m.id).filter(Boolean);
}

module.exports = { generateDebriefLocal, streamChatLocal, testConnection };
