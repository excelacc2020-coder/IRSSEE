import type { AIProvider, MCQSet, MCQQuestion, MorningBriefContent, MindMapContent, AnkiCard, ErrorCategory } from '../types';
import {
  MORNING_BRIEF_PROMPT,
  MIND_MAP_PROMPT,
  MCQ_PROMPT,
  MOCK_EXAM_PROMPT,
  ERROR_CATEGORIZATION_PROMPT,
  ANKI_CARDS_PROMPT,
  STORY_PROMPT,
} from '../constants/prompts';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

// ─── Universal 3-tier model routing ──────────────────────────────────────────

export type TaskTier = 'heavy' | 'reasoning' | 'light';

type TaskType = 'morningBrief' | 'mindMap' | 'ankiCards' | 'mcq' | 'categorizeError' | 'story';

const TASK_TIER: Record<TaskType, TaskTier> = {
  morningBrief:    'heavy',
  mindMap:         'heavy',
  ankiCards:       'heavy',
  story:           'heavy',
  mcq:             'reasoning', // needs arithmetic verification before writing options
  categorizeError: 'light',
};

// Default tier assignments — overwritten by refreshModels() when live model list is fetched
export const PROVIDER_TIERS: Record<AIProvider, Record<TaskTier, string>> = {
  claude: {
    heavy:     'claude-opus-4-6',
    reasoning: 'claude-sonnet-4-6',
    light:     'claude-haiku-4-5-20251001',
  },
  deepseek: {
    // DeepSeek retired deepseek-chat / deepseek-reasoner in favour of the V4
    // family. Every V4 model thinks by default; see DEEPSEEK_* budgets below.
    heavy:     'deepseek-v4-pro',    // best general-purpose model
    reasoning: 'deepseek-v4-pro',    // V4 has no separate reasoner; pro thinks natively
    light:     'deepseek-v4-flash',  // cheaper V4 tier
  },
  groq: {
    heavy:     'llama-3.3-70b-versatile',
    reasoning: 'llama-3.3-70b-versatile', // no dedicated reasoning model yet; same heavy
    light:     'llama3-8b-8192',
  },
  gemini: {
    heavy:     'gemini-2.5-pro',
    reasoning: 'gemini-2.5-flash',   // flash has built-in thinking mode
    light:     'gemini-2.5-flash-lite',
  },
  zai: {
    heavy:     'glm-5.2',
    reasoning: 'glm-5.1',
    light:     'glm-4.5-flash',
  },
};

// Restore any tier overrides persisted by a previous refreshModels() call
(function loadPersistedTiers() {
  for (const p of Object.keys(PROVIDER_TIERS) as AIProvider[]) {
    const stored = localStorage.getItem(`ea_tiers_${p}`);
    if (stored) {
      try { Object.assign(PROVIDER_TIERS[p], JSON.parse(stored) as Record<TaskTier, string>); } catch { /**/ }
    }
  }
})();

// Classify a model ID into a tier by name pattern.
// 'mini' needs word boundaries: without them it matches inside 'gemini',
// which files every Gemini model as light.
function inferModelTier(id: string): TaskTier {
  const s = id.toLowerCase();
  if (/flash|lite|\bmini\b|nano|micro|haiku|instant|\b8b\b|\b3b\b|\b1b\b/.test(s)) return 'light';
  if (/reason|think|\br1\b|\br2\b|qwq|deepthink/.test(s)) return 'reasoning';
  return 'heavy';
}

function resolveModel(config: AIConfig, task: TaskType): string {
  return PROVIDER_TIERS[config.provider][TASK_TIER[task]];
}

// ─── Live model discovery ─────────────────────────────────────────────────────

