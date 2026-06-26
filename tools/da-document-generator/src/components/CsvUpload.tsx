import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { CsvRow, InputSummary } from '../types';
import { fetchProductFromTemplate } from '../api/zazzleApi';

interface Props {
  rows: CsvRow[];
  onChange: (rows: CsvRow[]) => void;
  onReadinessChange?: (state: { dataComplete: boolean; idsValid: boolean; noDuplicates: boolean }) => void;
  onSelectionChange?: (selectedRows: CsvRow[]) => void;
  disabled?: boolean;
}

type ContentWarningType =
  | 'title_too_long'
  | 'slug_char_mismatch'
  | 'casing_issue'
  | 'slug_isolated_char'
  | 'mojibake';

type FilterKey = 'total' | 'selected' | 'missing' | 'duplicate_product_id' | 'duplicate_slug' | ContentWarningType;

const CONTENT_WARNING_LABELS: Record<ContentWarningType, string> = {
  title_too_long: 'Title exceeds 50 characters',
  slug_char_mismatch: 'Contains characters stripped from URL slug (e.g. &)',
  casing_issue: 'Inconsistent capitalization (content word lowercase or conjunction capitalized mid-title)',
  slug_isolated_char: 'Isolated single-character token in URL slug (e.g. mother-s-day)',
  mojibake: 'Possible encoding issue (e.g. â€™ instead of apostrophe)',
};

type ContentWarnings = Record<string, Record<string, ContentWarningType[]>>;

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  'in', 'on', 'at', 'to', 'by', 'of', 'up', 'as', 'is', 'it', 'vs', 'via',
]);

function checkTitleTooLong(value: string): boolean {
  return value.length > 50;
}

function checkSlugCharMismatch(value: string): boolean {
  return /[^a-zA-Z0-9\s]/.test(value);
}

function checkCasingIssue(value: string): boolean {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  if (!/^[A-Z]/.test(words[0])) return false;
  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    if (!w || w.length < 2) continue;
    const lower = w.toLowerCase();
    if (!STOP_WORDS.has(lower) && /^[a-z]/.test(w)) return true;
    if (STOP_WORDS.has(lower) && /^[A-Z]/.test(w)) return true;
  }
  return false;
}

function checkSlugIsolatedChar(slug: string): boolean {
  return /(?:^|-)[a-z](?:-|$)/.test(slug);
}

function checkMojibake(value: string): boolean {
  return /â€[^\s]|Ã[^\s]|Â[^\s]/.test(value);
}

const PLACEHOLDER_COLUMNS = ['product_id', 'product_type', 'url_slug', 'title', 'description'];
const PLACEHOLDER_ROW: CsvRow = { _id: 'placeholder', product_id: '-', product_type: '-', url_slug: '-', title: '-', description: '-' };

function computeSummary(rows: CsvRow[]): InputSummary {
  
  const total = rows.length;

  const productIdMap: Record<string, string[]> = {};
  for (const r of rows) {
    const id = r['product_id']?.trim();
    if (id) (productIdMap[id] ??= []).push(r._id);
  }
  const duplicateProductIdRowIds = new Set(
    Object.values(productIdMap).filter((ids) => ids.length > 1).flat(),
  );

  const slugMap: Record<string, string[]> = {};
  for (const r of rows) {
    const slug = r['url_slug']?.trim();
    if (slug) (slugMap[slug] ??= []).push(r._id);
  }
  const duplicateSlugRowIds = new Set(
    Object.values(slugMap).filter((ids) => ids.length > 1).flat(),
  );

  const withId = rows.filter((r) => r['product_id']?.trim() && r['url_slug']?.trim());
  const missing = total - withId.length;
  const duplicates = duplicateProductIdRowIds.size;
  const duplicateSlugs = duplicateSlugRowIds.size;

  return { total, duplicates, duplicateSlugs, missing, duplicateProductIdRowIds, duplicateSlugRowIds };
}


