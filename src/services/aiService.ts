import type { AIProvider, MCQSet, MCQQuestion, MorningBriefContent, MindMapContent, AnkiCard, ErrorCategory } from '../types';
import {
  MORNING_BRIEF_PROMPT,
  MIND_MAP_PROMPT,
  MCQ_PROMPT,
  MOCK_EXAM_PROMPT,
  ERROR_CATEGORIZATION_PROMPT,
  ANKI_CARDS_PROMPT,
} from '../constants/prompts';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

// ─── Model routing (Smart Opus Hybrid for Claude) ────────────────────────────

const CLAUDE_OPUS_MODEL = 'claude-opus-4-6';
const CLAUDE_SONNET_MODEL = 'claude-sonnet-4-6';
const CLAUDE_HAIKU_MODEL = 'claude-haiku-4-5-20251001';

type TaskType = 'morningBrief' | 'mindMap' | 'ankiCards' | 'mcq' | 'categorizeError';

function resolveModel(config: AIConfig, task: TaskType): string {
  if (config.provider !== 'claude') return config.model;

  // Smart Opus Hybrid: Opus for complex generation, Sonnet for MCQ (math accuracy), Haiku for simple categorization
  switch (task) {
    case 'morningBrief':
    case 'mindMap':
    case 'ankiCards':
      return CLAUDE_OPUS_MODEL;
    case 'mcq':
      return CLAUDE_SONNET_MODEL; // MCQ needs reliable arithmetic — Haiku makes calculation errors
    case 'categorizeError':
      return CLAUDE_HAIKU_MODEL;
  }
}

// ─── Provider adapters ───────────────────────────────────────────────────────

async function callClaudeModel(apiKey: string, model: string, prompt: string, maxTokens = 4096): Promise<Response> {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
}

async function callClaude(apiKey: string, model: string, prompt: string, maxTokens = 4096): Promise<string> {
  let response = await callClaudeModel(apiKey, model, prompt, maxTokens);

  // Fallback chain on 529 overloaded: Opus → Sonnet → Haiku
  if (response.status === 529 && model === CLAUDE_OPUS_MODEL) {
    response = await callClaudeModel(apiKey, CLAUDE_SONNET_MODEL, prompt, maxTokens);
  }
  if (response.status === 529) {
    response = await callClaudeModel(apiKey, CLAUDE_HAIKU_MODEL, prompt, maxTokens);
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  return data.content[0]?.text ?? '';
}

async function callOpenAICompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  maxTokens = 4096
): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? '';
}

async function callGemini(apiKey: string, model: string, prompt: string, maxTokens = 4096): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates[0]?.content?.parts[0]?.text ?? '';
}

// Token budgets per task — expanded prompts produce much longer structured JSON
const TASK_TOKEN_LIMITS: Record<TaskType, number> = {
  morningBrief: 12288,  // many sections with detailed items + overview
  mindMap:      12288,  // 6-8 decision steps + 5 reference lists
  mcq:          12288,  // 200-300 word scenario + 6 questions with comprehensive explanations
  ankiCards:     8192,  // 8-12 detailed cards
  categorizeError: 1024, // single short JSON object
};

async function callAI(config: AIConfig, task: TaskType, prompt: string): Promise<string> {
  const model = resolveModel(config, task);
  const maxTokens = TASK_TOKEN_LIMITS[task];

  switch (config.provider) {
    case 'claude':
      return callClaude(config.apiKey, model, prompt, maxTokens);
    case 'groq':
      return callOpenAICompat('https://api.groq.com/openai/v1', config.apiKey, model, prompt, maxTokens);
    case 'deepseek':
      return callOpenAICompat('https://api.deepseek.com/v1', config.apiKey, model, prompt, maxTokens);
    case 'gemini':
      return callGemini(config.apiKey, model, prompt, maxTokens);
  }
}

function parseJSON<T>(raw: string): T {
  // Strip markdown code fences if present
  let cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

  // Extract just the JSON structure — handles trailing explanation text from models
  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1) cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  } else if (firstBrace !== -1) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt to repair truncated JSON by closing open brackets/braces
    return JSON.parse(repairTruncatedJSON(cleaned)) as T;
  }
}

/**
 * Attempts to repair JSON truncated mid-output by the AI model.
 * Strips the last incomplete value and closes all open brackets/braces.
 */
