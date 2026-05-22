import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { CsvRow, InputSummary } from '../types';
import { fetchProductFromTemplate } from '../api/zazzleApi';

interface Props {
  rows: CsvRow[];
  onChange: (rows: CsvRow[]) => void;
  placeholders?: string[];
  onReadinessChange?: (state: { dataComplete: boolean; idsValid: boolean; noDuplicates: boolean }) => void;
}

const PLACEHOLDER_COLUMNS = ['template_id', 'url_slug', 'title', 'description'];
const PLACEHOLDER_ROW: CsvRow = { _id: 'placeholder', template_id: '-', url_slug: '-', title: '-', description: '-' };

function computeSummary(rows: CsvRow[]): InputSummary {
  const total = rows.length;

  const templateIdMap: Record<string, string[]> = {};
  for (const r of rows) {
    const id = r['template_id']?.trim();
    if (id) (templateIdMap[id] ??= []).push(r._id);
  }
  const duplicateTemplateIdRowIds = new Set(
    Object.values(templateIdMap).filter((ids) => ids.length > 1).flat(),
  );

  const slugMap: Record<string, string[]> = {};
  for (const r of rows) {
    const slug = r['url_slug']?.trim();
    if (slug) (slugMap[slug] ??= []).push(r._id);
  }
  const duplicateSlugRowIds = new Set(
    Object.values(slugMap).filter((ids) => ids.length > 1).flat(),
  );

  const withId = rows.filter((r) => r['template_id']?.trim() && r['url_slug']?.trim());
  const missing = total - withId.length;
  const duplicates = duplicateTemplateIdRowIds.size;

  return { total, duplicates, missing, duplicateTemplateIdRowIds, duplicateSlugRowIds };
}

interface SchemaMatch {
  missingFromCsv: string[];
  extraInCsv: string[];
  matchedCount: number;
}

