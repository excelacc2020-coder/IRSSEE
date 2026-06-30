import { useState } from 'react';
import { generateMindMap } from '../../services/aiService';
import MermaidDiagram from './MermaidDiagram';
import type {
  User, Session, UserSettings, MindMapContent, ScannedRule,
  DecisionTree, CalculationFlow, LessonTopic,
} from '../../types';

interface MindMapScaffoldProps {
  user: User;
  topic: LessonTopic;
  session: Session | null;
  settings: UserSettings | null;
  onComplete: (content: string) => void;
  onContinue: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Coerce an unknown (possibly string[] from the AI) into a single display string. */
function s(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(s).join('; ');
  if (v == null) return '';
  return JSON.stringify(v);
}

/** Sanitize text for use inside a quoted Mermaid node label. */
function mm(v: unknown): string {
  return s(v)
    .replace(/["\n\r]/g, ' ')      // quotes & newlines break labels
    .replace(/[<>]/g, ' ')         // angle brackets confuse the HTML-label parser
    .replace(/[{}|[\]]/g, ' ')     // reserved Mermaid shape characters
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

/**
 * Flatten the stored Morning Brief (JSON) into readable notes for the prompt.
 * The mind map analyzes ONLY these notes, so we pass every field through.
 */
function briefToText(session: Session | null): string {
  if (!session?.morning_brief_content) return '';
  let brief: Record<string, unknown>;
  try {
    brief = JSON.parse(session.morning_brief_content) as Record<string, unknown>;
  } catch {
    return '';
  }
  if (!brief || typeof brief !== 'object') return '';

  const lines: string[] = [];
  if (brief.overview) lines.push(`OVERVIEW: ${s(brief.overview)}`);

  const sections = Array.isArray(brief.sections) ? brief.sections : [];
  for (const sec of sections as Array<Record<string, unknown>>) {
    lines.push(`\n## ${s(sec.heading)}`);
    const items = Array.isArray(sec.items) ? sec.items : [];
    for (const it of items as Array<Record<string, unknown>>) {
      lines.push(`- ${s(it.label)}`);
      if (it.rule) lines.push(`  Rule: ${s(it.rule)}`);
      if (it.threshold) lines.push(`  Threshold: ${s(it.threshold)}`);
      if (it.form) lines.push(`  Form: ${s(it.form)}`);
      if (it.tip) lines.push(`  Tip: ${s(it.tip)}`);
    }
  }

  if (brief.connections) lines.push(`\nCONNECTIONS: ${s(brief.connections)}`);
  if (brief.examTraps) lines.push(`\nEXAM TRAPS: ${s(brief.examTraps)}`);
  if (brief.errorBridge) lines.push(`\nERROR BRIDGE: ${s(brief.errorBridge)}`);
  return lines.join('\n');
}

// ─── Mermaid flowchart builders ─────────────────────────────────────────────────

/** Decision tree → top-down Mermaid flowchart (green gates, red fails, success). */
function buildDecisionTreeChart(tree: DecisionTree): string {
  const gates = Array.isArray(tree.gates) ? tree.gates : [];
  const L: string[] = ['flowchart TD'];

  // Node definitions first so shapes/classes bind reliably.
  L.push(`  start(["${mm(tree.start) || 'Start'}"]):::start`);
  gates.forEach((g, i) => {
    L.push(`  g${i}{"${mm(g.question) || `Gate ${i + 1}`}"}:::gate`);
    L.push(`  f${i}["${mm(g.failOutcome) || 'Does not qualify'}"]:::fail`);
    (Array.isArray(tree.tiebreakers) ? tree.tiebreakers : [])
      .filter(t => t.fromGate === i + 1)
      .forEach((t, ti) => {
        const text = (Array.isArray(t.rules) ? t.rules : [])
          .map((r, ri) => `${ri + 1}. ${mm(r)}`)
          .join(' • ');
        L.push(`  tb${i}_${ti}["${text || 'Tiebreakers'}"]:::tie`);
      });
  });
  L.push(`  success(["${mm(tree.success) || 'Qualifies'}"]):::success`);

  // Edges.
  L.push(`  start --> ${gates.length ? 'g0' : 'success'}`);
  gates.forEach((_g, i) => {
    L.push(`  g${i} -->|No| f${i}`);
    L.push(`  g${i} -->|Yes| ${i < gates.length - 1 ? `g${i + 1}` : 'success'}`);
    (Array.isArray(tree.tiebreakers) ? tree.tiebreakers : [])
      .filter(t => t.fromGate === i + 1)
      .forEach((_t, ti) => L.push(`  g${i} -.->|Tiebreakers| tb${i}_${ti}`));
  });

  L.push("  classDef start fill:#ecfdf5,stroke:#059669,color:#065f46;");
  L.push("  classDef gate fill:#d1fae5,stroke:#059669,color:#065f46;");
  L.push("  classDef fail fill:#fee2e2,stroke:#dc2626,color:#991b1b;");
  L.push("  classDef success fill:#059669,stroke:#047857,color:#ffffff;");
  L.push("  classDef tie fill:#fef9c3,stroke:#ca8a04,color:#713f12;");
  return L.join('\n');
}

/** Calculation flow → top-down Mermaid flowchart (blue steps, amber branches). */
function buildCalcFlowChart(flow: CalculationFlow): string {
  const steps = Array.isArray(flow.steps) ? flow.steps : [];
  const L: string[] = ['flowchart TD'];

  steps.forEach((st, i) => {
    const label = [`${i + 1}. ${mm(st.label)}`, mm(st.formula), `= ${mm(st.result)}`]
      .filter(Boolean)
      .join('<br/>');
    L.push(`  s${i}["${label}"]:::step`);
    if (st.decision) {
      L.push(`  d${i}{"${mm(st.decision.condition) || 'Condition?'}"}:::decision`);
      L.push(`  dy${i}["${mm(st.decision.yes)}"]:::yes`);
      L.push(`  dn${i}["${mm(st.decision.no)}"]:::no`);
    }
  });
  L.push(`  final(["${mm(flow.final) || 'Result'}"]):::final`);

  steps.forEach((st, i) => {
    L.push(`  s${i} --> ${i < steps.length - 1 ? `s${i + 1}` : 'final'}`);
    if (st.decision) {
      L.push(`  s${i} -.-> d${i}`);
      L.push(`  d${i} -->|Yes| dy${i}`);
      L.push(`  d${i} -->|No| dn${i}`);
    }
  });

  L.push("  classDef step fill:#dbeafe,stroke:#2563eb,color:#1e3a8a;");
  L.push("  classDef decision fill:#fef3c7,stroke:#d97706,color:#78350f;");
  L.push("  classDef yes fill:#d1fae5,stroke:#059669,color:#065f46;");
  L.push("  classDef no fill:#fee2e2,stroke:#dc2626,color:#991b1b;");
  L.push("  classDef final fill:#2563eb,stroke:#1d4ed8,color:#ffffff;");
  return L.join('\n');
}

// ─── Rule Anatomy Scan column config (color identity carried into each output) ──

const SCAN_COLUMNS: {
  key: 'gateRules' | 'mathChainRules' | 'parallelRules';
  label: string;
  output: string;
  card: string;
  heading: string;
  numbers: string;
}[] = [
  {
    key: 'gateRules',
    label: 'Gate Rules',
    output: '→ Decision Tree',
    card: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20',
    heading: 'text-emerald-700 dark:text-emerald-300',
    numbers: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'mathChainRules',
    label: 'Math Chain Rules',
    output: '→ Calculation Flow',
    card: 'border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20',
    heading: 'text-blue-700 dark:text-blue-300',
    numbers: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'parallelRules',
    label: 'Parallel Rules',
    output: '→ Comparison Grid',
    card: 'border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/20',
    heading: 'text-purple-700 dark:text-purple-300',
    numbers: 'text-purple-600 dark:text-purple-400',
  },
];

function SectionTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-2.5 h-2.5 rounded-full ${accent}`} />
      <h4 className="text-sm font-semibold text-th-text uppercase tracking-wide">{children}</h4>
    </div>
  );
}

function EmptyOutput({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-th-border rounded-xl p-5 text-center">
      <p className="text-xs text-th-text-faint italic">{text}</p>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function MindMapScaffold({ topic, session, settings, onComplete, onContinue }: MindMapScaffoldProps) {
  const existingContent = session?.mind_map_content
    ? (() => { try { return JSON.parse(session.mind_map_content) as MindMapContent; } catch { return null; } })()
    : null;

  const [mindMap, setMindMap] = useState<MindMapContent | null>(existingContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const briefText = briefToText(session);

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
        topic.part,
        briefText
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
  const scan = mindMap?.scan;
  const tree = mindMap?.decisionTree;
  const flow = mindMap?.calculationFlow;
  const grid = mindMap?.comparisonGrid;

  const hasTree = !!tree && Array.isArray(tree.gates) && tree.gates.length > 0;
  const hasFlow = !!flow && Array.isArray(flow.steps) && flow.steps.length > 0;
  const hasGrid = !!grid && Array.isArray(grid.columns) && Array.isArray(grid.rows) && grid.rows.length > 0;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-th-text">Rule Map</h3>
        <p className="text-sm text-th-text-muted mt-1">
          Classifies the Morning Brief rules into gates, math chains, and parallels — then maps each
          into a Decision Tree, Calculation Flow, and Comparison Grid.
        </p>
      </div>

      {!mindMap && !loading && (
        <div className="bg-th-card border border-th-border rounded-xl p-6 text-center">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm text-left">
              {error}
            </div>
          )}
          {!briefText && (
            <p className="mb-4 text-sm text-yellow-600 dark:text-yellow-400">
              No Morning Brief found for today. Generate the Morning Brief first for the most accurate
              map — or continue and the map will be built from the topic alone.
            </p>
          )}
          <button
            onClick={generate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Generate Rule Map
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
          <p className="text-th-text-muted text-sm">Scanning rules and building the map...</p>
        </div>
      )}

      {mindMap && (
        <div className="space-y-8">
          {/* ── Rule Anatomy Scan ─────────────────────────────────────────── */}
          {scan && (
            <section>
              <SectionTitle accent="bg-th-text-muted">Rule Anatomy Scan</SectionTitle>
              <div className="grid gap-3 md:grid-cols-3">
                {SCAN_COLUMNS.map(col => {
                  const rules: ScannedRule[] = Array.isArray(scan[col.key]) ? scan[col.key] : [];
                  return (
                    <div key={col.key} className={`border rounded-xl p-4 ${col.card}`}>
                      <div className="flex items-baseline justify-between mb-2">
                        <h5 className={`text-xs font-semibold uppercase tracking-wider ${col.heading}`}>{col.label}</h5>
                        <span className={`text-[10px] font-medium ${col.numbers}`}>{col.output}</span>
                      </div>
                      {rules.length > 0 ? (
                        <ul className="space-y-2">
                          {rules.map((r, i) => (
                            <li key={i} className="text-xs text-th-text-secondary leading-snug">
                              <span>{s(r.rule)}</span>
                              {s(r.numbers) && (
                                <span className={`block font-mono text-[11px] mt-0.5 ${col.numbers}`}>{s(r.numbers)}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-th-text-faint italic">None in this brief</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {Array.isArray(scan.outputPlan) && scan.outputPlan.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-xs text-th-text-muted uppercase tracking-wider">Output plan:</span>
                  {scan.outputPlan.map((p, i) => (
                    <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-th-input text-th-text-secondary border border-th-border">
                      {s(p)}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Decision Tree (green) ─────────────────────────────────────── */}
          <section>
            <SectionTitle accent="bg-emerald-500">Decision Tree</SectionTitle>
            {hasTree ? (
              <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-4">
                <MermaidDiagram chart={buildDecisionTreeChart(tree!)} />
              </div>
            ) : (
              <EmptyOutput text="No gate (yes/no eligibility) rules in this brief — no decision tree needed." />
            )}
          </section>

          {/* ── Calculation Flow (blue) ───────────────────────────────────── */}
          <section>
            <SectionTitle accent="bg-blue-500">Calculation Flow</SectionTitle>
            {hasFlow ? (
              <div className="border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl p-4">
                <MermaidDiagram chart={buildCalcFlowChart(flow!)} />
              </div>
            ) : (
              <EmptyOutput text="No math-chain (calculation) rules in this brief — no calculation flow needed." />
            )}
          </section>

          {/* ── Comparison Grid (purple) ──────────────────────────────────── */}
          <section>
            <SectionTitle accent="bg-purple-500">Comparison Grid</SectionTitle>
            {hasGrid ? (
              <>
                <div className="border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-purple-100 dark:bg-purple-950/40">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                          Dimension
                        </th>
                        {grid!.columns.map((c, i) => (
                          <th key={i} className="text-left px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                            {s(c)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grid!.rows.map((row, ri) => {
                        const values = Array.isArray(row.values) ? row.values : [];
                        const allSame = values.length > 1 && values.every(v => s(v) === s(values[0]));
                        return (
                          <tr key={ri} className="border-t border-purple-100 dark:border-purple-900/60 odd:bg-purple-50/40 dark:odd:bg-purple-950/10">
                            <td className="px-3 py-2 text-xs font-medium text-th-text align-top">{s(row.dimension)}</td>
                            {grid!.columns.map((_, ci) => (
                              <td
                                key={ci}
                                className={`px-3 py-2 text-xs align-top ${allSame ? 'text-th-text-faint' : 'text-th-text-secondary'}`}
                              >
                                {s(values[ci])}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-th-text-faint mt-2">
                  Rows where values diverge across columns are the exam traps. Greyed rows are identical across all.
                </p>
              </>
            ) : (
              <EmptyOutput text="No parallel (related-credit) rules in this brief — no comparison grid needed." />
            )}
          </section>

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
