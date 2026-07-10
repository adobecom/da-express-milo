import { useState, useEffect, useRef, Fragment } from 'react';
import { postDoc, createDocVersion, cat, docExists } from '../api/daApi';
import { applyTemplate, rowToOutputPath, runGenerationQa, finalizeGeneratedDoc } from '../lib/generate';
import { runBatch, DEFAULT_CONCURRENCY } from '../lib/concurrency';
import { useDaDocumentActions } from '../hooks/useDaDocumentActions';
import ConfirmModal from './ConfirmModal';
import {
  GeneratePill,
  PreviewPill,
  PublishPill,
  QaIssueBadge,
  ExternalLinkIcon,
  ExistenceBadge,
  ExistenceOutcomeBadge,
  type ExistenceCheck,
} from './StatusPills';
import type { CsvRow, ProductTypeConfig, RowResult } from '../types';

interface Props {
  rows: CsvRow[];
  productTypeConfigs: ProductTypeConfig[];
  overrideConfig?: ProductTypeConfig;
  generateBlockReason?: string;
  onResultsChange?: (hasResults: boolean) => void;
}

const CONCURRENCY = DEFAULT_CONCURRENCY;

type BulkOp = 'idle' | 'generating' | 'previewing' | 'publishing' | 'unpublishing' | 'deleting';

