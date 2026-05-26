const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

function getClient() {
  const key = config.get('anthropicApiKey');
  if (!key) throw new Error('Anthropic API key not configured. Open settings to add it.');
  return new Anthropic({ apiKey: key });
}

function buildNoteContext(notes) {
  const { daily, weekly, other } = notes;
  const all = [...daily, ...weekly, ...other];
  if (all.length === 0) return null;
  return all.map(n => `--- ${n.sourceFile || n.filePath} ---\n${n.content}`).join('\n\n');
}

async function generateDebrief(notes) {
  const noteContext = buildNoteContext(notes);

  if (!noteContext) {
    return {
      summary: 'No notes found in the selected time window.',
      stateOfMind: 'No data',
      activeProjects: [],
      pillars: {
        health:        { score: 0, summary: 'Not mentioned in recent notes.' },
        projects:      { score: 0, summary: 'Not mentioned in recent notes.' },
        relationships: { score: 0, summary: 'Not mentioned in recent notes.' },
        mindset:       { score: 0, summary: 'Not mentioned in recent notes.' },
        spirituality:  { score: 0, summary: 'Not mentioned in recent notes.' },
      },
    };
  }

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are a personal assistant analyzing someone's private journal and notes.
Be warm, insightful, and honest. Return ONLY valid JSON — no markdown, no prose outside the JSON.`,
    messages: [{
      role: 'user',
      content: `Analyze these notes and return a JSON debrief with this exact structure:
{
  "summary": "2-3 sentence overall summary of where this person is at",
  "stateOfMind": "1 sentence on emotional/mental state",
  "activeProjects": ["project1", "project2"],
  "pillars": {
    "health":        { "score": 1-5, "summary": "one sentence" },
    "projects":      { "score": 1-5, "summary": "one sentence" },
    "relationships": { "score": 1-5, "summary": "one sentence" },
    "mindset":       { "score": 1-5, "summary": "one sentence" },
    "spirituality":  { "score": 1-5, "summary": "one sentence" }
  }
}
Score 0 means the pillar wasn't mentioned. Score 1-5 indicates presence and apparent health/engagement.

Notes:
${noteContext}`,
    }],
  });

  const text = response.content[0].text.trim();
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from response
    const match = text.match(/\{[\s\S]+\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse debrief JSON from Claude response');
  }
}

module.exports = { generateDebrief };
