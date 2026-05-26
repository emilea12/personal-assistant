const Anthropic = require('@anthropic-ai/sdk');
const { toggleTodo, deleteTodo, appendToDaily } = require('../vault/writer');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const tools = [
  {
    name: 'complete_task',
    description: 'Mark a todo task as complete or incomplete in the vault file.',
    input_schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Absolute path to the file containing the task' },
        lineNumber: { type: 'number', description: 'Line number of the task in the file' },
        complete: { type: 'boolean', description: 'true to mark complete, false to unmark' },
        taskText: { type: 'string', description: 'The task text for confirmation' },
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
        filePath: { type: 'string', description: 'Absolute path to the file containing the task' },
        lineNumber: { type: 'number', description: 'Line number of the task in the file' },
        taskText: { type: 'string', description: 'The task text for confirmation' },
      },
      required: ['filePath', 'lineNumber'],
    },
  },
  {
    name: 'append_note',
    description: "Append a line of text to today's daily note in the vault.",
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The text to append' },
      },
      required: ['text'],
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

async function* streamChat(messages, noteContext) {
  const systemPrompt = `You are a personal assistant with full access to the user's Obsidian vault notes.
You already know everything in their recent notes — they do not need to explain context.
Be concise, warm, and action-oriented.
When the user asks you to complete, delete, or add tasks/notes, use the provided tools to do it directly.
Always confirm what action was taken.

VAULT CONTEXT:
${noteContext || 'No notes loaded for the current time window.'}`;

  let currentMessages = [...messages];

  while (true) {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: currentMessages,
    });

    let toolUseBlocks = [];
    let currentToolUse = null;
    let inputAccumulator = '';

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          currentToolUse = { id: event.content_block.id, name: event.content_block.name };
          inputAccumulator = '';
        } else if (event.content_block.type === 'text') {
          yield { type: 'text_start' };
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'text', text: event.delta.text };
        } else if (event.delta.type === 'input_json_delta') {
          inputAccumulator += event.delta.partial_json;
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolUse) {
          try {
            currentToolUse.input = JSON.parse(inputAccumulator);
          } catch {
            currentToolUse.input = {};
          }
          toolUseBlocks.push(currentToolUse);
          currentToolUse = null;
          inputAccumulator = '';
        }
      } else if (event.type === 'message_stop') {
        break;
      }
    }

    const finalMessage = await stream.finalMessage();

    if (finalMessage.stop_reason === 'tool_use' && toolUseBlocks.length > 0) {
      currentMessages.push({ role: 'assistant', content: finalMessage.content });

      const toolResults = [];
      for (const tool of toolUseBlocks) {
        const result = executeTool(tool.name, tool.input);
        yield { type: 'action', message: result.message };
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: JSON.stringify(result),
        });
      }
      currentMessages.push({ role: 'user', content: toolResults });
    } else {
      break;
    }
  }
}

module.exports = { streamChat };