export default function GeneratePanel({ rows, productTypeConfigs, overrideConfig, generateBlockReason, onResultsChange }: Props) {
  const [results, setResults] = useState<RowResult[]>([]);
  const [bulkOp, setBulkOp] = useState<BulkOp>('idle');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [existenceStatus, setExistenceStatus] = useState<Record<string, ExistenceCheck>>({});
  const checkedPaths = useRef<Set<string>>(new Set());

  const actions = useDaDocumentActions<RowResult>(setResults, {
    afterDelete: (r) => ({ id: r.id, path: r.path, stage: 'pending' }),
  });

  const previewRows = results.length === 0
    ? rows.map((row) => {
        const cfg = overrideConfig ?? productTypeConfigs.find((c) => c.productType === row.product_type?.trim());
        return {
          id: row['_id'],
          path: cfg ? rowToOutputPath(row, cfg.outputDir) : '',
          productType: row.product_type ?? '',
          hasConfig: !!cfg,
        };
      })
    : [];

  useEffect(() => {
    onResultsChange?.(results.some((r) => r.stage !== 'pending'));
  }, [results]);

  useEffect(() => {
    if (results.length > 0) return;
    const toCheck = previewRows.filter(
      (pr) => pr.hasConfig && pr.path && !checkedPaths.current.has(pr.path),
    );
    if (toCheck.length === 0) return;
    toCheck.forEach((pr) => checkedPaths.current.add(pr.path));
    setExistenceStatus((prev) => {
      const next = { ...prev };
      for (const pr of toCheck) next[pr.path] = 'checking';
      return next;
    });
    void runBatch(toCheck, async (pr) => {
      try {
        const exists = await docExists(pr.path);
        setExistenceStatus((prev) => ({ ...prev, [pr.path]: exists ? 'exists' : 'not-found' }));
      } catch {
        setExistenceStatus((prev) => ({ ...prev, [pr.path]: 'error' }));
      }
    }, CONCURRENCY);
  }, [previewRows, results.length]);

  function toggleRowDetail(id: string) {
    setExpandedRowId((prev) => (prev === id ? null : id));
  }

  function lookupConfig(productType: string): ProductTypeConfig | undefined {
    return productTypeConfigs.find((c) => c.productType === productType?.trim());
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

  async function handleGenerate() {
    const existenceSnapshot = { ...existenceStatus };
    setResults(
      rows.map((row) => {
        const cfg = overrideConfig ?? lookupConfig(row.product_type ?? '');
        return { id: row['_id'], path: cfg ? rowToOutputPath(row, cfg.outputDir) : '', stage: 'pending' };
      }),
    );
    setBulkOp('generating');

    const generatedBatch = new Date().toISOString();
    const templateCache = new Map<string, string>();
    const queue = [...rows];
    let idx = 0;

    async function processRow(row: CsvRow) {
      const cfg = overrideConfig ?? lookupConfig(row.product_type ?? '');
      if (!cfg) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === row['_id']
              ? { ...r, stage: 'error', error: `No config found for product type: ${row.product_type || '(empty)'}` }
              : r,
          ),
        );
        return;
      }

      const path = rowToOutputPath(row, cfg.outputDir);
      setResults((prev) =>
        prev.map((r) => (r.id === row['_id'] ? { ...r, path, stage: 'generating' } : r)),
      );

      try {
        let templateHtml = templateCache.get(cfg.templatePath);
        if (!templateHtml) {
          templateHtml = await cat(cfg.templatePath);
          templateCache.set(cfg.templatePath, templateHtml);
        }
        const html = finalizeGeneratedDoc(applyTemplate(templateHtml, row), row, { generatedBatch });
        const qa = runGenerationQa(html);
        if (existenceSnapshot[path] === 'exists') {
          try {
            await createDocVersion(path, 'Pre-generation backup');
          } catch { /* best-effort: proceed with write even if versioning fails */ }
        }
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
    const row = rows.find((r) => r['_id'] === rowId);
    if (!row) return;
    const cfg = overrideConfig ?? lookupConfig(row.product_type ?? '');
    if (!cfg) {
      setResults((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? { ...r, stage: 'error', error: `No config found for product type: ${row.product_type || '(empty)'}` }
            : r,
        ),
      );
      return;
    }
    const path = rowToOutputPath(row, cfg.outputDir);
    setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, path, stage: 'generating' } : r));
    try {
      const templateHtml = await cat(cfg.templatePath);
      const html = finalizeGeneratedDoc(applyTemplate(templateHtml, row), row, {
        generatedBatch: new Date().toISOString(),
      });
      const qa = runGenerationQa(html);
      let existed = false;
      try { existed = await docExists(path); } catch { /* skip versioning if check fails */ }
      if (existed) {
        try {
          await createDocVersion(path, 'Pre-generation backup');
        } catch { /* best-effort */ }
      }
      const res = await postDoc(path, html);
      setResults((prev) => prev.map((r) =>
        r.id === rowId ? { ...r, stage: 'generated', qa, editUrl: res.source?.editUrl } : r,
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResults((prev) => prev.map((r) => r.id === rowId ? { ...r, stage: 'error', error: msg } : r));
    }
  }

  async function handleBulkDelete() {
    setDeleteModalOpen(false);
    const targets = results.filter((r) =>
      ['generated', 'qa-fail', 'previewing', 'previewed', 'publishing',
        'published', 'unpublishing', 'unpublished'].includes(r.stage),
    );
    setBulkOp('deleting');
    await actions.deleteBulk(targets);
    setBulkOp('idle');
  }

  async function handlePreview() {
    const targets = results.filter((r) => r.stage === 'generated');
    setBulkOp('previewing');
    await actions.previewBulk(targets);
    setBulkOp('idle');
  }

  async function handlePublish() {
    // Note: stricter than showPublishBtn's counts.publishable (stage === 'previewed' only) —
    // rows that failed generation-time QA are intentionally excluded from the actual publish run.
    const targets = results.filter((r) => r.stage === 'previewed' && r.qa?.pass);
    setBulkOp('publishing');
    await actions.publishBulk(targets);
    setBulkOp('idle');
  }

  async function handleUnpublish() {
    const targets = results.filter((r) => r.stage === 'published');
    setBulkOp('unpublishing');
    await actions.unpublishBulk(targets);
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
            disabled={running || !!generateBlockReason}
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

      {(results.length > 0 || previewRows.length > 0) && (
        <>
          {results.length === 0 && (() => {
            const overwriteCount = previewRows.filter((pr) => existenceStatus[pr.path] === 'exists').length;
            return (
              <p className="text-sm text-gray-500">
                Showing output paths for {previewRows.length} document{previewRows.length !== 1 ? 's' : ''} — click Generate to create them
                {overwriteCount > 0 && (
                  <span className="text-amber-600 font-medium ml-1">
                    · {overwriteCount} will overwrite existing content
                  </span>
                )}
              </p>
            );
          })()}
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
              {results.length === 0 && previewRows.map((pr) => (
                <tr key={pr.id} className="border-b border-gray-100 opacity-60">
                  <td className="px-3 py-2 font-mono whitespace-nowrap min-w-[280px]">
                    {!pr.hasConfig
                      ? <span className="text-amber-600 font-sans">No config for &ldquo;{pr.productType || '(none)'}&rdquo;</span>
                      : <span className="inline-flex items-center gap-2">
                          {existenceStatus[pr.path] === 'exists' ? (
                            <a href={`https://da.live/edit#${pr.path}`} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline inline-flex items-center gap-1">
                              {pr.path}
                              <ExternalLinkIcon />
                            </a>
                          ) : (
                            <span className="text-gray-500">{pr.path}</span>
                          )}
                          <ExistenceBadge status={existenceStatus[pr.path]} />
                        </span>
                    }
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap"><span className="text-gray-300">—</span></td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button type="button" disabled className="text-xs text-gray-300 font-medium cursor-not-allowed">Generate</button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap"><span className="text-gray-300">—</span></td>
                  <td className="px-3 py-2 whitespace-nowrap"><span className="text-gray-300">—</span></td>
                </tr>
              ))}
              {results.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-b border-gray-100">
                    <td className="px-3 py-2 font-mono text-gray-600 whitespace-nowrap min-w-[280px]">
                      <span className="inline-flex items-center gap-2">
                        {r.editUrl ? (
                          <a href={r.editUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            {r.path}
                            <ExternalLinkIcon />
                          </a>
                        ) : r.path}
                        <ExistenceOutcomeBadge status={existenceStatus[r.path]} />
                      </span>
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
                        onDelete={() => actions.deleteRow(r)}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <PreviewPill result={r} onPreview={() => actions.previewRow(r)} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <PublishPill result={r} onPublish={() => actions.publishRow(r)} onUnpublish={() => actions.unpublishRow(r)} />
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
        </>
      )}

      {resetModalOpen && (
        <ConfirmModal
          title="Reset results?"
          confirmLabel="Reset"
          confirmClassName="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-900 cursor-pointer transition-colors"
          onCancel={() => setResetModalOpen(false)}
          onConfirm={() => { setResults([]); setExistenceStatus({}); checkedPaths.current.clear(); setResetModalOpen(false); }}
        >
          <p className="text-sm text-gray-500">
            This will clear all {results.length} result{results.length !== 1 ? 's' : ''} from this
            view and unlock the data inputs. Documents already written to DA are not
            deleted — use the Delete button to remove them first.
          </p>
        </ConfirmModal>
      )}

      {deleteModalOpen && (
        <ConfirmModal
          title={`Delete ${counts.deletable} document${counts.deletable !== 1 ? 's' : ''}?`}
          confirmLabel="Delete"
          onCancel={() => setDeleteModalOpen(false)}
          onConfirm={handleBulkDelete}
        >
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
        </ConfirmModal>
      )}
    </div>
  );
}

