import { useState, useEffect } from 'react';
import ErrorTable from '../dashboard/ErrorTable';
import TopicHeatMap from '../dashboard/TopicHeatMap';
import { getAllErrors, getAllSessions, getUserSettings } from '../../services/storageService';
import type { User, ErrorRecord, Session } from '../../types';

interface DashboardTabProps {
  user: User;
}

export default function DashboardTab({ user }: DashboardTabProps) {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [activeView, setActiveView] = useState<'errors' | 'heatmap'>('heatmap');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [errs, sess, settings] = await Promise.all([
        getAllErrors(user.id),
        getAllSessions(user.id),
        getUserSettings(user.id),
      ]);
      setErrors(errs);
      setSessions(sess);
      setCurrentDay(settings?.current_day ?? 1);
      setLoading(false);
    }
    load();
  }, [user.id]);

  const errorCounts = errors.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});

  const completedDays = sessions.filter(s => s.locked).length;
  const totalScore = sessions.reduce((sum, s) => sum + (s.quiz_score ?? 0), 0);
  const totalQuestions = sessions.reduce((sum, s) => {
    const qs = s.quiz_questions;
    return sum + (Array.isArray(qs) ? qs.length : 0);
  }, 0);
  const avgPct = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-1">Study analytics and error patterns</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{completedDays}</div>
          <div className="text-xs text-gray-500 mt-1">Days Complete</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{errors.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Errors</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className={`text-3xl font-bold ${avgPct >= 83 ? 'text-green-400' : avgPct >= 67 ? 'text-yellow-400' : 'text-red-400'}`}>
            {avgPct}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Avg Quiz Score</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{50 - currentDay}</div>
          <div className="text-xs text-gray-500 mt-1">Days Remaining</div>
        </div>
      </div>

      {/* Error Category Breakdown */}
      {errors.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { key: 'rule_gap', label: 'Rule Gap', color: 'border-red-800 bg-red-950/20 text-red-300' },
            { key: 'calculation_error', label: 'Calc Error', color: 'border-orange-800 bg-orange-950/20 text-orange-300' },
            { key: 'exception_missed', label: 'Exception', color: 'border-yellow-800 bg-yellow-950/20 text-yellow-300' },
            { key: 'trap_fallen', label: 'Trap', color: 'border-purple-800 bg-purple-950/20 text-purple-300' },
          ].map(({ key, label, color }) => (
            <div key={key} className={`border rounded-xl p-4 text-center ${color}`}>
              <div className="text-2xl font-bold">{errorCounts[key] ?? 0}</div>
              <div className="text-xs opacity-70 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveView('heatmap')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeView === 'heatmap' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Topic Heat Map
        </button>
        <button
          onClick={() => setActiveView('errors')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeView === 'errors' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Error Log
          {errors.length > 0 && (
            <span className="ml-1.5 bg-red-700 text-white text-xs px-1.5 py-0.5 rounded-full">
              {errors.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading...</div>
      ) : activeView === 'heatmap' ? (
        <TopicHeatMap sessions={sessions} currentDay={currentDay} />
      ) : (
        <ErrorTable errors={errors} />
      )}
    </div>
  );
}
