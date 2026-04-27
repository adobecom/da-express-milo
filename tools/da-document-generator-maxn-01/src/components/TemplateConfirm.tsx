import { useState } from 'react';
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

export default function TemplateConfirm({ state, onChange }: Props) {
  const [url, setUrl] = useState('');

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
      const is404 = msg.startsWith('404');
      onChange({
        status: is404 ? 'invalid' : 'error',
        html: null,
        sourcePath,
        placeholders: [],
        issues: [is404 ? 'Template not found — check the URL and confirm you have access' : `Fetch error: ${msg}`],
      });
    }
  }

  const showResult = state.status !== 'idle' && state.status !== 'loading';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          placeholder="https://da.live/edit#/adobecom/da-express-milo/drafts/…"
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
        />
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!url.trim() || state.status === 'loading'}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {state.status === 'loading' ? 'Loading…' : 'Confirm'}
        </button>
      </div>

      {showResult && (
        <div className={`rounded-xl p-4 border flex flex-col gap-3 ${STATUS_CARD[state.status]}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[state.status]}`}>
              {STATUS_LABEL[state.status]}
            </span>
            {state.sourcePath && (
              <code className="text-xs text-gray-500 break-all">{state.sourcePath}</code>
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

      <div className="text-xs text-gray-400 flex flex-col gap-0.5">
        <p>Accepted formats:</p>
        <code className="bg-gray-100 px-1 rounded">https://da.live/edit#/org/repo/path</code>
        <code className="bg-gray-100 px-1 rounded">https://da.live/#/org/repo/path</code>
        <code className="bg-gray-100 px-1 rounded">/org/repo/path</code>
        <code className="bg-gray-100 px-1 rounded">https://main--repo--org.aem.page/path</code>
      </div>
    </div>
  );
}
