import { useState } from 'react';
import type { GmcRowPreview } from '../../lib/gmcSubmit';
import type { ManagedDoc } from '../../types';
import EditableTextCell from '../ui/EditableTextCell';
import { ExternalLinkIcon } from '../StatusPills';
import { ImageIcon } from './gmcIcons';
import { formatPrice } from './gmcFormat';

interface ErroredRow {
  preview: GmcRowPreview;
  message?: string;
}

interface Props {
  /** Rows accepted by GMC (now Pending). */
  submittedCount: number;
  /** Rows GMC rejected per-item, or whose chunk failed. */
  failedCount: number;
  /** Blocked rows that never entered the submit. */
  excludedCount: number;
  errored: ErroredRow[];
  /** Target countries per path — same preview-only state shown during review (§8). */
  countryByPath: Map<string, string[]>;
  onEditField: (doc: ManagedDoc, key: 'title' | 'description', value: string) => Promise<void>;
  onRetry: () => void;
  retrying: boolean;
  onClose: () => void;
}

/** Short guidance for the honest error taxonomy in GMC-Submit-Dialog-PRD.md §9. */
function guidanceFor(message?: string): string | null {
  if (!message) return null;
  const m = message.toLowerCase();
  if (m.includes('rate limited') || m.includes('unreachable')) return 'Transient — use "Retry errored rows".';
  if (m.includes('image')) return 'Fix the product image on Zazzle, then refetch and retry.';
  if (m.includes('price')) return 'Fix pricing on Zazzle, then refetch and retry.';
  if (m.includes('category') || m.includes('product type') || m.includes('product_type')) {
    return 'Product type not supported yet — backend follow-up needed.';
  }
  if (m.includes('http') || m.includes('link') || m.includes('url')) {
    return 'Republish the page so its live URL is valid, then retry.';
  }
  return 'Correct the title/description if the value is invalid, then retry.';
}

// Same fixed-pixel-column + scrollable-wrapper pattern as GmcProductTable/DocumentManagerTable:
// real widths give the table a real total width, so a narrow screen scrolls it instead of
// squashing columns. No "select/warning/status" columns here (not applicable post-submit) — Error
// replaces Status since preview.doc's gmc state is a stale pre-submit snapshot, not the outcome.
const COLUMN_WIDTHS = [64, 220, 260, 140, 70, 60, 140, 280];
const GRID_TEMPLATE = COLUMN_WIDTHS.map((w) => `${w}px`).join(' ');
const TOTAL_WIDTH = COLUMN_WIDTHS.reduce((a, b) => a + b, 0);

/** Post-submit progress summary plus a scrollable errors-only table with the same information the
 * review step showed (image, title, description, product type, price, page, country) so the user
 * doesn't lose context — plus inline edit for title/description and the failure reason. */
export default function GmcSubmitSummary({
  submittedCount,
  failedCount,
  excludedCount,
  errored,
  countryByPath,
  onEditField,
  onRetry,
  retrying,
  onClose,
}: Props) {
  return (
    <>
      <div className="text-sm text-gray-700">
        <span className="font-medium text-amber-600">{submittedCount}</span> submitted (Pending),{' '}
        <span className="font-medium text-red-600">{failedCount}</span> failed,{' '}
        <span className="font-medium text-gray-500">{excludedCount}</span> excluded.
      </div>

      {errored.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-auto max-h-[22rem]">
            <div style={{ width: TOTAL_WIDTH }}>
              <div
                className="grid bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 sticky top-0 z-10"
                style={{ gridTemplateColumns: GRID_TEMPLATE }}
              >
                <div className="px-3 py-2">Image</div>
                <div className="px-3 py-2">Title</div>
                <div className="px-3 py-2">Description</div>
                <div className="px-3 py-2">Product type</div>
                <div className="px-3 py-2">Price</div>
                <div className="px-3 py-2">Page</div>
                <div className="px-3 py-2">Country</div>
                <div className="px-3 py-2">Error</div>
              </div>

              {errored.map(({ preview, message }) => (
                <GmcErrorRow
                  key={preview.path}
                  preview={preview}
                  message={message}
                  countries={countryByPath.get(preview.path) ?? ['US']}
                  onEditField={onEditField}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
        {errored.length > 0 && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {retrying ? 'Retrying…' : 'Retry errored rows'}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-900 cursor-pointer transition-colors"
        >
          Close
        </button>
      </div>
    </>
  );
}

interface ErrorRowProps {
  preview: GmcRowPreview;
  message?: string;
  countries: string[];
  onEditField: (doc: ManagedDoc, key: 'title' | 'description', value: string) => Promise<void>;
}

/** One errored row, laid out on the shared {@link GRID_TEMPLATE}. A row only ever reaches here
 * after having resolved (row + offerId) at review time, so `preview.row` carries the same
 * DA-else-Zazzle-resolved title/description/price/image the review step showed — not the raw,
 * possibly-blank DA-only fields. */
function GmcErrorRow({ preview, message, countries, onEditField }: ErrorRowProps) {
  const { doc, row } = preview;
  const [showImage, setShowImage] = useState(false);
  const guidance = guidanceFor(message);

  return (
    <div className="grid items-start border-t border-gray-100 text-xs" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
      <div className="px-3 py-2">
        {row?.image_link ? (
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
      <div className="px-3 py-2 min-w-0 overflow-x-auto whitespace-nowrap no-scrollbar">
        <EditableTextCell
          value={doc.title || row?.title}
          editable={doc.editable.title}
          onSave={(v) => onEditField(doc, 'title', v)}
        />
      </div>
      <div className="px-3 py-2 min-w-0 overflow-x-auto whitespace-nowrap no-scrollbar">
        <EditableTextCell
          value={doc.description || row?.description}
          editable={doc.editable.description}
          onSave={(v) => onEditField(doc, 'description', v)}
        />
      </div>
      <div className="px-3 py-2 min-w-0">
        <span className="truncate text-gray-700 block font-mono" title={preview.productType}>
          {preview.productType}
        </span>
      </div>
      <div className="px-3 py-2 whitespace-nowrap text-gray-800">
        {row ? formatPrice(row.price) : <span className="text-gray-300">—</span>}
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
        <span className="truncate text-gray-700 block" title={countries.join(', ')}>
          {countries.join(', ')}
        </span>
      </div>
      <div className="px-3 py-2 min-w-0">
        <div className="text-red-600">{message ?? 'Submission failed'}</div>
        {guidance && <div className="text-gray-400 mt-0.5">{guidance}</div>}
      </div>
    </div>
  );
}
