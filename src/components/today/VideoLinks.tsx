import type { LessonTopic } from '../../types';

interface VideoLinksProps {
  topic: LessonTopic;
  onContinue: () => void;
}

export default function VideoLinks({ topic, onContinue }: VideoLinksProps) {
  const irsSearchUrl = (pub: string) =>
    `https://www.irs.gov/publications/${pub.toLowerCase().replace('pub ', 'p').replace(/\s+/g, '').replace(/ch\..+/, '')}`;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Video & Reference Materials</h3>
        <p className="text-sm text-gray-400 mt-1">
          Study video and IRS publications for {topic.topic}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* IRS Publications */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            IRS Publications
          </h4>
          <div className="space-y-2">
            {topic.irsPublications.map(pub => (
              <a
                key={pub}
                href={irsSearchUrl(pub)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <span className="text-blue-400 font-mono text-xs flex-shrink-0">{pub}</span>
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors truncate">
                  View on IRS.gov
                </span>
                <span className="ml-auto text-gray-600 group-hover:text-gray-400 transition-colors text-xs flex-shrink-0">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Video — direct link from lesson plan */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Study Video
          </h4>
          {topic.videoUrl ? (
            <div className="space-y-3">
              <a
                href={topic.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 bg-red-950/30 border border-red-900/50 hover:bg-red-950/50 rounded-lg transition-colors group"
              >
                <span className="text-red-400 flex-shrink-0 text-xl leading-none mt-0.5">▶</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors">
                    Watch on YouTube
                  </p>
                  {topic.videoNotes && (
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      {topic.videoNotes}
                    </p>
                  )}
                </div>
                <span className="ml-auto text-gray-600 group-hover:text-gray-400 transition-colors text-xs flex-shrink-0 mt-0.5">
                  ↗
                </span>
              </a>
            </div>
          ) : (
            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-gray-500 text-sm">
                {topic.videoNotes ?? 'No dedicated video for this day. Use the search links below or refer to IRS publications.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Quick Links
        </h4>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://www.irs.gov/search?q=${encodeURIComponent(topic.topic)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-md transition-colors"
          >
            Search IRS.gov
          </a>
          {/* Fallback YouTube search if no direct link */}
          {!topic.videoUrl && (
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic.videoKeywords[0] ?? topic.topic)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-md transition-colors"
            >
              Search YouTube
            </a>
          )}
          <a
            href="https://www.prometric.com/test-takers/search/see"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-md transition-colors"
          >
            SEE Exam Info
          </a>
          <a
            href="https://www.irs.gov/tax-professionals/enrolled-agents/enrolled-agent-information"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-md transition-colors"
          >
            EA Information
          </a>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Continue to Study Notes
        </button>
      </div>
    </div>
  );
}
