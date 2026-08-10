import type { GmcRowPreview } from '../../lib/gmcSubmit';
import type { GmcEnv, ManagedDoc } from '../../types';
import GmcProductTable from './GmcProductTable';

interface Props {
  /** Product-type groups: [rawType, previews][], already sorted. */
  groups: [string, GmcRowPreview[]][];
  env: GmcEnv;
  loadingPaths: Set<string>;
  countryByPath: Map<string, string[]>;
  selectedPaths: Set<string>;
  onToggleSelect: (path: string) => void;
  onToggleGroup: (paths: string[], select: boolean) => void;
  onEditCountries: (path: string) => void;
  onRefetch: (doc: ManagedDoc) => Promise<void>;
  /** Any previews still assembling (drives the empty-state copy). */
  loading: boolean;
}

/**
 * Renders one collapsible, independently-virtualized {@link GmcProductTable} per product type. This
 * flows at natural height (no nested scroll region) and lets the modal body scroll the whole list —
 * each table is `shrink-0` so an expanded table never squashes its siblings. Each table caps its
 * own body at ~5 rows and virtualizes them, so a 1k-row selection spread across product types stays
 * responsive while still reading as separate per-product tables (GMC-Submit-Dialog-PRD.md §7).
 */
export default function GmcPreviewList({
  groups,
  env,
  loadingPaths,
  countryByPath,
  selectedPaths,
  onToggleSelect,
  onToggleGroup,
  onEditCountries,
  onRefetch,
  loading,
}: Props) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-500">
        {loading ? 'Loading product data…' : 'No published documents to submit.'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map(([type, previews]) => (
        <GmcProductTable
          key={type}
          productType={type}
          previews={previews}
          env={env}
          loadingPaths={loadingPaths}
          countryByPath={countryByPath}
          selectedPaths={selectedPaths}
          onToggleSelect={onToggleSelect}
          onToggleGroup={onToggleGroup}
          onEditCountries={onEditCountries}
          onRefetch={onRefetch}
        />
      ))}
    </div>
  );
}
