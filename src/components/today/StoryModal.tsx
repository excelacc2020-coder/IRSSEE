import { useEffect } from 'react';

interface StoryModalProps {
  heading: string;
  story: string;
  onClose: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

/**
 * Renders a single line of Markdown-style text, converting **bold** segments
 * into <strong> elements. Everything else is plain text.
 */
function renderInline(line: string, keyPrefix: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-th-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

function isStandaloneBoldBlock(block: string): boolean {
  const trimmed = block.trim();
  return (
    !trimmed.includes('\n') &&
    trimmed.startsWith('**') &&
    trimmed.endsWith('**') &&
    trimmed.length > 4
  );
}

/**
 * Minimal Markdown renderer for the story format:
 *  - first standalone-bold block  -> story title
 *  - "Test Yourself" heading       -> quiz divider
 *  - other standalone-bold blocks  -> blue section headings (echo brief subtopics)
 *  - everything else               -> flowing prose paragraphs
 * No external Markdown dependency — the story format is intentionally simple.
 */
function renderStory(story: string) {
  const blocks = story.trim().split(/\n{2,}/);
  const titleIndex = blocks.findIndex(isStandaloneBoldBlock);

  return blocks.map((block, bi) => {
    const trimmed = block.trim();

    if (isStandaloneBoldBlock(block)) {
      const text = trimmed.slice(2, -2).trim();

      // Story title — the first bold heading.
      if (bi === titleIndex) {
        return (
          <p key={bi} className="text-xl font-bold text-th-text first:mt-0">
            {text}
          </p>
        );
      }

      // The quiz divider gets a separating rule.
      if (/^test yourself/i.test(text)) {
        return (
          <p
            key={bi}
            className="text-sm font-semibold text-th-text uppercase tracking-wider border-t border-th-border pt-4 mt-6"
          >
            {text}
          </p>
        );
      }

      // Section heading — styled to mirror the Morning Brief subtopics.
      return (
        <p
          key={bi}
          className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mt-5"
        >
          {text}
        </p>
      );
    }

    const lines = block.split('\n');
    return (
      <p key={bi} className="text-sm text-th-text-secondary leading-relaxed">
        {lines.map((line, li) => (
          <span key={li}>
            {renderInline(line, `${bi}-${li}`)}
            {li < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

export default function StoryModal({ heading, story, onClose, onRegenerate, regenerating }: StoryModalProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-th-card border border-th-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-th-border flex-shrink-0">
          <div>
            <p className="text-xs text-th-text-faint uppercase tracking-wider mb-0.5">Story</p>
            <h3 className="text-lg font-semibold text-th-text">{heading}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={regenerating}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-th-border text-th-text-secondary hover:bg-th-hover transition-colors disabled:opacity-60"
              >
                {regenerating ? 'Regenerating…' : 'Regenerate'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-th-text-faint hover:text-th-text transition-colors text-sm px-3 py-1 rounded-lg hover:bg-th-hover"
              aria-label="Close story"
            >
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-3">
          {regenerating && (
            <div className="mb-3 flex items-center gap-2 text-xs text-th-text-muted">
              <span className="inline-block w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Rewriting the story with the latest format…
            </div>
          )}
          {renderStory(story)}
        </div>
      </div>
    </div>
  );
}
