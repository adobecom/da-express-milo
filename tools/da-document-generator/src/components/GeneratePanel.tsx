import { useState, Fragment } from 'react';
import {
  postDoc,
  triggerPreview,
  triggerPublish,
  getToken,
  daPathToPreviewUrl,
  daPathToLiveUrl,
} from '../api/daApi';
import { applyTemplate, rowToOutputPath, runGenerationQa, runPageQa } from '../lib/generate';
import type { CsvRow, TemplateState, RowResult, QaResult } from '../types';

interface Props {
  rows: CsvRow[];
  template: TemplateState;
}

const DEFAULT_OUTPUT_DIR = '/adobecom/da-express-milo/drafts/maxn/document-generator';
const CONCURRENCY = 3;

type BulkOp = 'idle' | 'generating' | 'previewing' | 'publishing';

export default function GeneratePanel({ rows, template }: Props) {
  const [outputDir, setOutputDir] = useState(DEFAULT_OUTPUT_DIR);
  const [results, setResults] = useState<RowResult[]>([]);
  const [bulkOp, setBulkOp] = useState<BulkOp>('idle');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  function toggleRowDetail(id: string) {
    setExpandedRowId((prev) => (prev === id ? null : id));
  }

  const running = bulkOp !== 'idle';

  const counts = {
    generated: results.filter((r) =>
      ['generated', 'previewing', 'previewed', 'qa-fail', 'publishing', 'published'].includes(r.stage),
    ).length,
    previewable: results.filter((r) => r.stage === 'generated').length,
    previewed: results.filter((r) =>
      ['previewed', 'publishing', 'published'].includes(r.stage),
    ).length,
    publishable: results.filter((r) => r.stage === 'previewed').length,
    done: results.filter((r) => r.stage === 'generated').length,
    error: results.filter((r) => r.stage === 'error').length,
    published: results.filter((r) => r.stage === 'published').length,
  };

  async function runBatch(items: RowResult[], fn: (r: RowResult) => Promise<void>) {
    const queue = [...items];
    let idx = 0;
    async function worker() {
      while (idx < queue.length) {
        // eslint-disable-next-line no-await-in-loop
        await fn(queue[idx++]);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
  }

  async function handleGenerate() {
    if (!template.html) return;
    setResults(
      rows.map((row) => ({ id: row['_id'], path: rowToOutputPath(row, outputDir), stage: 'pending' })),
    );
    setBulkOp('generating');

    const queue = [...rows];
    let idx = 0;

    async function processRow(row: CsvRow) {
      const path = rowToOutputPath(row, outputDir);
      setResults((prev) =>
        prev.map((r) => (r.id === row['_id'] ? { ...r, stage: 'generating' } : r)),
      );
      try {
        const html = applyTemplate(template.html!, row);
        const qa = runGenerationQa(html);
        const res = await postDoc(path, html);
        setResults((prev) =>
          prev.map((r) =>
            r.id === row['_id']
              ? { ...r, stage: 'generated', qa, editUrl: res.source?.editUrl }
              : r,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setResults((prev) =>
          prev.map((r) => (r.id === row['_id'] ? { ...r, stage: 'error', error: msg } : r)),
        );
      }
    }

    async function worker() {
      while (idx < queue.length) {
        // eslint-disable-next-line no-await-in-loop
        await processRow(queue[idx++]);
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    setBulkOp('idle');
  }

  async function handlePreview() {
    const token = getToken();
    if (!token) return;
    const targets = results.filter((r) => r.stage === 'generated');
    setBulkOp('previewing');
    await runBatch(targets, async (r) => {
      setResults((prev) => prev.map((x) => (x.id === r.id ? { ...x, stage: 'previewing' } : x)));
      try {
        await triggerPreview(r.path, token);
        setResults((prev) =>
          prev.map((x) =>
            x.id === r.id
              ? { ...x, stage: 'previewed', previewUrl: daPathToPreviewUrl(r.path) }
              : x,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setResults((prev) =>
          prev.map((x) => (x.id === r.id ? { ...x, stage: 'error', error: msg } : x)),
        );
      }
    });
    setBulkOp('idle');
  }

  async function handlePublish() {
    const token = getToken();
    if (!token) return;
    const targets = results.filter((r) => r.stage === 'previewed' && r.qa?.pass);
    setBulkOp('publishing');
    await runBatch(targets, async (r) => {
      setResults((prev) => prev.map((x) => (x.id === r.id ? { ...x, stage: 'publishing' } : x)));
      try {
        await triggerPublish(r.path, token);
        const liveUrl = daPathToLiveUrl(r.path);
        let qa: QaResult | undefined;
        try {
          const resp = await fetch(liveUrl);
          const html = await resp.text();
          qa = runPageQa(html);
        } catch {
          // QA fetch failed — page is still published, just no QA data
        }
        setResults((prev) =>
          prev.map((x) =>
            x.id === r.id
              ? { ...x, stage: 'published', liveUrl, qa }
              : x,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setResults((prev) =>
          prev.map((x) => (x.id === r.id ? { ...x, stage: 'error', error: msg } : x)),
        );
      }
    });
    setBulkOp('idle');
  }

  const showPreviewBtn = !running && counts.previewable > 0;
  const showPublishBtn = !running && counts.publishable > 0;

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

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={running || !template.html}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {bulkOp === 'generating'
            ? `Generating… ${counts.generated + counts.error} / ${rows.length}`
            : `Generate ${rows.length} document${rows.length !== 1 ? 's' : ''}`}
        </button>

        {showPreviewBtn && (
          <button
            type="button"
            onClick={handlePreview}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Preview {counts.previewable} document{counts.previewable !== 1 ? 's' : ''}
          </button>
        )}

        {bulkOp === 'previewing' && (
          <span className="text-sm text-indigo-600 font-medium">
            Previewing… {counts.previewed} / {counts.previewable}
          </span>
        )}

        {showPublishBtn && (
          <button
            type="button"
            onClick={handlePublish}
            className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
          >
            Publish {counts.publishable} document{counts.publishable !== 1 ? 's' : ''}
          </button>
        )}

        {bulkOp === 'publishing' && (
          <span className="text-sm text-green-600 font-medium">
            Publishing… {counts.published} / {counts.publishable}
          </span>
        )}

        {results.length > 0 && !running && (
          <p className="text-sm text-gray-500 ml-auto">
            {counts.generated > 0 && <span className="text-green-600 font-medium">{counts.generated} generated </span>}
            {counts.previewed > 0 && <span className="text-indigo-600 font-medium">{counts.previewed} previewed </span>}
            {counts.published > 0 && <span className="text-green-700 font-medium">{counts.published} published </span>}
            {counts.error > 0 && <span className="text-red-600 font-medium">{counts.error} error</span>}
          </p>
        )}
      </div>

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-96 overflow-y-auto">
          <table className="text-xs w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Path</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Issues</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Generate</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">Preview</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">Publish</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-b border-gray-100">
                    <td className="px-3 py-2 font-mono text-gray-600 truncate max-w-[240px]">
                      {r.editUrl ? (
                        <a href={r.editUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {r.path}
                        </a>
                      ) : r.path}
                    </td>
                    <td className="px-3 py-2">
                      <QaIssueBadge
                        qa={r.qa}
                        expanded={expandedRowId === r.id}
                        onToggle={() => toggleRowDetail(r.id)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <GeneratePill result={r} />
                    </td>
                    <td className="px-3 py-2">
                      <PreviewPill result={r} />
                    </td>
                    <td className="px-3 py-2">
                      <PublishPill result={r} />
                    </td>
                  </tr>
                  {expandedRowId === r.id && r.qa && r.qa.issues.length > 0 && (
                    <tr className="border-b border-gray-100 bg-amber-50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex flex-col gap-3">
                          {r.qa.issues.map((issue) => (
                            <div key={issue.id} className="flex flex-col gap-0.5">
                              <span className="font-semibold text-amber-900">{issue.label}</span>
                              <span className="text-gray-600">{issue.description}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function QaIssueBadge({
  qa,
  expanded,
  onToggle,
}: {
  qa?: QaResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!qa) return <span className="text-gray-300">—</span>;
  if (qa.pass) return <span className="text-green-600 font-medium">✓ Pass</span>;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-amber-700 font-medium hover:text-amber-900 flex items-center gap-1"
    >
      {qa.issues.length} issue{qa.issues.length !== 1 ? 's' : ''}
      <span className="text-xs leading-none">{expanded ? '▲' : '▼'}</span>
    </button>
  );
}

function GeneratePill({ result }: { result: RowResult }) {
  const { stage, error } = result;
  if (stage === 'pending') return <span className="text-gray-300">—</span>;
  if (stage === 'generating') return <span className="text-blue-600 font-medium">Generating…</span>;
  if (stage === 'error') return <span className="text-red-600 font-medium cursor-help" title={error}>Error</span>;
  if (['generated', 'qa-fail', 'previewing', 'previewed', 'publishing', 'published'].includes(stage))
    return <span className="text-green-600 font-medium">Generated</span>;
  return <span className="text-gray-300">—</span>;
}

function PreviewPill({ result }: { result: RowResult }) {
  const { stage, previewUrl } = result;
  if (stage === 'previewing') return <span className="text-indigo-500 font-medium">Previewing…</span>;
  if (previewUrl) {
    return (
      <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:underline">
        ✓ aem.page ↗
      </a>
    );
  }
  return <span className="text-gray-300">—</span>;
}

function PublishPill({ result }: { result: RowResult }) {
  const { stage, liveUrl } = result;
  if (stage === 'publishing') return <span className="text-green-500 font-medium">Publishing…</span>;
  if (liveUrl) {
    return (
      <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-green-700 font-medium hover:underline">
        ✓ aem.live ↗
      </a>
    );
  }
  return <span className="text-gray-300">—</span>;
}
