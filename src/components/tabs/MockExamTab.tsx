import { useState } from 'react';
import { generateMockExam, categorizeError } from '../../services/aiService';
import { saveError } from '../../services/storageService';
import { LESSON_PLAN } from '../../constants/lessonPlan';
import type { User, Session, UserSettings, MCQQuestion } from '../../types';

interface MockExamTabProps {
  user: User;
  sessions: Session[];
  settings: UserSettings | null;
}

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

type ExamPhase = 'intro' | 'active' | 'results';

function computeQuestionCount(completedCount: number): number {
  // ~4 questions per completed day, capped at 40
  return Math.min(Math.max(completedCount * 4, 10), 40);
}

export default function MockExamTab({ user, sessions, settings }: MockExamTabProps) {
  const completedDays = sessions.filter(s => s.locked).map(s => s.day);
  const completedTopics = LESSON_PLAN
    .filter(t => completedDays.includes(t.day))
    .sort((a, b) => a.day - b.day)
    .map(t => ({ day: t.day, topic: t.topic, part: t.part }));

  const questionCount = computeQuestionCount(completedTopics.length);

  const [phase, setPhase] = useState<ExamPhase>('intro');
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingErrors, setSavingErrors] = useState(false);

  async function startExam() {
    if (!settings?.ai_api_key) {
      setError('No AI API key configured. Go to Settings to add your API key.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const qs = await generateMockExam(
        { provider: settings.ai_provider, apiKey: settings.ai_api_key, model: settings.ai_model },
        completedTopics,
        questionCount
      );
      setQuestions(qs);
      setAnswers({});
      setPhase('active');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate exam questions');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setError('');
    setSavingErrors(true);

    // Categorize and save wrong answers
    if (settings?.ai_api_key) {
      const wrongQs = questions.filter(q => answers[q.id] !== q.correct);
      const dayForQuestion = (q: MCQQuestion) => {
        // Find which completed topic this question most likely belongs to
        // by checking if any topic name appears in the question text
        const match = completedTopics.find(t =>
          q.question.toLowerCase().includes(t.topic.split(' ')[0].toLowerCase())
        );
        return match?.day ?? completedTopics[0]?.day ?? 1;
      };

      await Promise.all(
        wrongQs.map(async q => {
          const userAnswer = answers[q.id];
          const userAnswerText = q.options[userAnswer as keyof typeof q.options] ?? userAnswer;
          const correctAnswerText = q.options[q.correct];
          const day = dayForQuestion(q);
          const topicEntry = completedTopics.find(t => t.day === day) ?? completedTopics[0];

          let category = 'rule_gap';
          try {
            category = await categorizeError(
              { provider: settings.ai_provider, apiKey: settings.ai_api_key, model: settings.ai_model },
              q.question,
              `${userAnswer}: ${userAnswerText}`,
              `${q.correct}: ${correctAnswerText}`,
              q.explanation
            );
          } catch {
            // default to rule_gap
          }

          await saveError(user.id, {
            day,
            topic: topicEntry?.topic ?? 'Mock Exam',
            part: topicEntry?.part ?? 1,
            question: q.question,
            user_answer: `${userAnswer}: ${userAnswerText}`,
            correct_answer: `${q.correct}: ${correctAnswerText}`,
            explanation: q.explanation,
            category: category as 'rule_gap' | 'calculation_error' | 'exception_missed' | 'trap_fallen',
          });
        })
      );
    }

    setSavingErrors(false);
    setPhase('results');
  }

  function retakeExam() {
    setPhase('intro');
    setQuestions([]);
    setAnswers({});
    setError('');
  }

  const score = questions.filter(q => answers[q.id] === q.correct).length;
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-th-text">Mock Exam</h2>
          <p className="text-th-text-muted mt-1">
            Simulated IRS SEE exam across all {completedTopics.length} completed topics.
          </p>
        </div>

        <div className="bg-th-card border border-th-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div>
              <div className="text-2xl font-bold text-th-text">{completedTopics.length}</div>
              <div className="text-xs text-th-text-muted mt-0.5">Topics covered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-th-text">{questionCount}</div>
              <div className="text-xs text-th-text-muted mt-0.5">Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-th-text">70%</div>
              <div className="text-xs text-th-text-muted mt-0.5">Passing score</div>
            </div>
          </div>

          <div className="mb-5">
            <p className="text-xs font-semibold text-th-text-faint uppercase tracking-wider mb-2">Topics included</p>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {completedTopics.map(t => (
                <div key={t.day} className="flex items-center gap-2 text-sm text-th-text-secondary">
                  <span className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />
                  <span>Day {t.day}: {t.topic}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={startExam}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-th-hover disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating {questionCount} questions...
              </span>
            ) : `Start Mock Exam — ${questionCount} Questions`}
          </button>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const passed = pct >= 70;
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-th-text">Mock Exam Results</h2>
        </div>

        <div className={`rounded-xl border p-6 mb-6 text-center ${
          passed
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
        }`}>
          <div className={`text-5xl font-bold mb-1 ${passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {pct}%
          </div>
          <div className={`text-lg font-semibold mb-1 ${passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {passed ? 'Passed' : 'Below passing threshold'}
          </div>
          <div className="text-sm text-th-text-muted">
            {score} correct out of {questions.length} — passing is 70% ({Math.ceil(questions.length * 0.7)})
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {questions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correct;
            return (
              <div
                key={q.id}
                className={`bg-th-card border rounded-xl p-5 ${
                  isCorrect ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCorrect ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-xs text-th-text-faint uppercase tracking-wider mb-1 block">
                      {q.type === 'direct' ? 'Direct Question' :
                       q.type === 'incomplete' ? 'Complete the Sentence' :
                       q.type === 'except' ? 'All EXCEPT' : 'Scenario-Based'}
                    </span>
                    <p className="text-th-text text-sm leading-relaxed">{q.question}</p>
                  </div>
                </div>

                <div className="grid gap-2 ml-10 mb-3">
                  {OPTION_KEYS.map(key => {
                    const isCorrectOption = key === q.correct;
                    const isSelected = userAnswer === key;
                    let style = 'bg-th-input/50 border-th-border-strong text-th-text-faint';
                    if (isCorrectOption) style = 'bg-green-50 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-700 dark:text-green-200';
                    else if (isSelected) style = 'bg-red-50 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-200';

                    return (
                      <div key={key} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${style}`}>
                        <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">{key}</span>
                        <span className="flex-1 leading-snug">{q.options[key]}</span>
                        {isCorrectOption && <span className="ml-auto text-green-600 dark:text-green-400 text-xs flex-shrink-0">Correct</span>}
                        {isSelected && !isCorrectOption && <span className="ml-auto text-red-600 dark:text-red-400 text-xs flex-shrink-0">Your answer</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="ml-10 p-3 bg-th-input/60 rounded-lg border border-th-border-strong">
                  <p className="text-xs font-semibold text-th-text-muted mb-1">Explanation</p>
                  <p className="text-sm text-th-text-secondary leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={retakeExam}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Take Another Mock Exam
        </button>
      </div>
    );
  }

  // ── Active exam ────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-th-text">Mock Exam</h2>
          <p className="text-sm text-th-text-muted mt-0.5">
            {Object.keys(answers).length}/{questions.length} answered
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-th-text-faint">Passing score</div>
          <div className="text-sm font-semibold text-th-text">70%</div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5 mb-6">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          return (
            <div key={q.id} className="bg-th-card border border-th-border rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-th-input flex items-center justify-center text-xs font-bold text-th-text-secondary">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <span className="text-xs text-th-text-faint uppercase tracking-wider mb-1 block">
                    {q.type === 'direct' ? 'Direct Question' :
                     q.type === 'incomplete' ? 'Complete the Sentence' :
                     q.type === 'except' ? 'All EXCEPT' : 'Scenario-Based'}
                  </span>
                  <p className="text-th-text text-sm leading-relaxed">{q.question}</p>
                </div>
              </div>

              <div className="grid gap-2 ml-10">
                {OPTION_KEYS.map(key => {
                  const isSelected = userAnswer === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: key }))}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors text-sm cursor-pointer ${
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-600 text-blue-700 dark:text-blue-200'
                          : 'bg-th-input border-th-border-strong text-th-text-secondary hover:bg-th-hover hover:border-th-border-strong'
                      }`}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                        {key}
                      </span>
                      <span className="flex-1 leading-snug">{q.options[key]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-th-bg border-t border-th-border py-4 flex items-center justify-between">
        <span className="text-sm text-th-text-muted">
          {questions.length - Object.keys(answers).length} questions remaining
        </span>
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length || savingErrors}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-th-hover disabled:cursor-not-allowed text-white font-medium px-8 py-2.5 rounded-lg transition-colors"
        >
          {savingErrors ? 'Scoring...' : 'Submit Exam'}
        </button>
      </div>
    </div>
  );
}
