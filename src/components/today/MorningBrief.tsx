import { useState, useEffect } from 'react';
import { generateMorningBrief } from '../../services/aiService';
import { getRecentErrors } from '../../services/storageService';
import type { User, Session, UserSettings, MorningBriefContent, LessonTopic } from '../../types';

interface MorningBriefProps {
  user: User;
  topic: LessonTopic;
  session: Session | null;
  settings: UserSettings | null;
  onComplete: (content: MorningBriefContent) => void;
}

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
  const [brief, setBrief] = useState<MorningBriefContent | null>(() => {
    const cached = loadCachedBrief(user.id, topic.day);
    if (cached) return cached;
    if (session?.morning_brief_content) {
      try {
        const parsed = JSON.parse(session.morning_brief_content) as MorningBriefContent;
        saveCachedBrief(user.id, topic.day, parsed);
        return parsed;
      } catch {
        // syntax error
      }
    }
    return null;
  });

  // Keep it in sync if session loads slower than the component mounts
  useEffect(() => {
    if (!brief && session?.morning_brief_content) {
      try {
        const parsed = JSON.parse(session.morning_brief_content) as MorningBriefContent;
        saveCachedBrief(user.id, topic.day, parsed);
        setBrief(parsed);
      } catch {
        // ignore
      }
    }
  }, [brief, session?.morning_brief_content, user.id, topic.day]);

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
      onComplete(result);
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
          {/* Core Concepts — subtopic bullet points */}
          <div className="border border-blue-700 bg-blue-950/30 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Core Concepts
            </h4>
            <div className="space-y-3">
              {brief.subtopics.map((st, i) => (
                <div key={i} className="border-l-2 border-blue-600 pl-3">
                  <p className="text-sm font-medium text-blue-300">{st.name}</p>
                  <p className="text-sm text-gray-200 mt-0.5">{st.explanation}</p>
                  <p className="text-xs text-gray-400 mt-0.5 italic">{st.phaseContext}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Rules & Thresholds — table */}
          <div className="border border-purple-700 bg-purple-950/30 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Key Rules & Thresholds
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-800 text-left">
                    <th className="py-2 pr-3 text-xs font-semibold text-purple-300 whitespace-nowrap">Subtopic</th>
                    <th className="py-2 pr-3 text-xs font-semibold text-purple-300 whitespace-nowrap">Key Rule</th>
                    <th className="py-2 pr-3 text-xs font-semibold text-purple-300 whitespace-nowrap">Threshold / Exceptions</th>
                    <th className="py-2 pr-3 text-xs font-semibold text-purple-300 whitespace-nowrap">Forms / Compliance</th>
                    <th className="py-2 text-xs font-semibold text-purple-300 whitespace-nowrap">Nuance / Tax Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {brief.rulesTable.map((row, i) => (
                    <tr key={i} className="border-b border-purple-900/50 align-top">
                      <td className="py-2 pr-3 text-purple-200 font-medium whitespace-nowrap">{row.subtopic}</td>
                      <td className="py-2 pr-3 text-gray-200">{row.keyRule}</td>
                      <td className="py-2 pr-3 text-gray-300">{row.thresholdExceptions}</td>
                      <td className="py-2 pr-3 text-gray-300">{row.formsCompliance}</td>
                      <td className="py-2 text-gray-400">{row.nuanceTaxStrategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Connections */}
          <div className="border border-indigo-700 bg-indigo-950/30 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Connections
            </h4>
            <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
              {brief.connections}
            </div>
          </div>

          {/* Exam Traps */}
          <div className="border border-red-700 bg-red-950/30 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Exam Traps
            </h4>
            <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
              {brief.examTraps}
            </div>
          </div>

          {/* Error Bridge */}
          <div className="border border-yellow-700 bg-yellow-950/30 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Error Bridge
            </h4>
            <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
              {brief.errorBridge}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => onComplete(brief)}
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
          {alreadyViewed && brief && (
            <button
              onClick={() => onComplete(brief)}
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
