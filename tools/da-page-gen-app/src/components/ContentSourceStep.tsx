import { useState } from 'react';

interface Props {
  onConfirm: (records: unknown[]) => void;
}

type Tab = 'paste' | 'upload';

export function ContentSourceStep({ onConfirm }: Props) {
  const [tab, setTab] = useState<Tab>('paste');
  const [pasteText, setPasteText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<unknown[] | null>(null);

  function parseJson(text: string): unknown[] | null {
    try {
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
      // Accept a single object as a one-item array
      if (parsed && typeof parsed === 'object') return [parsed];
      return null;
    } catch {
      return null;
    }
  }

  async function handleLoad() {
    setError('');
    let text = '';
    if (tab === 'paste') {
      text = pasteText.trim();
    } else if (file) {
      text = await file.text();
    }
    if (!text) {
      setError('Nothing to parse. Paste JSON or upload a file.');
      return;
    }
    const records = parseJson(text);
    if (!records) {
      setError('Invalid JSON. Expected an array of objects.');
      return;
    }
    setPreview(records);
  }

  function handleConfirm() {
    if (preview) onConfirm(preview);
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      tab === t
        ? 'border-purple-600 text-purple-700'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Content source</h2>
        <p className="text-gray-500 text-sm">
          Provide a JSON array where each object represents one page to generate.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 px-4 pt-2 gap-2">
          <button className={tabClass('paste')} onClick={() => setTab('paste')}>Paste JSON</button>
          <button className={tabClass('upload')} onClick={() => setTab('upload')}>Upload file</button>
        </div>
        <div className="p-4">
          {tab === 'paste' ? (
            <textarea
              className="w-full h-48 p-3 font-mono text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder={'[\n  { "id": "123", "title": "My Product", "description": "..." },\n  ...\n]'}
              value={pasteText}
              onChange={(e) => { setPasteText(e.target.value); setPreview(null); }}
            />
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); }}
              />
              <span className="text-gray-500 text-sm">
                {file ? file.name : 'Click or drag a .json file here'}
              </span>
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {preview && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium text-sm">
            ✓ Parsed <span className="font-bold">{preview.length}</span> record{preview.length !== 1 ? 's' : ''}
          </p>
          <details className="mt-2">
            <summary className="text-green-700 text-xs cursor-pointer hover:underline">
              Preview first record
            </summary>
            <pre className="mt-2 text-xs bg-white border border-green-200 rounded p-2 overflow-auto max-h-40">
              {JSON.stringify(preview[0], null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleLoad}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Parse
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!preview}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Use {preview ? `${preview.length} records` : 'records'} →
        </button>
      </div>
    </div>
  );
}