function buildZazzleMap(): Record<string, string> {
  return {
    title: 'rootRawTitle',
    short_title: 'rootRawTitle',
    description: 'description',
    initial_pretty_preferred_view_url: 'initialPrettyPreferredViewUrl',
    department_name: 'departmentName',
    product_type: 'productType',
    plural_unit_label: 'pluralUnitLabel',
    singular_unit_label: 'singularUnitLabel',
  };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function ensureShortTitle(fields: string[], rows: CsvRow[]): { fields: string[]; rows: CsvRow[] } {
  const hasTitle = fields.includes('title');
  const hasShortTitle = fields.includes('short_title');
  if (hasShortTitle) return { fields, rows };

  const normalizedFields = [...fields];
  let normalizedRows = rows;

  if (!hasTitle) {
    const tidx = normalizedFields.indexOf('product_id');
    normalizedFields.splice(tidx >= 0 ? tidx + 1 : normalizedFields.length, 0, 'title');
    normalizedRows = normalizedRows.map((row) => ({ ...row, title: '' }));
  }

  const titleIdx = normalizedFields.indexOf('title');
  normalizedFields.splice(titleIdx + 1, 0, 'short_title');
  normalizedRows = normalizedRows.map((row) => ({ ...row, short_title: row.title ?? '' }));

  return { fields: normalizedFields, rows: normalizedRows };
}

function computeContentWarnings(rows: CsvRow[]): ContentWarnings {
  const result: ContentWarnings = {};
  for (const row of rows) {
    const rowWarnings: Record<string, ContentWarningType[]> = {};

    for (const col of ['title', 'short_title']) {
      const val = row[col]?.trim();
      if (!val) continue;
      const w: ContentWarningType[] = [];
      if (checkTitleTooLong(val))     w.push('title_too_long');
      if (checkSlugCharMismatch(val)) w.push('slug_char_mismatch');
      if (checkCasingIssue(val))      w.push('casing_issue');
      if (checkMojibake(val))         w.push('mojibake');
      if (w.length) rowWarnings[col] = w;
    }

    const slug = row['url_slug']?.trim();
    if (slug && checkSlugIsolatedChar(slug)) {
      rowWarnings['url_slug'] = ['slug_isolated_char'];
    }

    const desc = row['description']?.trim();
    if (desc && checkMojibake(desc)) {
      rowWarnings['description'] = [...(rowWarnings['description'] ?? []), 'mojibake'];
    }

    if (Object.keys(rowWarnings).length) result[row._id] = rowWarnings;
  }
  return result;
}

function computeRowHasWarning(
  row: CsvRow,
  opts: {
    tableColumns: string[];
    duplicateProductIdRowIds: Set<string>;
    duplicateSlugRowIds: Set<string>;
    contentWarnings: ContentWarnings;
    zazzleHydratedFields: Record<string, string[]>;
    zazzleReferenceValues: Record<string, { title?: string; description?: string }>;
  },
): boolean {
  const { tableColumns, duplicateProductIdRowIds, duplicateSlugRowIds,
          contentWarnings, zazzleHydratedFields, zazzleReferenceValues } = opts;

  if (tableColumns.some((col) => !row[col]?.trim())) return true;
  if (duplicateProductIdRowIds.has(row._id)) return true;
  if (duplicateSlugRowIds.has(row._id)) return true;
  if (Object.keys(contentWarnings[row._id] ?? {}).length > 0) return true;

  const ref = zazzleReferenceValues[row._id];
  if (ref) {
    const hydrated = zazzleHydratedFields[row._id] ?? [];
    for (const col of ['title', 'short_title', 'description']) {
      if (hydrated.includes(col)) continue;
      const zRef = col === 'description' ? ref.description : ref.title;
      if (zRef && row[col]?.trim() && row[col]?.trim() !== zRef.trim()) return true;
    }
  }
  return false;
}

function computeRowWarningPriority(
  row: CsvRow,
  opts: {
    tableColumns: string[];
    duplicateProductIdRowIds: Set<string>;
    duplicateSlugRowIds: Set<string>;
    contentWarnings: ContentWarnings;
    zazzleHydratedFields: Record<string, string[]>;
    zazzleReferenceValues: Record<string, { title?: string; description?: string }>;
  },
): number {
  const { tableColumns, duplicateProductIdRowIds, duplicateSlugRowIds,
          contentWarnings, zazzleHydratedFields, zazzleReferenceValues } = opts;

  if (tableColumns.some((col) => !row[col]?.trim())) return 1;
  if (duplicateProductIdRowIds.has(row._id))          return 2;
  if (duplicateSlugRowIds.has(row._id))               return 3;

  const allWarns = Object.values(contentWarnings[row._id] ?? {}).flat();
  if (allWarns.includes('title_too_long'))     return 4;
  if (allWarns.includes('slug_char_mismatch')) return 5;
  if (allWarns.includes('casing_issue'))       return 6;
  if (allWarns.includes('slug_isolated_char')) return 7;
  if (allWarns.includes('mojibake'))           return 8;

  const ref = zazzleReferenceValues[row._id];
  if (ref) {
    const hydrated = zazzleHydratedFields[row._id] ?? [];
    for (const col of ['title', 'short_title', 'description']) {
      if (hydrated.includes(col)) continue;
      const zRef = col === 'description' ? ref.description : ref.title;
      if (zRef && row[col]?.trim() && row[col]?.trim() !== zRef.trim()) return 9;
    }
  }
  return 0;
}

export default function CsvUpload({ rows, onChange, onReadinessChange, onSelectionChange, disabled = false }: Props) {
  const [inputMode, setInputMode] = useState<'upload' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [hydrateMsg, setHydrateMsg] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validateMsg, setValidateMsg] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<Record<string, 'valid' | 'invalid'>>({});
  const [columns, setColumns] = useState<string[]>([]);
  const [zazzleHydratedFields, setZazzleHydratedFields] = useState<Record<string, string[]>>({});
  const [zazzleReferenceValues, setZazzleReferenceValues] = useState<Record<string, { title?: string; description?: string }>>({});
  const [expandedDiffCells, setExpandedDiffCells] = useState<Record<string, boolean>>({});
  const [contentWarnings, setContentWarnings] = useState<ContentWarnings>({});
  const [activeFilter, setActiveFilter] = useState<FilterKey>('total');
  const [checkedRowIds, setCheckedRowIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const summary = computeSummary(rows);
  const hasData = rows.length > 0;
  const baseCols = columns.length > 0
    ? columns
    : Object.keys(rows[0] ?? {}).filter((k) => k !== '_id');
  const tableColumns = hasData
    ? [...baseCols, ...['url_slug', 'description', 'product_type'].filter((c) => !baseCols.includes(c))]
    : PLACEHOLDER_COLUMNS;
  const visibleRows = hasData ? rows : [PLACEHOLDER_ROW];

  const allDataComplete = hasData && rows.every(
    (row) => tableColumns.every((col) => !!row[col]?.trim()),
  );
  const allIdsValid =
    hasData &&
    Object.keys(validationStatus).length === rows.length &&
    Object.values(validationStatus).every((v) => v === 'valid');

  const hasDuplicates =
    summary.duplicateProductIdRowIds.size > 0 || summary.duplicateSlugRowIds.size > 0;

  const warningCounts = useMemo(() => {
    const counts: Partial<Record<ContentWarningType, number>> = {};
    for (const rowWarnings of Object.values(contentWarnings)) {
      const seen = new Set<ContentWarningType>();
      for (const cellW of Object.values(rowWarnings))
        for (const w of cellW) seen.add(w);
      for (const t of seen) counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [contentWarnings]);

  const sortedRows = useMemo(() => {
    if (!hasData) return visibleRows;
    const opts = {
      tableColumns,
      duplicateProductIdRowIds: summary.duplicateProductIdRowIds,
      duplicateSlugRowIds: summary.duplicateSlugRowIds,
      contentWarnings,
      zazzleHydratedFields,
      zazzleReferenceValues,
    };
    return [...visibleRows].sort(
      (a, b) => computeRowWarningPriority(a, opts) - computeRowWarningPriority(b, opts),
    );
  }, [visibleRows, tableColumns, summary, contentWarnings, zazzleHydratedFields, zazzleReferenceValues]);

  const firstWarningIndex = useMemo(() => {
    if (!hasData) return -1;
    const opts = {
      tableColumns,
      duplicateProductIdRowIds: summary.duplicateProductIdRowIds,
      duplicateSlugRowIds: summary.duplicateSlugRowIds,
      contentWarnings,
      zazzleHydratedFields,
      zazzleReferenceValues,
    };
    return sortedRows.findIndex((row) => computeRowWarningPriority(row, opts) > 0);
  }, [sortedRows, tableColumns, summary, contentWarnings, zazzleHydratedFields, zazzleReferenceValues]);

  const filteredRows = useMemo(() => {
    if (activeFilter === 'total') return sortedRows;
    return sortedRows.filter((row) => {
      if (activeFilter === 'selected')
        return checkedRowIds.has(row._id);
      if (activeFilter === 'missing')
        return tableColumns.some((col) => !row[col]?.trim());
      if (activeFilter === 'duplicate_product_id')
        return summary.duplicateProductIdRowIds.has(row._id);
      if (activeFilter === 'duplicate_slug')
        return summary.duplicateSlugRowIds.has(row._id);
      return Object.values(contentWarnings[row._id] ?? {}).flat()
        .includes(activeFilter as ContentWarningType);
    });
  }, [sortedRows, activeFilter, tableColumns, summary, contentWarnings, checkedRowIds]);

  const selectedRowsList = rows.filter((r) => checkedRowIds.has(r._id));
  const selectedDataComplete = selectedRowsList.length > 0 && selectedRowsList.every(
    (row) => tableColumns.every((col) => !!row[col]?.trim()),
  );
  const selectedIdsValid =
    selectedRowsList.length > 0 &&
    selectedRowsList.every((r) => validationStatus[r._id] !== undefined) &&
    selectedRowsList.every((r) => validationStatus[r._id] === 'valid');
  const selectedHasDuplicates = selectedRowsList.some(
    (r) => summary.duplicateProductIdRowIds.has(r._id) || summary.duplicateSlugRowIds.has(r._id),
  );

  useEffect(() => {
    onReadinessChange?.({ dataComplete: selectedDataComplete, idsValid: selectedIdsValid, noDuplicates: !selectedHasDuplicates });
  }, [selectedDataComplete, selectedIdsValid, selectedHasDuplicates]);

  // Reset checkbox defaults when new row data is loaded. Not triggered by validate/hydrate so
  // user-adjusted checkboxes survive those operations.
  useEffect(() => {
    if (!hasData) { setCheckedRowIds(new Set()); return; }
    const opts = {
      tableColumns,
      duplicateProductIdRowIds: summary.duplicateProductIdRowIds,
      duplicateSlugRowIds: summary.duplicateSlugRowIds,
      contentWarnings,
      zazzleHydratedFields,
      zazzleReferenceValues,
    };
    const defaulted = new Set(
      rows
        .filter((r) => computeRowWarningPriority(r, opts) === 0 && validationStatus[r._id] !== 'invalid')
        .map((r) => r._id),
    );
    setCheckedRowIds(defaulted);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  useEffect(() => {
    onSelectionChange?.(rows.filter((r) => checkedRowIds.has(r._id)));
  }, [checkedRowIds, rows]);

  async function handleHydrate() {
    setHydrating(true);
    setHydrateMsg(null);
    const zazzleMap = buildZazzleMap();
    const hydratedFields: Record<string, string[]> = {};
    const referenceValues: Record<string, { title?: string; description?: string }> = {};
    const updated = await Promise.all(
      rows.map(async (row) => {
        if (!row.product_id?.trim()) return row;
        const product = await fetchProductFromTemplate(row.product_id);
        if (!product) return row;
        referenceValues[row._id] = {
          title: product.rootRawTitle,
          description: product.description,
        };
        const hasMissing = tableColumns.some((col) => !row[col]?.trim());
        if (!hasMissing) return row;
        const filled = { ...row };
        const newlyHydrated: string[] = [];
        for (const col of tableColumns) {
          if (!filled[col]?.trim()) {
            const zKey = zazzleMap[col];
            if (zKey) {
              filled[col] = String((product as unknown as Record<string, unknown>)[zKey] ?? '');
              newlyHydrated.push(col);
            }
          }
        }
        if (!filled['url_slug']?.trim() && filled['short_title']?.trim()) {
          filled['url_slug'] = slugify(filled['short_title']);
          if (!newlyHydrated.includes('url_slug')) newlyHydrated.push('url_slug');
        }
        hydratedFields[row._id] = newlyHydrated;
        return filled;
      }),
    );
    const changedCount = updated.filter((row, i) => row !== rows[i]).length;
    const refCount = Object.keys(referenceValues).length;
    setHydrateMsg(
      changedCount > 0
        ? `Updated ${changedCount} row${changedCount === 1 ? '' : 's'} from Zazzle`
        : refCount > 0
        ? 'All fields already complete — Zazzle data loaded for comparison'
        : 'No matching Zazzle data found',
    );
    setZazzleHydratedFields(hydratedFields);
    setZazzleReferenceValues(referenceValues);
    setExpandedDiffCells({});
    setContentWarnings(computeContentWarnings(updated));
    setActiveFilter('total');
    onChange(updated);
    setHydrating(false);
  }

  async function handleValidate() {
    setValidating(true);
    setValidateMsg(null);
    const results: Record<string, 'valid' | 'invalid'> = {};

    await Promise.all(
      rows.map(async (row) => {
        const id = row.product_id?.trim();
        if (!id) { results[row._id] = 'invalid'; return; }
        const product = await fetchProductFromTemplate(id);
        results[row._id] = product ? 'valid' : 'invalid';
      }),
    );

    setValidationStatus(results);
    const validCount = Object.values(results).filter((v) => v === 'valid').length;
    const invalidCount = Object.values(results).filter((v) => v === 'invalid').length;
    setValidateMsg(`${validCount} valid, ${invalidCount} invalid`);
    setValidating(false);
  }

  function parseCsv(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const rawFields = (result.meta.fields ?? []).filter((f) => f !== '_id');
        const rawParsed = result.data.map((row, i) => ({ ...row, _id: String(i) })) as CsvRow[];
        const { fields, rows } = ensureShortTitle(rawFields, rawParsed);
        setColumns(fields);
        onChange(rows);
      },
    });
  }

  function parseXlsx(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false });
      const rawParsed = raw.map((row, i) => ({
        ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k.trim(), String(v)])),
        _id: String(i),
      })) as CsvRow[];
      const rawFields = Object.keys(rawParsed[0] ?? {}).filter((k) => k !== '_id');
      const { fields, rows } = ensureShortTitle(rawFields, rawParsed);
      setColumns(fields);
      onChange(rows);
    };
    reader.readAsArrayBuffer(file);
  }

  function handleManualSubmit() {
    const ids = manualInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) return;
    setColumns(['product_id', 'product_type', 'title', 'short_title', 'description', 'url_slug']);
    setValidationStatus({});
    setValidateMsg(null);
    setHydrateMsg(null);
    setZazzleHydratedFields({});
    setZazzleReferenceValues({});
    setExpandedDiffCells({});
    setContentWarnings({});
    setActiveFilter('total');
    onChange(ids.map((id, i) => ({ _id: String(i), product_id: id, product_type: '', title: '', short_title: '', description: '', url_slug: '' })));
  }

  function handleFile(file: File) {
    setValidationStatus({});
    setValidateMsg(null);
    setHydrateMsg(null);
    setZazzleHydratedFields({});
    setZazzleReferenceValues({});
    setExpandedDiffCells({});
    setContentWarnings({});
    setActiveFilter('total');
    if (file.name.endsWith('.xlsx')) {
      parseXlsx(file);
    } else {
      parseCsv(file);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={() => { if (!disabled) setInputMode('manual'); }}
          disabled={disabled}
          className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
            disabled
              ? `opacity-40 cursor-not-allowed ${inputMode === 'manual' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`
              : `cursor-pointer ${inputMode === 'manual' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`
          }`}
        >
          Enter IDs
        </button>
        <button
          onClick={() => { if (!disabled) setInputMode('upload'); }}
          disabled={disabled}
          className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
            disabled
              ? `opacity-40 cursor-not-allowed ${inputMode === 'upload' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`
              : `cursor-pointer ${inputMode === 'upload' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`
          }`}
        >
          Upload File
        </button>
      </div>

      {inputMode === 'upload' ? (
        <div
          onDragOver={disabled ? undefined : (e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={disabled ? undefined : () => setIsDragging(false)}
          onDrop={disabled ? undefined : (e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={disabled ? undefined : () => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            disabled
              ? 'border-gray-200 opacity-40 cursor-not-allowed'
              : isDragging
                ? 'border-blue-400 bg-blue-50 cursor-pointer'
                : 'border-gray-200 hover:border-gray-300 cursor-pointer'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          <p className="text-sm text-gray-500">
            {hasData
              ? `${rows.length} rows loaded — click to replace`
              : 'Drop a .csv or .xlsx file here, or click to browse'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Requires{' '}
            <code className="bg-gray-100 px-1 rounded">product_id</code> column
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={manualInput}
            onChange={(e) => { if (!disabled) setManualInput(e.target.value); }}
            disabled={disabled}
            placeholder={'Paste product IDs, one per line or comma-separated, for example:\nurn:aaid:sc:VA6C2:56f7551c-a9f5-5e5a-ae74-3a0bcf8f1428\nurn:aaid:sc:VA6C2:7b3a902d-f1c4-4d8e-bc91-2e5a7f0c3d19\nurn:aaid:sc:VA6C2:b88c4843-e148-5314-b9d6-3b08a433772b'}
            rows={6}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualInput.trim() || disabled}
            className="self-start text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Load IDs
          </button>
        </div>
      )}
      {hasData && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Total" value={summary.total}
            isSelected={activeFilter === 'total'}
            onClick={() => setActiveFilter('total')}
          />
          <Stat
            label="Selected" value={checkedRowIds.size} color="indigo"
            isSelected={activeFilter === 'selected'}
            onClick={() => setActiveFilter((p) => p === 'selected' ? 'total' : 'selected')}
          />
          {summary.duplicates > 0 && (
            <Stat
              label="Duplicate product_id values" value={summary.duplicates} color="orange"
              isSelected={activeFilter === 'duplicate_product_id'}
              onClick={() => setActiveFilter((p) => p === 'duplicate_product_id' ? 'total' : 'duplicate_product_id')}
            />
          )}
          {summary.duplicateSlugs > 0 && (
            <Stat
              label="Duplicate url_slug values" value={summary.duplicateSlugs} color="orange"
              isSelected={activeFilter === 'duplicate_slug'}
              onClick={() => setActiveFilter((p) => p === 'duplicate_slug' ? 'total' : 'duplicate_slug')}
            />
          )}
          {summary.missing > 0 && (
            <Stat
              label="Rows Missing Values" value={summary.missing} color="red"
              isSelected={activeFilter === 'missing'}
              onClick={() => setActiveFilter((p) => p === 'missing' ? 'total' : 'missing')}
            />
          )}
          {(warningCounts.title_too_long ?? 0) > 0 && (
            <Stat
              label="Long title (>50)" value={warningCounts.title_too_long!} color="yellow"
              isSelected={activeFilter === 'title_too_long'}
              onClick={() => setActiveFilter((p) => p === 'title_too_long' ? 'total' : 'title_too_long')}
            />
          )}
          {(warningCounts.slug_char_mismatch ?? 0) > 0 && (
            <Stat
              label="Title/slug mismatch" value={warningCounts.slug_char_mismatch!} color="yellow"
              isSelected={activeFilter === 'slug_char_mismatch'}
              onClick={() => setActiveFilter((p) => p === 'slug_char_mismatch' ? 'total' : 'slug_char_mismatch')}
            />
          )}
          {(warningCounts.casing_issue ?? 0) > 0 && (
            <Stat
              label="Casing issues" value={warningCounts.casing_issue!} color="yellow"
              isSelected={activeFilter === 'casing_issue'}
              onClick={() => setActiveFilter((p) => p === 'casing_issue' ? 'total' : 'casing_issue')}
            />
          )}
          {(warningCounts.slug_isolated_char ?? 0) > 0 && (
            <Stat
              label="Isolated slug token" value={warningCounts.slug_isolated_char!} color="yellow"
              isSelected={activeFilter === 'slug_isolated_char'}
              onClick={() => setActiveFilter((p) => p === 'slug_isolated_char' ? 'total' : 'slug_isolated_char')}
            />
          )}
          {(warningCounts.mojibake ?? 0) > 0 && (
            <Stat
              label="Encoding issues" value={warningCounts.mojibake!} color="yellow"
              isSelected={activeFilter === 'mojibake'}
              onClick={() => setActiveFilter((p) => p === 'mojibake' ? 'total' : 'mojibake')}
            />
          )}
        </div>
      )}


      {hasData && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleValidate}
            disabled={validating || hydrating || disabled}
            className="self-start text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {validating ? 'Validating…' : 'Validate Product IDs'}
          </button>
          {hasData && (
            <button
              onClick={handleHydrate}
              disabled={hydrating || validating || disabled}
              className="self-start text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {hydrating ? 'Hydrating…' : 'Hydrate from Zazzle'}
            </button>
          )}
          {validateMsg && <span className="text-xs text-gray-500">{validateMsg}</span>}
          {hydrateMsg && <span className="text-xs text-gray-500">{hydrateMsg}</span>}
        </div>
      )}

      {hasData && (Object.keys(zazzleHydratedFields).length > 0 || Object.keys(contentWarnings).length > 0) && (
        <ZazzleLegend showContentWarning={Object.keys(contentWarnings).length > 0} />
      )}
      {disabled && hasData && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Data inputs are locked while results exist. Reset results in Step 3 to make changes.
        </p>
      )}
      <DataTable
        columns={tableColumns}
        rows={filteredRows}
        placeholder={!hasData}
        validationStatus={validationStatus}
        duplicateProductIdRowIds={summary.duplicateProductIdRowIds}
        duplicateSlugRowIds={summary.duplicateSlugRowIds}
        zazzleHydratedFields={zazzleHydratedFields}
        zazzleReferenceValues={zazzleReferenceValues}
        expandedDiffCells={expandedDiffCells}
        onToggleDiffCell={(key) => setExpandedDiffCells((prev) => ({ ...prev, [key]: !prev[key] }))}
        contentWarnings={contentWarnings}
        firstWarningIndex={activeFilter === 'total' ? firstWarningIndex : -1}
        checkedRowIds={checkedRowIds}
        onToggleCheck={(id) =>
          setCheckedRowIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          })
        }
        onToggleAll={(ids, allChecked) =>
          setCheckedRowIds((prev) => {
            const next = new Set(prev);
            if (allChecked) ids.forEach((id) => next.delete(id));
            else ids.forEach((id) => next.add(id));
            return next;
          })
        }
      />
    </div>
  );
}

