
import React from 'react';
import type { ChatMessage } from '../types';
import { UserIcon, AiIcon, SystemIcon, LinkIcon } from './icons';

interface MessageProps {
  message: ChatMessage;
}

const renderContent = (text: string) => {
    // FIX: Escaped forward slashes in the URL part of the regex to prevent parsing errors in TSX.
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|https:\/\/S+)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="bg-slate-900 rounded px-1.5 py-1 text-sm text-amber-300">{part.slice(1, -1)}</code>;
        }
        return part.split('\n').map((line, lineIndex) => (
          <React.Fragment key={`${index}-${lineIndex}`}>
            {line}
            {lineIndex < part.split('\n').length - 1 && <br />}
          </React.Fragment>
        ));
    });
};

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isAI = message.sender === 'ai';
  const isSystem = message.sender === 'system';

  const containerClasses = `flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`;
  
  const bubbleClasses = `max-w-xl xl:max-w-2xl p-4 rounded-lg shadow-md ${
    isUser
      ? 'bg-indigo-600 text-white rounded-br-none'
      : isAI
      ? 'bg-slate-700 text-slate-200 rounded-bl-none'
      : 'bg-slate-600/50 border border-slate-500 text-slate-300 rounded-bl-none w-full'
  }`;

  const icon = isUser ? <UserIcon /> : isAI ? <AiIcon /> : <SystemIcon />;

  return (
    <div className={containerClasses}>
      <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center shadow-inner">
        {icon}
      </div>
      <div className="flex flex-col">
        <div className={bubbleClasses}>
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                {renderContent(message.text)}
            </div>
        </div>
        {message.references && message.references.length > 0 && (
            <div className="mt-2 ml-2 flex flex-col gap-1.5">
                {message.references.map((ref, index) => (
                    <a 
                        key={index} 
                        href={ref.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                    >
                        <LinkIcon />
                        <span>{ref.title || ref.uri}</span>
                    </a>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
