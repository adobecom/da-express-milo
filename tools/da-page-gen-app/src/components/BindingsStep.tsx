import { useState } from 'react';
import type { Binding, Transform } from '../types.js';
import { defaultBinding } from '../lib/bindings.js';
import { enumeratePaths, resolvePath, applyTransform } from '../lib/jsonPath.js';

interface Props {
  placeholders: string[];
  records: unknown[];
  initialBindings?: Binding[];
  onConfirm: (bindings: Binding[], destPathPattern: string) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string;
}

const TRANSFORMS: Transform[] = ['none', 'slug', 'uppercase', 'lowercase'];

export function BindingsStep({ placeholders, records, initialBindings, onConfirm, onBack, loading = false, error = '' }: Props) {
  const availablePaths = records[0] ? enumeratePaths(records[0]) : [];

  const [bindings, setBindings] = useState<Binding[]>(
    initialBindings ??
      placeholders.map((token) => defaultBinding(token, records[0])),
  );
  const [destPattern, setDestPattern] = useState('/drafts/generated/[[title|slug]]');
  const [showPreview, setShowPreview] = useState(false);

  function updateBinding(index: number, patch: Partial<Binding>) {
    setBindings((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function addBinding() {
    setBindings((prev) => [...prev, { token: '', dataPath: '', transform: 'none' }]);
  }

  function removeBinding(index: number) {
    setBindings((prev) => prev.filter((_, i) => i !== index));
  }

  // Preview the first record's resolved values
  const previewRecord = records[0];

  function resolveDestPreview(record: unknown): string {
    return destPattern.replace(/\[\[([^\]]+)\]\]/g, (_, inner: string) => {
      const [dp, tf] = inner.split('|') as [string, string | undefined];
      return applyTransform(resolvePath(record, dp.trim()), (tf?.trim() as Transform) ?? 'none');
    });
  }

  const canProceed = bindings.length > 0 && bindings.every((b) => b.token && b.dataPath) && destPattern.trim();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Bindings</h2>
        <p className="text-gray-500 text-sm">
          Map each template placeholder to a field in your data. Use dot-notation for nested paths
          (e.g. <code className="bg-gray-100 px-1 rounded">product.title</code>).
        </p>
      </div>

      {/* Binding table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-44">Template token</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Data path</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-36">Transform</th>
                {showPreview && (
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-48">
                    Preview (record 1)
                  </th>
                )}
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bindings.map((b, i) => (
                <tr key={i} className="hover:bg-gray-50/60">
                  <td className="px-4 py-2">
                    <input
                      value={b.token}
                      onChange={(e) => updateBinding(i, { token: e.target.value })}
                      placeholder="[[title]]"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      list={`paths-${i}`}
                      value={b.dataPath}
                      onChange={(e) => updateBinding(i, { dataPath: e.target.value })}
                      placeholder="product.title"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <datalist id={`paths-${i}`}>
                      {availablePaths.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={b.transform}
                      onChange={(e) => updateBinding(i, { transform: e.target.value as Transform })}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      {TRANSFORMS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  {showPreview && (
                    <td className="px-4 py-2 text-gray-500 text-xs truncate max-w-0">
                      {previewRecord
                        ? applyTransform(resolvePath(previewRecord, b.dataPath), b.transform)
                        : '—'}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeBinding(i)}
                      className="text-gray-400 hover:text-red-500 text-lg leading-none"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
          <button
            type="button"
            onClick={addBinding}
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            + Add binding
          </button>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
        </div>
      </div>

      {/* Dest path pattern */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Output path pattern
          </label>
          <p className="text-gray-400 text-xs mb-2">
            Use <code className="bg-gray-100 px-1 rounded">{'[[dataPath|transform]]'}</code> to
            derive the DA destination path from each record.{' '}
            <span className="font-medium text-gray-500">Example:</span>{' '}
            <code className="bg-gray-100 px-1 rounded">/drafts/products/{'[[id]]'}</code>
          </p>
          <input
            value={destPattern}
            onChange={(e) => setDestPattern(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
        {previewRecord != null && destPattern && (
          <p className="text-gray-500 text-xs">
            Record 1 → <span className="font-mono text-gray-800">{resolveDestPreview(previewRecord)}</span>
          </p>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => onConfirm(bindings, destPattern.trim())}
          disabled={!canProceed || loading}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Resolving…' : 'Preview & generate →'}
        </button>
      </div>
    </div>
  );
}
