const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateDebriefLocal } = require('./local');
const config = require('../config');

const EMPTY_DEBRIEF = {
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

function buildNoteContext(notes) {
  const { daily, weekly, other } = notes;
  const all = [...daily, ...weekly, ...other];
  if (all.length === 0) return null;
  return all.map(n => `--- ${(n.filePath || '').split('/').pop()} ---\n${n.content}`).join('\n\n');
}

function parseDebriefJson(text) {
  const clean = text.trim();
  try { return JSON.parse(clean); } catch { /* fall through */ }
  const match = clean.match(/```(?:json)?\s*([\s\S]+?)```/) || clean.match(/(\{[\s\S]+\})/);
  if (match) return JSON.parse(match[1]);
  throw new Error('Could not parse debrief JSON from AI response');
}

const DEBRIEF_PROMPT = (noteContext) => `Analyze these notes and return a JSON debrief with this exact structure:
{
  "summary": "2-3 sentence overall summary of where this person is at",
  "stateOfMind": "1 sentence on emotional/mental state",
  "activeProjects": ["project1", "project2"],
  "pillars": {
    "health":        { "score": 0-5, "summary": "one sentence" },
    "projects":      { "score": 0-5, "summary": "one sentence" },
    "relationships": { "score": 0-5, "summary": "one sentence" },
    "mindset":       { "score": 0-5, "summary": "one sentence" },
    "spirituality":  { "score": 0-5, "summary": "one sentence" }
  }
}
Score 0 means the pillar wasn't mentioned. Score 1-5 indicates presence and apparent health/engagement.
Return ONLY valid JSON — no markdown fences, no prose outside the JSON.

Notes:
${noteContext}`;

async function generateDebriefAnthropic(noteContext) {
  const key = config.get('anthropicApiKey');
  if (!key) throw new Error('Anthropic API key not configured.');
  const client = new Anthropic({ apiKey: key });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: 'You are a personal assistant analyzing private journal notes. Be warm and insightful.',
    messages: [{ role: 'user', content: DEBRIEF_PROMPT(noteContext) }],
  });
  return parseDebriefJson(response.content[0].text);
}

async function generateDebriefGemini(noteContext) {
  const key = config.get('geminiApiKey');
  if (!key) throw new Error('Gemini API key not configured.');
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: 'You are a personal assistant analyzing private journal notes. Be warm and insightful.',
  });
  const result = await model.generateContent(DEBRIEF_PROMPT(noteContext));
  return parseDebriefJson(result.response.text());
}

async function generateDebrief(notes) {
  const noteContext = buildNoteContext(notes);
  if (!noteContext) return EMPTY_DEBRIEF;
  const provider = config.get('provider');
  if (provider === 'gemini')    return generateDebriefGemini(noteContext);
  if (provider === 'local')     return parseDebriefJson(await generateDebriefLocal(noteContext, DEBRIEF_PROMPT(noteContext)));
  return generateDebriefAnthropic(noteContext);
}

module.exports = { generateDebrief };
