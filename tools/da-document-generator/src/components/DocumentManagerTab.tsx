import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { crawlAndLoadDocs, backfillIdentity, writeFieldValue } from '../lib/documentManager';
import type { CrawlError, DocFetchError } from '../api/crawl';
import type { EditableFieldKey } from '../lib/generate';
import { useDaDocumentActions } from '../hooks/useDaDocumentActions';
import ConfirmModal from './ConfirmModal';
import DocumentManagerTable, { type SortField } from './DocumentManagerTable';
import BulkEditBar from './BulkEditBar';
import BulkFieldEditModal from './BulkFieldEditModal';
import type { ManagedDoc } from '../types';

const LEGACY_BATCH = '(legacy / no batch)';
const ALL = 'all';

export default function DocumentManagerTab() {
  const [rootPathInput, setRootPathInput] = useState('');
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [scanNonce, setScanNonce] = useState(0);
  const [docs, setDocs] = useState<ManagedDoc[]>([]);
  const [crawlErrors, setCrawlErrors] = useState<(CrawlError | DocFetchError)[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subDirFilter, setSubDirFilter] = useState(ALL);
  const [batchFilter, setBatchFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('subDirectory');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fieldEditModalOpen, setFieldEditModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissedErrors, setDismissedErrors] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const { isFetching, refetch } = useQuery({
    queryKey: ['dm-crawl', rootPath],
    queryFn: () => crawlAndLoadDocs(rootPath!),
    enabled: false,
    staleTime: Infinity,
  });

  const actions = useDaDocumentActions<ManagedDoc>(setDocs, { afterDelete: () => undefined });

  function handleScan() {
    const trimmed = rootPathInput.trim();
    if (!trimmed) return;
    setRootPath(trimmed);
    setScanNonce((n) => n + 1);
  }

  // Deferring the setState calls to the refetch() promise's resolution (rather than calling
  // them synchronously in the effect body) keeps this a "trigger an external fetch" effect,
  // not a "derive state from state" effect — and lets scanNonce force a rescan of the same path.
  useEffect(() => {
    if (rootPath === null) return;
    void refetch().then((result) => {
      if (result.data) {
        setDocs(result.data.docs);
        setCrawlErrors(result.data.errors);
        setSelected(new Set());
        setDismissedErrors(false);
        setHasScanned(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootPath, scanNonce]);

  const subDirectories = useMemo(
    () => [...new Set(docs.map((d) => d.subDirectory))].sort(),
    [docs],
  );
  const batches = useMemo(
    () => [...new Set(docs.map((d) => d.identity.generatedBatch || LEGACY_BATCH))]
      .sort((a, b) => (a === LEGACY_BATCH ? 1 : b === LEGACY_BATCH ? -1 : b.localeCompare(a))),
    [docs],
  );

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (subDirFilter !== ALL && d.subDirectory !== subDirFilter) return false;
      if (batchFilter !== ALL) {
        const batch = d.identity.generatedBatch || LEGACY_BATCH;
        if (batch !== batchFilter) return false;
      }
      if (statusFilter !== ALL && d.stage !== statusFilter) return false;
      if (issuesOnly && !d.needsBackfill) return false;
      return true;
    });
  }, [docs, subDirFilter, batchFilter, statusFilter, issuesOnly]);

  const sorted = useMemo(() => {
    const value = (d: ManagedDoc): string => {
      switch (sortField) {
        case 'path': return d.path;
        case 'subDirectory': return d.subDirectory;
        case 'productType': return d.identity.productType ?? '';
        case 'batch': return d.identity.generatedBatch ?? '';
        case 'lastUpdated': return d.identity.lastUpdated ?? '';
        case 'status': return d.stage;
        default: return '';
      }
    };
    const copy = [...filtered];
    copy.sort((a, b) => {
      const cmp = value(a).localeCompare(value(b));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortField, sortDirection]);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function toggleSelect(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }

  function toggleSelectAll() {
    const allSelected = sorted.length > 0 && sorted.every((d) => selected.has(d.path));
    setSelected(allSelected ? new Set() : new Set(sorted.map((d) => d.path)));
  }

  const selectedDocs = docs.filter((d) => selected.has(d.path));
  const canBackfill = selectedDocs.some((d) => d.needsBackfill);

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
      setSelected(new Set());
    }
  }

  async function handleBackfill() {
    const targets = selectedDocs.filter((d) => d.needsBackfill);
    await withBusy(async () => {
      for (const target of targets) {
        const updated = await backfillIdentity(target);
        if (updated) {
          setDocs((prev) => prev.map((d) => (d.path === updated.path ? updated : d)));
        }
      }
    });
  }

  async function handleEditField(doc: ManagedDoc, key: EditableFieldKey, value: string) {
    const updated = await writeFieldValue(doc, key, value);
    setDocs((prev) => prev.map((d) => (d.path === updated.path ? updated : d)));
  }

  async function handleBulkEditField(key: EditableFieldKey, value: string) {
    const editableKey = key === 'short_title' ? 'shortTitle' : key;
    const succeeded: string[] = [];
    const skipped: { path: string; reason: string }[] = [];
    for (const doc of selectedDocs) {
      if (!doc.editable[editableKey]) {
        skipped.push({ path: doc.path, reason: 'not editable' });
        continue;
      }
      try {
        const updated = await writeFieldValue(doc, key, value);
        setDocs((prev) => prev.map((d) => (d.path === updated.path ? updated : d)));
        succeeded.push(doc.path);
      } catch (err) {
        skipped.push({ path: doc.path, reason: err instanceof Error ? err.message : String(err) });
      }
    }
    return { succeeded, skipped };
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="font-medium text-gray-900">Document Manager</h2>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={rootPathInput}
          onChange={(e) => setRootPathInput(e.target.value)}
          placeholder="/org/repo/path/to/folder"
          className="flex-1 min-w-[280px] max-w-md h-9 px-3 border border-gray-300 rounded-lg text-sm font-mono"
        />
        <button
          type="button"
          onClick={handleScan}
          disabled={isFetching || !rootPathInput.trim()}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {isFetching ? 'Scanning…' : rootPath === rootPathInput.trim() && hasScanned ? 'Rescan' : 'Scan'}
        </button>
        {hasScanned && !isFetching && (
          <span className="text-sm text-gray-500">{docs.length} document{docs.length !== 1 ? 's' : ''} found</span>
        )}
      </div>

      {!hasScanned && !isFetching && (
        <p className="text-sm text-gray-500">Enter a DA folder path above and click Scan to load its documents.</p>
      )}

      {isFetching && (
        <p className="text-sm text-gray-500">Scanning… this may take a while for large folders.</p>
      )}

      {crawlErrors.length > 0 && !dismissedErrors && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <p className="flex-1">
            {crawlErrors.length} path{crawlErrors.length !== 1 ? 's' : ''} could not be read and may be missing from this list.
          </p>
          <button type="button" onClick={() => setDismissedErrors(true)} className="text-amber-700 hover:text-amber-900 font-medium cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {hasScanned && !isFetching && (
        <>
          <div className="flex items-center gap-3 flex-wrap text-sm">
            <FilterSelect label="Sub-directory" value={subDirFilter} onChange={setSubDirFilter} options={subDirectories} />
            <FilterSelect label="Batch" value={batchFilter} onChange={setBatchFilter} options={batches} formatOption={(b) => (b === LEGACY_BATCH ? b : new Date(b).toLocaleString())} />
            <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={['generated', 'previewed', 'published', 'error']} formatOption={(s) => (s === 'generated' ? 'Draft' : s[0].toUpperCase() + s.slice(1))} />
            <label className="flex items-center gap-1.5 text-gray-600 cursor-pointer">
              <input type="checkbox" checked={issuesOnly} onChange={(e) => setIssuesOnly(e.target.checked)} className="cursor-pointer" />
              Issues only
            </label>
          </div>

          <BulkEditBar
            selectedCount={selected.size}
            canBackfill={canBackfill}
            busy={busy}
            onPreview={() => withBusy(() => actions.previewBulk(selectedDocs))}
            onPublish={() => withBusy(() => actions.publishBulk(selectedDocs))}
            onUnpublish={() => withBusy(() => actions.unpublishBulk(selectedDocs))}
            onDelete={() => setDeleteModalOpen(true)}
            onBackfill={handleBackfill}
            onEditField={() => setFieldEditModalOpen(true)}
            onClearSelection={() => setSelected(new Set())}
          />

          <DocumentManagerTable
            rows={sorted}
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            allSelected={sorted.length > 0 && sorted.every((d) => selected.has(d.path))}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            actions={actions}
            onEditField={handleEditField}
          />
        </>
      )}

      {deleteModalOpen && (
        <ConfirmModal
          title={`Delete ${selectedDocs.length} document${selectedDocs.length !== 1 ? 's' : ''}?`}
          confirmLabel="Delete"
          onCancel={() => setDeleteModalOpen(false)}
          onConfirm={() => { setDeleteModalOpen(false); void withBusy(() => actions.deleteBulk(selectedDocs)); }}
        >
          <p className="text-sm text-gray-500">This will permanently delete the following documents from DA:</p>
          <ul className="text-xs font-mono text-gray-700 max-h-64 overflow-y-auto border border-gray-100 rounded-lg p-3 flex flex-col gap-1">
            {selectedDocs.map((d) => <li key={d.path} className="whitespace-nowrap">{d.path}</li>)}
          </ul>
        </ConfirmModal>
      )}

      {fieldEditModalOpen && (
        <BulkFieldEditModal
          docs={selectedDocs}
          onApply={handleBulkEditField}
          onClose={() => { setFieldEditModalOpen(false); setSelected(new Set()); }}
        />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  formatOption,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  formatOption?: (v: string) => string;
}) {
  return (
    <label className="flex items-center gap-1.5 text-gray-600">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2 border border-gray-300 rounded-lg text-sm"
      >
        <option value={ALL}>All</option>
        {options.map((o) => (
          <option key={o} value={o}>{formatOption ? formatOption(o) : o}</option>
        ))}
      </select>
    </label>
  );
}
