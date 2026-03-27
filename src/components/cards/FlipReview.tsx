import { useState } from 'react';
import { updateCardStatus } from '../../services/storageService';
import type { AnkiCard } from '../../types';

interface FlipReviewProps {
  cards: AnkiCard[];
  onExit: (updatedIds: string[]) => void;
}

export default function FlipReview({ cards, onExit }: FlipReviewProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [updatedIds, setUpdatedIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [gotItCount, setGotItCount] = useState(0);

  const card = cards[index];

  async function handleResponse(gotIt: boolean) {
    const newStatus = gotIt ? 'mastered' : 'reviewing';
    await updateCardStatus(card.id, newStatus);
    setUpdatedIds(prev => [...prev, card.id]);
    if (gotIt) setGotItCount(c => c + 1);

    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex(i => i + 1);
      setFlipped(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-blue-400 text-3xl">✓</span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Session Complete</h3>
        <p className="text-gray-400 text-sm mb-1">
          Reviewed {cards.length} card{cards.length !== 1 ? 's' : ''}
        </p>
        <p className="text-gray-400 text-sm mb-6">
          {gotItCount} mastered · {cards.length - gotItCount} still reviewing
        </p>
        <button
          onClick={() => onExit(updatedIds)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-400">{index + 1} / {cards.length}</span>
        <div className="flex-1 mx-4 bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all"
            style={{ width: `${((index) / cards.length) * 100}%` }}
          />
        </div>
        <button
          onClick={() => onExit(updatedIds)}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          Exit
        </button>
      </div>

      {/* Card */}
      <div
        className="flip-card w-full cursor-pointer select-none"
        style={{ minHeight: '260px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`flip-card-inner w-full ${flipped ? 'flipped' : ''}`} style={{ minHeight: '260px' }}>
          {/* Front */}
          <div className="flip-card-front bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col justify-center items-center text-center w-full" style={{ minHeight: '260px' }}>
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-4">Question</p>
            <p className="text-white text-lg font-medium leading-relaxed">{card.question}</p>
            <p className="text-xs text-gray-600 mt-6">Click to reveal answer</p>
          </div>

          {/* Back */}
          <div className="flip-card-back bg-gray-900 border border-blue-800 rounded-2xl p-8 flex flex-col justify-center items-center text-center" style={{ minHeight: '260px' }}>
            <p className="text-xs text-green-400 uppercase tracking-wider mb-4">Answer</p>
            <p className="text-gray-200 text-base leading-relaxed">{card.answer}</p>
            <p className="text-xs text-gray-600 mt-4">{card.topic} · Day {card.day}</p>
          </div>
        </div>
      </div>

      {/* Response Buttons */}
      {flipped && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleResponse(false)}
            className="flex-1 bg-red-900/30 hover:bg-red-900/60 border border-red-800 text-red-300 font-medium py-3 rounded-xl transition-colors"
          >
            Review Again
          </button>
          <button
            onClick={() => handleResponse(true)}
            className="flex-1 bg-green-900/30 hover:bg-green-900/60 border border-green-800 text-green-300 font-medium py-3 rounded-xl transition-colors"
          >
            Got It
          </button>
        </div>
      )}

      {!flipped && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">Click the card to reveal the answer</p>
        </div>
      )}
    </div>
  );
}
