import { supabase } from '../lib/supabase';
import type { Session, ErrorRecord, AnkiCard, UserSettings, MCQQuestion, MCQSet, ErrorCategory, AIProvider, CardStatus } from '../types';

// ─── localStorage helpers ───────────────────────────────────────────────────

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function lsSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage quota exceeded — ignore
  }
}

// ─── User Settings ───────────────────────────────────────────────────────────

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const cached = lsGet<UserSettings>(`settings_${userId}`);

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('getUserSettings error:', error);
    return cached;
  }

  if (data) {
    const remote = data as UserSettings;
    // If localStorage has a newer write (e.g. upsert just completed locally but
    // Supabase hasn't persisted yet), prefer the local version to avoid reverting.
    if (cached?.updated_at && remote.updated_at && cached.updated_at > remote.updated_at) {
      return cached;
    }
    lsSet(`settings_${userId}`, remote);
    return remote;
  }
  return cached;
}

export async function upsertUserSettings(
  userId: string,
  settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'updated_at'>>
): Promise<void> {
  const existing = lsGet<UserSettings>(`settings_${userId}`);
  const merged: UserSettings = {
    id: existing?.id ?? userId,
    user_id: userId,
    ai_provider: 'claude',
    ai_api_key: '',
    ai_model: 'claude-opus-4-6',
    current_day: 1,
    ...existing,
    ...settings,
    updated_at: new Date().toISOString(),
  };

  // Always write to localStorage immediately (works offline / dev mode)
  lsSet(`settings_${userId}`, merged);

  const cleanSettings = {
    id: merged.id,
    user_id: merged.user_id,
    ai_provider: merged.ai_provider,
    ai_api_key: merged.ai_api_key,
    ai_model: merged.ai_model,
    current_day: merged.current_day,
    updated_at: merged.updated_at,
  };

  // Await Supabase sync so the DB is updated before the caller triggers a re-fetch
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(cleanSettings, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('upsertUserSettings DB error:', error);
    } else if (data) {
      lsSet(`settings_${userId}`, data);
    }
  } catch (err) {
    console.error('upsertUserSettings network error:', err);
    // localStorage already has the merged data — works offline
  }
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function getSession(userId: string, day: number): Promise<Session | null> {
  const cacheKey = `session_${userId}_${day}`;
  const cached = lsGet<Session>(cacheKey);

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle();

  if (error) {
    console.error('getSession error:', error);
    return cached;
  }

  if (data) {
    lsSet(cacheKey, data);
    return data as Session;
  }
  return cached;
}

export async function upsertSession(
  userId: string,
  day: number,
  updates: Partial<Omit<Session, 'id' | 'user_id' | 'created_at'>>
): Promise<Session | null> {
  const cacheKey = `session_${userId}_${day}`;
  const existing = lsGet<Session>(cacheKey) ?? await getSession(userId, day);

  const merged: Session = {
    id: existing?.id ?? `${userId}_${day}`,
    user_id: userId,
    day,
    topic: '',
    part: 1,
    morning_brief_viewed: false,
    study_notes: '',
    mind_map_generated: false,
    mind_map_content: '',
    quiz_scenario: null,
    quiz_questions: null,
    quiz_answers: null,
    quiz_score: null,
    quiz_passed: false,
    locked: false,
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...existing,
    ...updates,
  };

  // Always write to localStorage immediately
  lsSet(cacheKey, merged);

  // Best-effort Supabase sync
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  const payload: Partial<Session> = {
    user_id: merged.user_id,
    day: merged.day,
    topic: merged.topic,
    part: merged.part,
    morning_brief_viewed: merged.morning_brief_viewed,
    morning_brief_content: merged.morning_brief_content,
    study_notes: merged.study_notes,
    mind_map_generated: merged.mind_map_generated,
    mind_map_content: merged.mind_map_content,
    quiz_scenario: merged.quiz_scenario,
    quiz_questions: merged.quiz_questions,
    quiz_answers: merged.quiz_answers,
    quiz_score: merged.quiz_score,
    quiz_passed: merged.quiz_passed,
    locked: merged.locked,
    created_at: merged.created_at,
    updated_at: merged.updated_at,
  };
  
  if (merged.id && uuidRegex.test(merged.id)) {
    payload.id = merged.id;
  }

  void Promise.resolve(
    supabase
      .from('sessions')
      .upsert(payload, { onConflict: 'user_id,day' })
      .select()
      .single()
  ).then(({ data, error }) => { 
    if (error) console.error('upsertSession DB error:', error, payload);
    if (data) lsSet(cacheKey, data as Session); 
  }).catch((err) => { console.error('upsertSession network error:', err); });

  return merged;
}

