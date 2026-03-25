import { useState } from 'react';
import { resolveTemplate } from '../api/serverApi.js';
import type { TemplateResolveResponse } from '../types.js';

interface Props {
  onConfirm: (result: TemplateResolveResponse) => void;
  onBack: () => void;
}

export function TemplateStep({ onConfirm, onBack }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TemplateResolveResponse | null>(null);

  async function handleLoad() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await resolveTemplate(trimmed);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Template</h2>
        <p className="text-gray-500 text-sm">
          Enter a DA page URL. The server will fetch its HTML and detect placeholder tokens like{' '}
          <code className="bg-gray-100 px-1 rounded">{'[[title]]'}</code> and{' '}
          <code className="bg-gray-100 px-1 rounded">{'[[description]]'}</code>.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-700">Template URL or source path</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            placeholder="https://main--da-express-milo--adobecom.aem.live/drafts/…"
            className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleLoad}
            disabled={!url.trim() || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load'}
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {result && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-green-800 text-sm font-medium">Template loaded</span>
              <span className="text-gray-400 text-xs font-mono truncate">{result.sourcePath}</span>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Detected placeholders ({result.placeholders.length})
              </p>
              {result.placeholders.length === 0 ? (
                <p className="text-gray-400 text-sm italic">
                  No {'[[...]]'} tokens found. You can still define bindings manually.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.placeholders.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-mono"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => result && onConfirm(result)}
          disabled={!result}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Define bindings →
        </button>
      </div>
    </div>
  );
}
