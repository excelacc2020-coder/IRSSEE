export interface User {
  id: string;
  email: string;
}

export interface LessonTopic {
  day: number;
  topic: string;
  part: 1 | 2 | 3;
  week: number;
  irsPublications: string[];
  videoKeywords: string[];
  videoUrl?: string;    // Direct YouTube URL with timestamp from lesson plan
  videoNotes?: string;  // Chapter/timestamp notes
}

export interface Session {
  id: string;
  user_id: string;
  day: number;
  topic: string;
  part: 1 | 2 | 3;
  morning_brief_viewed: boolean;
  morning_brief_content?: string;
  study_notes: string;
  mind_map_generated: boolean;
  mind_map_content: string;
  quiz_scenario: string | null;
  quiz_questions: MCQQuestion[] | null;
  quiz_answers: Record<number, string> | null;
  quiz_score: number | null;
  quiz_passed: boolean;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface MCQQuestion {
  id: number;
  type: 'direct' | 'incomplete' | 'except' | 'scenario';
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface MCQSet {
  scenario: string;
  questions: MCQQuestion[];
}

export type ErrorCategory = 'rule_gap' | 'calculation_error' | 'exception_missed' | 'trap_fallen';

export interface ErrorRecord {
  id: string;
  user_id: string;
  day: number;
  topic: string;
  part: 1 | 2 | 3;
  question: string;
  user_answer: string;
  correct_answer: string;
  explanation: string;
  category: ErrorCategory;
  created_at: string;
}

export type CardStatus = 'new' | 'reviewing' | 'mastered';

export interface AnkiCard {
  id: string;
  user_id: string;
  day: number;
  topic: string;
  question: string;
  answer: string;
  status: CardStatus;
  times_reviewed: number;
  last_reviewed_at: string | null;
  created_at: string;
}

export type AIProvider = 'claude' | 'groq' | 'deepseek' | 'gemini';

export interface UserSettings {
  id: string;
  user_id: string;
  ai_provider: AIProvider;
  ai_api_key: string;
  ai_model: string;
  current_day: number;
  updated_at: string;
}

export interface SubtopicConcept {
  name: string;
  explanation: string;
  phaseContext: string;
}

export interface RulesTableRow {
  subtopic: string;
  keyRule: string;
  thresholdExceptions: string;
  formsCompliance: string;
  nuanceTaxStrategy: string;
}

export interface MorningBriefContent {
  subtopics: SubtopicConcept[];
  rulesTable: RulesTableRow[];
  connections: string;
  examTraps: string;
  errorBridge: string;
}

export interface MindMapFlowNode {
  node: string;      // e.g., "Step 1: Determine Filing Status"
  question: string;  // key decision question at this step
  action: string;    // what to do / rule to apply
}

export interface MindMapContent {
  decisionFlow: MindMapFlowNode[];
  rules: string[];
  exceptions: string[];
  forms: string[];
  calculations: string[];
  traps: string[];
}

export type ActiveTab = 'today' | 'dashboard' | 'cards' | 'settings';
export type TodayPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6;
