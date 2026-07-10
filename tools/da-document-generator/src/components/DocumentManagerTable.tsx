import { useState } from 'react';
import type { ManagedDoc } from '../types';
import type { DaDocumentActions } from '../hooks/useDaDocumentActions';
import type { EditableFieldKey } from '../lib/generate';
import { GeneratePill, PreviewPill, PublishPill, ExternalLinkIcon } from './StatusPills';

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
}

const SORT_COLUMNS: { field: SortField; label: string }[] = [
  { field: 'path', label: 'Path' },
  { field: 'subDirectory', label: 'Sub-directory' },
  { field: 'productType', label: 'Product Type' },
  { field: 'batch', label: 'Batch' },
  { field: 'lastUpdated', label: 'Last Updated' },
  { field: 'status', label: 'Status' },
];

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
}: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
        No documents match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-[32rem] overflow-y-auto">
      <table className="text-xs min-w-max w-full">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
          <tr>
            <th className="px-3 py-2 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="cursor-pointer"
              />
            </th>
            {SORT_COLUMNS.map(({ field, label }) => (
              <th key={field} className="px-3 py-2 text-left font-medium text-gray-600 min-w-[120px]">
                <button
                  type="button"
                  onClick={() => onSort(field)}
                  className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-900"
                >
                  {label}
                  {sortField === field && <span className="text-[10px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                </button>
              </th>
            ))}
            <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Product ID</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">Issues</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[160px]">Title</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[140px]">Short Title</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[220px]">Description</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">Preview</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">Publish</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">Delete</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((doc) => (
            <tr key={doc.path} className={`border-b border-gray-100 ${selected.has(doc.path) ? 'bg-blue-50/50' : ''}`}>
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.has(doc.path)}
                  onChange={() => onToggleSelect(doc.path)}
                  className="cursor-pointer"
                />
              </td>
              <td className="px-3 py-2 font-mono text-gray-600 whitespace-nowrap">
                {doc.editUrl ? (
                  <a href={doc.editUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                    {doc.path}
                    <ExternalLinkIcon />
                  </a>
                ) : doc.path}
              </td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{doc.subDirectory}</td>
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{doc.identity.productType ?? '—'}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                {doc.identity.generatedBatch ? new Date(doc.identity.generatedBatch).toLocaleString() : '—'}
              </td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                {doc.identity.lastUpdated ? new Date(doc.identity.lastUpdated).toLocaleString() : '—'}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <StatusLabel doc={doc} />
              </td>
              <td className="px-3 py-2 font-mono text-gray-400 whitespace-nowrap max-w-[140px] truncate" title={doc.identity.productId}>
                {doc.identity.productId ?? '—'}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {doc.needsBackfill ? (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                    Missing metadata
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-gray-700 max-w-[200px]">
                <EditableCell
                  value={doc.title}
                  editable={doc.editable.title}
                  onSave={(value) => onEditField(doc, 'title', value)}
                />
              </td>
              <td className="px-3 py-2 text-gray-700 max-w-[160px]">
                <EditableCell
                  value={doc.shortTitle}
                  editable={doc.editable.shortTitle}
                  onSave={(value) => onEditField(doc, 'short_title', value)}
                />
              </td>
              <td className="px-3 py-2 text-gray-500 max-w-[260px]">
                <EditableCell
                  value={doc.description}
                  editable={doc.editable.description}
                  onSave={(value) => onEditField(doc, 'description', value)}
                />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <PreviewPill result={doc} onPreview={() => actions.previewRow(doc)} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <PublishPill result={doc} onPublish={() => actions.publishRow(doc)} onUnpublish={() => actions.unpublishRow(doc)} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <GeneratePill result={doc} onGenerate={() => {}} onDelete={() => actions.deleteRow(doc)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditableCell({
  value,
  editable,
  onSave,
}: {
  value?: string;
  editable: boolean;
  onSave: (value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editable) {
    return (
      <span className="text-gray-400 truncate block" title="Not editable — backfill or regenerate to enable editing">
        {value ?? '—'}
      </span>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(value ?? ''); setError(null); setEditing(true); }}
        className="text-left w-full truncate hover:bg-blue-50 rounded px-1 -mx-1 cursor-text"
      >
        {value || <span className="text-gray-300">Click to edit</span>}
      </button>
    );
  }

  async function commit() {
    if (draft === (value ?? '')) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <input
        autoFocus
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); void commit(); }
          if (e.key === 'Escape') { setEditing(false); setDraft(value ?? ''); setError(null); }
        }}
        className="w-full border border-blue-300 rounded px-1 py-0.5 text-xs"
      />
      {error && <span className="text-red-600 text-[10px]">{error}</span>}
    </div>
  );
}

function StatusLabel({ doc }: { doc: ManagedDoc }) {
  const { stage } = doc;
  if (stage === 'published') return <span className="text-green-700 font-medium">Published</span>;
  if (stage === 'previewed') return <span className="text-indigo-600 font-medium">Previewed</span>;
  if (stage === 'unpublished') return <span className="text-amber-600 font-medium">Unpublished</span>;
  if (stage === 'error') return <span className="text-red-600 font-medium">Error</span>;
  if (['previewing', 'publishing', 'unpublishing', 'deleting'].includes(stage)) {
    return <span className="text-gray-500 font-medium">{stage}…</span>;
  }
  return <span className="text-gray-500 font-medium">Draft</span>;
}
