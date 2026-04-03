import { useState } from 'react';
import type { LessonTopic, Session } from '../../types';

// Tax year = most recently completed year (current year minus 1)
const TAX_YEAR = '2025';

interface NotebookLMPromptProps {
  topic: LessonTopic;
  session: Session | null;
  onContinue: () => void;
}

function buildPrompt(topic: LessonTopic, notes: string): string {
  const pubs = topic.irsPublications.join(', ');
  const taxYearNote = `TAX YEAR: ${TAX_YEAR} — All dollar amounts, thresholds, phase-outs, and limits must reflect ${TAX_YEAR} figures.\n`;
  const notesContext = notes?.trim()
    ? `\n\nADDITIONAL CONTEXT FROM MY STUDY NOTES:\n${notes.trim()}`
    : '';

  return `You are helping me build a deep, practical knowledge base on the following IRS tax topic:

TOPIC: ${topic.topic}
IRS PART: Part ${topic.part} (${topic.part === 1 ? 'Individuals' : topic.part === 2 ? 'Businesses' : 'Representation'})
${taxYearNote}KEY IRS REFERENCES: ${pubs}
${notesContext}

Using the source documents I have uploaded, please create comprehensive, client-service-oriented study content covering the following areas. The goal is to prepare a new tax preparer and tax strategist to confidently handle this topic when working with real clients — not just pass an exam, but genuinely serve clients well.

──────────────────────────────────────────
1. REAL CLIENT SCENARIOS
──────────────────────────────────────────
Describe the 3–5 most common situations where a real client will encounter ${topic.topic}. For each scenario:
- What does the client's situation look like when they walk in?
- What questions should the preparer ask during intake?
- What documents or records should be requested?
- What is the most common mistake clients (and preparers) make in this scenario?

──────────────────────────────────────────
2. TAX PREPARER'S WORKFLOW
──────────────────────────────────────────
Walk through the step-by-step process of handling ${topic.topic} from client interview to completed return:
- Intake checklist: what to gather
- Which IRS forms are involved, key lines, and instructions
- How to calculate or determine the correct tax treatment
- Common errors that trigger IRS notices or correspondence
- Red flags that indicate additional due diligence is needed

──────────────────────────────────────────
3. TAX STRATEGIST'S OPPORTUNITIES
──────────────────────────────────────────
From a proactive planning perspective:
- What year-end or mid-year planning conversations should a strategist have with clients about ${topic.topic}?
- What legal strategies exist to reduce tax liability in this area?
- When is it worth doing deeper analysis (e.g., cost-benefit of an election, timing of a transaction)?
- What type of client (individual, self-employed, business owner, HNW) benefits most from each strategy?

──────────────────────────────────────────
4. CRITICAL RULES, THRESHOLDS & CALCULATIONS
──────────────────────────────────────────
List every dollar amount, percentage, phase-out range, income limit, and threshold a preparer must know for ${topic.topic}. For each:
- State the rule clearly
- Show an example calculation using realistic client numbers
- Note whether it is indexed for inflation and if so, the current year amount

──────────────────────────────────────────
5. FORMS, LINES & COMPLIANCE CHECKLIST
──────────────────────────────────────────
- Which forms are required? Which are supplemental?
- What are the most critical lines to review or double-check?
- What attachments, elections, or statements are required?
- What are the due dates and extension rules?

──────────────────────────────────────────
6. EXAM-LEVEL TRAPS & EDGE CASES
──────────────────────────────────────────
What are the nuanced exceptions, special rules, and "gotcha" scenarios that even experienced preparers miss on ${topic.topic}? Focus on:
- Rules that are widely misunderstood
- Exceptions to the general rule that catch people off guard
- IRS audit triggers in this area
- IRS SEE exam–style trick questions on this topic (provide examples with explanations of why the "obvious" answer is wrong)

──────────────────────────────────────────
7. CLIENT-READY TALKING POINTS
──────────────────────────────────────────
Provide plain-English explanations for three types of clients:
1. Simple individual taxpayer (W-2, standard deduction)
2. Self-employed or small business owner
3. High-net-worth or complex tax situation

For each: what do they need to understand, what decisions do they need to make, and what should they proactively tell their preparer?

──────────────────────────────────────────
FORMAT INSTRUCTIONS
──────────────────────────────────────────
- Use numbered lists and bullet points throughout
- Bold key terms, thresholds, and form numbers
- Include real dollar examples using ${TAX_YEAR} tax year figures throughout
- Keep explanations practical — "what do I do with this client" not textbook theory
- Where rules vary by filing status or entity type, show the variation in a table or comparison

IRS References: ${pubs}`;
}

export default function NotebookLMPrompt({ topic, session, onContinue }: NotebookLMPromptProps) {
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(topic, session?.study_notes ?? '');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = prompt;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-th-text">Google NotebookLM Prompt</h3>
          <p className="text-sm text-th-text-muted mt-1">
            Copy this prompt into NotebookLM after uploading your source materials (IRS publications, video transcripts).
            Framed for a tax preparer learning to serve clients — not just pass an exam.
          </p>
        </div>
      </div>

      {/* How to use */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-5">
        <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">How to use</h4>
        <ol className="text-sm text-th-text-secondary space-y-1.5 list-decimal list-inside">
          <li>Open <a href="https://notebooklm.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline">NotebookLM</a> and create a new notebook for today's topic</li>
          <li>Upload source materials: IRS publication PDFs, paste in the YouTube video URL, add any study guides</li>
          <li>Copy the prompt below and paste it into the chat input</li>
          <li>NotebookLM will synthesize your uploaded sources using this structured framework</li>
        </ol>
      </div>

      {/* IRS Pubs quick reference */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="text-xs text-th-text-faint">Suggested sources:</span>
        {topic.irsPublications.map(pub => (
          <span key={pub} className="text-xs bg-th-input text-blue-600 dark:text-blue-400 font-mono px-2 py-1 rounded border border-th-border-strong">
            {pub}
          </span>
        ))}
        {topic.videoUrl && (
          <a
            href={topic.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-th-input text-red-600 dark:text-red-400 px-2 py-1 rounded border border-th-border-strong hover:bg-th-hover transition-colors"
          >
            ▶ Video transcript
          </a>
        )}
      </div>

      {/* Prompt box */}
      <div className="relative mb-5">
        <div className="bg-th-card border border-th-border-strong rounded-xl p-5 font-mono text-xs text-th-text-secondary leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
          {prompt}
        </div>

        {/* Copy button overlaid */}
        <button
          onClick={handleCopy}
          className={`absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            copied
              ? 'bg-green-700 text-green-100'
              : 'bg-th-input hover:bg-th-hover text-th-text-secondary hover:text-th-text border border-th-border-strong'
          }`}
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>Copied</span>
            </>
          ) : (
            <>
              <span>⎘</span>
              <span>Copy Prompt</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              copied
                ? 'bg-green-700 text-green-100'
                : 'bg-th-input hover:bg-th-hover text-th-text-secondary border border-th-border-strong'
            }`}
          >
            {copied ? '✓ Copied to Clipboard' : '⎘ Copy Prompt'}
          </button>
          <a
            href="https://notebooklm.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-th-input hover:bg-th-hover text-th-text-secondary border border-th-border-strong transition-colors"
          >
            Open NotebookLM ↗
          </a>
        </div>
        <button
          onClick={onContinue}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Continue to MCQ Quiz
        </button>
      </div>
    </div>
  );
}
