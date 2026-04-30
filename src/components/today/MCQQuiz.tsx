import { useState } from 'react';
import { generateMCQs, categorizeError } from '../../services/aiService';
import { saveError, parseQuizQuestions, parseQuizScenario, parseQuizAnswers } from '../../services/storageService';
import { LESSON_PLAN } from '../../constants/lessonPlan';
import type { User, Session, UserSettings, LessonTopic, MCQQuestion } from '../../types';

interface MCQQuizProps {
  user: User;
  topic: LessonTopic;
  session: Session | null;
  settings: UserSettings | null;
  onComplete: (questions: MCQQuestion[], answers: Record<number, string>, score: number, scenario: string) => void;
  onContinue: () => void;
}

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

export default function MCQQuiz({ user, topic, session, settings, onComplete, onContinue }: MCQQuizProps) {
  const existingQuestions = parseQuizQuestions(session?.quiz_questions);
  const existingAnswers = parseQuizAnswers(session?.quiz_answers);
  const existingScenario = parseQuizScenario(session?.quiz_scenario ?? '');
  const alreadySubmitted = existingQuestions.length > 0 && Object.keys(existingAnswers).length > 0;

  const [scenario, setScenario] = useState<string>(existingScenario);
  const [questions, setQuestions] = useState<MCQQuestion[]>(existingQuestions);
  const [answers, setAnswers] = useState<Record<number, string>>(existingAnswers);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewMode, setReviewMode] = useState(alreadySubmitted);

  async function generate() {
    if (!settings?.ai_api_key) {
      setError('No AI API key configured. Go to Settings to add your API key.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build list of topics covered up to and including today
      const coveredTopics = LESSON_PLAN
        .filter(t => t.day <= topic.day)
        .map(t => t.topic);

      const mcqSet = await generateMCQs(
        { provider: settings.ai_provider, apiKey: settings.ai_api_key, model: settings.ai_model },
        topic.topic,
        topic.part,
        [],
        coveredTopics
      );
      setScenario(mcqSet.scenario);
      setQuestions(mcqSet.questions);
      setAnswers({});
      setSubmitted(false);
      setReviewMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    const score = questions.filter(q => answers[q.id] === q.correct).length;

    // Categorize and save wrong answers
    if (settings?.ai_api_key) {
      const wrongQs = questions.filter(q => answers[q.id] !== q.correct);
      await Promise.all(
        wrongQs.map(async q => {
          const userAnswer = answers[q.id];
          const userAnswerText = q.options[userAnswer as keyof typeof q.options] ?? userAnswer;
          const correctAnswerText = q.options[q.correct];

          let category: string = 'rule_gap';
          try {
            category = await categorizeError(
              { provider: settings.ai_provider, apiKey: settings.ai_api_key, model: settings.ai_model },
              q.question,
              `${userAnswer}: ${userAnswerText}`,
              `${q.correct}: ${correctAnswerText}`,
              q.explanation
            );
          } catch {
            // default to rule_gap if categorization fails
          }

          await saveError(user.id, {
            day: topic.day,
            topic: topic.topic,
            part: topic.part,
            question: q.question,
            user_answer: `${userAnswer}: ${userAnswerText}`,
            correct_answer: `${q.correct}: ${correctAnswerText}`,
            explanation: q.explanation,
            category: category as 'rule_gap' | 'calculation_error' | 'exception_missed' | 'trap_fallen',
          });
        })
      );
    }

    setSubmitted(true);
    setReviewMode(true);
    setLoading(false);
    onComplete(questions, answers, score, scenario);
  }

  const score = submitted
    ? questions.filter(q => answers[q.id] === q.correct).length
    : 0;

  // Empty state
  if (questions.length === 0 && !loading) {
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-th-text">MCQ Quiz</h3>
          <p className="text-sm text-th-text-muted mt-1">
            One complex client scenario, 6 questions — all referencing the same real-world situation.
          </p>
        </div>
        <div className="bg-th-card border border-th-border rounded-xl p-6 text-center">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm text-left">
              {error}
            </div>
          )}
          <button
            onClick={generate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Generate Quiz Questions
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-th-card border border-th-border rounded-xl p-8 text-center">
        <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-th-text-muted text-sm">
          {questions.length === 0 ? 'Building client scenario and quiz questions...' : 'Scoring and categorizing errors...'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-th-text">MCQ Quiz</h3>
          <p className="text-sm text-th-text-muted mt-1">{topic.topic}</p>
        </div>
        {submitted && (
          <div className={`text-center px-4 py-2 rounded-lg border flex-shrink-0 ml-4 ${
            score >= 4 ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
          }`}>
            <div className="text-2xl font-bold">{score}/{questions.length}</div>
            <div className="text-xs">{score >= 4 ? 'Passed' : 'Review needed'}</div>
          </div>
        )}
      </div>

      {/* Scenario Card — shown at top, always visible during quiz */}
      {scenario && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
            Client Scenario — All questions refer to this situation
          </div>
          <p className="text-sm text-th-text-secondary leading-relaxed whitespace-pre-wrap">
            {typeof scenario === 'string' ? scenario : JSON.stringify(scenario)}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.correct;

          return (
            <div
              key={q.id}
              className={`bg-th-card border rounded-xl p-5 ${
                submitted
                  ? isCorrect ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'
                  : 'border-th-border'
              }`}
            >
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
                  <p className="text-th-text text-sm leading-relaxed">
                    {typeof q.question === 'string' ? q.question : JSON.stringify(q.question)}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 ml-10">
                {OPTION_KEYS.map(key => {
                  const rawOption = q.options[key];
                  const optionText = typeof rawOption === 'string' ? rawOption : JSON.stringify(rawOption);
                  const isSelected = userAnswer === key;
                  const isCorrectOption = key === q.correct;

                  let optionStyle = 'bg-th-input border-th-border-strong text-th-text-secondary hover:bg-th-hover hover:border-th-border-strong';

                  if (submitted) {
                    if (isCorrectOption) {
                      optionStyle = 'bg-green-50 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-700 dark:text-green-200';
                    } else if (isSelected && !isCorrectOption) {
                      optionStyle = 'bg-red-50 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-200';
                    } else {
                      optionStyle = 'bg-th-input/50 border-th-border-strong text-th-text-faint';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-blue-100 dark:bg-blue-900/40 border-blue-600 text-blue-700 dark:text-blue-200';
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => !submitted && setAnswers(prev => ({ ...prev, [q.id]: key }))}
                      disabled={submitted}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors text-sm ${optionStyle} ${
                        submitted ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                        {key}
                      </span>
                      <span className="flex-1 leading-snug">{optionText}</span>
                      {submitted && isCorrectOption && <span className="ml-auto text-green-600 dark:text-green-400 text-xs flex-shrink-0">Correct</span>}
                      {submitted && isSelected && !isCorrectOption && <span className="ml-auto text-red-600 dark:text-red-400 text-xs flex-shrink-0">Your answer</span>}
                    </button>
                  );
                })}
              </div>

              {submitted && reviewMode && (
                <div className="mt-4 ml-10 p-3 bg-th-input/60 rounded-lg border border-th-border-strong">
                  <p className="text-xs font-semibold text-th-text-muted mb-1">Explanation</p>
                  <p className="text-sm text-th-text-secondary leading-relaxed">
                    {typeof q.explanation === 'string' ? q.explanation : JSON.stringify(q.explanation)}
                  </p>
                  {!isCorrect && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">Wrong answer logged for error pattern analysis.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        {!submitted ? (
          <>
            <span className="text-xs text-th-text-faint">
              {Object.keys(answers).length}/{questions.length} answered
            </span>
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-th-hover disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Submit Quiz
            </button>
          </>
        ) : (
          <>
            <button
              onClick={generate}
              className="text-sm text-th-text-muted hover:text-th-text transition-colors"
            >
              New Scenario
            </button>
            <button
              onClick={onContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Continue to Evening Lock
            </button>
          </>
        )}
      </div>
    </div>
  );
}
