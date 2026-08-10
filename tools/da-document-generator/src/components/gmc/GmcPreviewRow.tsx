import { useState } from 'react';
import type { GmcRowPreview } from '../../lib/gmcSubmit';
import type { GmcEnv, ManagedDoc } from '../../types';
import { GmcStatusChip, ProvenanceBadge, ExternalLinkIcon } from '../StatusPills';
import { GMC_GRID } from './gmcGrid';
import { ImageIcon } from './gmcIcons';
import { formatPrice } from './gmcFormat';

interface Props {
  preview: GmcRowPreview;
  env: GmcEnv;
  /** Preview is still being assembled (Zazzle/pricing in flight). */
  loading: boolean;
  /** Whether this row is selected (for bulk country apply). */
  selected: boolean;
  /** Toggle this row's selection. */
  onToggleSelect: () => void;
  countries: string[];
  /** Open the multi-select country editor for this row. */
  onEditCountries: () => void;
  /** Re-pull Zazzle data for a blocked row and re-assemble its preview. May reject. */
  onRefetch: (doc: ManagedDoc) => Promise<void>;
}

/**
 * One preview row, laid out on the shared {@link GMC_GRID} so it aligns with the list's column
 * header. Eleven cells in order: select · warning · thumbnail · Title · Description · Product type ·
 * Price · Sale price · Page · Country · Status. Column 1 is a selection checkbox (bulk country apply)
 * and column 2 is a consolidated Zazzle-provenance warning — the "warning sign first" layout that matches the
 * Document Manager table's typography (text-xs, px-3 py-2 cells, border-b border-gray-100 dividers,
 * bg-blue-50/50 selected rows). Read-only except the checkbox, a blocked row's refetch, and the
 * country picker. Rendered inside the virtualizer's absolutely-positioned, measured wrapper (see
 * GmcPreviewList).
 */