function DataTable({
  columns,
  rows,
  placeholder,
  validationStatus = {},
  duplicateProductIdRowIds = new Set(),
  duplicateSlugRowIds = new Set(),
  zazzleHydratedFields = {},
  zazzleReferenceValues = {},
  expandedDiffCells = {},
  onToggleDiffCell,
  contentWarnings = {},
  firstWarningIndex = -1,
  checkedRowIds = new Set(),
  onToggleCheck,
  onToggleAll,
}: {
  columns: string[];
  rows: CsvRow[];
  placeholder: boolean;
  validationStatus?: Record<string, 'valid' | 'invalid'>;
  duplicateProductIdRowIds?: Set<string>;
  duplicateSlugRowIds?: Set<string>;
  zazzleHydratedFields?: Record<string, string[]>;
  zazzleReferenceValues?: Record<string, { title?: string; description?: string }>;
  expandedDiffCells?: Record<string, boolean>;
  onToggleDiffCell?: (key: string) => void;
  contentWarnings?: ContentWarnings;
  firstWarningIndex?: number;
  checkedRowIds?: Set<string>;
  onToggleCheck?: (id: string) => void;
  onToggleAll?: (ids: string[], allCurrentlyChecked: boolean) => void;
}) {
  const nonPlaceholderRows = placeholder ? [] : rows.filter((r) => r._id !== 'placeholder');
  const allVisibleChecked = nonPlaceholderRows.length > 0 && nonPlaceholderRows.every((r) => checkedRowIds.has(r._id));
  const someVisibleChecked = nonPlaceholderRows.some((r) => checkedRowIds.has(r._id));

  return (
    <div className={`overflow-auto rounded-xl border border-gray-200 max-h-[420px] ${placeholder ? 'opacity-40' : ''}`}>
      <table className="text-xs w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
          <tr className="border-l-2 border-l-gray-50">
            <th className="px-3 py-2 w-[40px] text-center">
              {!placeholder && (
                <input
                  type="checkbox"
                  checked={allVisibleChecked}
                  ref={(el) => { if (el) el.indeterminate = someVisibleChecked && !allVisibleChecked; }}
                  onChange={() => onToggleAll?.(nonPlaceholderRows.map((r) => r._id), allVisibleChecked)}
                  className="cursor-pointer accent-indigo-600"
                />
              )}
            </th>
            <th className="px-3 py-2 text-left font-medium text-gray-400 whitespace-nowrap w-[40px]">#</th>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                {col}
              </th>
            ))}
            {(Object.keys(validationStatus).length > 0 || Object.keys(zazzleReferenceValues).length > 0) && (
              <th className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap w-[40px]">API</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const status = validationStatus[row._id];
            const isProductIdDup = duplicateProductIdRowIds.has(row._id);
            const isSlugDup = duplicateSlugRowIds.has(row._id);
            const isDup = isProductIdDup || isSlugDup;
            const rowHasAnyWarning = computeRowHasWarning(row, {
              tableColumns: columns,
              duplicateProductIdRowIds,
              duplicateSlugRowIds,
              contentWarnings,
              zazzleHydratedFields,
              zazzleReferenceValues,
            });
            const borderClass = isDup              ? 'border-l-orange-400' :
              status === 'invalid'                 ? 'border-l-red-400'    :
              rowHasAnyWarning                     ? 'border-l-yellow-400' :
              status === 'valid'                   ? 'border-l-green-400'  :
                                                     'border-l-transparent';
            const isSectionBoundary = index === firstWarningIndex && firstWarningIndex > 0;
            return (
              <tr
                key={row._id}
                className={`border-b border-gray-100 last:border-b-0 border-l-2 ${borderClass}${isSectionBoundary ? ' border-t-4 border-t-gray-300' : ''}`}
              >
                <td className="px-3 py-2 w-[40px] text-center">
                  {!placeholder && (
                    <input
                      type="checkbox"
                      checked={checkedRowIds.has(row._id)}
                      onChange={() => onToggleCheck?.(row._id)}
                      className="cursor-pointer accent-indigo-600"
                    />
                  )}
                </td>
                <td className="px-3 py-2 text-gray-400 whitespace-nowrap w-[40px]">
                  {placeholder ? '—' : parseInt(row._id) + 1}
                </td>
                {columns.map((col) => {
                  const isEmpty = !placeholder && !row[col]?.trim();
                  const isHydrated = !placeholder && (zazzleHydratedFields[row._id]?.includes(col) ?? false);
                  const isTitleCol = col === 'title' || col === 'short_title';
                  const isDescCol = col === 'description';
                  const zazzleRef = (isTitleCol || isDescCol)
                    ? (isTitleCol ? zazzleReferenceValues[row._id]?.title : zazzleReferenceValues[row._id]?.description)
                    : undefined;
                  const hasComparison = !isHydrated && !!zazzleRef && !!row[col]?.trim();
                  const valuesMatch = hasComparison && row[col]?.trim() === zazzleRef?.trim();
                  const diffKey = `${row._id}-${col}`;
                  const isDiffExpanded = expandedDiffCells[diffKey] ?? false;
                  const cellWarnings = contentWarnings[row._id]?.[col] ?? [];
                  const hasContentWarning = cellWarnings.length > 0;
                  const cellClass = isHydrated
                    ? 'bg-purple-50 text-purple-700'
                    : isEmpty
                      ? 'bg-red-50 text-red-400 italic'
                      : hasContentWarning
                        ? 'bg-yellow-50 text-yellow-800'
                        : 'text-gray-700';
                  return (
                    <td key={col} className={`px-3 py-2 ${cellClass}`}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          {col === 'product_id' && isProductIdDup && (
                            <span className="relative group shrink-0 cursor-help text-orange-500">
                              <DuplicateIcon />
                              <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-36 rounded bg-gray-800 px-2 py-1.5 text-sm leading-snug text-white shadow-lg group-hover:block whitespace-normal">
                                Duplicate product ID
                              </span>
                            </span>
                          )}
                          {col === 'product_id' && status && (
                            <span className={`shrink-0 font-bold ${status === 'valid' ? 'text-green-500' : 'text-red-500'}`}>
                              {status === 'valid' ? '✓' : '✗'}
                            </span>
                          )}
                          {col === 'url_slug' && isSlugDup && (
                            <span className="relative group shrink-0 cursor-help text-orange-500">
                              <DuplicateIcon />
                              <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-36 rounded bg-gray-800 px-2 py-1.5 text-sm leading-snug text-white shadow-lg group-hover:block whitespace-normal">
                                Duplicate URL slug
                              </span>
                            </span>
                          )}
                          {hasContentWarning && (
                            <span className="relative group shrink-0 cursor-help text-yellow-600">
                              ⚠
                              <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-56 rounded bg-gray-800 px-2 py-1.5 text-sm leading-snug text-white shadow-lg group-hover:block whitespace-normal">
                                {cellWarnings.map((w) => CONTENT_WARNING_LABELS[w]).join(' · ')}
                              </span>
                            </span>
                          )}
                          {hasComparison && valuesMatch && (
                            <span className="shrink-0 text-green-500 font-bold" title="Matches Zazzle data">✓</span>
                          )}
                          {hasComparison && !valuesMatch && (
                            <button
                              type="button"
                              onClick={() => onToggleDiffCell?.(diffKey)}
                              className="shrink-0 flex items-center gap-0.5 font-medium text-amber-600 hover:text-amber-800 cursor-pointer"
                              title="Differs from Zazzle — click to see Zazzle's value"
                            >
                              <span>⚠</span>
                              <span className="text-xs leading-none">{isDiffExpanded ? '▲' : '▼'}</span>
                            </button>
                          )}
                          <div className="overflow-x-auto whitespace-nowrap min-w-0 flex-1">
                            {isEmpty ? '—' : (row[col] ?? '')}
                          </div>
                        </div>
                        {hasComparison && !valuesMatch && isDiffExpanded && (
                          <div className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 whitespace-normal">
                            <span className="font-medium">Zazzle: </span>{zazzleRef}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
                {(Object.keys(validationStatus).length > 0 || Object.keys(zazzleReferenceValues).length > 0) && (
                  <td className="px-3 py-2 text-center">
                    {row.product_id?.trim() && (
                      <a
                        href={`https://www.zazzle.com/svc/partner/adobeexpress/v1/getproductfromtemplate?templateId=${encodeURIComponent(row.product_id.trim())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 inline-flex items-center justify-center"
                        title="View raw Zazzle API response"
                      >
                        <ExternalLinkIcon />
                      </a>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ZazzleLegend({ showContentWarning = false }: { showContentWarning?: boolean }) {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
      <span className="font-medium text-gray-600">Legend:</span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded-sm bg-purple-100 border border-purple-300" />
        Populated from Zazzle
      </span>
      <span className="flex items-center gap-1">
        <span className="text-green-500 font-bold">✓</span>
        Matches Zazzle
      </span>
      <span className="flex items-center gap-1">
        <span className="text-amber-600 font-bold">⚠</span>
        Differs from Zazzle
      </span>
      <span className="flex items-center gap-1">
        <span className="text-orange-500"><DuplicateIcon /></span>
        Duplicate value
      </span>
      {showContentWarning && (
        <span className="flex items-center gap-1">
          <span className="text-yellow-600 font-bold">⚠</span>
          Content warning
        </span>
      )}
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
      <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
      <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
      <path d="M5 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1V5a2 2 0 0 0-2-2H5V2Z"/>
      <path d="M2 5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5Z"/>
    </svg>
  );
}

function Stat({
  label,
  value,
  color = 'gray',
  isSelected = false,
  onClick,
}: {
  label: string;
  value: number;
  color?: 'gray' | 'green' | 'yellow' | 'red' | 'orange' | 'indigo';
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const bg = { gray: 'bg-gray-50', green: 'bg-green-50', yellow: 'bg-yellow-50', red: 'bg-red-50', orange: 'bg-orange-50', indigo: 'bg-indigo-50' }[color];
  const text = { gray: 'text-gray-900', green: 'text-gray-900', yellow: 'text-yellow-700', red: 'text-red-700', orange: 'text-orange-700', indigo: 'text-indigo-700' }[color];
  const sub = { gray: 'text-gray-500', green: 'text-gray-500', yellow: 'text-yellow-600', red: 'text-red-600', orange: 'text-orange-600', indigo: 'text-indigo-500' }[color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${bg} rounded-lg p-3 text-center w-full transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-offset-1 ring-blue-500' : 'hover:brightness-95'
      }`}
    >
      <p className={`text-xl font-semibold ${text}`}>{value}</p>
      <p className={`text-xs ${sub}`}>{label}</p>
    </button>
  );
}
