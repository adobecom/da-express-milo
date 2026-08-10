import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ManagedDoc, GmcEnv, GmcEnvState } from '../../types';
import {
  assembleGmcPreview,
  submitAssembledRows,
  type GmcRowPreview,
  type GmcSubmitEntry,
  type GmcSubmitProgress,
} from '../../lib/gmcSubmit';
import { getToken } from '../../api/daApi';
import { writeFieldValue, refetchZazzleInfo } from '../../lib/documentManager';
import { runBatch, GMC_ASSEMBLE_CONCURRENCY } from '../../lib/concurrency';
import Modal from '../ui/Modal';
import EnvToggle from '../ui/EnvToggle';
import ConfirmModal from '../ConfirmModal';
import GmcPreviewList from './GmcPreviewList';
import GmcSubmitSummary from './GmcSubmitSummary';
import CountrySelectDialog from './CountrySelectDialog';
import { DEFAULT_COUNTRY } from './gmcCountries';

interface Props {
  selectedDocs: ManagedDoc[];
  onClose: () => void;
  /** Apply per-row GMC states for the submitted env back onto the main docs list (keyed by doc.path). */
  onResults: (env: GmcEnv, updates: Map<string, GmcEnvState>) => void;
  /** Reflect an in-dialog doc edit/refetch (from the error/blocked rows) back into the main table. */
  onDocUpdated: (doc: ManagedDoc) => void;
}

type Phase = 'review' | 'submitting' | 'summary';

const UNKNOWN_TYPE = '(unknown type)';

/** A resolvable preview (`row` + `offerId` present) → a submit entry; otherwise null. */
function toEntry(preview: GmcRowPreview): GmcSubmitEntry | null {
  if (!preview.row || !preview.offerId) return null;
  return { path: preview.path, offerId: preview.offerId, row: preview.row };
}