export async function getAllSessions(userId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('day', { ascending: true });

  if (!error && data && data.length > 0) {
    // Cache each session in localStorage while we have them
    (data as Session[]).forEach(s => lsSet(`session_${userId}_${s.day}`, s));
    return data as Session[];
  }

  // Fallback: scan localStorage for all sessions (works in dev/offline mode)
  const sessions: Session[] = [];
  const prefix = `session_${userId}_`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      const s = lsGet<Session>(key);
      if (s) sessions.push(s);
    }
  }
  return sessions.sort((a, b) => a.day - b.day);
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export async function saveError(
  userId: string,
  record: Omit<ErrorRecord, 'id' | 'user_id' | 'created_at'>
): Promise<void> {
  const newRecord: ErrorRecord = {
    ...record,
    id: `${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };

  // Always write to localStorage immediately
  const cacheKey = `errors_${userId}`;
  const existing = lsGet<ErrorRecord[]>(cacheKey) ?? [];
  lsSet(cacheKey, [newRecord, ...existing]);

  // Best-effort Supabase sync
  void Promise.resolve(
    supabase.from('errors').insert({ ...record, user_id: userId })
  ).then(({ error }) => {
    if (error) console.error('saveError DB error:', error);
  }).catch((err) => { console.error('saveError network error:', err); });
}

export async function getAllErrors(userId: string): Promise<ErrorRecord[]> {
  const cacheKey = `errors_${userId}`;

  const { data, error } = await supabase
    .from('errors')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!error && data && data.length > 0) {
    const records = data as ErrorRecord[];
    lsSet(cacheKey, records);
    return records;
  }

  // Fallback: localStorage
  return lsGet<ErrorRecord[]>(cacheKey) ?? [];
}

export async function getRecentErrors(userId: string, limit = 5): Promise<ErrorRecord[]> {
  const { data, error } = await supabase
    .from('errors')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as ErrorRecord[];
}

// ─── Anki Cards ───────────────────────────────────────────────────────────────

export async function saveAnkiCards(
  userId: string,
  cards: Omit<AnkiCard, 'id' | 'user_id' | 'created_at' | 'times_reviewed' | 'last_reviewed_at' | 'status'>[]
): Promise<void> {
  const now = new Date().toISOString();
  const newCards: AnkiCard[] = cards.map((c, i) => ({
    ...c,
    id: `${userId}_card_${Date.now()}_${i}`,
    user_id: userId,
    status: 'new' as CardStatus,
    times_reviewed: 0,
    last_reviewed_at: null,
    created_at: now,
  }));

  // Always write to localStorage immediately
  const cacheKey = `cards_${userId}`;
  const existing = lsGet<AnkiCard[]>(cacheKey) ?? [];
  lsSet(cacheKey, [...newCards, ...existing]);

  // Best-effort Supabase sync
  const payload = newCards.map(c => {
    const copy = { ...c };
    delete (copy as any).id; // Let Supabase DB generate valid UUID per schema
    return copy;
  });

  void Promise.resolve(
    supabase.from('anki_cards').insert(payload)
  ).then(({ error }) => {
    if (error) console.error('saveAnkiCards DB error:', error, payload);
  }).catch((err) => { console.error('saveAnkiCards network error:', err); });
}

export async function getAllCards(userId: string): Promise<AnkiCard[]> {
  const cacheKey = `cards_${userId}`;

  const { data, error } = await supabase
    .from('anki_cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!error && data && data.length > 0) {
    const cards = data as AnkiCard[];
    lsSet(cacheKey, cards);
    return cards;
  }

  // Fallback: localStorage
  return lsGet<AnkiCard[]>(cacheKey) ?? [];
}

export async function updateCardStatus(
  cardId: string,
  status: CardStatus
): Promise<void> {
  // Fetch current times_reviewed, then increment it
  const { data: current } = await supabase
    .from('anki_cards')
    .select('times_reviewed')
    .eq('id', cardId)
    .single();

  const { error } = await supabase
    .from('anki_cards')
    .update({
      status,
      times_reviewed: ((current?.times_reviewed as number) ?? 0) + 1,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', cardId);

  if (error) console.error('updateCardStatus:', error);
}

// ─── Quiz helpers ────────────────────────────────────────────────────────────

export function parseQuizQuestions(raw: unknown): MCQQuestion[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as MCQQuestion[];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    // New format: MCQSet with scenario + questions
    if (parsed && typeof parsed === 'object' && 'questions' in parsed) {
      return (parsed as MCQSet).questions;
    }
    if (Array.isArray(parsed)) return parsed as MCQQuestion[];
    return [];
  } catch {
    return [];
  }
}

export function parseQuizScenario(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw;
}

export function parseQuizAnswers(raw: unknown): Record<number, string> {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<number, string>;
  try {
    return JSON.parse(raw as string) as Record<number, string>;
  } catch {
    return {};
  }
}

// ─── Reset ────────────────────────────────────────────────────────────────────

export async function resetAllProgress(userId: string): Promise<void> {
  await Promise.all([
    supabase.from('sessions').delete().eq('user_id', userId),
    supabase.from('errors').delete().eq('user_id', userId),
    supabase.from('anki_cards').delete().eq('user_id', userId),
    supabase.from('user_settings').update({ current_day: 1 }).eq('user_id', userId),
  ]);

  // Clear all localStorage keys for this user
  Object.keys(localStorage)
    .filter(k => k.includes(userId))
    .forEach(k => localStorage.removeItem(k));
}

// ─── Re-exports for convenience ───────────────────────────────────────────────

export type { ErrorCategory, AIProvider };
