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

const REFERENCE_CONFIG: { key: keyof Omit<MindMapContent, 'decisionFlow'>; label: string; color: string; emptyLabel: string }[] = [
  { key: 'rules', label: 'Core Rules', color: 'border-blue-700 bg-blue-950/20 text-blue-300', emptyLabel: 'No rules identified' },
  { key: 'exceptions', label: 'Exceptions', color: 'border-orange-700 bg-orange-950/20 text-orange-300', emptyLabel: 'No exceptions identified' },
  { key: 'forms', label: 'Forms & Schedules', color: 'border-teal-700 bg-teal-950/20 text-teal-300', emptyLabel: 'No forms identified' },
  { key: 'calculations', label: 'Calculations', color: 'border-purple-700 bg-purple-950/20 text-purple-300', emptyLabel: 'No calculations identified' },
  { key: 'traps', label: 'Exam Traps', color: 'border-red-700 bg-red-950/20 text-red-300', emptyLabel: 'No traps identified' },
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
        <h3 className="text-lg font-semibold text-white">Decision Flow Map</h3>
        <p className="text-sm text-gray-400 mt-1">
          How a tax professional thinks through {topic.topic} — step by step.
        </p>
      </div>

      {!mindMap && !loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm text-left">
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
              className="ml-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Building decision flow map...</p>
        </div>
      )}

      {mindMap && (
        <div>
          {/* Decision Flow */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Decision Flow</h4>
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
                    <div className={`flex-1 bg-gray-900 border border-gray-700 rounded-xl p-4 ${
                      i < (mindMap.decisionFlow ?? []).length - 1 ? 'mb-2' : ''
                    }`}>
                      <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                        {node.node}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <div className="flex-1 bg-yellow-950/30 border border-yellow-800/50 rounded-lg px-3 py-2">
                          <span className="text-xs text-yellow-600 font-medium block mb-0.5">Decision</span>
                          <span className="text-sm text-yellow-200 leading-snug">{node.question}</span>
                        </div>
                        <div className="flex-1 bg-green-950/30 border border-green-800/50 rounded-lg px-3 py-2">
                          <span className="text-xs text-green-600 font-medium block mb-0.5">Action</span>
                          <span className="text-sm text-green-200 leading-snug">{node.action}</span>
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
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Reference Framework</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {REFERENCE_CONFIG.map(({ key, label, color, emptyLabel }) => {
                const items = mindMap[key] as string[] | undefined;
                return (
                  <div key={key} className={`border rounded-xl p-4 ${color.split(' ').slice(0, 2).join(' ')} bg-gray-900/50`}>
                    <h5 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${color.split(' ')[2]}`}>{label}</h5>
                    {items && items.length > 0 ? (
                      <ul className="space-y-1.5">
                        {items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                            <span className="text-gray-600 flex-shrink-0 mt-0.5">·</span>
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-600 italic">{emptyLabel}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={generate}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
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
