import { useState, useEffect, useCallback } from 'react';
import { getTopicByDay } from '../../constants/lessonPlan';
import { getSession as fetchSession, upsertSession, upsertUserSettings } from '../../services/storageService';
import MorningBrief from '../today/MorningBrief';
import VideoLinks from '../today/VideoLinks';
import StudyNotes from '../today/StudyNotes';
import MindMapScaffold from '../today/MindMapScaffold';
import NotebookLMPrompt from '../today/NotebookLMPrompt';
import MCQQuiz from '../today/MCQQuiz';
import EveningLock from '../today/EveningLock';
import type { User, Session, UserSettings, TodayPhase } from '../../types';

interface TodayTabProps {
  user: User;
  viewingDay: number;
  settings: UserSettings | null;
  onDataChange: () => void;
}

const PHASE_LABELS: Record<TodayPhase, string> = {
  0: 'Morning Brief',
  1: 'Video & Refs',
  2: 'Study Notes',
  3: 'Mind Map',
  4: 'NotebookLM',
  5: 'MCQ Quiz',
  6: 'Evening Lock',
};

function getMaxUnlockedPhase(session: Session | null): TodayPhase {
  if (!session) return 0;
  if (session.locked) return 6;
  if (session.quiz_passed) return 6;
  if (session.quiz_questions !== null) return 5;
  if (session.mind_map_generated) return 5;  // NotebookLM (4) and MCQ (5) both unlock after mind map
  if (session.study_notes?.length > 0) return 3;
  if (session.morning_brief_viewed) return 2;
  return 0;
}

export default function TodayTab({ user, viewingDay, settings, onDataChange }: TodayTabProps) {
  const topic = getTopicByDay(viewingDay);
  const [session, setSession] = useState<Session | null>(null);
  const [activePhase, setActivePhase] = useState<TodayPhase>(0);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    setLoading(true);
    const s = await fetchSession(user.id, viewingDay);
    setSession(s);
    const maxPhase = getMaxUnlockedPhase(s);
    // Don't auto-jump to Evening Lock if already locked — stay at lock phase
    setActivePhase(maxPhase);
    setLoading(false);
  }, [user.id, viewingDay]);

  useEffect(() => { loadSession(); }, [loadSession]);

  const handleSessionUpdate = useCallback(async (updates: Partial<Session>) => {
    if (!topic) return;
    const updated = await upsertSession(user.id, viewingDay, {
      topic: topic.topic,
      part: topic.part,
      ...updates,
    });
    setSession(updated);
    if (updated) {
      const maxPhase = getMaxUnlockedPhase(updated);
      if (maxPhase > activePhase) setActivePhase(maxPhase);
    }
    // When a day is locked, advance current_day to the next day
    if (updates.locked && viewingDay < 50) {
      await upsertUserSettings(user.id, { current_day: viewingDay + 1 });
    }
    onDataChange();
  }, [user.id, viewingDay, topic, activePhase, onDataChange]);

  if (!topic) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Topic not found for Day {viewingDay}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Loading session...
      </div>
    );
  }

  const maxUnlocked = getMaxUnlockedPhase(session);
  const isLocked = session?.locked ?? false;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span>Part {topic.part}</span>
          <span>·</span>
          <span>Week {topic.week}</span>
          <span>·</span>
          <span>Day {topic.day} of 50</span>
          {isLocked && (
            <span className="ml-2 bg-green-900/40 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">
              Complete
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-white">{topic.topic}</h2>
      </div>

      {/* Phase stepper */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {([0, 1, 2, 3, 4, 5, 6] as TodayPhase[]).map(phase => {
          const unlocked = phase <= maxUnlocked;
          const active = phase === activePhase;

          return (
            <button
              key={phase}
              onClick={() => unlocked && setActivePhase(phase)}
              disabled={!unlocked}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : unlocked
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-900 text-gray-600 cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                active ? 'bg-blue-500' : unlocked ? 'bg-gray-700' : 'bg-gray-800'
              }`}>
                {phase + 1}
              </span>
              <span className="hidden sm:inline">{PHASE_LABELS[phase]}</span>
            </button>
          );
        })}
      </div>

      {/* Phase content */}
      <div>
        {activePhase === 0 && (
          <MorningBrief
            user={user}
            topic={topic}
            session={session}
            settings={settings}
            onComplete={content => handleSessionUpdate({
              morning_brief_viewed: true,
              morning_brief_content: JSON.stringify(content)
            })}
          />
        )}
        {activePhase === 1 && (
          <VideoLinks
            topic={topic}
            onContinue={() => setActivePhase(2)}
          />
        )}
        {activePhase === 2 && (
          <StudyNotes
            user={user}
            day={viewingDay}
            topic={topic}
            session={session}
            onNotesChange={notes => handleSessionUpdate({ study_notes: notes })}
            onContinue={() => setActivePhase(3)}
          />
        )}
        {activePhase === 3 && (
          <MindMapScaffold
            user={user}
            topic={topic}
            session={session}
            settings={settings}
            onComplete={content => handleSessionUpdate({ mind_map_generated: true, mind_map_content: content })}
            onContinue={() => setActivePhase(4)}
          />
        )}
        {activePhase === 4 && (
          <NotebookLMPrompt
            topic={topic}
            session={session}
            onContinue={() => setActivePhase(5)}
          />
        )}
        {activePhase === 5 && (
          <MCQQuiz
            user={user}
            topic={topic}
            session={session}
            settings={settings}
            onComplete={(questions, answers, score, scenario) =>
              handleSessionUpdate({
                quiz_scenario: scenario,
                quiz_questions: questions,
                quiz_answers: answers,
                quiz_score: score,
                quiz_passed: score >= 4,
              })
            }
            onContinue={() => setActivePhase(6)}
          />
        )}
        {activePhase === 6 && (
          <EveningLock
            user={user}
            topic={topic}
            session={session}
            settings={settings}
            onLock={() => handleSessionUpdate({ locked: true })}
            onUnlock={() => handleSessionUpdate({ locked: false })}
          />
        )}
      </div>
    </div>
  );
}
