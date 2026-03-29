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

/**
 * Validates that a parsed object matches the NEW brief format.
 * Returns null for old-format (flat string) briefs so they are discarded
 * rather than crashing the renderer.
 */
function validateBriefFormat(data: unknown): MorningBriefContent | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  // Old format had flat string fields — discard silently
  if ('coreConcept' in d || 'keyRulesThresholds' in d) return null;
  // New format must have both arrays
  if (!Array.isArray(d.subtopics) || !Array.isArray(d.rulesTable)) return null;
  return data as MorningBriefContent;
}

/**
 * Parse the brief stored in session.morning_brief_content.
 * Returns null if absent, unparseable, or in the old format.
 */
function parseBriefFromSession(session: Session | null): MorningBriefContent | null {
  if (!session?.morning_brief_content) return null;
  try {
    const parsed = JSON.parse(session.morning_brief_content);
    return validateBriefFormat(parsed);
  } catch {
    return null;
  }
}

export default function MorningBrief({ user, topic, session, settings, onComplete }: MorningBriefProps) {
  // Single source of truth: session.morning_brief_content (backed by Supabase).
  // We derive the brief directly from the session prop — no separate localStorage key.
  const [brief, setBrief] = useState<MorningBriefContent | null>(() =>
    parseBriefFromSession(session)
  );

  // Re-derive when the session prop updates (async Supabase load arrives after mount)
  useEffect(() => {
    if (!brief) {
      const parsed = parseBriefFromSession(session);
      if (parsed) setBrief(parsed);
    }
  }, [brief, session]);

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
      // Save locally for instant display
      setBrief(result);
      // Persist to Supabase via onComplete → upsertSession in TodayTab
      onComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate morning brief');
    } finally {
      setLoading(false);
    }
  }

  const alreadyViewed = session?.morning_brief_viewed ?? false;
  // True only if viewed flag is set but content is absent/invalid (format mismatch)
  const briefMissing = alreadyViewed && !brief;

  // ─── Render: brief loaded ────────────────────────────────────────────────────

  if (brief && !loading) {
    return (
      <div>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Morning Brief</h3>
            <p className="text-sm text-gray-400 mt-1">
              AI-generated study scaffold. Saved to cloud — available on all devices.
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
              {(brief.subtopics ?? []).map((st, i) => (
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
              Key Rules &amp; Thresholds
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
                  {(brief.rulesTable ?? []).map((row, i) => (
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

  // ─── Render: no brief yet ────────────────────────────────────────────────────

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
          {briefMissing && (
            <p className="text-sm text-yellow-400 mb-4">
              Previous brief used an older format and was updated. Please generate a new one — this only happens once.
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
        </div>
      )}
    </div>
  );
}
