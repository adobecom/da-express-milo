import { useState } from 'react';
import type { ManagedDoc } from '../types';
import type { EditableFieldKey } from '../lib/generate';

const FIELD_LABELS: Record<EditableFieldKey, string> = {
  title: 'Title',
  short_title: 'Short title',
  description: 'Description',
};

interface Result {
  succeeded: string[];
  skipped: { path: string; reason: string }[];
}

interface Props {
  docs: ManagedDoc[];
  onApply: (field: EditableFieldKey, value: string) => Promise<Result>;
  onClose: () => void;
}

export default function BulkFieldEditModal({ docs, onApply, onClose }: Props) {
  const [field, setField] = useState<EditableFieldKey>('title');
  const [value, setValue] = useState('');
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const editableCount = docs.filter((d) => d.editable[field === 'short_title' ? 'shortTitle' : field]).length;

  async function handleApply() {
    setApplying(true);
    try {
      const r = await onApply(field, value);
      setResult(r);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 w-[420px] max-w-[90vw] flex flex-col gap-4 shadow-xl">
        <h3 className="font-semibold text-gray-900 text-base">Bulk edit field</h3>

        {!result ? (
          <>
            <p className="text-sm text-gray-500">
              Applying to <strong>{editableCount}</strong> of {docs.length} selected document{docs.length !== 1 ? 's' : ''}
              {editableCount < docs.length && ' — the rest are not editable and will be skipped'}.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Field</label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value as EditableFieldKey)}
                className="w-full h-9 px-2 border border-gray-300 rounded-lg text-sm"
              >
                {(Object.keys(FIELD_LABELS) as EditableFieldKey[]).map((f) => (
                  <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New value</label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter one value to apply to all selected documents"
                className="w-full min-h-[84px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer transition-colors">
                Cancel
              </button>
              <button
                type="button"
                disabled={applying || !value.trim() || editableCount === 0}
                onClick={handleApply}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {applying ? 'Applying…' : `Apply to ${editableCount} document${editableCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-700">
              Updated <span className="font-medium text-green-700">{result.succeeded.length}</span> document{result.succeeded.length !== 1 ? 's' : ''}.
            </p>
            {result.skipped.length > 0 && (
              <ul className="text-xs text-gray-600 max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-3 flex flex-col gap-1">
                {result.skipped.map((s) => (
                  <li key={s.path} className="whitespace-nowrap"><span className="font-mono">{s.path}</span> — {s.reason}</li>
                ))}
              </ul>
            )}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-900 cursor-pointer transition-colors">
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
