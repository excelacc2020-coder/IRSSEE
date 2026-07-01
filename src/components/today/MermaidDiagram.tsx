import { useEffect, useRef, useState } from 'react';

/**
 * Renders a Mermaid flowchart definition to SVG.
 *
 * Mermaid is loaded at runtime from a CDN via dynamic import rather than as an
 * npm dependency — the project lives on a file-synced drive where installing
 * mermaid's large native dependency tree is unreliable. The CDN module is
 * fetched once (cached) and works the same in dev and on Vercel.
 */

// Typed as `string` (not a string literal) so TypeScript treats the dynamic
// import as Promise<any> instead of trying to resolve it as a local module.
const MERMAID_CDN: string = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mermaidPromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadMermaid(): Promise<any> {
  if (!mermaidPromise) {
    mermaidPromise = import(/* @vite-ignore */ MERMAID_CDN).then(mod => {
      const mermaid = mod.default ?? mod;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        htmlLabels: true,
        flowchart: { htmlLabels: true, curve: 'basis', useMaxWidth: true },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

let idCounter = 0;

export default function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setErrMsg('');
    setSvg('');

    const isDark =
      typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const themed =
      `%%{init: {'theme':'${isDark ? 'dark' : 'base'}','flowchart':{'htmlLabels':true}}}%%\n${chart}`;
    const renderId = `mmd-${++idCounter}`;

    loadMermaid()
      .then(mermaid => mermaid.render(renderId, themed))
      .then(({ svg }: { svg: string }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch((e: unknown) => {
        if (!cancelled) setErrMsg(e instanceof Error ? e.message : String(e));
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  // Fallback: surface the actual error (so it can be diagnosed) and keep the
  // raw definition available in a collapsible block — information is never lost.
  if (errMsg) {
    return (
      <div className="text-xs">
        <p className="text-red-600 dark:text-red-400 mb-1">Diagram couldn’t render: {errMsg}</p>
        <details>
          <summary className="text-th-text-faint cursor-pointer">Show diagram source</summary>
          <pre className="text-th-text-secondary whitespace-pre-wrap bg-th-input rounded-lg p-3 mt-1 overflow-x-auto">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center gap-2 text-xs text-th-text-muted py-6">
        <span className="inline-block w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram w-full overflow-x-auto py-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
