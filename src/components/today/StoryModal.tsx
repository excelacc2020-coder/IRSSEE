import { useEffect } from 'react';

interface StoryModalProps {
  heading: string;
  story: string;
  onClose: () => void;
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

/**
 * Minimal Markdown renderer for the story format: bold story name, flowing
 * prose paragraphs (blank-line separated), and the "Test Yourself" block.
 * No external Markdown dependency — the story format is intentionally simple.
 */
function renderStory(story: string) {
  const blocks = story.trim().split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const lines = block.split('\n');
    // A block whose only content is a single bold phrase reads as a heading.
    const trimmed = block.trim();
    const isStandaloneBold =
      lines.length === 1 &&
      trimmed.startsWith('**') &&
      trimmed.endsWith('**') &&
      trimmed.length > 4;

    if (isStandaloneBold) {
      return (
        <p key={bi} className="text-lg font-semibold text-th-text mt-5 first:mt-0">
          {trimmed.slice(2, -2)}
        </p>
      );
    }

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

export default function StoryModal({ heading, story, onClose }: StoryModalProps) {
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
          <button
            onClick={onClose}
            className="text-th-text-faint hover:text-th-text transition-colors text-sm px-3 py-1 rounded-lg hover:bg-th-hover flex-shrink-0 ml-4"
            aria-label="Close story"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-3">
          {renderStory(story)}
        </div>
      </div>
    </div>
  );
}
