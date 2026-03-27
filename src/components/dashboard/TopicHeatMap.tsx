import { LESSON_PLAN, PART_LABELS } from '../../constants/lessonPlan';
import type { Session } from '../../types';

interface TopicHeatMapProps {
  sessions: Session[];
  currentDay: number;
}

function getHeatColor(session: Session | undefined, day: number, currentDay: number): { bg: string; label: string } {
  if (day > currentDay) return { bg: 'bg-gray-800', label: 'Locked' };
  if (!session) return { bg: 'bg-gray-700', label: 'Not started' };
  if (session.locked) {
    const score = session.quiz_score ?? 0;
    const total = session.quiz_questions ? (Array.isArray(session.quiz_questions) ? session.quiz_questions.length : 0) : 0;
    const pct = total > 0 ? score / total : 0;
    if (pct >= 0.83) return { bg: 'bg-green-600', label: `Complete — ${score}/${total}` };
    if (pct >= 0.5) return { bg: 'bg-yellow-600', label: `Review — ${score}/${total}` };
    return { bg: 'bg-red-700', label: `Weak — ${score}/${total}` };
  }
  if (session.quiz_passed) return { bg: 'bg-yellow-500', label: 'Quiz passed' };
  if (session.morning_brief_viewed) return { bg: 'bg-blue-600', label: 'In progress' };
  return { bg: 'bg-gray-600', label: 'Started' };
}

export default function TopicHeatMap({ sessions, currentDay }: TopicHeatMapProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />Strong (83%+)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-600 inline-block" />Review needed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-700 inline-block" />Weak (&lt;50%)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />In progress</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-700 inline-block" />Not started</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-800 inline-block" />Locked</span>
      </div>

      {([1, 2, 3] as const).map(part => (
        <div key={part} className="mb-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {PART_LABELS[part]}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {LESSON_PLAN.filter(t => t.part === part).map(t => {
              const session = sessions.find(s => s.day === t.day);
              const { bg, label } = getHeatColor(session, t.day, currentDay);

              return (
                <div
                  key={t.day}
                  title={`Day ${t.day}: ${t.topic}\n${label}`}
                  className={`${bg} rounded-lg p-2.5 cursor-default transition-opacity hover:opacity-80`}
                >
                  <div className="text-xs font-bold text-white/80">Day {t.day}</div>
                  <div className="text-xs text-white/60 mt-0.5 leading-tight line-clamp-2">{t.topic}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
