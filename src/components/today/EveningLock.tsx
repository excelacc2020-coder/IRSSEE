import { useState } from 'react';
import { generateAnkiCards } from '../../services/aiService';
import { saveAnkiCards, parseQuizQuestions, parseQuizAnswers } from '../../services/storageService';
import type { User, Session, UserSettings, LessonTopic } from '../../types';

interface EveningLockProps {
  user: User;
  topic: LessonTopic;
  session: Session | null;
  settings: UserSettings | null;
  onLock: () => void;
  onUnlock: () => void;
}

export default function EveningLock({ user, topic, session, settings, onLock, onUnlock }: EveningLockProps) {
  const [cardsGenerated, setCardsGenerated] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [loading, setLoading] = useState<'cards' | 'lock' | null>(null);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(session?.locked ?? false);

  const questions = parseQuizQuestions(session?.quiz_questions);
  const answers = parseQuizAnswers(session?.quiz_answers);
  const score = session?.quiz_score ?? 0;
  const total = questions.length;
  const wrongQuestions = questions
    .filter(q => answers[q.id] !== q.correct)
    .map(q => q.question);

  async function handleGenerateCards() {
    if (!settings?.ai_api_key) {
      setError('No AI API key configured. Go to Settings to add your API key.');
      return;
    }

    setLoading('cards');
    setError('');

    try {
      const cards = await generateAnkiCards(
        { provider: settings.ai_provider, apiKey: settings.ai_api_key, model: settings.ai_model },
        topic.topic,
        topic.day,
        wrongQuestions,
        session?.study_notes ?? ''
      );

      await saveAnkiCards(user.id, cards);
      setCardCount(cards.length);
      setCardsGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate Anki cards');
    } finally {
      setLoading(null);
    }
  }

  async function handleLock() {
    setLoading('lock');
    try {
      await onLock();
      setLocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock day');
    } finally {
      setLoading(null);
    }
  }

  if (locked) {
    return (
      <div className="space-y-4">
        <div className="bg-th-card border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
          </div>
          <h3 className="text-xl font-semibold text-th-text mb-2">Day {topic.day} Complete</h3>
          <p className="text-th-text-muted text-sm mb-1">
            {topic.topic} — locked and saved to your study record.
          </p>
          <p className="text-th-text-faint text-xs">
            Score: {questions.length > 0 ? `${score}/${questions.length}` : '—'} &nbsp;·&nbsp; {wrongQuestions.length} error{wrongQuestions.length !== 1 ? 's' : ''} logged
          </p>
        </div>

        <div className="bg-th-card border border-th-border rounded-xl p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-th-text-secondary">Need to reopen this day?</p>
            <p className="text-xs text-th-text-faint mt-1">
              Unlock to regenerate Anki cards, review your answers, or update study notes.
              Your progress to Day {topic.day + 1} is not affected.
            </p>
          </div>
          <button
            onClick={onUnlock}
            className="flex-shrink-0 bg-th-input hover:bg-th-hover border border-th-border-strong text-th-text-secondary hover:text-th-text text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Reopen Day
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-th-text">Evening Lock</h3>
        <p className="text-sm text-th-text-muted mt-1">
          Generate Anki cards from today's weak areas, then lock the day.
        </p>
      </div>

      {/* Day Summary */}
      <div className="bg-th-card border border-th-border rounded-xl p-5 mb-4">
        <h4 className="text-xs font-semibold text-th-text-muted uppercase tracking-wider mb-4">Day Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-th-text">{score}/{total}</div>
            <div className="text-xs text-th-text-faint mt-1">Quiz Score</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${session?.quiz_passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {session?.quiz_passed ? 'Pass' : 'Fail'}
            </div>
            <div className="text-xs text-th-text-faint mt-1">Quiz Result</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-th-text">{wrongQuestions.length}</div>
            <div className="text-xs text-th-text-faint mt-1">Wrong Answers</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${session?.mind_map_generated ? 'text-green-600 dark:text-green-400' : 'text-th-text-faint'}`}>
              {session?.mind_map_generated ? 'Done' : 'Skip'}
            </div>
            <div className="text-xs text-th-text-faint mt-1">Mind Map</div>
          </div>
        </div>
      </div>

      {/* Wrong Questions Review */}
      {wrongQuestions.length > 0 && (
        <div className="bg-th-card border border-th-border rounded-xl p-5 mb-4">
          <h4 className="text-xs font-semibold text-th-text-muted uppercase tracking-wider mb-3">
            Weak Areas ({wrongQuestions.length})
          </h4>
          <ul className="space-y-2">
            {wrongQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-th-text-muted">
                <span className="text-red-500 flex-shrink-0">·</span>
                <span className="leading-snug">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Anki Cards Generation */}
      <div className="bg-th-card border border-th-border rounded-xl p-5 mb-6">
        <h4 className="text-xs font-semibold text-th-text-muted uppercase tracking-wider mb-3">
          Anki Flashcards
        </h4>
        {!cardsGenerated ? (
          <div>
            <p className="text-sm text-th-text-muted mb-4">
              Generate {wrongQuestions.length > 0 ? `${5 + wrongQuestions.length}–10` : '5–8'} targeted flashcards
              based on {wrongQuestions.length > 0 ? 'your wrong answers and ' : ''}today's key concepts.
            </p>
            {error && (
              <div className="mb-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <button
              onClick={handleGenerateCards}
              disabled={loading !== null}
              className="bg-purple-700 hover:bg-purple-600 disabled:bg-th-hover disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading === 'cards' ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : 'Generate Anki Cards'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
            <p className="text-sm text-th-text-secondary">
              {cardCount} flashcards added to your Card Library.
            </p>
          </div>
        )}
      </div>

      {/* Lock Button */}
      <div className="bg-th-card border border-th-border rounded-xl p-5">
        <h4 className="text-xs font-semibold text-th-text-muted uppercase tracking-wider mb-3">
          Lock Day {topic.day}
        </h4>
        <p className="text-sm text-th-text-muted mb-4">
          Locking saves your progress permanently and marks the day complete.
          {!cardsGenerated && ' You can still lock without generating cards.'}
        </p>
        <button
          onClick={handleLock}
          disabled={loading !== null}
          className="bg-green-700 hover:bg-green-600 disabled:bg-th-hover disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          {loading === 'lock' ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Locking...
            </span>
          ) : `Lock Day ${topic.day}`}
        </button>
      </div>
    </div>
  );
}