export default function GmcSubmitDialog({ selectedDocs, onClose, onResults, onDocUpdated }: Props) {
  const publishedDocs = useMemo(() => selectedDocs.filter((d) => d.stage === 'published'), [selectedDocs]);

  const [env, setEnv] = useState<GmcEnv>('test');
  const [phase, setPhase] = useState<Phase>('review');
  // Seeded with a base preview per published doc so every row renders immediately (with a spinner)
  // and fills in progressively as assembly resolves.
  const [previews, setPreviews] = useState<Map<string, GmcRowPreview>>(() => {
    const map = new Map<string, GmcRowPreview>();
    for (const doc of publishedDocs) {
      map.set(doc.path, { path: doc.path, doc, productType: doc.identity.productType || UNKNOWN_TYPE });
    }
    return map;
  });
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(() => new Set(publishedDocs.map((d) => d.path)));
  const [countryByPath, setCountryByPath] = useState<Map<string, string[]>>(new Map());
  const [progress, setProgress] = useState<GmcSubmitProgress | null>(null);
  const [updates, setUpdates] = useState<Map<string, GmcEnvState>>(new Map());
  const [showProdConfirm, setShowProdConfirm] = useState(false);
  const [retrying, setRetrying] = useState(false);
  // Row selection (submittable rows only) — drives the bulk country editor.
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  // When set, the country editor is open for these paths (one row, or every selected row for bulk).
  const [countryEditor, setCountryEditor] = useState<{ paths: string[] } | null>(null);

  // Assemble every published row's preview once on open, throttled so a large selection doesn't
  // hammer Zazzle. The ref guard keeps it single-run (incl. StrictMode double-invoke); there is
  // deliberately no cancelling cleanup so a prop-reference change can't abort an in-flight load.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void runBatch(
      publishedDocs,
      async (doc) => {
        let preview: GmcRowPreview;
        try {
          preview = await assembleGmcPreview(doc);
        } catch (err) {
          preview = {
            path: doc.path,
            doc,
            productType: doc.identity.productType || UNKNOWN_TYPE,
            blockedReason: err instanceof Error ? err.message : String(err),
          };
        }
        setPreviews((prev) => new Map(prev).set(preview.path, preview));
        setLoadingPaths((prev) => {
          const next = new Set(prev);
          next.delete(doc.path);
          return next;
        });
      },
      GMC_ASSEMBLE_CONCURRENCY,
    );
  }, [publishedDocs]);

  const groups = useMemo(() => {
    const byType = new Map<string, GmcRowPreview[]>();
    for (const doc of publishedDocs) {
      const preview = previews.get(doc.path);
      if (!preview) continue;
      const list = byType.get(preview.productType);
      if (list) list.push(preview);
      else byType.set(preview.productType, [preview]);
    }
    return [...byType.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [publishedDocs, previews]);

  const resolvableEntries = useMemo(
    () => [...previews.values()].map(toEntry).filter((entry): entry is GmcSubmitEntry => entry !== null),
    [previews],
  );
  const excludedCount = useMemo(
    () => [...previews.values()].filter((preview) => Boolean(preview.blockedReason)).length,
    [previews],
  );
  const errored = useMemo(() => {
    const list: { preview: GmcRowPreview; message?: string }[] = [];
    for (const [path, state] of updates) {
      if (state.status !== 'error') continue;
      const preview = previews.get(path);
      if (preview) list.push({ preview, message: state.message });
    }
    return list;
  }, [updates, previews]);
  const pendingCount = useMemo(
    () => [...updates.values()].filter((state) => state.status === 'pending').length,
    [updates],
  );

  const loadingCount = loadingPaths.size;
  const readyCount = resolvableEntries.length;
  const publishedCount = publishedDocs.length;

  // Paths eligible for selection/bulk-country — a blocked row can't be submitted so it's excluded.
  const submittablePaths = useMemo(
    () => [...previews.values()].filter((preview) => !preview.blockedReason).map((preview) => preview.path),
    [previews],
  );
  const selectedCount = selectedPaths.size;

  // Submit targets only the selection when something's selected; an empty selection falls back to
  // "submit everything ready" (the pre-selection default behavior).
  const entriesToSubmit = useMemo(
    () => (selectedCount > 0 ? resolvableEntries.filter((entry) => selectedPaths.has(entry.path)) : resolvableEntries),
    [resolvableEntries, selectedPaths, selectedCount],
  );
  const submitCount = entriesToSubmit.length;

  // Replace the target countries for a set of paths (the editor's Save handler). Enforces the
  // "always ≥1 market" invariant by falling back to the default. This drives both the per-row edit
  // (one path) and the bulk edit (every selected path) — replacing rather than merging is what lets
  // a bulk edit remove countries too, not just add them.
  function setCountriesForPaths(paths: string[], codes: string[]) {
    const safe = codes.length > 0 ? codes : [DEFAULT_COUNTRY];
    setCountryByPath((prev) => {
      const next = new Map(prev);
      for (const path of paths) next.set(path, safe);
      return next;
    });
  }

  // The union of the given paths' current countries — used to pre-seed the editor so a bulk edit
  // starts from what the selected rows already target.
  function countriesForPaths(paths: string[]): string[] {
    const set = new Set<string>();
    for (const path of paths) for (const code of countryByPath.get(path) ?? [DEFAULT_COUNTRY]) set.add(code);
    return set.size > 0 ? [...set] : [DEFAULT_COUNTRY];
  }

  function toggleSelect(path: string) {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  // Select/deselect a batch of paths at once (per-table "select all in group").
  function toggleGroup(paths: string[], select: boolean) {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      for (const path of paths) {
        if (select) next.add(path);
        else next.delete(path);
      }
      return next;
    });
  }

  async function handleRefetch(doc: ManagedDoc) {
    const updated = await refetchZazzleInfo(doc);
    if (!updated) throw new Error('Refetch found no Zazzle data for this product');
    onDocUpdated(updated);
    const preview = await assembleGmcPreview(updated);
    setPreviews((prev) => new Map(prev).set(preview.path, preview));
  }

  async function handleErrorEdit(doc: ManagedDoc, key: 'title' | 'description', value: string) {
    const updated = await writeFieldValue(doc, key, value);
    onDocUpdated(updated);
    setPreviews((prev) => {
      const existing = prev.get(updated.path);
      if (!existing) return prev;
      return new Map(prev).set(updated.path, { ...existing, doc: updated });
    });
  }

  async function doSubmit(entries: GmcSubmitEntry[]) {
    if (entries.length === 0) return;
    const token = getToken();
    if (!token) return;
    setProgress(null);
    setPhase('submitting');
    const result = await submitAssembledRows(entries, env, token, setProgress);
    onResults(env, result);
    setUpdates(result);
    setPhase('summary');
  }

  function handleSubmitAll() {
    if (submitCount === 0) return;
    if (env === 'prod') {
      setShowProdConfirm(true);
      return;
    }
    void doSubmit(entriesToSubmit);
  }

  async function handleRetry() {
    const token = getToken();
    if (!token) return;
    const erroredDocs = errored.map((e) => e.preview.doc);
    if (erroredDocs.length === 0) return;
    setRetrying(true);
    try {
      const reassembled: GmcRowPreview[] = [];
      await runBatch(
        erroredDocs,
        async (doc) => {
          const preview = await assembleGmcPreview(doc);
          reassembled.push(preview);
          setPreviews((prev) => new Map(prev).set(preview.path, preview));
        },
        GMC_ASSEMBLE_CONCURRENCY,
      );
      const entries = reassembled.map(toEntry).filter((entry): entry is GmcSubmitEntry => entry !== null);
      if (entries.length === 0) return;
      const retryUpdates = await submitAssembledRows(entries, env, token);
      setUpdates((prev) => {
        const merged = new Map(prev);
        for (const [path, state] of retryUpdates) merged.set(path, state);
        return merged;
      });
      onResults(env, retryUpdates);
    } finally {
      setRetrying(false);
    }
  }

  const dismissable = phase !== 'submitting';

  let body: ReactNode;
  if (phase === 'summary') {
    body = (
      <GmcSubmitSummary
        submittedCount={pendingCount}
        failedCount={errored.length}
        excludedCount={excludedCount}
        errored={errored}
        countryByPath={countryByPath}
        onEditField={handleErrorEdit}
        onRetry={() => void handleRetry()}
        retrying={retrying}
        onClose={onClose}
      />
    );
  } else if (phase === 'submitting') {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <svg className="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-sm text-gray-700">
          {progress && progress.chunkCount > 0
            ? `Submitting chunk ${progress.chunkIndex} of ${progress.chunkCount}…`
            : 'Submitting…'}
        </p>
        <p className="text-xs text-gray-400">
          Pushing to {env === 'prod' ? 'production' : 'test'} GMC. Please don't close this window.
        </p>
      </div>
    );
  } else {
    body = (
      <>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Environment</span>
          <EnvToggle value={env} onChange={setEnv} />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
          <button
            type="button"
            onClick={() => setSelectedPaths(new Set(submittablePaths))}
            disabled={submittablePaths.length === 0}
            className="font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
          >
            Select all{submittablePaths.length > 0 ? ` (${submittablePaths.length})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPaths(new Set())}
            disabled={selectedCount === 0}
            className="font-medium text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
          >
            Clear
          </button>
          <span className="text-gray-400">{selectedCount} selected</span>
          <span className="mx-1 h-4 w-px bg-gray-200" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setCountryEditor({ paths: [...selectedPaths] })}
            disabled={selectedCount === 0}
            title={selectedCount === 0 ? 'Select one or more rows first' : undefined}
            className="font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
          >
            Edit countries for selected
          </button>
          <span className="text-gray-400">
            Preview only — submission targets US until the backend supports more markets.
          </span>
        </div>

        {publishedCount < selectedDocs.length && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs px-3 py-2">
            Only published documents can be submitted to GMC — {publishedCount} of {selectedDocs.length} selected
            documents are published.
          </div>
        )}

        {loadingCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading product data… ({publishedCount - loadingCount}/{publishedCount})
          </div>
        )}

        <GmcPreviewList
          groups={groups}
          env={env}
          loadingPaths={loadingPaths}
          countryByPath={countryByPath}
          selectedPaths={selectedPaths}
          onToggleSelect={toggleSelect}
          onToggleGroup={toggleGroup}
          onEditCountries={(path) => setCountryEditor({ paths: [path] })}
          onRefetch={handleRefetch}
          loading={loadingCount > 0}
        />
      </>
    );
  }

  const footer =
    phase === 'review' ? (
      <div className="flex items-center justify-between w-full">
        <span className="text-xs text-gray-500">
          {readyCount} ready · {excludedCount} excluded
          {loadingCount > 0 ? ` · ${loadingCount} loading` : ''}
        </span>
        <button
          type="button"
          onClick={handleSubmitAll}
          disabled={loadingCount > 0 || submitCount === 0}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {selectedCount > 0 ? 'Submit selected' : 'Submit all'}
          {submitCount > 0 ? ` (${submitCount})` : ''}
        </button>
      </div>
    ) : undefined;

  return (
    <Modal title="Submit to GMC" size="xl" dismissable={dismissable} onClose={onClose} footer={footer}>
      {body}
      {showProdConfirm && (
        <ConfirmModal
          title="Submit to PRODUCTION GMC?"
          confirmLabel="Submit to Prod"
          zClassName="z-[60]"
          onCancel={() => setShowProdConfirm(false)}
          onConfirm={() => {
            setShowProdConfirm(false);
            void doSubmit(entriesToSubmit);
          }}
        >
          <p className="text-sm text-gray-600 max-w-sm">
            About to push {submitCount} {selectedCount > 0 ? 'selected ' : ''}product{submitCount !== 1 ? 's' : ''} to{' '}
            <strong>production</strong> Google Merchant Center. They'll appear in Google Shopping. Continue?
          </p>
        </ConfirmModal>
      )}
      {countryEditor && (
        <CountrySelectDialog
          title={
            countryEditor.paths.length > 1
              ? `Target countries — ${countryEditor.paths.length} rows`
              : 'Target countries'
          }
          initialSelected={countriesForPaths(countryEditor.paths)}
          onCancel={() => setCountryEditor(null)}
          onSave={(codes) => {
            setCountriesForPaths(countryEditor.paths, codes);
            setCountryEditor(null);
          }}
        />
      )}
    </Modal>
  );
}