export default function GmcPreviewRow({
  preview,
  env,
  loading,
  selected,
  onToggleSelect,
  countries,
  onEditCountries,
  onRefetch,
}: Props) {
  const { doc, row, blockedReason } = preview;
  const [refetching, setRefetching] = useState(false);
  const [refetchError, setRefetchError] = useState<string | null>(null);
  // Images are loaded on demand — rendering ~1k <img> tags up front is a needless network hit, so
  // each row starts with a "View image" button and only mounts the <img> when the author asks.
  const [showImage, setShowImage] = useState(false);

  async function handleRefetch() {
    setRefetching(true);
    setRefetchError(null);
    try {
      await onRefetch(doc);
    } catch (err) {
      setRefetchError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefetching(false);
    }
  }

  if (loading) {
    // A clear skeleton (proper row height, one placeholder per column) so a still-loading group
    // reads as "loading rows", not a mysterious thin gray line. Eleven cells match GMC_GRID.
    return (
      <div className="grid items-center border-b border-gray-100" style={{ gridTemplateColumns: GMC_GRID }}>
        <div className="px-3 py-2" />
        <div className="px-3 py-2" />
        <div className="px-3 py-2"><div className="h-3 w-10 rounded bg-gray-100 animate-pulse" /></div>
        <div className="px-3 py-2"><div className="h-3 w-32 rounded bg-gray-100 animate-pulse" /></div>
        <div className="px-3 py-2"><div className="h-3 w-40 rounded bg-gray-100 animate-pulse" /></div>
        <div className="px-3 py-2"><div className="h-3 w-16 rounded bg-gray-100 animate-pulse" /></div>
        <div className="px-3 py-2"><div className="h-3 w-12 rounded bg-gray-100 animate-pulse" /></div>
        <div className="px-3 py-2"><div className="h-3 w-12 rounded bg-gray-100 animate-pulse" /></div>
        <div className="px-3 py-2"><div className="h-3 w-10 rounded bg-gray-100 animate-pulse" /></div>
        <div className="px-3 py-2"><div className="h-3 w-16 rounded bg-gray-100 animate-pulse" /></div>
        <div className="px-3 py-2"><div className="h-3 w-16 rounded bg-gray-100 animate-pulse" /></div>
      </div>
    );
  }

  if (blockedReason || !row) {
    const reason = blockedReason || 'Could not assemble a complete payload';
    // Full-width flex row (not the grid) that leads with the warning icon — a blocked row can't be
    // submitted so it has no checkbox and doesn't need per-column alignment.
    return (
      <div className="flex items-start gap-3 border-b border-gray-100 bg-gray-50/60 px-3 py-2 text-xs">
        <span className="shrink-0 mt-0.5">
          <ProvenanceBadge title={reason} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-600 truncate" title={doc.title || doc.path}>
            {doc.title || doc.path}
          </div>
          <div className="text-amber-700 mt-0.5">Excluded — {reason}</div>
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRefetch()}
              disabled={refetching}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1"
            >
              <RefreshIcon spinning={refetching} /> Refetch Zazzle
            </button>
            {refetchError && (
              <span className="text-xs text-red-600 cursor-help" title={refetchError}>
                {refetchError}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <GmcStatusChip state={doc.gmc?.[env]} />
        </div>
      </div>
    );
  }

  // Fields that fell back to Zazzle because the authored doc had no value — the one consolidated
  // warning. Price/image are excluded on purpose: price is always live from Zazzle, so including it
  // would make the icon always-on and meaningless.
  const zazzleFields = (['title', 'description', 'product_type'] as const).filter(
    (k) => preview.sources?.[k] === 'zazzle',
  );

  return (
    <div
      className={`grid items-center border-b border-gray-100 text-xs${selected ? ' bg-blue-50/50' : ''}`}
      style={{ gridTemplateColumns: GMC_GRID }}
    >
      <div className="px-3 py-2 flex items-center">
        <input type="checkbox" checked={selected} onChange={onToggleSelect} className="cursor-pointer" />
      </div>
      <div className="px-3 py-2 flex items-center">
        {zazzleFields.length > 0 && (
          <ProvenanceBadge
            title={`Sourced from Zazzle (no authored value): ${zazzleFields.join(', ')} — verify before submit`}
          />
        )}
      </div>
      <div className="px-3 py-2">
        {row.image_link ? (
          showImage ? (
            <div className="flex flex-col items-start gap-0.5">
              <img
                src={row.image_link}
                alt={row.title}
                loading="lazy"
                className="w-16 h-16 rounded object-cover border border-gray-200 bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowImage(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Hide
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowImage(true)}
              title="Load & preview the product image"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <ImageIcon /> View
            </button>
          )
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>
      <div className="px-3 py-2 min-w-0">
        <span className="truncate text-gray-800 block" title={row.title}>
          {row.title}
        </span>
      </div>
      <div className="px-3 py-2 min-w-0">
        <span className="truncate text-gray-600 block" title={row.description}>
          {row.description}
        </span>
      </div>
      <div className="px-3 py-2 min-w-0">
        <span className="truncate text-gray-700 block font-mono" title={preview.productType}>
          {preview.productType}
        </span>
      </div>
      <div className="px-3 py-2 whitespace-nowrap">
        <span className="text-gray-800">{formatPrice(row.price)}</span>
        <span className="block text-gray-400">live</span>
      </div>
      <div className="px-3 py-2 whitespace-nowrap">
        {row.sale_price != null ? (
          <span
            className="text-green-600 font-medium"
            title={row.sale_price_end_date ? `Sale ends ${new Date(row.sale_price_end_date).toLocaleString()}` : undefined}
          >
            {formatPrice(row.sale_price)}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>
      <div className="px-3 py-2 whitespace-nowrap">
        {doc.liveUrl ? (
          <a
            href={doc.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            View
            <ExternalLinkIcon />
          </a>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>
      <div className="px-3 py-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-gray-700" title={countries.join(', ')}>
            {countries.join(', ')}
          </span>
          <button
            type="button"
            onClick={onEditCountries}
            title="Edit target countries"
            className="shrink-0 font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Edit
          </button>
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <GmcStatusChip state={doc.gmc?.[env]} />
          {doc.gmc?.[env]?.status === 'live' && (
            <span className="text-gray-400">re-submitting will update the live listing</span>
          )}
        </div>
      </div>
    </div>
  );
}

function RefreshIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
