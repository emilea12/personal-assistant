const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { toggleTodo, deleteTodo, appendToDaily } = require('../vault/writer');
const config = require('../config');

// ── Shared tool definitions ────────────────────────────────────────────────

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

function buildSystemPrompt(noteContext) {
  return `You are a personal assistant with full access to the user's Obsidian vault notes.
You already know everything in their recent notes — they do not need to explain context.
Be concise, warm, and action-oriented.
When the user asks you to complete, delete, or add tasks/notes, use the provided tools to do it directly.
Always confirm what action was taken.

VAULT CONTEXT:
${noteContext || 'No notes loaded for the current time window.'}`;
}

// ── Anthropic streaming chat ───────────────────────────────────────────────

const anthropicTools = [
  {
    name: 'complete_task',
    description: 'Mark a todo task as complete or incomplete in the vault file.',
    input_schema: {
      type: 'object',
      properties: {
        filePath:   { type: 'string', description: 'Absolute path to the file' },
        lineNumber: { type: 'number', description: 'Line number of the task' },
        complete:   { type: 'boolean', description: 'true to mark complete, false to unmark' },
        taskText:   { type: 'string', description: 'Task text for confirmation' },
      },
      required: ['filePath', 'lineNumber', 'complete'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a todo task line from the vault file.',
    input_schema: {
      type: 'object',
      properties: {
        filePath:   { type: 'string', description: 'Absolute path to the file' },
        lineNumber: { type: 'number', description: 'Line number of the task' },
        taskText:   { type: 'string', description: 'Task text for confirmation' },
      },
      required: ['filePath', 'lineNumber'],
    },
  },
  {
    name: 'append_note',
    description: "Append a line of text to today's daily note.",
    input_schema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'Text to append' } },
      required: ['text'],
    },
  },
];

async function* streamChatAnthropic(messages, noteContext) {
  const key = config.get('anthropicApiKey');
  if (!key) throw new Error('Anthropic API key not configured.');
  const client = new Anthropic({ apiKey: key });
  let currentMessages = [...messages];

  while (true) {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystemPrompt(noteContext),
      tools: anthropicTools,
      messages: currentMessages,
    });

    let toolUseBlocks = [];
    let currentTool = null;
    let inputBuf = '';

    for await (const event of stream) {
      if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        currentTool = { id: event.content_block.id, name: event.content_block.name };
        inputBuf = '';
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'text', text: event.delta.text };
        } else if (event.delta.type === 'input_json_delta') {
          inputBuf += event.delta.partial_json;
        }
      } else if (event.type === 'content_block_stop' && currentTool) {
        try { currentTool.input = JSON.parse(inputBuf); } catch { currentTool.input = {}; }
        toolUseBlocks.push(currentTool);
        currentTool = null;
        inputBuf = '';
      }
    }

    const finalMessage = await stream.finalMessage();

    if (finalMessage.stop_reason === 'tool_use' && toolUseBlocks.length > 0) {
      currentMessages.push({ role: 'assistant', content: finalMessage.content });
      const toolResults = [];
      for (const tool of toolUseBlocks) {
        const result = executeTool(tool.name, tool.input);
        yield { type: 'action', message: result.message };
        toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: JSON.stringify(result) });
      }
      currentMessages.push({ role: 'user', content: toolResults });
    } else {
      break;
    }
  }
}

// ── Gemini streaming chat ──────────────────────────────────────────────────

const geminiFunctionDeclarations = [
  {
    name: 'complete_task',
    description: 'Mark a todo task as complete or incomplete in the vault file.',
    parameters: {
      type: 'OBJECT',
      properties: {
        filePath:   { type: 'STRING', description: 'Absolute path to the file' },
        lineNumber: { type: 'NUMBER', description: 'Line number of the task' },
        complete:   { type: 'BOOLEAN', description: 'true to mark complete' },
        taskText:   { type: 'STRING', description: 'Task text for confirmation' },
      },
      required: ['filePath', 'lineNumber', 'complete'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a todo task line from the vault file.',
    parameters: {
      type: 'OBJECT',
      properties: {
        filePath:   { type: 'STRING', description: 'Absolute path to the file' },
        lineNumber: { type: 'NUMBER', description: 'Line number of the task' },
        taskText:   { type: 'STRING', description: 'Task text for confirmation' },
      },
      required: ['filePath', 'lineNumber'],
    },
  },
  {
    name: 'append_note',
    description: "Append text to today's daily note.",
    parameters: {
      type: 'OBJECT',
      properties: { text: { type: 'STRING', description: 'Text to append' } },
      required: ['text'],
    },
  },
];

async function* streamChatGemini(messages, noteContext) {
  const key = config.get('geminiApiKey');
  if (!key) throw new Error('Gemini API key not configured.');

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: buildSystemPrompt(noteContext),
    tools: [{ functionDeclarations: geminiFunctionDeclarations }],
  });

  // Convert message history to Gemini format (skip 'action' role messages)
  const geminiHistory = messages.slice(0, -1)
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

  const lastUserMessage = messages[messages.length - 1].content;
  const chat = model.startChat({ history: geminiHistory });

  // First turn — stream the response
  const result = await chat.sendMessageStream(lastUserMessage);

  for await (const chunk of result.stream) {
    try {
      const text = chunk.text();
      if (text) yield { type: 'text', text };
    } catch { /* chunk may be a function call, not text */ }
  }

  const response = await result.response;
  const functionCalls = response.functionCalls();

  if (functionCalls && functionCalls.length > 0) {
    const functionResponses = [];
    for (const fc of functionCalls) {
      const toolResult = executeTool(fc.name, fc.args);
      yield { type: 'action', message: toolResult.message };
      functionResponses.push({
        functionResponse: { name: fc.name, response: toolResult },
      });
    }

    // Send results back and stream the follow-up
    const result2 = await chat.sendMessageStream(functionResponses);
    for await (const chunk of result2.stream) {
      try {
        const text = chunk.text();
        if (text) yield { type: 'text', text };
      } catch { /* ignore */ }
    }
  }
}

// ── Public interface ───────────────────────────────────────────────────────

async function* streamChat(messages, noteContext) {
  const provider = config.get('provider');
  const gen = provider === 'gemini'
    ? streamChatGemini(messages, noteContext)
    : streamChatAnthropic(messages, noteContext);
  for await (const chunk of gen) yield chunk;
}

module.exports = { streamChat };