function repairTruncatedJSON(json: string): string {
  // Close any unterminated string (odd number of unescaped quotes)
  let quoteCount = 0;
  for (let i = 0; i < json.length; i++) {
    if (json[i] === '"' && (i === 0 || json[i - 1] !== '\\')) quoteCount++;
  }
  let repaired = json;
  if (quoteCount % 2 !== 0) repaired += '"';

  // Remove trailing incomplete key-value pair (truncated mid-string value)
  repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*"[^"]*"?\s*$/, '');
  // Remove trailing incomplete key
  repaired = repaired.replace(/,\s*"[^"]*"\s*$/, '');
  // Remove trailing incomplete number or boolean
  repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*[\d.a-z]+\s*$/, '');
  // Remove trailing incomplete object/array element
  repaired = repaired.replace(/,\s*\{[^}]*$/, '');
  // Remove dangling comma
  repaired = repaired.replace(/,\s*$/, '');

  // Count open brackets/braces and close them
  const opens: string[] = [];
  let inString = false;
  let escape = false;

  for (const ch of repaired) {
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') opens.push('}');
    else if (ch === '[') opens.push(']');
    else if (ch === '}' || ch === ']') opens.pop();
  }

  // Close in reverse order
  return repaired + opens.reverse().join('');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateMorningBrief(
  config: AIConfig,
  topic: string,
  part: number,
  recentErrors: Array<{ question: string; category: string }>
): Promise<MorningBriefContent> {
  const errorContext = recentErrors.length > 0
    ? recentErrors.map(e => `- ${e.category}: ${e.question}`).join('\n')
    : '';

  const prompt = MORNING_BRIEF_PROMPT(topic, part, errorContext);
  const raw = await callAI(config, 'morningBrief', prompt);
  return parseJSON<MorningBriefContent>(raw);
}

export async function generateMindMap(
  config: AIConfig,
  topic: string,
  part: number
): Promise<MindMapContent> {
  const prompt = MIND_MAP_PROMPT(topic, part);
  const raw = await callAI(config, 'mindMap', prompt);
  return parseJSON<MindMapContent>(raw);
}

export async function generateMCQs(
  config: AIConfig,
  topic: string,
  part: number,
  errorCategories: string[],
  coveredTopics: string[] = []
): Promise<MCQSet> {
  const errorContext = errorCategories.length > 0 ? errorCategories.join(', ') : '';
  const prompt = MCQ_PROMPT(topic, part, errorContext, coveredTopics);
  const raw = await callAI(config, 'mcq', prompt);
  return parseJSON<MCQSet>(raw);
}

export async function generateMockExam(
  config: AIConfig,
  completedTopics: { day: number; topic: string; part: number }[],
  questionCount: number
): Promise<MCQQuestion[]> {
  const prompt = MOCK_EXAM_PROMPT(completedTopics, questionCount);
  const raw = await callAI(config, 'mcq', prompt);
  const result = parseJSON<{ questions: MCQQuestion[] }>(raw);
  return result.questions;
}

export async function categorizeError(
  config: AIConfig,
  question: string,
  userAnswer: string,
  correctAnswer: string,
  explanation: string
): Promise<ErrorCategory> {
  const prompt = ERROR_CATEGORIZATION_PROMPT(question, userAnswer, correctAnswer, explanation);
  const raw = await callAI(config, 'categorizeError', prompt);
  const result = parseJSON<{ category: ErrorCategory }>(raw);
  return result.category;
}

export async function generateAnkiCards(
  config: AIConfig,
  topic: string,
  day: number,
  wrongQuestions: string[],
  studyNotes: string
): Promise<Omit<AnkiCard, 'id' | 'user_id' | 'created_at' | 'times_reviewed' | 'last_reviewed_at' | 'status'>[]> {
  const prompt = ANKI_CARDS_PROMPT(topic, wrongQuestions, studyNotes);
  const raw = await callAI(config, 'ankiCards', prompt);
  const cards = parseJSON<Array<{ question: string; answer: string }>>(raw);
  return cards.map(c => ({ ...c, day, topic }));
}

export async function testConnection(config: AIConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await callAI(
      config,
      'categorizeError',
      'Reply with exactly the word: ok'
    );
    return { ok: result.toLowerCase().includes('ok') };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
