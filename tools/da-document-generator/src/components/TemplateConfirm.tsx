import { useEffect, useState } from 'react';
import { cat, urlToSourcePath, validateTemplate } from '../api/daApi';
import type { TemplateState } from '../types';

interface Props {
  state: TemplateState;
  onChange: (state: TemplateState) => void;
}

const STATUS_BADGE: Record<string, string> = {
  ready: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  invalid: 'bg-red-100 text-red-700',
  error: 'bg-red-100 text-red-700',
};

const STATUS_CARD: Record<string, string> = {
  ready: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  invalid: 'bg-red-50 border-red-200',
  error: 'bg-red-50 border-red-200',
};

const STATUS_LABEL: Record<string, string> = {
  ready: 'Ready',
  warning: 'Warning',
  invalid: 'Invalid',
  error: 'Error',
};

const DEFAULT_TEMPLATE = '/adobecom/da-express-milo/drafts/maxn/document-generator-template';

export default function TemplateConfirm({ state, onChange }: Props) {
  const [url, setUrl] = useState(DEFAULT_TEMPLATE);
  const [showFormats, setShowFormats] = useState(false);

  async function handleConfirm() {
    if (!url.trim()) return;
    const sourcePath = urlToSourcePath(url.trim());
    onChange({ status: 'loading', html: null, sourcePath, placeholders: [], issues: [] });

    try {
      const html = await cat(sourcePath);
      const validation = validateTemplate(html);
      onChange({ status: validation.status, html, sourcePath, placeholders: validation.placeholders, issues: validation.issues });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const is403 = msg.startsWith('403');
      const is404 = msg.startsWith('404');
      onChange({
        status: is403 || is404 ? 'invalid' : 'error',
        html: null,
        sourcePath,
        placeholders: [],
        issues: [
          is403 ? 'Access denied — confirm you are in the correct DA organization'
                : is404 ? 'Template not found — check the URL and confirm you have access'
                : `Fetch error: ${msg}`,
        ],
      });
    }
  }

  useEffect(() => {
    if (!url.trim()) return;
    const timer = setTimeout(() => { handleConfirm(); }, 600);
    return () => clearTimeout(timer);
  }, [url]);

  const showResult = state.status !== 'idle' && state.status !== 'loading';

  return (
    <div className="flex flex-col gap-4">
      <div>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />


      <div className="text-xs text-gray-400 pt-1 pl-3">
        <button
          type="button"
          onClick={() => setShowFormats((v) => !v)}
          className="flex items-center gap-1 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <span>Accepted Formats</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
            <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
        </button>
        {showFormats && (
          <div className="flex flex-col gap-0.5 mt-1">
            <code className="bg-gray-100 px-1 rounded">https://da.live/edit#/adobecom/da-express-milo/drafts/maxn/document-generator-template</code>
            <code className="bg-gray-100 px-1 rounded">/adobecom/da-express-milo/drafts/maxn/document-generator-template</code>
            <code className="bg-gray-100 px-1 rounded">da-express-milo/drafts/maxn/document-generator-template</code>
          </div>
        )}
      </div>
      </div>

      {showResult && (
        <div className={`rounded-xl p-4 border flex flex-col gap-3 ${STATUS_CARD[state.status]}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[state.status]}`}>
              {STATUS_LABEL[state.status]}
            </span>
            {state.sourcePath && (
              <a
                href={`https://da.live/edit#${state.sourcePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 break-all hover:text-blue-600 font-mono inline-flex items-center gap-1"
              >
                {state.sourcePath}
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
                  <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z"/>
                  <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z"/>
                </svg>
              </a>
            )}
          </div>

          {state.placeholders.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                Placeholders ({state.placeholders.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {state.placeholders.map((p) => (
                  <code key={p} className="text-xs bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                    {`{{${p}}}`}
                  </code>
                ))}
              </div>
            </div>
          )}

          {state.issues.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">Issues</p>
              <ul className="flex flex-col gap-1">
                {state.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-gray-700">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