async function fetchRawModels(provider: AIProvider, apiKey: string): Promise<string[]> {
  try {
    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      });
      if (!res.ok) return [];
      const data = await res.json() as { data: Array<{ id: string }> };
      return data.data.map(m => m.id);
    }

    if (provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (!res.ok) return [];
      const data = await res.json() as {
        models: Array<{ name: string; supportedGenerationMethods?: string[] }>;
      };
      return data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace('models/', ''))
        .filter(id => id.startsWith('gemini'));
    }

    // OpenAI-compatible providers
    const base: Record<string, string> = {
      deepseek: 'https://api.deepseek.com/v1',
      groq:     'https://api.groq.com/openai/v1',
      zai:      'https://api.z.ai/api/paas/v4',
    };
    const res = await fetch(`${base[provider]}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!res.ok) return [];
    const data = await res.json() as { data: Array<{ id: string }> };
    return data.data.map(m => m.id);
  } catch {
    return [];
  }
}

// Model IDs that should not be auto-selected for generating study material:
// experimental or preview snapshots, and models built for another job entirely
// (speech, embeddings, moderation, image). A live list routinely contains these
// alongside the general-purpose models — e.g. deepseek-v4-flash-vision-exp sorts
// ahead of deepseek-v4-flash and would otherwise win the light tier.
const UNSTABLE_MODEL_PATTERN =
  /-exp\b|experimental|preview|\bbeta\b|vision|audio|image|embed|rerank|tts|whisper|guard|moderation/;

function computeTiersFromModels(
  provider: AIProvider,
  models: string[],
): Record<TaskTier, string> {
  const byTier: Record<TaskTier, string[]> = { heavy: [], reasoning: [], light: [] };
  for (const m of models) byTier[inferModelTier(m)].push(m);

  // Newest-looking name first, preferring a stable general-purpose model. Falls
  // back within the tier if a provider offers nothing else there.
  const best = (tier: TaskTier): string | undefined => {
    const ranked = [...byTier[tier]].sort().reverse();
    return ranked.find(m => !UNSTABLE_MODEL_PATTERN.test(m.toLowerCase())) ?? ranked[0];
  };

  const cur = PROVIDER_TIERS[provider];
  return {
    heavy:     best('heavy')     ?? cur.heavy,
    reasoning: best('reasoning') ?? best('heavy') ?? cur.heavy,
    light:     best('light')     ?? best('heavy') ?? cur.heavy,
  };
}

export async function refreshModels(
  provider: AIProvider,
  apiKey: string,
): Promise<{ models: string[]; tiers: Record<TaskTier, string> }> {
  const models = await fetchRawModels(provider, apiKey);
  if (models.length > 0) {
    const tiers = computeTiersFromModels(provider, models);
    Object.assign(PROVIDER_TIERS[provider], tiers);
    localStorage.setItem(`ea_tiers_${provider}`, JSON.stringify(PROVIDER_TIERS[provider]));
  }
  return { models, tiers: { ...PROVIDER_TIERS[provider] } };
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

  // Fallback chain on 529 overloaded: heavy → reasoning → light
  const ct = PROVIDER_TIERS.claude;
  if (response.status === 529 && model === ct.heavy) {
    response = await callClaudeModel(apiKey, ct.reasoning, prompt, maxTokens);
  }
  if (response.status === 529) {
    response = await callClaudeModel(apiKey, ct.light, prompt, maxTokens);
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  return data.content[0]?.text ?? '';
}

// Thrown when a provider returns a well-formed response with no answer text.
// finishReason lets callers distinguish "ran out of budget" (length) from other
// empty replies, so they can retry with different settings instead of failing.
export class EmptyContentError extends Error {
  readonly finishReason?: string;
  constructor(message: string, finishReason?: string) {
    super(message);
    this.name = 'EmptyContentError';
    this.finishReason = finishReason;
  }
}

async function callOpenAICompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  maxTokens = 4096,
  extraBody: Record<string, unknown> = {}
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
      ...extraBody,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string | null }; finish_reason?: string }>;
    usage?: { completion_tokens_details?: { reasoning_tokens?: number } };
  };
  const choice = data.choices?.[0];
  const content = choice?.message?.content ?? '';
  if (!content.trim()) {
    const reason = choice?.finish_reason ? ` (finish_reason: ${choice.finish_reason})` : '';
    const reasoningTokens = data.usage?.completion_tokens_details?.reasoning_tokens;
    const spent = reasoningTokens
      ? ` It used ${reasoningTokens} of its ${maxTokens}-token budget on reasoning before writing anything.`
      : '';
    throw new EmptyContentError(
      `Model "${model}" returned empty content${reason}.${spent} Raise the token budget for this task, or pick a different model in Settings.`,
      choice?.finish_reason
    );
  }
  return content;
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

// Token budgets per task. Kept within Claude Opus's output cap so the same
// values are safe across providers. Reasoning models (e.g. glm-5.2) spend part
// of this budget on hidden reasoning, so the heavier tasks need extra headroom.
const TASK_TOKEN_LIMITS: Record<TaskType, number> = {
  morningBrief: 16384,  // many sections with detailed items + overview
  mindMap:      16384,  // rule scan + multiple decision trees / calc flows
  mcq:          16384,  // 200-300 word scenario + 6 questions with comprehensive explanations
  ankiCards:    12288,  // 8-12 detailed cards
  categorizeError: 1024, // single short JSON object
  story:        24576,  // long narrative + 3 worked MCQs, plus reasoning headroom
};

// ─── DeepSeek V4 thinking budgets ────────────────────────────────────────────
// Every V4 model (pro, flash) thinks by default, and the chain of thought is
// billed inside max_tokens — reasoning_tokens sits within completion_tokens.
// A budget sized for the answer alone therefore gets spent entirely on
// thinking, and the API returns empty content with finish_reason "length".
// Give the thinking its own room on top of the answer budget.
// Docs: https://api-docs.deepseek.com/guides/thinking_mode/
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const DEEPSEEK_REASONING_HEADROOM = 4;      // total budget = answer budget x this
const DEEPSEEK_MAX_OUTPUT_TOKENS = 384_000; // V4 hard ceiling for pro and flash

// Thinking is OFF by default. V4 Pro's chain of thought adds minutes to a
// single Morning Brief refresh, which is too slow for daily study use. The
// widened budgets above stay in place regardless, so that if DeepSeek ever
// ignores this flag the request still has room to finish instead of coming
// back empty. Set to 'enabled' to trade speed for arithmetic checking.
const DEEPSEEK_THINKING: 'enabled' | 'disabled' = 'disabled';

// Used only while DEEPSEEK_THINKING is 'enabled'. DeepSeek defaults
// reasoning_effort to "high", which produces the longest chains; tie effort to
// the task so a one-line classification does not pay for deliberation it has
// no use for. Accepted values: "low" | "high" | "max".
const DEEPSEEK_TASK_EFFORT: Record<TaskType, 'low' | 'high'> = {
  morningBrief:    'high',
  mindMap:         'high',
  ankiCards:       'high',
  story:           'high',
  mcq:             'high', // must verify arithmetic before writing options
  categorizeError: 'low',  // single short JSON object
};

function deepseekBudget(task: TaskType): number {
  return Math.min(
    TASK_TOKEN_LIMITS[task] * DEEPSEEK_REASONING_HEADROOM,
    DEEPSEEK_MAX_OUTPUT_TOKENS
  );
}

async function callDeepSeek(
  apiKey: string,
  model: string,
  prompt: string,
  task: TaskType
): Promise<string> {
  const budget = deepseekBudget(task);
  const thinkingOn = DEEPSEEK_THINKING === 'enabled';
  const body: Record<string, unknown> = { thinking: { type: DEEPSEEK_THINKING } };
  if (thinkingOn) body.reasoning_effort = DEEPSEEK_TASK_EFFORT[task];

  try {
    return await callOpenAICompat(DEEPSEEK_BASE_URL, apiKey, model, prompt, budget, body);
  } catch (err) {
    // The chain of thought outran even the widened budget before producing an
    // answer. Retry once with thinking off so the whole budget goes to output,
    // rather than surfacing a dead end to the user. Pointless when thinking is
    // already off: the same request would fail the same way.
    if (thinkingOn && err instanceof EmptyContentError && err.finishReason === 'length') {
      return callOpenAICompat(DEEPSEEK_BASE_URL, apiKey, model, prompt, budget, {
        thinking: { type: 'disabled' },
      });
    }
    throw err;
  }
}

async function callAI(config: AIConfig, task: TaskType, prompt: string): Promise<string> {
  const model = resolveModel(config, task);
  const maxTokens = TASK_TOKEN_LIMITS[task];

  switch (config.provider) {
    case 'claude':
      return callClaude(config.apiKey, model, prompt, maxTokens);
    case 'groq':
      return callOpenAICompat('https://api.groq.com/openai/v1', config.apiKey, model, prompt, maxTokens);
    case 'deepseek':
      // Budget is task-derived inside callDeepSeek: thinking needs headroom
      // beyond the answer-sized maxTokens used by the other providers.
      return callDeepSeek(config.apiKey, model, prompt, task);
    case 'zai':
      // Z.ai (Zhipu GLM) — OpenAI-compatible chat completions endpoint
      return callOpenAICompat('https://api.z.ai/api/paas/v4', config.apiKey, model, prompt, maxTokens);
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
  part: number,
  morningBrief: string
): Promise<MindMapContent> {
  const briefInput = morningBrief.trim()
    ? morningBrief.trim()
    : `(No Morning Brief was provided. Use your own knowledge of "${topic}" to surface its key gate rules, math-chain rules, and parallel rules.)`;
  const prompt = MIND_MAP_PROMPT(topic, part, briefInput);
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

export async function generateStory(
  config: AIConfig,
  topic: string,
  part: number
): Promise<string> {
  const prompt = STORY_PROMPT(topic, part);
  // Story output is flowing Markdown prose, not JSON — return it as-is.
  const story = await callAI(config, 'story', prompt);
  if (!story.trim()) {
    throw new Error(
      `Model "${config.model}" returned an empty story. Try again, or switch to a different provider/model in Settings.`
    );
  }
  return story;
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
