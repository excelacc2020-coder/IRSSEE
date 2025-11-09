import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, AppStatus } from '../types';
import { Message } from './Message';
import { SendIcon, StartIcon, NextIcon, LoadingIcon, MicrophoneIcon, HamburgerIcon } from './icons';

// Fix: Add missing Web Speech API type definitions to resolve compilation errors.
// These types are for browser APIs not included in default TS DOM libs.
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// Type definition for SpeechRecognition
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

// Type definition for the SpeechRecognition constructor
interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

// Extend the global Window interface to include vendor-prefixed SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  appStatus: AppStatus;
  onStartLesson: () => void;
  onNextLesson: () => void;
  inputDisabled: boolean;
  onExitMockExam: () => void;
  onToggleSidebar: () => void;
  currentLessonTopic?: string;
}

// Add this type definition for SpeechRecognitionEvent
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}


export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  appStatus,
  onStartLesson,
  onNextLesson,
  inputDisabled,
  onExitMockExam,
  onToggleSidebar,
  currentLessonTopic,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setInputValue(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access was denied. Please allow microphone access in your browser settings to use this feature.');
      }
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  const handleSend = () => {
    if (inputValue.trim() && !inputDisabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
    setIsRecording(!isRecording);
  };

  const renderActionButton = () => {
    switch (appStatus) {
      case 'IDLE':
        return (
          <button
            onClick={onStartLesson}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors duration-200"
          >
            <StartIcon />
            Start Today's Lesson
          </button>
        );
      case 'TOPIC_PASSED':
        return (
          <button
            onClick={onNextLesson}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors duration-200"
          >
            <NextIcon />
            Proceed to Next Topic
          </button>
        );
      case 'MOCK_EXAM_COMPLETED':
        return (
            <button
                onClick={onExitMockExam}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors duration-200"
            >
                Return to Lessons
            </button>
        );
      case 'COMPLETED':
        return <p className="text-green-400 font-semibold">Course Completed!</p>;
      default:
        return null;
    }
  };
  
  const getPlaceholderText = () => {
    if (isRecording) return "Listening...";
    if (inputDisabled) {
        if (appStatus === 'GENERATING_MOCK_EXAM') return "Generating mock exam...";
        return "Waiting for task completion...";
    }
    if (appStatus === 'MOCK_EXAM_IN_PROGRESS') return "Enter your answer (A, B, C, or D)...";
    return "Type your detailed answer here...";
  };

  return (
    <div className="flex flex-col h-full">
      <header className="md:hidden flex items-center justify-between p-2 border-b border-slate-700 bg-slate-800 flex-shrink-0">
        <button onClick={onToggleSidebar} className="p-2 text-slate-300 hover:text-white">
          <HamburgerIcon />
        </button>
        <div className="text-center">
            <h2 className="text-sm font-semibold text-white truncate px-2">{currentLessonTopic || 'Lesson Plan'}</h2>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="flex flex-col flex-1 p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-6">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
            {(appStatus === 'GENERATING' || appStatus === 'EVALUATING' || appStatus === 'GENERATING_MOCK_EXAM') && (
                <div className="flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center"><LoadingIcon /></div>
                    <div className="w-full">
                        <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-auto pt-4 border-t border-slate-700">
            <div className="flex justify-center mb-4">
              {renderActionButton()}
            </div>
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholderText()}
                disabled={inputDisabled}
                rows={appStatus === 'MOCK_EXAM_IN_PROGRESS' ? 1 : 4}
                className="w-full p-4 pl-14 pr-16 text-slate-200 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-all duration-200 disabled:opacity-50"
              />
              <button
                onClick={handleMicClick}
                disabled={inputDisabled}
                title={isRecording ? 'Stop recording' : 'Start recording'}
                className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-700 disabled:opacity-50 transition-colors duration-200 ${isRecording ? 'animate-pulse' : ''}`}
              >
                <MicrophoneIcon isRecording={isRecording} />
              </button>
              <button
                onClick={handleSend}
                disabled={inputDisabled || inputValue.trim() === ''}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <SendIcon />
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center mt-2">
                Educational use only, US tax context (SEE focus). Not legal/tax advice to the public.
            </p>
          </div>
      </div>
    </div>
  );
};