import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { GmcRowPreview } from '../../lib/gmcSubmit';
import type { GmcEnv, ManagedDoc } from '../../types';
import GmcPreviewRow from './GmcPreviewRow';
import prettifyProductType from './prettifyProductType';
import { GMC_GRID, GMC_GRID_WIDTH } from './gmcGrid';

/**
 * One collapsible, independently-virtualized table for a SINGLE product type. The GMC submit dialog
 * stacks one of these per product group.
 *
 * Design notes:
 * - Collapse + virtualization: `useVirtualizer` is called UNCONDITIONALLY (hooks rule) even while
 *   collapsed, but the scroll container is only mounted when `expanded`. Because the scroll element
 *   mounts fresh on expand, we force a re-measure in an effect keyed on `expanded`.
 * - Per-table scrolling: each table owns its OWN scroll container (capped at ~5 rows via
 *   `max-h-[16rem]`) and its OWN virtualizer, so a large multi-product selection stays responsive
 *   while still reading as separate per-product tables. The column header lives inside that scroll
 *   container as a `sticky top-0` first child so it stays visible and stays aligned with the rows
 *   (shared {@link GMC_GRID}).
 * - Horizontal scroll: columns are fixed pixel widths (not fr/minmax), and the header + body sit in
 *   an inner div pinned to the total column width ({@link GMC_GRID_WIDTH}). On a narrow screen the
 *   outer scroll container scrolls that fixed-width content horizontally instead of squashing
 *   columns until they overlap (same pattern as DocumentManagerTable).
 * - `shrink-0` on the root: the parent list lets the modal body scroll, so a table must keep its
 *   natural height and never shrink to fit (otherwise expanded tables squash their siblings).
 */

interface Props {
  /** Raw product-type key (prettify for display only). */
  productType: string;
  /** This group's previews, in display order. */
  previews: GmcRowPreview[];
  env: GmcEnv;
  loadingPaths: Set<string>;
  countryByPath: Map<string, string[]>;
  selectedPaths: Set<string>;
  onToggleSelect: (path: string) => void;
  /** Select or deselect a set of paths at once (used by the group "select all"). */
  onToggleGroup: (paths: string[], select: boolean) => void;
  /** Open the country editor for a single row. */
  onEditCountries: (path: string) => void;
  onRefetch: (doc: ManagedDoc) => Promise<void>;
}

export default function GmcProductTable({
  productType,
  previews,
  env,
  loadingPaths,
  countryByPath,
  selectedPaths,
  onToggleSelect,
  onToggleGroup,
  onEditCountries,
  onRefetch,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  // Blocked rows can't be submitted, so they're excluded from the group's select-all.
  const selectablePaths = previews.filter((p) => !p.blockedReason).map((p) => p.path);
  const allSelected = selectablePaths.length > 0 && selectablePaths.every((path) => selectedPaths.has(path));
  const someSelected = selectablePaths.some((path) => selectedPaths.has(path));
  const anyLoading = previews.some((p) => loadingPaths.has(p.path));

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: previews.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 44,
    overscan: 10,
    getItemKey: (index) => previews[index].path,
  });

  // The scroll element only mounts when expanded, so force a fresh measure on expand.
  useEffect(() => {
    if (expanded) virtualizer.measure();
  }, [expanded, virtualizer]);

  return (
    <div className="shrink-0 rounded-xl border border-gray-200 overflow-hidden">
      {/* Header bar — clicking it toggles collapse; the checkbox stops propagation so it doesn't. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer select-none text-xs"
      >
        <span className="text-gray-400">{expanded ? '▾' : '▸'}</span>
        <span onClick={(e) => e.stopPropagation()}>
          <input
            ref={selectAllRef}
            type="checkbox"
            className="cursor-pointer"
            checked={allSelected}
            disabled={selectablePaths.length === 0}
            onChange={() => onToggleGroup(selectablePaths, !allSelected)}
            aria-label={`Select all in ${prettifyProductType(productType)}`}
          />
        </span>
        <span className="font-semibold text-gray-700">{prettifyProductType(productType)}</span>
        <span className="text-gray-400">· {previews.length}</span>
        {anyLoading && <Spinner />}
      </div>

      {expanded && (
        <div ref={scrollRef} className="overflow-auto max-h-[16rem]">
          <div style={{ width: GMC_GRID_WIDTH }}>
            {/* Column header — same GMC_GRID as the rows so columns align; sticky within the scroll. */}
            <div
              className="grid bg-white border-b border-gray-200 text-xs font-medium text-gray-600 sticky top-0 z-10"
              style={{ gridTemplateColumns: GMC_GRID }}
            >
              <div className="px-3 py-2" />
              <div className="px-3 py-2" />
              <div className="px-3 py-2">Image</div>
              <div className="px-3 py-2">Title</div>
              <div className="px-3 py-2">Description</div>
              <div className="px-3 py-2">Product type</div>
              <div className="px-3 py-2">Price</div>
              <div className="px-3 py-2">Sale price</div>
              <div className="px-3 py-2">Page</div>
              <div className="px-3 py-2">Country</div>
              <div className="px-3 py-2">Status ({env})</div>
            </div>

            {/* Virtualized body — only visible rows are mounted. */}
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((vi) => {
                const preview = previews[vi.index];
                return (
                  <div
                    key={vi.key}
                    data-index={vi.index}
                    ref={virtualizer.measureElement}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
                  >
                    <GmcPreviewRow
                      preview={preview}
                      env={env}
                      loading={loadingPaths.has(preview.path)}
                      selected={selectedPaths.has(preview.path)}
                      onToggleSelect={() => onToggleSelect(preview.path)}
                      countries={countryByPath.get(preview.path) ?? ['US']}
                      onEditCountries={() => onEditCountries(preview.path)}
                      onRefetch={onRefetch}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
