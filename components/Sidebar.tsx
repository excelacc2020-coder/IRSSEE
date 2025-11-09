import React from 'react';
import type { LessonProgress } from '../types';
import { ProgressBar } from './ProgressBar';
import { LockIcon, CheckCircleIcon, PlayIcon, CloseIcon } from './icons';

interface SidebarProps {
  lessons: LessonProgress[];
  currentLessonIndex: number;
  onSelectLesson: (index: number) => void;
  onStartMockExam: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ lessons, currentLessonIndex, onSelectLesson, onStartMockExam, isOpen, onClose }) => {
  const passedCount = lessons.filter(l => l.status === 'passed').length;
  const totalCount = lessons.length;
  const progress = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;
  const MIN_LESSONS_FOR_MOCK = 5;

  return (
    <aside className={`w-80 lg:w-96 bg-slate-900/70 backdrop-blur-sm border-r border-slate-700/50 flex flex-col h-full
        fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out
        md:static md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex justify-between items-center mb-6 p-4">
        <div>
            <h1 className="text-2xl font-bold text-white">IRS SEE Prep</h1>
            <p className="text-sm text-slate-400">Your AI-Powered Study Partner</p>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white md:hidden" aria-label="Close menu">
            <CloseIcon />
        </button>
      </div>
      
      <div className="mb-4 px-4">
        <ProgressBar progress={progress} />
        <p className="text-center text-sm text-slate-400 mt-2">{passedCount} of {totalCount} Topics Mastered</p>
      </div>

      <div className="mb-4 border-t border-b border-slate-700/50 py-4 px-4">
          <button
              onClick={onStartMockExam}
              disabled={passedCount < MIN_LESSONS_FOR_MOCK}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-500 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
              Start Mock Exam
          </button>
          {passedCount < MIN_LESSONS_FOR_MOCK && (
              <p className="text-xs text-center text-slate-500 mt-2">
                  Pass at least {MIN_LESSONS_FOR_MOCK} topics to unlock.
              </p>
          )}
      </div>
      
      <h2 className="text-lg font-semibold text-slate-300 mb-3 px-4">Lesson Plan</h2>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="space-y-2">
          {lessons.map((lesson, index) => {
            const isActive = index === currentLessonIndex;
            const isPassed = lesson.status === 'passed';
            
            let statusIcon;
            if (isPassed) {
              statusIcon = <CheckCircleIcon />;
            } else if (isActive) {
              statusIcon = <PlayIcon />;
            } else {
              statusIcon = <LockIcon />;
            }

            return (
              <li key={lesson.day}>
                <button
                  onClick={() => onSelectLesson(index)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/30 ring-1 ring-indigo-500'
                      : isPassed
                      ? 'bg-green-600/20'
                      : 'bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                      <div className="flex-1">
                          <p className={`font-semibold text-sm ${isActive ? 'text-indigo-300' : isPassed ? 'text-green-300' : 'text-slate-300'}`}>
                              Day {lesson.day}: {lesson.topic}
                          </p>
                          <p className="text-xs text-slate-400">{lesson.phase}</p>
                      </div>
                      <div className={`ml-3 ${isPassed ? 'text-green-400' : isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                          {statusIcon}
                      </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};