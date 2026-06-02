import { useState, useEffect, Fragment } from 'react';
import {
  postDoc,
  triggerPreview,
  triggerPublish,
  triggerUnpublish,
  deleteDocument,
  getToken,
  daPathToPreviewUrl,
  daPathToLiveUrl,
} from '../api/daApi';
import { applyTemplate, rowToOutputPath, runGenerationQa, runPageQa } from '../lib/generate';
import type { CsvRow, TemplateState, RowResult, QaResult } from '../types';

interface Props {
  rows: CsvRow[];
  template: TemplateState;
  generateBlockReason?: string;
  onResultsChange?: (hasResults: boolean) => void;
}

const CONCURRENCY = 3;

type BulkOp = 'idle' | 'generating' | 'previewing' | 'publishing' | 'unpublishing' | 'deleting';

export default function GeneratePanel({ rows, template, generateBlockReason, onResultsChange }: Props) {
  const outputDir = template.outputDir ?? '';
  const [results, setResults] = useState<RowResult[]>([]);
  const [bulkOp, setBulkOp] = useState<BulkOp>('idle');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    onResultsChange?.(results.some((r) => r.stage !== 'pending'));
  }, [results]);

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
    unpublished: results.filter((r) => r.stage === 'unpublished').length,
    deletable: results.filter((r) =>
      ['generated', 'qa-fail', 'previewing', 'previewed', 'publishing',
        'published', 'unpublishing', 'unpublished'].includes(r.stage),
    ).length,
  };

  async function runBatch(items: RowResult[], fn: (r: RowResult) => Promise<void>) {
    const queue = [...items];
    let idx = 0;
    async function worker() {
      while (idx < queue.length) {
         
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
         
        await processRow(queue[idx++]);
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    setBulkOp('idle');
  }

  async function handleGenerateRow(rowId: string) {
    if (!template.html) return;
    const row = rows.find((r) => r['_id'] === rowId);
    if (!row) return;
    const path = rowToOutputPath(row, outputDir);
    setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, stage: 'generating' } : r));
    try {
      const html = applyTemplate(template.html!, row);
      const qa = runGenerationQa(html);
      const res = await postDoc(path, html);
      setResults((prev) => prev.map((r) =>
        r.id === rowId ? { ...r, stage: 'generated', qa, editUrl: res.source?.editUrl } : r,
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, stage: 'error', error: msg } : r));
    }
  }

  async function handleDeleteRow(rowId: string, path: string) {
    const token = getToken();
    if (!token) return;
    setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, stage: 'deleting' } : r));
    try {
      await deleteDocument(path, token);
      setResults((prev) => prev.map((r) =>
        r.id === rowId ? { id: r.id, path: r.path, stage: 'pending' } : r,
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, stage: 'error', error: msg } : r));
    }
  }

  async function handleBulkDelete() {
    const token = getToken();
    if (!token) return;
    setDeleteModalOpen(false);
    const targets = results.filter((r) =>
      ['generated', 'qa-fail', 'previewing', 'previewed', 'publishing',
        'published', 'unpublishing', 'unpublished'].includes(r.stage),
    );
    setBulkOp('deleting');
    await runBatch(targets, async (r) => {
      setResults((prev) => prev.map((x) => x.id === r.id ? { ...x, stage: 'deleting' } : x));
      try {
        await deleteDocument(r.path, token);
        setResults((prev) => prev.map((x) =>
          x.id === r.id ? { id: x.id, path: x.path, stage: 'pending' } : x,
        ));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setResults((prev) => prev.map((x) => x.id === r.id ? { ...x, stage: 'error', error: msg } : x));
      }
    });
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

  async function handlePreviewRow(rowId: string, path: string) {
    const token = getToken();
    if (!token) return;
    setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, stage: 'previewing' } : r));
    try {
      await triggerPreview(path, token);
      setResults((prev) => prev.map((r) =>
        r.id === rowId ? { ...r, stage: 'previewed', previewUrl: daPathToPreviewUrl(path) } : r,
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, stage: 'error', error: msg } : r));
    }
  }

  async function handlePublishRow(rowId: string, path: string) {
    const token = getToken();
    if (!token) return;
    setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, stage: 'publishing' } : r));
    try {
      await triggerPublish(path, token);
      const liveUrl = daPathToLiveUrl(path);
      let qa: QaResult | undefined;
      try {
        const resp = await fetch(liveUrl);
        const html = await resp.text();
        qa = runPageQa(html);
      } catch {
        // QA fetch failed — page is still published
      }
      setResults((prev) => prev.map((r) =>
        r.id === rowId ? { ...r, stage: 'published', liveUrl, qa } : r,
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, stage: 'error', error: msg } : r));
    }
  }

  async function handleUnpublishRow(rowId: string, path: string) {
    const token = getToken();
    if (!token) return;
    setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, stage: 'unpublishing' } : r));
    try {
      await triggerUnpublish(path, token);
      setResults((prev) => prev.map((r) =>
        r.id === rowId ? { ...r, stage: 'unpublished', liveUrl: undefined } : r,
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, stage: 'error', error: msg } : r));
    }
  }

  async function handleUnpublish() {
    const token = getToken();
    if (!token) return;
    const targets = results.filter((r) => r.stage === 'published');
    setBulkOp('unpublishing');
    await runBatch(targets, async (r) => {
      setResults((prev) => prev.map((x) => x.id === r.id ? { ...x, stage: 'unpublishing' } : x));
      try {
        await triggerUnpublish(r.path, token);
        setResults((prev) => prev.map((x) =>
          x.id === r.id ? { ...x, stage: 'unpublished', liveUrl: undefined } : x,
        ));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setResults((prev) => prev.map((x) => x.id === r.id ? { ...x, stage: 'error', error: msg } : x));
      }
    });
    setBulkOp('idle');
  }

  const showPreviewBtn = !running && counts.previewable > 0;
  const showPublishBtn = !running && counts.publishable > 0;
  const showUnpublishBtn = !running && counts.published >= 2;
  const showDeleteBtn = !running && counts.deletable >= 2;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gray-200 text-gray-600">
          3
        </span>
        <h2 className="font-medium text-gray-900">Generate</h2>
      </div>

      {outputDir && (
        <p className="text-xs text-gray-400">
          Documents will be written to{' '}
          <code className="bg-gray-100 px-1 rounded font-mono">{outputDir}/{'{{url_slug}}'}</code>
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {results.length > 0 && !running && (
          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 cursor-pointer transition-colors border border-gray-200"
          >
            Reset Results
          </button>
        )}

        <div className="relative group inline-block">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={running || !template.html || !!generateBlockReason}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {bulkOp === 'generating'
              ? `Generating… ${counts.generated + counts.error} / ${rows.length}`
              : `Generate ${rows.length} document${rows.length !== 1 ? 's' : ''}`}
          </button>
          {generateBlockReason && (
            <div className="absolute bottom-full left-0 mb-1.5 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity duration-150">
              {generateBlockReason}
            </div>
          )}
        </div>

        {showPreviewBtn && (
          <button
            type="button"
            onClick={handlePreview}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 cursor-pointer transition-colors"
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
            className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 cursor-pointer transition-colors"
          >
            Publish {counts.publishable} document{counts.publishable !== 1 ? 's' : ''}
          </button>
        )}

        {bulkOp === 'publishing' && (
          <span className="text-sm text-green-600 font-medium">
            Publishing… {counts.published} / {counts.publishable}
          </span>
        )}

        {showUnpublishBtn && (
          <button
            type="button"
            onClick={handleUnpublish}
            className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 cursor-pointer transition-colors"
          >
            Unpublish {counts.published} documents
          </button>
        )}

        {bulkOp === 'unpublishing' && (
          <span className="text-sm text-red-600 font-medium">
            Unpublishing… {counts.unpublished} / {results.filter((r) => r.stage === 'unpublishing' || r.stage === 'unpublished').length}
          </span>
        )}

        {showDeleteBtn && (
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="px-5 py-2.5 bg-red-700 text-white text-sm font-medium rounded-xl hover:bg-red-800 cursor-pointer transition-colors"
          >
            Delete {counts.deletable} documents
          </button>
        )}

        {bulkOp === 'deleting' && (
          <span className="text-sm text-red-700 font-medium">
            Deleting…
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
          <table className="text-xs min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[280px]">Path</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Issues</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Generate</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-44">Preview</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-52">Publish</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-b border-gray-100">
                    <td className="px-3 py-2 font-mono text-gray-600 whitespace-nowrap min-w-[280px]">
                      {r.editUrl ? (
                        <a href={r.editUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                          {r.path}
                          <ExternalLinkIcon />
                        </a>
                      ) : r.path}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <QaIssueBadge
                        qa={r.qa}
                        expanded={expandedRowId === r.id}
                        onToggle={() => toggleRowDetail(r.id)}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <GeneratePill
                        result={r}
                        onGenerate={() => handleGenerateRow(r.id)}
                        onDelete={() => handleDeleteRow(r.id, r.path)}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <PreviewPill result={r} onPreview={() => handlePreviewRow(r.id, r.path)} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <PublishPill result={r} onPublish={() => handlePublishRow(r.id, r.path)} onUnpublish={() => handleUnpublishRow(r.id, r.path)} />
                    </td>
                  </tr>
                  {expandedRowId === r.id && r.qa && (
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          {r.qa.checks.map((check) => (
                            <div key={check.id} className="flex gap-2 items-start">
                              <span className={`shrink-0 font-semibold ${check.pass ? 'text-green-600' : 'text-amber-700'}`}>
                                {check.pass ? '✓' : '✗'}
                              </span>
                              <div className="flex flex-col gap-0.5">
                                <span className={`font-semibold ${check.pass ? 'text-gray-700' : 'text-amber-900'}`}>
                                  {check.label}
                                </span>
                                <span className="text-gray-500">{check.description}</span>
                              </div>
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

      {resetModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-max max-w-[90vw] flex flex-col gap-4 shadow-xl">
            <h3 className="font-semibold text-gray-900 text-base">Reset results?</h3>
            <p className="text-sm text-gray-500">
              This will clear all {results.length} result{results.length !== 1 ? 's' : ''} from this
              view and unlock the template and data inputs. Documents already written to DA are not
              deleted — use the Delete button to remove them first.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setResults([]); setResetModalOpen(false); }}
                className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-900 cursor-pointer transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-max max-w-[90vw] flex flex-col gap-4 shadow-xl">
            <h3 className="font-semibold text-gray-900 text-base">
              Delete {counts.deletable} document{counts.deletable !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-gray-500">
              This will permanently delete the following documents from DA:
            </p>
            <ul className="text-xs font-mono text-gray-700 max-h-64 overflow-y-auto border border-gray-100 rounded-lg p-3 flex flex-col gap-1">
              {results
                .filter((r) =>
                  ['generated', 'qa-fail', 'previewing', 'previewed', 'publishing',
                    'published', 'unpublishing', 'unpublished'].includes(r.stage),
                )
                .map((r) => <li key={r.id} className="whitespace-nowrap">{r.path}</li>)}
            </ul>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 cursor-pointer transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
      <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
      <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
    </svg>
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
  const failCount = qa.checks.filter((c) => !c.pass).length;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`font-medium flex items-center gap-1 cursor-pointer ${
        qa.pass ? 'text-green-600 hover:text-green-800' : 'text-amber-700 hover:text-amber-900'
      }`}
    >
      {qa.pass ? '✓ Pass' : `Issues (${failCount})`}
      <span className="text-xs leading-none">{expanded ? '▲' : '▼'}</span>
    </button>
  );
}

function GeneratePill({
  result,
  onGenerate,
  onDelete,
}: {
  result: RowResult;
  onGenerate: () => void;
  onDelete: () => void;
}) {
  const { stage, error } = result;
  if (stage === 'generating') return <span className="text-blue-600 font-medium">Generating…</span>;
  if (stage === 'deleting') return <span className="text-red-500 font-medium">Deleting…</span>;
  if (stage === 'error') {
    const codeMatch = error?.match(/^(\d{3})[:\s]/);
    const code = codeMatch?.[1];
    const label = code === '403' ? 'Access Denied'
                : code === '404' ? 'Not Found'
                : code === '500' ? 'Server Error'
                : 'Error';
    const display = code ? `${label} (${code})` : 'Error';
    return <span className="text-red-600 font-medium cursor-help" title={error}>{display}</span>;
  }
  if (['generated', 'qa-fail', 'previewing', 'previewed', 'publishing',
    'published', 'unpublishing', 'unpublished'].includes(stage)) {
    return (
      <button type="button" onClick={onDelete}
        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer">
        Delete
      </button>
    );
  }
  return (
    <button type="button" onClick={onGenerate}
      className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors cursor-pointer">
      Generate
    </button>
  );
}

function PreviewPill({ result, onPreview }: { result: RowResult; onPreview: () => void }) {
  const { stage, previewUrl } = result;
  if (stage === 'previewing') return <span className="text-indigo-500 font-medium">Previewing…</span>;
  if (previewUrl) {
    return (
      <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1">
        ✓ aem.page
        <ExternalLinkIcon />
      </a>
    );
  }
  if (stage === 'generated') {
    return (
      <button type="button" onClick={onPreview}
        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors cursor-pointer">
        Preview
      </button>
    );
  }
  return <span className="text-gray-300">—</span>;
}

function PublishPill({
  result,
  onPublish,
  onUnpublish,
}: {
  result: RowResult;
  onPublish: () => void;
  onUnpublish: () => void;
}) {
  const { stage, liveUrl } = result;
  if (stage === 'publishing') return <span className="text-green-500 font-medium">Publishing…</span>;
  if (stage === 'unpublishing') return <span className="text-orange-500 font-medium">Unpublishing…</span>;
  if (stage === 'unpublished') {
    return (
      <button type="button" onClick={onPublish}
        className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors cursor-pointer">
        Publish
      </button>
    );
  }
  if (liveUrl) {
    return (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-green-700 font-medium hover:underline inline-flex items-center gap-1">
          ✓ aem.live
          <ExternalLinkIcon />
        </a>
        <button type="button" onClick={onUnpublish}
          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer">
          Unpublish
        </button>
      </div>
    );
  }
  if (stage === 'previewed') {
    return (
      <button type="button" onClick={onPublish}
        className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors cursor-pointer">
        Publish
      </button>
    );
  }
  return <span className="text-gray-300">—</span>;
}
