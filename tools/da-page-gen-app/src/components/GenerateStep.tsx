import { useState, useCallback } from 'react';
import { generateFromBindings } from '../api/serverApi.js';
import type { Binding, ResolvedItem, ItemStatus } from '../types.js';

interface Props {
  items: ResolvedItem[];
  records: unknown[];
  bindings: Binding[];
  destPathPattern: string;
  templateSourcePath: string;
  onBack: () => void;
}

interface ItemState {
  status: ItemStatus;
  editUrl?: string;
  error?: string;
}

const STATUS_BADGE: Record<ItemStatus, string> = {
  idle: 'bg-gray-100 text-gray-600',
  generating: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
};

export function GenerateStep({ items, records, bindings, destPathPattern, templateSourcePath, onBack }: Props) {
  const [states, setStates] = useState<ItemState[]>(() =>
    items.map(() => ({ status: 'idle' as ItemStatus })),
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const patch = useCallback((indices: number[], update: Partial<ItemState>) => {
    setStates((prev) => prev.map((s, i) => (indices.includes(i) ? { ...s, ...update } : s)));
  }, []);

  async function generateIndices(indices: number[]) {
    if (indices.length === 0) return;
    patch(indices, { status: 'generating' });
    try {
      const results = await generateFromBindings(
        templateSourcePath,
        indices.map((i) => records[i]),
        bindings,
        destPathPattern,
      );
      if (!Array.isArray(results)) {
        throw new Error(`Unexpected server response: ${JSON.stringify(results).slice(0, 200)}`);
      }
      setStates((prev) =>
        prev.map((s, i) => {
          const ri = indices.indexOf(i);
          if (ri === -1) return s;
          const r = results[ri];
          return r
            ? { status: r.success ? 'done' : 'error', editUrl: r.editUrl, error: r.error }
            : s;
        }),
      );
    } catch (e) {
      patch(indices, { status: 'error', error: e instanceof Error ? e.message : 'Unknown error' });
    }
  }

  function toggleSelect(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((_, i) => i)),
    );
  }

  const idleIndices = items.map((_, i) => i).filter((i) => states[i]?.status === 'idle');
  const selectedArray = [...selected];
  const previewKeys = Object.keys(items[0]?.preview ?? {}).slice(0, 3);
  const doneCount = states.filter((s) => s.status === 'done').length;
  const errorCount = states.filter((s) => s.status === 'error').length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Generate pages</h2>
          <p className="text-gray-500 text-sm">
            {items.length} page{items.length !== 1 ? 's' : ''} ready.
            {doneCount > 0 && <span className="text-green-700"> {doneCount} done.</span>}
            {errorCount > 0 && <span className="text-red-600"> {errorCount} failed.</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          ← Back
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => generateIndices(idleIndices)}
          disabled={idleIndices.length === 0}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Generate all idle ({idleIndices.length})
        </button>
        <button
          type="button"
          onClick={() => generateIndices(selectedArray.filter((i) => states[i]?.status === 'idle'))}
          disabled={selectedArray.length === 0}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Generate selected ({selectedArray.length})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === items.length && items.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Dest path</th>
                {previewKeys.map((k) => (
                  <th key={k} className="text-left px-4 py-2.5 font-medium text-gray-600 max-w-[180px]">{k}</th>
                ))}
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-24">Status</th>
                <th className="px-4 py-2.5 w-32" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, i) => {
                const state = states[i]!;
                return (
                  <tr
                    key={i}
                    className={`hover:bg-gray-50/60 cursor-pointer select-none ${selected.has(i) ? 'bg-purple-50/60' : ''}`}
                    onClick={() => toggleSelect(i)}
                  >
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleSelect(i)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-700 max-w-[240px] truncate">
                      {item.destPath}
                    </td>
                    {previewKeys.map((k) => (
                      <td key={k} className="px-4 py-2 text-gray-600 text-xs max-w-[180px] truncate">
                        {item.preview[k] ?? '—'}
                      </td>
                    ))}
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[state.status]}`}>
                        {state.status}
                      </span>
                      {state.status === 'error' && state.error && (
                        <p className="text-red-500 text-xs mt-0.5 max-w-[200px] truncate" title={state.error}>
                          {state.error}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => generateIndices([i])}
                          disabled={state.status === 'generating' || state.status === 'done'}
                          className="px-2.5 py-1 text-xs font-medium rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                          {state.status === 'generating' ? '…' : state.status === 'done' ? '✓' : 'Generate'}
                        </button>
                        {state.status === 'done' && state.editUrl && (
                          <a
                            href={state.editUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Edit
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
