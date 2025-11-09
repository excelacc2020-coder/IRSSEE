export interface Lesson {
  week: number;
  day: number;
  phase: string;
  topic: string;
  description: string;
  references: string;
  part: string;
  sequence: string;
}

export interface LessonProgress extends Lesson {
  status: 'locked' | 'active' | 'passed';
  score: number;
  twistsCompleted: number;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai' | 'system';
  text: string;
  references?: { title: string; uri: string }[];
}

export type AppStatus = 'IDLE' | 'GENERATING' | 'AWAITING_ANSWER' | 'EVALUATING' | 'TOPIC_PASSED' | 'COMPLETED' | 'GENERATING_MOCK_EXAM' | 'MOCK_EXAM_IN_PROGRESS' | 'MOCK_EXAM_COMPLETED';

export interface EvaluationResult {
  totalScore: number;
  scores: {
    rules: number;
    calculations: number;
    compliance: number;
    alternatives: number;
    planning: number;
    clarity: number;
  };
  feedback: {
    good: string[];
    corrections: string[];
    takeaways: string[];
  };
  knowledgePoints: string[];
  detailedExplanation?: string;
}

export interface MockQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  topic: string;
}