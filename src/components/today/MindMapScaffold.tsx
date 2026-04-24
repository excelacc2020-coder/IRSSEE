import { useState } from 'react';
import { generateMindMap } from '../../services/aiService';
import type { User, Session, UserSettings, MindMapContent, LessonTopic } from '../../types';

interface MindMapScaffoldProps {
  user: User;
  topic: LessonTopic;
  session: Session | null;
  settings: UserSettings | null;
  onComplete: (content: string) => void;
  onContinue: () => void;
}

const REFERENCE_CONFIG: { key: keyof Omit<MindMapContent, 'decisionFlow'>; label: string; bgColor: string; borderColor: string; headingColor: string; emptyLabel: string }[] = [
  { key: 'rules', label: 'Core Rules', bgColor: 'bg-blue-50 dark:bg-blue-950/20', borderColor: 'border-blue-300 dark:border-blue-700', headingColor: 'text-blue-700 dark:text-blue-300', emptyLabel: 'No rules identified' },
  { key: 'exceptions', label: 'Exceptions', bgColor: 'bg-orange-50 dark:bg-orange-950/20', borderColor: 'border-orange-300 dark:border-orange-700', headingColor: 'text-orange-700 dark:text-orange-300', emptyLabel: 'No exceptions identified' },
  { key: 'forms', label: 'Forms & Schedules', bgColor: 'bg-teal-50 dark:bg-teal-950/20', borderColor: 'border-teal-300 dark:border-teal-700', headingColor: 'text-teal-700 dark:text-teal-300', emptyLabel: 'No forms identified' },
  { key: 'calculations', label: 'Calculations', bgColor: 'bg-purple-50 dark:bg-purple-950/20', borderColor: 'border-purple-300 dark:border-purple-700', headingColor: 'text-purple-700 dark:text-purple-300', emptyLabel: 'No calculations identified' },
  { key: 'traps', label: 'Exam Traps', bgColor: 'bg-red-50 dark:bg-red-950/20', borderColor: 'border-red-300 dark:border-red-700', headingColor: 'text-red-700 dark:text-red-300', emptyLabel: 'No traps identified' },
];

export default function MindMapScaffold({ topic, session, settings, onComplete, onContinue }: MindMapScaffoldProps) {
  const existingContent = session?.mind_map_content
    ? (() => { try { return JSON.parse(session.mind_map_content) as MindMapContent; } catch { return null; } })()
    : null;

  const [mindMap, setMindMap] = useState<MindMapContent | null>(existingContent);
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
      const result = await generateMindMap(
        { provider: settings.ai_provider, apiKey: settings.ai_api_key, model: settings.ai_model },
        topic.topic,
        topic.part
      );
      setMindMap(result);
      onComplete(JSON.stringify(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate mind map');
    } finally {
      setLoading(false);
    }
  }

  const alreadyGenerated = session?.mind_map_generated ?? false;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-th-text">Decision Flow Map</h3>
        <p className="text-sm text-th-text-muted mt-1">
          How a tax professional thinks through {topic.topic} — step by step.
        </p>
      </div>

      {!mindMap && !loading && (
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
            Generate Decision Flow
          </button>
          {alreadyGenerated && (
            <button
              onClick={onContinue}
              className="ml-3 bg-th-hover hover:bg-gray-600 text-th-text-secondary font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-th-card border border-th-border rounded-xl p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-th-text-muted text-sm">Building decision flow map...</p>
        </div>
      )}

      {mindMap && (
        <div>
          {/* Decision Flow */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-th-text-muted uppercase tracking-wider mb-4">Decision Flow</h4>
            <div className="relative">
              {(mindMap.decisionFlow ?? []).map((node, i) => (
                <div key={i}>
                  {/* Flow node */}
                  <div className="flex gap-3">
                    {/* Left: step number + vertical line */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {i + 1}
                      </div>
                      {i < (mindMap.decisionFlow ?? []).length - 1 && (
                        <div className="w-0.5 bg-blue-800 flex-1 min-h-[32px] mt-1" />
                      )}
                    </div>

                    {/* Right: content */}
                    <div className={`flex-1 bg-th-card border border-th-border-strong rounded-xl p-4 ${
                      i < (mindMap.decisionFlow ?? []).length - 1 ? 'mb-2' : ''
                    }`}>
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                        {node.node}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <div className="flex-1 bg-amber-50 dark:bg-yellow-950/30 border border-amber-200 dark:border-yellow-800/50 rounded-lg px-3 py-2">
                          <span className="text-xs text-amber-700 dark:text-yellow-500 font-medium block mb-0.5">Decision</span>
                          <span className="text-sm text-amber-900 dark:text-yellow-100 leading-snug">{node.question}</span>
                        </div>
                        <div className="flex-1 bg-emerald-50 dark:bg-green-950/30 border border-emerald-200 dark:border-green-800/50 rounded-lg px-3 py-2">
                          <span className="text-xs text-emerald-700 dark:text-green-500 font-medium block mb-0.5">Action</span>
                          <span className="text-sm text-emerald-900 dark:text-green-100 leading-snug">{node.action}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reference Tables */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-th-text-muted uppercase tracking-wider mb-3">Reference Framework</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {REFERENCE_CONFIG.map(({ key, label, bgColor, borderColor, headingColor, emptyLabel }) => {
                const items = mindMap[key] as string[] | undefined;
                return (
                  <div key={key} className={`border rounded-xl p-4 ${bgColor} ${borderColor}`}>
                    <h5 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${headingColor}`}>{label}</h5>
                    {items && items.length > 0 ? (
                      <ul className="space-y-1.5">
                        {items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-th-text-secondary">
                            <span className="text-th-text-faint flex-shrink-0 mt-0.5">·</span>
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-th-text-faint italic">{emptyLabel}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={generate}
              className="text-sm text-th-text-faint hover:text-th-text-secondary transition-colors"
            >
              Regenerate
            </button>
            <button
              onClick={onContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Continue to MCQ Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
