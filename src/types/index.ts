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
  topic_stories?: Record<string, string>; // section heading -> generated story (markdown)
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

export type AIProvider = 'claude' | 'groq' | 'deepseek' | 'gemini' | 'zai';

export interface UserSettings {
  id: string;
  user_id: string;
  ai_provider: AIProvider;
  ai_api_key: string;
  ai_model: string;
  current_day: number;
  updated_at: string;
}

export interface BriefSectionItem {
  label: string;
  rule: string | string[];
  threshold: string | string[];
  form: string | string[];
  tip: string | string[];
}

export interface BriefSection {
  heading: string;
  items: BriefSectionItem[];
}

export interface MorningBriefContent {
  overview: string;
  sections: BriefSection[];
  connections: string;
  examTraps: string;
  errorBridge: string;
}

// ─── Mind Map: Rule Anatomy → Decision Tree / Calculation Flow / Comparison Grid ──

export type RuleType = 'gate' | 'mathChain' | 'parallel';

export interface ScannedRule {
  rule: string;      // short rule label
  numbers: string;   // exact numbers/thresholds attached to it ("" if none)
}

export interface RuleAnatomyScan {
  gateRules: ScannedRule[];
  mathChainRules: ScannedRule[];
  parallelRules: ScannedRule[];
  outputPlan: string[]; // any of "Decision Tree" | "Calculation Flow" | "Comparison Grid"
}

export interface DecisionGate {
  question: string;     // yes/no check, short phrase (< 8 words)
  failOutcome: string;  // consequence box on "No"
}

export interface TiebreakerBranch {
  fromGate: number;     // 1-based gate index this branches from
  rules: string[];      // ordered tiebreaker rules
}

export interface DecisionTree {
  title?: string;                 // the credit/status/test this tree resolves
  start: string;                  // what is being tested
  gates: DecisionGate[];
  success: string;                // success outcome with dollar amount
  tiebreakers?: TiebreakerBranch[];
}

export interface CalcStep {
  label: string;        // what you calculate
  formula: string;      // exact formula with all numbers
  result: string;       // what this produces
  decision?: {          // optional branch that fires after this step
    condition: string;  // condition with threshold
    yes: string;        // path when condition is true
    no: string;         // path when condition is false
  };
}

export interface CalculationFlow {
  title?: string;       // the credit/amount this flow computes
  steps: CalcStep[];
  final: string;        // end result + form/line reference
}

export interface ComparisonGrid {
  columns: string[];                              // related credits/rules being compared
  rows: { dimension: string; values: string[] }[]; // values aligned to columns
}

export interface MindMapContent {
  scan: RuleAnatomyScan;
  decisionTrees?: DecisionTree[];   // one tree per distinct gated process
  calculationFlows?: CalculationFlow[]; // one flow per distinct calculation
  comparisonGrid?: ComparisonGrid;
  // Legacy single-object fields (pre-array maps) — normalized on read.
  decisionTree?: DecisionTree;
  calculationFlow?: CalculationFlow;
}

export type ActiveTab = 'today' | 'dashboard' | 'cards' | 'mock-exam' | 'settings';

export interface MockExamSet {
  questions: MCQQuestion[];
}
export type TodayPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6;
