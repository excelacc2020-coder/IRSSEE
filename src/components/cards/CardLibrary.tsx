import { useState } from 'react';
import type { AnkiCard, CardStatus } from '../../types';

interface CardLibraryProps {
  cards: AnkiCard[];
  onStartReview: (cards: AnkiCard[]) => void;
}

const STATUS_CONFIG: Record<CardStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-900/40 text-blue-300 border-blue-800' },
  reviewing: { label: 'Reviewing', color: 'bg-yellow-900/40 text-yellow-300 border-yellow-800' },
  mastered: { label: 'Mastered', color: 'bg-green-900/40 text-green-300 border-green-800' },
};

export default function CardLibrary({ cards, onStartReview }: CardLibraryProps) {
  const [filterStatus, setFilterStatus] = useState<CardStatus | 'all'>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [search, setSearch] = useState('');

  const topics = [...new Set(cards.map(c => c.topic))].sort();

  const filtered = cards.filter(c => {
    const statusMatch = filterStatus === 'all' || c.status === filterStatus;
    const topicMatch = filterTopic === 'all' || c.topic === filterTopic;
    const searchMatch = !search ||
      c.question.toLowerCase().includes(search.toLowerCase()) ||
      c.answer.toLowerCase().includes(search.toLowerCase());
    return statusMatch && topicMatch && searchMatch;
  });

  const reviewableCards = cards.filter(c => c.status !== 'mastered');

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['new', 'reviewing', 'mastered'] as CardStatus[]).map(status => (
          <div key={status} className="bg-th-card border border-th-border rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-th-text">
              {cards.filter(c => c.status === status).length}
            </div>
            <div className="text-xs text-th-text-faint mt-1">{STATUS_CONFIG[status].label}</div>
          </div>
        ))}
      </div>

      {/* Review Button */}
      {reviewableCards.length > 0 && (
        <button
          onClick={() => onStartReview(reviewableCards)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl mb-6 transition-colors"
        >
          Review {reviewableCards.length} Card{reviewableCards.length !== 1 ? 's' : ''}
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search cards..."
          className="bg-th-input border border-th-border-strong text-th-text text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 placeholder-th-text-faint w-full sm:w-48"
        />

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as CardStatus | 'all')}
          className="bg-th-input border border-th-border-strong text-th-text-secondary text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          {(['new', 'reviewing', 'mastered'] as CardStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>

        <select
          value={filterTopic}
          onChange={e => setFilterTopic(e.target.value)}
          className="bg-th-input border border-th-border-strong text-th-text-secondary text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Topics</option>
          {topics.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="text-xs text-th-text-faint mb-3">
        Showing {filtered.length} of {cards.length} cards
      </div>

      {/* Card List */}
      {filtered.length === 0 ? (
        <div className="bg-th-card border border-th-border rounded-xl p-8 text-center text-th-text-faint text-sm">
          {cards.length === 0
            ? 'No cards yet. Complete some days to generate Anki cards during the Evening Lock phase.'
            : 'No cards match your filters.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(card => (
            <div key={card.id} className="bg-th-card border border-th-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm text-th-text font-medium leading-snug flex-1">{card.question}</p>
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${STATUS_CONFIG[card.status].color}`}>
                  {STATUS_CONFIG[card.status].label}
                </span>
              </div>
              <p className="text-sm text-th-text-muted leading-relaxed">{card.answer}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-th-text-faint">
                <span>{card.topic}</span>
                <span>·</span>
                <span>Day {card.day}</span>
                <span>·</span>
                <span>Reviewed {card.times_reviewed}×</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
