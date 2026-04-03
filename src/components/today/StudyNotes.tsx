import { useState, useEffect, useRef } from 'react';
import type { Session, LessonTopic, User } from '../../types';

interface StudyNotesProps {
  user: User;
  day: number;
  topic: LessonTopic;
  session: Session | null;
  onNotesChange: (notes: string) => void;
  onContinue: () => void;
}

export default function StudyNotes({ topic, session, onNotesChange, onContinue }: StudyNotesProps) {
  const [notes, setNotes] = useState(session?.study_notes ?? '');
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotes(session?.study_notes ?? '');
  }, [session?.study_notes]);

  function handleChange(value: string) {
    setNotes(value);
    setSaved(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onNotesChange(value);
      setSaved(true);
    }, 800);
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-th-text">Study Notes</h3>
          <p className="text-sm text-th-text-muted mt-1">
            Your notes for {topic.topic}. Auto-saved as you type.
          </p>
        </div>
        {saved && <span className="text-xs text-green-500 mt-1">Saved</span>}
      </div>

      <div className="bg-th-card border border-th-border rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-2 border-b border-th-border flex items-center gap-2">
          <span className="text-xs text-th-text-faint">Notes for Day {topic.day}: {topic.topic}</span>
        </div>
        <textarea
          value={notes}
          onChange={e => handleChange(e.target.value)}
          placeholder={`Write your study notes here...\n\nSuggested structure:\n• Key rules and thresholds\n• Exceptions to remember\n• Form numbers and their purpose\n• Common exam traps\n• Questions to look up`}
          className="w-full bg-transparent text-th-text-secondary placeholder-th-text-faint px-4 py-4 text-sm leading-relaxed resize-none focus:outline-none min-h-[320px] font-mono"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-th-text-faint">{notes.length} characters</span>
        <button
          onClick={() => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            onNotesChange(notes);
            onContinue();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Continue to Mind Map
        </button>
      </div>
    </div>
  );
}