function computeSchemaMatch(csvColumns: string[], templatePlaceholders: string[]): SchemaMatch {
  const csvSet = new Set(csvColumns.filter((c) => c !== '_id'));
  const placeholderSet = new Set(templatePlaceholders);
  return {
    missingFromCsv: templatePlaceholders.filter((p) => !csvSet.has(p)),
    extraInCsv: csvColumns.filter((c) => c !== '_id' && c !== 'url_slug' && !placeholderSet.has(c)),
    matchedCount: templatePlaceholders.filter((p) => csvSet.has(p)).length,
  };
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

const MAX_VISIBLE_ROWS = 200;

export default function CsvUpload({ rows, onChange, placeholders = [], onReadinessChange }: Props) {
  const [inputMode, setInputMode] = useState<'upload' | 'manual'>('upload');
  const [manualInput, setManualInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [hydrateMsg, setHydrateMsg] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validateMsg, setValidateMsg] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<Record<string, 'valid' | 'invalid'>>({});
  const [columns, setColumns] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const summary = computeSummary(rows);
  const hasData = rows.length > 0;
  const baseCols = columns.length > 0
    ? columns
    : Object.keys(rows[0] ?? {}).filter((k) => k !== '_id');
  const tableColumns = hasData
    ? [...baseCols, ...['url_slug', 'description'].filter((c) => !baseCols.includes(c))]
    : PLACEHOLDER_COLUMNS;
  const visibleRows = hasData ? rows.slice(0, MAX_VISIBLE_ROWS) : [PLACEHOLDER_ROW];

  const allDataComplete = hasData && rows.every(
    (row) => tableColumns.every((col) => !!row[col]?.trim()),
  );
  const allIdsValid =
    hasData &&
    Object.keys(validationStatus).length === rows.length &&
    Object.values(validationStatus).every((v) => v === 'valid');

  const hasDuplicates =
    summary.duplicateTemplateIdRowIds.size > 0 || summary.duplicateSlugRowIds.size > 0;

  useEffect(() => {
    onReadinessChange?.({ dataComplete: allDataComplete, idsValid: allIdsValid, noDuplicates: !hasDuplicates });
  }, [allDataComplete, allIdsValid, hasDuplicates]);

  async function handleHydrate() {
    setHydrating(true);
    setHydrateMsg(null);
    const zazzleMap = buildZazzleMap();
    const updated = await Promise.all(
      rows.map(async (row) => {
        const hasMissing = tableColumns.some((col) => !row[col]?.trim());
        if (!hasMissing || !row.template_id?.trim()) return row;
        const product = await fetchProductFromTemplate(row.template_id);
        if (!product) return row;
        const filled = { ...row };
        for (const col of tableColumns) {
          if (!filled[col]?.trim()) {
            const zKey = zazzleMap[col];
            if (zKey) filled[col] = String((product as unknown as Record<string, unknown>)[zKey] ?? '');
          }
        }
        if (!filled['url_slug']?.trim() && filled['short_title']?.trim()) {
          filled['url_slug'] = slugify(filled['short_title']);
        }
        return filled;
      }),
    );
    const changedCount = updated.filter((row, i) => row !== rows[i]).length;
    setHydrateMsg(changedCount > 0
      ? `Updated ${changedCount} row${changedCount === 1 ? '' : 's'} from Zazzle`
      : 'No matching Zazzle data found for missing fields');
    onChange(updated);
    setHydrating(false);
  }

  async function handleValidate() {
    setValidating(true);
    setValidateMsg(null);
    const results: Record<string, 'valid' | 'invalid'> = {};

    await Promise.all(
      rows.map(async (row) => {
        const id = row.template_id?.trim();
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
        const fields = (result.meta.fields ?? []).filter((f) => f !== '_id');
        setColumns(fields);
        const parsed = result.data.map((row, i) => ({ ...row, _id: String(i) })) as CsvRow[];
        onChange(parsed);
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
      const parsed = raw.map((row, i) => ({
        ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k.trim(), String(v)])),
        _id: String(i),
      })) as CsvRow[];
      const fields = Object.keys(parsed[0] ?? {}).filter((k) => k !== '_id');
      setColumns(fields);
      onChange(parsed);
    };
    reader.readAsArrayBuffer(file);
  }

  function handleManualSubmit() {
    const ids = manualInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) return;
    setColumns(['template_id', 'title', 'short_title', 'description', 'url_slug']);
    setValidationStatus({});
    setValidateMsg(null);
    setHydrateMsg(null);
    onChange(ids.map((id, i) => ({ _id: String(i), template_id: id, title: '', short_title: '', description: '', url_slug: '' })));
  }

  function handleFile(file: File) {
    setValidationStatus({});
    setValidateMsg(null);
    setHydrateMsg(null);
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
          onClick={() => setInputMode('upload')}
          className={`text-xs px-3 py-1 rounded-full border font-medium cursor-pointer transition-colors ${
            inputMode === 'upload'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setInputMode('manual')}
          className={`text-xs px-3 py-1 rounded-full border font-medium cursor-pointer transition-colors ${
            inputMode === 'manual'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          Enter IDs
        </button>
      </div>

      {inputMode === 'upload' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
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
            <code className="bg-gray-100 px-1 rounded">template_id</code> column
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={'Paste template IDs, one per line or comma-separated\ne.g.\n150004762482726999\n150004762482726998'}
            rows={6}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualInput.trim()}
            className="self-start text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Load IDs
          </button>
        </div>
      )}
      {hasData && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Total" value={summary.total} />
          {summary.duplicates > 0 && (
            <Stat label="Duplicates" value={summary.duplicates} color="orange" />
          )}
          {summary.missing > 0 && (
            <Stat label="Rows Missing Values" value={summary.missing} color="red" />
          )}
        </div>
      )}

      {hasData && placeholders.length > 0 && (() => {
        const schemaMatch = computeSchemaMatch(tableColumns, placeholders);
        const hasMismatch = schemaMatch.missingFromCsv.length > 0 || schemaMatch.extraInCsv.length > 0;
        if (!hasMismatch) {
          return (
            <p className="text-xs font-medium text-green-600">
              ✓ All {placeholders.length} template placeholder{placeholders.length !== 1 ? 's' : ''} matched
            </p>
          );
        }
        return (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-amber-800">Column / template mismatch</p>
            {schemaMatch.missingFromCsv.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-amber-700">
                  Missing from CSV — template expects {schemaMatch.missingFromCsv.length} more:
                </p>
                <div className="flex flex-wrap gap-1">
                  {schemaMatch.missingFromCsv.map((p) => (
                    <code key={p} className="text-xs bg-amber-100 border border-amber-300 text-amber-900 px-1.5 py-0.5 rounded">
                      {p}
                    </code>
                  ))}
                </div>
              </div>
            )}
            {schemaMatch.extraInCsv.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-amber-700">Extra in CSV — not used by template:</p>
                <div className="flex flex-wrap gap-1">
                  {schemaMatch.extraInCsv.map((c) => (
                    <code key={c} className="text-xs bg-amber-100 border border-amber-300 text-amber-900 px-1.5 py-0.5 rounded">
                      {c}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {hasData && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleValidate}
            disabled={validating || hydrating}
            className="self-start text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {validating ? 'Validating…' : 'Validate Template IDs'}
          </button>
          {summary.missing > 0 && (
            <button
              onClick={handleHydrate}
              disabled={hydrating || validating}
              className="self-start text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {hydrating ? 'Hydrating…' : 'Hydrate from Zazzle'}
            </button>
          )}
          {validateMsg && <span className="text-xs text-gray-500">{validateMsg}</span>}
          {hydrateMsg && <span className="text-xs text-gray-500">{hydrateMsg}</span>}
        </div>
      )}

      <DataTable
        columns={tableColumns}
        rows={visibleRows}
        placeholder={!hasData}
        validationStatus={validationStatus}
        duplicateTemplateIdRowIds={summary.duplicateTemplateIdRowIds}
        duplicateSlugRowIds={summary.duplicateSlugRowIds}
      />
      {hasData && rows.length > MAX_VISIBLE_ROWS && (
        <p className="text-xs text-gray-400 text-center">
          Showing {MAX_VISIBLE_ROWS} of {rows.length} rows
        </p>
      )}
    </div>
  );
}

function DataTable({
  columns,
  rows,
  placeholder,
  validationStatus = {},
  duplicateTemplateIdRowIds = new Set(),
  duplicateSlugRowIds = new Set(),
}: {
  columns: string[];
  rows: CsvRow[];
  placeholder: boolean;
  validationStatus?: Record<string, 'valid' | 'invalid'>;
  duplicateTemplateIdRowIds?: Set<string>;
  duplicateSlugRowIds?: Set<string>;
}) {
  return (
    <div className={`overflow-auto rounded-xl border border-gray-200 max-h-[420px] ${placeholder ? 'opacity-40' : ''}`}>
      <table className="text-xs w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-400 whitespace-nowrap w-[40px]">#</th>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                {col}
              </th>
            ))}
            {Object.keys(validationStatus).length > 0 && (
              <th className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap w-[40px]">API</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = validationStatus[row._id];
            const isTemplateDup = duplicateTemplateIdRowIds.has(row._id);
            const isSlugDup = duplicateSlugRowIds.has(row._id);
            const isDup = isTemplateDup || isSlugDup;
            const borderClass = isDup ? 'border-l-orange-400' :
              status === 'valid' ? 'border-l-green-400' :
              status === 'invalid' ? 'border-l-red-400' :
              'border-l-transparent';
            return (
              <tr
                key={row._id}
                className={`border-b border-gray-100 last:border-b-0 border-l-2 ${borderClass}`}
              >
                <td className="px-3 py-2 text-gray-400 whitespace-nowrap w-[40px]">
                  {placeholder ? '—' : parseInt(row._id) + 1}
                </td>
                {columns.map((col) => {
                  const isEmpty = !placeholder && !row[col]?.trim();
                  return (
                    <td
                      key={col}
                      className={`px-3 py-2 ${isEmpty ? 'bg-red-50 text-red-400 italic' : 'text-gray-700'}`}
                    >
                      <div className="flex items-center gap-1">
                        {col === 'template_id' && isTemplateDup && (
                          <span className="shrink-0 font-bold text-orange-500" title="Duplicate template ID">⚠</span>
                        )}
                        {col === 'template_id' && status && (
                          <span className={`shrink-0 font-bold ${status === 'valid' ? 'text-green-500' : 'text-red-500'}`}>
                            {status === 'valid' ? '✓' : '✗'}
                          </span>
                        )}
                        {col === 'url_slug' && isSlugDup && (
                          <span className="shrink-0 font-bold text-orange-500" title="Duplicate URL slug">⚠</span>
                        )}
                        <div className="overflow-x-auto whitespace-nowrap min-w-0 flex-1">
                          {isEmpty ? '—' : (row[col] ?? '')}
                        </div>
                      </div>
                    </td>
                  );
                })}
                {Object.keys(validationStatus).length > 0 && (
                  <td className="px-3 py-2 text-center">
                    {row.template_id?.trim() && (
                      <a
                        href={`https://www.zazzle.com/svc/partner/adobeexpress/v1/getproductfromtemplate?templateId=${encodeURIComponent(row.template_id.trim())}`}
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

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
      <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
      <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
    </svg>
  );
}

function Stat({
  label,
  value,
  color = 'gray',
}: {
  label: string;
  value: number;
  color?: 'gray' | 'green' | 'yellow' | 'red' | 'orange';
}) {
  const bg = { gray: 'bg-gray-50', green: 'bg-green-50', yellow: 'bg-yellow-50', red: 'bg-red-50', orange: 'bg-orange-50' }[color];
  const text = { gray: 'text-gray-900', green: 'text-gray-900', yellow: 'text-yellow-700', red: 'text-red-700', orange: 'text-orange-700' }[color];
  const sub = { gray: 'text-gray-500', green: 'text-gray-500', yellow: 'text-yellow-600', red: 'text-red-600', orange: 'text-orange-600' }[color];
  return (
    <div className={`${bg} rounded-lg p-3 text-center`}>
      <p className={`text-xl font-semibold ${text}`}>{value}</p>
      <p className={`text-xs ${sub}`}>{label}</p>
    </div>
  );
}
