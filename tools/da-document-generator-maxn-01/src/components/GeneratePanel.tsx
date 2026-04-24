import { useState } from 'react';
import { postDoc } from '../api/daApi';
import { applyTemplate, rowToOutputPath } from '../lib/generate';
import type { CsvRow, TemplateState } from '../types';

interface RowResult {
  id: string;
  path: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  editUrl?: string;
  error?: string;
}

interface Props {
  rows: CsvRow[];
  template: TemplateState;
}

const DEFAULT_OUTPUT_DIR = '/adobecom/da-express-milo/drafts/maxn/document-generator';
const CONCURRENCY = 3;

export default function GeneratePanel({ rows, template }: Props) {
  const [outputDir, setOutputDir] = useState(DEFAULT_OUTPUT_DIR);
  const [results, setResults] = useState<RowResult[]>([]);
  const [running, setRunning] = useState(false);

  const doneCount = results.filter((r) => r.status === 'done').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const inProgress = results.filter((r) => r.status === 'generating').length;

  function initResults(): RowResult[] {
    return rows.map((row) => ({
      id: row['_id'],
      path: rowToOutputPath(row, outputDir),
      status: 'pending',
    }));
  }

  async function handleGenerate() {
    if (!template.html) return;
    const initial = initResults();
    setResults(initial);
    setRunning(true);

    const queue = [...rows];
    let idx = 0;

    async function processRow(row: CsvRow) {
      const path = rowToOutputPath(row, outputDir);
      setResults((prev) =>
        prev.map((r) => (r.id === row['_id'] ? { ...r, status: 'generating' } : r))
      );
      try {
        const html = applyTemplate(template.html!, row);
        const res = await postDoc(path, html);
        setResults((prev) =>
          prev.map((r) =>
            r.id === row['_id']
              ? { ...r, status: 'done', editUrl: res.source?.editUrl }
              : r
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setResults((prev) =>
          prev.map((r) => (r.id === row['_id'] ? { ...r, status: 'error', error: msg } : r))
        );
      }
    }

    async function worker() {
      while (idx < queue.length) {
        const row = queue[idx++];
        await processRow(row);
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker());
    await Promise.all(workers);
    setRunning(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gray-200 text-gray-600">
          3
        </span>
        <h2 className="font-medium text-gray-900">Generate</h2>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Output directory</label>
        <input
          type="text"
          value={outputDir}
          onChange={(e) => setOutputDir(e.target.value)}
          disabled={running}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        />
        <p className="text-xs text-gray-400">
          Documents will be written to{' '}
          <code className="bg-gray-100 px-1 rounded">{outputDir}/{'{{slug}}'}</code>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={running || !template.html}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running ? `Generating… ${doneCount + errorCount} / ${rows.length}` : `Generate ${rows.length} document${rows.length !== 1 ? 's' : ''}`}
        </button>

        {results.length > 0 && !running && (
          <p className="text-sm text-gray-600">
            <span className="text-green-600 font-medium">{doneCount} succeeded</span>
            {errorCount > 0 && (
              <span className="text-red-600 font-medium">, {errorCount} failed</span>
            )}
          </p>
        )}
      </div>

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-80 overflow-y-auto">
          <table className="text-xs w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Path</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 font-mono text-gray-600 truncate max-w-[320px]">
                    {r.status === 'done' && r.editUrl ? (
                      <a
                        href={r.editUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {r.path}
                      </a>
                    ) : (
                      r.path
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill result={r} inProgress={inProgress} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusPill({ result }: { result: RowResult; inProgress: number }) {
  if (result.status === 'pending') {
    return <span className="text-gray-400">Pending</span>;
  }
  if (result.status === 'generating') {
    return <span className="text-blue-600 font-medium">Generating…</span>;
  }
  if (result.status === 'done') {
    return <span className="text-green-600 font-medium">Done</span>;
  }
  return (
    <span className="text-red-600 font-medium" title={result.error}>
      Error
    </span>
  );
}
