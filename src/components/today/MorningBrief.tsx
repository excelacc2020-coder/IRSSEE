import { useState } from 'react';
import { generateMorningBrief } from '../../services/aiService';
import { getRecentErrors } from '../../services/storageService';
import type { User, Session, UserSettings, MorningBriefContent, LessonTopic } from '../../types';

interface MorningBriefProps {
  user: User;
  topic: LessonTopic;
  session: Session | null;
  settings: UserSettings | null;
  onComplete: () => void;
}

const SECTION_LABELS: Record<keyof MorningBriefContent, string> = {
  coreConcept: 'Core Concept',
  keyRulesThresholds: 'Key Rules & Thresholds',
  formsCompliance: 'Forms & Compliance',
  connections: 'Connections',
  examTraps: 'Exam Traps',
  errorBridge: 'Error Bridge',
};

const SECTION_COLORS: Record<keyof MorningBriefContent, string> = {
  coreConcept: 'border-blue-700 bg-blue-950/30',
  keyRulesThresholds: 'border-purple-700 bg-purple-950/30',
  formsCompliance: 'border-teal-700 bg-teal-950/30',
  connections: 'border-indigo-700 bg-indigo-950/30',
  examTraps: 'border-red-700 bg-red-950/30',
  errorBridge: 'border-yellow-700 bg-yellow-950/30',
};

function loadCachedBrief(userId: string, day: number): MorningBriefContent | null {
  try {
    const raw = localStorage.getItem(`brief_${userId}_${day}`);
    return raw ? (JSON.parse(raw) as MorningBriefContent) : null;
  } catch {
    return null;
  }
}

function saveCachedBrief(userId: string, day: number, content: MorningBriefContent): void {
  try {
    localStorage.setItem(`brief_${userId}_${day}`, JSON.stringify(content));
  } catch { /* quota exceeded */ }
}

export default function MorningBrief({ user, topic, session, settings, onComplete }: MorningBriefProps) {
  const [brief, setBrief] = useState<MorningBriefContent | null>(
    () => loadCachedBrief(user.id, topic.day)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    if (!settings?.ai_api_key) {
      setError('No AI API key configured. Go to Settings to add your API key.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const recentErrors = await getRecentErrors(user.id, 5);
      const result = await generateMorningBrief(
        { provider: settings.ai_provider, apiKey: settings.ai_api_key, model: settings.ai_model },
        topic.topic,
        topic.part,
        recentErrors.map(e => ({ question: e.question, category: e.category }))
      );
      saveCachedBrief(user.id, topic.day, result);
      setBrief(result);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate morning brief');
    } finally {
      setLoading(false);
    }
  }

  const alreadyViewed = session?.morning_brief_viewed ?? false;

  // Show the brief if cached — no need to regenerate
  if (brief && !loading) {
    return (
      <div>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Morning Brief</h3>
            <p className="text-sm text-gray-400 mt-1">
              AI-generated study scaffold. Cached — no tokens used on return.
            </p>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 ml-4"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {(Object.keys(SECTION_LABELS) as (keyof MorningBriefContent)[]).map(key => (
            <div
              key={key}
              className={`border rounded-xl p-5 ${SECTION_COLORS[key]}`}
            >
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {SECTION_LABELS[key]}
              </h4>
              <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {brief[key]}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              onClick={onComplete}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Continue to Videos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Morning Brief</h3>
        <p className="text-sm text-gray-400 mt-1">
          AI-generated study scaffold for today's topic. Uses recent errors to personalize the Error Bridge section.
        </p>
      </div>

      {loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Generating your morning brief...</p>
          <p className="text-gray-600 text-xs mt-1">Using Claude Opus for deep analysis</p>
        </div>
      )}

      {!loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          {alreadyViewed && (
            <p className="text-sm text-yellow-400 mb-4">
              Brief was generated but is no longer cached. Generate a fresh one or continue.
            </p>
          )}
          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm text-left">
              {error}
            </div>
          )}
          <button
            onClick={generate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Generate Morning Brief
          </button>
          {alreadyViewed && (
            <button
              onClick={onComplete}
              className="ml-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
}
