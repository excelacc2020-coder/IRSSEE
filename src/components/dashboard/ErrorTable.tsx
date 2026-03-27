import { useState } from 'react';
import type { ErrorRecord, ErrorCategory } from '../../types';

interface ErrorTableProps {
  errors: ErrorRecord[];
}

const CATEGORY_CONFIG: Record<ErrorCategory, { label: string; color: string }> = {
  rule_gap: { label: 'Rule Gap', color: 'bg-red-900/40 text-red-300 border-red-800' },
  calculation_error: { label: 'Calculation Error', color: 'bg-orange-900/40 text-orange-300 border-orange-800' },
  exception_missed: { label: 'Exception Missed', color: 'bg-yellow-900/40 text-yellow-300 border-yellow-800' },
  trap_fallen: { label: 'Trap Fallen', color: 'bg-purple-900/40 text-purple-300 border-purple-800' },
};

const ALL_CATEGORIES: ErrorCategory[] = ['rule_gap', 'calculation_error', 'exception_missed', 'trap_fallen'];

export default function ErrorTable({ errors }: ErrorTableProps) {
  const [filterCategory, setFilterCategory] = useState<ErrorCategory | 'all'>('all');
  const [filterPart, setFilterPart] = useState<1 | 2 | 3 | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = errors.filter(e => {
    const categoryMatch = filterCategory === 'all' || e.category === filterCategory;
    const partMatch = filterPart === 'all' || e.part === filterPart;
    return categoryMatch && partMatch;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              filterCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors border ${
                filterCategory === cat
                  ? `${CATEGORY_CONFIG[cat].color}`
                  : 'bg-gray-800 text-gray-400 hover:text-white border-gray-700'
              }`}
            >
              {CATEGORY_CONFIG[cat].label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(['all', 1, 2, 3] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPart(p)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                filterPart === p ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Parts' : `Part ${p}`}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        Showing {filtered.length} of {errors.length} errors
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
          No errors recorded yet. Complete some MCQ quizzes to see your error patterns.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(err => (
            <div
              key={err.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === err.id ? null : err.id)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-800/50 transition-colors"
              >
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border mt-0.5 ${CATEGORY_CONFIG[err.category].color}`}>
                  {CATEGORY_CONFIG[err.category].label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 line-clamp-2 leading-snug">{err.question}</p>
                  <p className="text-xs text-gray-500 mt-1">Day {err.day} · {err.topic}</p>
                </div>
                <span className="text-gray-600 text-sm flex-shrink-0 mt-0.5">{expanded === err.id ? '▲' : '▼'}</span>
              </button>

              {expanded === err.id && (
                <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3">
                      <p className="text-xs text-red-400 mb-1">Your Answer</p>
                      <p className="text-sm text-gray-300">{err.user_answer}</p>
                    </div>
                    <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
                      <p className="text-xs text-green-400 mb-1">Correct Answer</p>
                      <p className="text-sm text-gray-300">{err.correct_answer}</p>
                    </div>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Explanation</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{err.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
