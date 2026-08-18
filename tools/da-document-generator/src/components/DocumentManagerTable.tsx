import { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ManagedDoc, GmcEnv } from '../types';
import type { DaDocumentActions } from '../hooks/useDaDocumentActions';
import type { EditableFieldKey } from '../lib/generate';
import { GeneratePill, PreviewPill, PublishPill, GmcBothEnvStatus, ExternalLinkIcon } from './StatusPills';
import EditableTextCell from './ui/EditableTextCell';

export type SortField = 'path' | 'subDirectory' | 'productType' | 'batch' | 'lastUpdated' | 'status';

interface Props {
  rows: ManagedDoc[];
  selected: Set<string>;
  onToggleSelect: (path: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  actions: DaDocumentActions<ManagedDoc>;
  onEditField: (doc: ManagedDoc, key: EditableFieldKey, value: string) => Promise<void>;
  /** Keyed by `${path}:${env}` — rows currently mid-flight for a per-row GMC status check. */
  checkingGmc: Set<string>;
  onCheckGmcStatus: (doc: ManagedDoc, env: GmcEnv) => void;
}

const SORT_COLUMNS: { field: SortField; label: string }[] = [
  { field: 'path', label: 'Path' },
  { field: 'subDirectory', label: 'Sub-directory' },
  { field: 'productType', label: 'Product Type' },
  { field: 'batch', label: 'Batch' },
  { field: 'lastUpdated', label: 'Last Updated' },
  { field: 'status', label: 'Status' },
];

// Fixed column widths shared by the header and every row so a single CSS grid template
// keeps them aligned while the body is virtualized (see DocumentRow). Deriving the
// template + total width from one array keeps them from drifting apart.
// GMC Status (index 14) is wider now that it stacks both test + prod (GmcBothEnvStatus).
const COLUMN_WIDTHS = [44, 460, 200, 200, 210, 210, 120, 440, 150, 320, 280, 400, 130, 210, 200, 80];
const GRID_TEMPLATE = COLUMN_WIDTHS.map((w) => `${w}px`).join(' ');
const TOTAL_WIDTH = COLUMN_WIDTHS.reduce((a, b) => a + b, 0);

export default function DocumentManagerTable({
  rows,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  sortField,
  sortDirection,
  onSort,
  actions,
  onEditField,
  checkingGmc,
  onCheckGmcStatus,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 37,
    overscan: 10,
    getItemKey: (index) => rows[index].path,
  });

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
        No documents match the current filters.
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="rounded-xl border border-gray-200 max-h-[32rem] overflow-auto">
      <div style={{ width: TOTAL_WIDTH }}>
        {/* Header — same grid template as the rows so columns line up */}
        <div
          className="grid bg-gray-50 border-b border-gray-200 sticky top-0 z-10 text-xs"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
          <div className="px-3 py-2 flex items-center">
            <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} className="cursor-pointer" />
          </div>
          {SORT_COLUMNS.map(({ field, label }) => (
            <div key={field} className="px-3 py-2 font-medium text-gray-600 truncate">
              <button
                type="button"
                onClick={() => onSort(field)}
                className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-900"
              >
                {label}
                {sortField === field && <span className="text-[10px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
              </button>
            </div>
          ))}
          <div className="px-3 py-2 font-medium text-gray-600">Product ID</div>
          <div className="px-3 py-2 font-medium text-gray-600">Issues</div>
          <div className="px-3 py-2 font-medium text-gray-600">Title</div>
          <div className="px-3 py-2 font-medium text-gray-600">Short Title</div>
          <div className="px-3 py-2 font-medium text-gray-600">Description</div>
          <div className="px-3 py-2 font-medium text-gray-600">Preview</div>
          <div className="px-3 py-2 font-medium text-gray-600">Publish</div>
          <div className="px-3 py-2 font-medium text-gray-600">GMC Status</div>
          <div className="px-3 py-2 font-medium text-gray-600">Delete</div>
        </div>

        {/* Virtualized body — only visible rows are mounted */}
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((vi) => (
            <DocumentRow
              key={vi.key}
              dataIndex={vi.index}
              measureRef={virtualizer.measureElement}
              start={vi.start}
              doc={rows[vi.index]}
              isSelected={selected.has(rows[vi.index].path)}
              onToggleSelect={onToggleSelect}
              actions={actions}
              onEditField={onEditField}
              checkingGmc={checkingGmc}
              onCheckGmcStatus={onCheckGmcStatus}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  doc: ManagedDoc;
  isSelected: boolean;
  dataIndex: number;
  start: number;
  measureRef: (el: HTMLElement | null) => void;
  onToggleSelect: (path: string) => void;
  actions: DaDocumentActions<ManagedDoc>;
  onEditField: (doc: ManagedDoc, key: EditableFieldKey, value: string) => Promise<void>;
  checkingGmc: Set<string>;
  onCheckGmcStatus: (doc: ManagedDoc, env: GmcEnv) => void;
}

const DocumentRow = memo(function DocumentRow({
  doc,
  isSelected,
  dataIndex,
  start,
  measureRef,
  onToggleSelect,
  actions,
  onEditField,
  checkingGmc,
  onCheckGmcStatus,
}: RowProps) {
  return (
    <div
      data-index={dataIndex}
      ref={measureRef}
      className={`grid items-center border-b border-gray-100 text-xs ${isSelected ? 'bg-blue-50/50' : ''}`}
      style={{
        gridTemplateColumns: GRID_TEMPLATE,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${start}px)`,
      }}
    >
      <div className="px-3 py-2 flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(doc.path)}
          className="cursor-pointer"
        />
      </div>
      <div className="px-3 py-2 font-mono overflow-x-auto whitespace-nowrap no-scrollbar" title={doc.path}>
        <a
          href={doc.editUrl ?? `https://da.live/edit#${doc.path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          {doc.path}
          <ExternalLinkIcon />
        </a>
      </div>
      <div className="px-3 py-2 text-gray-500 overflow-x-auto whitespace-nowrap no-scrollbar">{doc.subDirectory}</div>
      <div className="px-3 py-2 text-gray-700 overflow-x-auto whitespace-nowrap no-scrollbar">{doc.identity.productType ?? '—'}</div>
      <div className="px-3 py-2 text-gray-500 overflow-x-auto whitespace-nowrap no-scrollbar">
        {doc.identity.generatedBatch ? new Date(doc.identity.generatedBatch).toLocaleString() : '—'}
      </div>
      <div className="px-3 py-2 text-gray-500 overflow-x-auto whitespace-nowrap no-scrollbar">
        {doc.identity.lastUpdated ? new Date(doc.identity.lastUpdated).toLocaleString() : '—'}
      </div>
      <div className="px-3 py-2 truncate">
        <StatusLabel doc={doc} />
      </div>
      <div className="px-3 py-2 font-mono text-gray-400 overflow-x-auto whitespace-nowrap no-scrollbar" title={doc.identity.productId}>
        {doc.identity.productId ?? '—'}
      </div>
      <div className="px-3 py-2">
        {doc.needsBackfill ? (
          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 whitespace-nowrap">
            Missing metadata
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>
      <div className="px-3 py-2 text-gray-700 min-w-0 overflow-x-auto whitespace-nowrap no-scrollbar">
        <EditableTextCell value={doc.title} editable={doc.editable.title} onSave={(v) => onEditField(doc, 'title', v)} />
      </div>
      <div className="px-3 py-2 text-gray-700 min-w-0 overflow-x-auto whitespace-nowrap no-scrollbar">
        <EditableTextCell value={doc.shortTitle} editable={doc.editable.shortTitle} onSave={(v) => onEditField(doc, 'short_title', v)} />
      </div>
      <div className="px-3 py-2 text-gray-500 min-w-0 overflow-x-auto whitespace-nowrap no-scrollbar">
        <EditableTextCell value={doc.description} editable={doc.editable.description} onSave={(v) => onEditField(doc, 'description', v)} />
      </div>
      <div className="px-3 py-2">
        <PreviewPill result={doc} onPreview={() => actions.previewRow(doc)} />
      </div>
      <div className="px-3 py-2">
        <PublishPill result={doc} onPublish={() => actions.publishRow(doc)} onUnpublish={() => actions.unpublishRow(doc)} />
      </div>
      <div className="px-3 py-2">
        <GmcBothEnvStatus
          gmc={doc.gmc}
          checking={{ test: checkingGmc.has(`${doc.path}:test`), prod: checkingGmc.has(`${doc.path}:prod`) }}
          onCheck={doc.identity.productId && doc.stage === 'published' ? (env) => onCheckGmcStatus(doc, env) : undefined}
          disabledReason={
            !doc.identity.productId ? 'Missing product id'
              : doc.stage !== 'published' ? 'Not published — nothing to check yet'
                : undefined
          }
        />
      </div>
      <div className="px-3 py-2">
        <GeneratePill result={doc} onGenerate={() => {}} onDelete={() => actions.deleteRow(doc)} />
      </div>
    </div>
  );
});

function StatusLabel({ doc }: { doc: ManagedDoc }) {
  const { stage } = doc;
  if (doc.statusUnknown) {
    return (
      <span className="text-gray-400 font-medium" title="Publish status check failed (rate-limited or unreachable) — the real state is unknown. Rescan to retry.">
        Unknown
      </span>
    );
  }
  if (stage === 'published') return <span className="text-green-700 font-medium">Published</span>;
  if (stage === 'previewed') return <span className="text-indigo-600 font-medium">Previewed</span>;
  if (stage === 'unpublished') return <span className="text-amber-600 font-medium">Unpublished</span>;
  if (stage === 'error') return <span className="text-red-600 font-medium">Error</span>;
  if (['previewing', 'publishing', 'unpublishing', 'deleting'].includes(stage)) {
    return <span className="text-gray-500 font-medium">{stage}…</span>;
  }
  return <span className="text-gray-500 font-medium">Draft</span>;
}
