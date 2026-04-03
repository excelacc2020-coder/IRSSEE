import { useState } from 'react';
import { LESSON_PLAN, PART_LABELS } from '../constants/lessonPlan';
import type { ActiveTab, Session } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentDay: number;
  sessions: Session[];
  onDaySelect: (day: number) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const NAV_TABS: { id: ActiveTab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'cards', label: 'Cards' },
  { id: 'settings', label: 'Settings' },
];

function getStatusColor(day: number, currentDay: number, sessions: Session[]): string {
  if (day > currentDay) return 'bg-th-hover'; // locked
  const session = sessions.find(s => s.day === day);
  if (!session) return 'bg-gray-600'; // not started
  if (session.locked) return 'bg-green-600'; // completed
  if (session.quiz_passed) return 'bg-yellow-600'; // quiz done
  if (session.morning_brief_viewed) return 'bg-blue-600'; // in progress
  return 'bg-gray-600';
}

export default function Sidebar({
  activeTab,
  onTabChange,
  currentDay,
  sessions,
  onDaySelect,
  theme,
  toggleTheme,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedPart, setExpandedPart] = useState<number>(
    LESSON_PLAN.find(t => t.day === currentDay)?.part ?? 1
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-th-border">
        <h1 className="text-lg font-bold text-th-text">EA Command Center</h1>
        <p className="text-xs text-th-text-faint mt-0.5">SEE Exam Prep — Day {currentDay} of 50</p>
      </div>

      {/* Nav Tabs */}
      <nav className="px-3 py-3 border-b border-th-border space-y-1">
        {NAV_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { onTabChange(tab.id); setMobileOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-th-text'
                : 'text-th-text-muted hover:text-th-text hover:bg-th-input'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Lesson Plan */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-xs font-semibold text-th-text-faint uppercase tracking-wider px-1 mb-2">
          Lesson Plan
        </p>

        {([1, 2, 3] as const).map(part => {
          const partTopics = LESSON_PLAN.filter(t => t.part === part);
          const isExpanded = expandedPart === part;

          return (
            <div key={part} className="mb-2">
              <button
                onClick={() => setExpandedPart(isExpanded ? 0 : part)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-th-text-muted hover:text-th-text rounded-md hover:bg-th-input transition-colors"
              >
                <span>{PART_LABELS[part]}</span>
                <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>›</span>
              </button>

              {isExpanded && (
                <div className="mt-1 space-y-0.5">
                  {partTopics.map(topic => {
                    const statusColor = getStatusColor(topic.day, currentDay, sessions);
                    const isCurrent = topic.day === currentDay;

                    return (
                      <button
                        key={topic.day}
                        onClick={() => {
                          onDaySelect(topic.day);
                          onTabChange('today');
                          setMobileOpen(false);
                        }}
                        disabled={topic.day > currentDay}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                          isCurrent
                            ? 'bg-th-hover text-th-text font-medium'
                            : topic.day > currentDay
                            ? 'text-th-text-faint cursor-not-allowed'
                            : 'text-th-text-muted hover:text-th-text hover:bg-th-input cursor-pointer'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
                        <span className="truncate">
                          Day {topic.day}: {topic.topic}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Theme Toggle */}
      <div className="px-4 py-3 border-t border-th-border">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-th-text-secondary hover:text-th-text hover:bg-th-input transition-colors"
        >
          <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          <span className="px-2 py-0.5 rounded bg-th-input text-xs text-th-text-muted">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-th-border">
        <div className="grid grid-cols-2 gap-1 text-xs text-th-text-faint">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-600" />Complete</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-600" />Quiz done</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600" />In progress</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600" />Not started</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-th-sidebar border-b border-th-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-sm font-bold text-th-text">EA Command Center</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-th-text-muted hover:text-th-text p-1"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-th-overlay/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed top-0 left-0 z-40 h-full w-72 bg-th-sidebar border-r border-th-border transform transition-transform pt-12 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-th-sidebar border-r border-th-border h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </div>
    </>
  );
}
