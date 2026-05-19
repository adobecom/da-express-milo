import { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { CsvRow, InputSummary } from '../types';
import { fetchProductFromTemplate } from '../api/zazzleApi';

interface Props {
  rows: CsvRow[];
  onChange: (rows: CsvRow[]) => void;
  placeholders?: string[];
}

const PLACEHOLDER_COLUMNS = ['template_id', 'url_slug', 'title'];
const PLACEHOLDER_ROW: CsvRow = { _id: 'placeholder', template_id: '-', url_slug: '-', title: '-' };

function computeSummary(rows: CsvRow[]): InputSummary {
  const total = rows.length;
  const withId = rows.filter((r) => r['template_id']?.trim() && r['url_slug']?.trim());
  const missing = total - withId.length;

  const counts: Record<string, number> = {};
  for (const r of withId) {
    const id = r['template_id'].trim();
    counts[id] = (counts[id] ?? 0) + 1;
  }
  const duplicates = withId.filter((r) => counts[r['template_id'].trim()] > 1).length;

  return { total, duplicates, missing };
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

export default function CsvUpload({ rows, onChange, placeholders = [] }: Props) {
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
    ? (baseCols.includes('url_slug') ? baseCols : [...baseCols, 'url_slug'])
    : PLACEHOLDER_COLUMNS;
  const visibleRows = hasData ? rows.slice(0, MAX_VISIBLE_ROWS) : [PLACEHOLDER_ROW];

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
    setColumns(['template_id', 'title', 'short_title', 'url_slug']);
    setValidationStatus({});
    setValidateMsg(null);
    setHydrateMsg(null);
    onChange(ids.map((id, i) => ({ _id: String(i), template_id: id, title: '', short_title: '', url_slug: '' })));
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
          className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
            inputMode === 'upload'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setInputMode('manual')}
          className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
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
            className="self-start text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Load IDs
          </button>
        </div>
      )}
      {hasData && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Total" value={summary.total} />
          {summary.duplicates > 0 && (
            <Stat label="Duplicates" value={summary.duplicates} color="yellow" />
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
            className="self-start text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {validating ? 'Validating…' : 'Validate Template IDs'}
          </button>
          {summary.missing > 0 && (
            <button
              onClick={handleHydrate}
              disabled={hydrating || validating}
              className="self-start text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {hydrating ? 'Hydrating…' : 'Hydrate from Zazzle'}
            </button>
          )}
          {validateMsg && <span className="text-xs text-gray-500">{validateMsg}</span>}
          {hydrateMsg && <span className="text-xs text-gray-500">{hydrateMsg}</span>}
        </div>
      )}

      <DataTable columns={tableColumns} rows={visibleRows} placeholder={!hasData} validationStatus={validationStatus} />
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
}: {
  columns: string[];
  rows: CsvRow[];
  placeholder: boolean;
  validationStatus?: Record<string, 'valid' | 'invalid'>;
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
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = validationStatus[row._id];
            return (
              <tr
                key={row._id}
                className={`border-b border-gray-100 last:border-0 border-l-2 ${
                  status === 'valid' ? 'border-l-green-400' :
                  status === 'invalid' ? 'border-l-red-400' :
                  'border-l-transparent'
                }`}
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
                      <div className="max-w-[200px] overflow-x-auto whitespace-nowrap">
                        {col === 'template_id' && status && (
                          <span className={`mr-1 font-bold ${status === 'valid' ? 'text-green-500' : 'text-red-500'}`}>
                            {status === 'valid' ? '✓' : '✗'}
                          </span>
                        )}
                        {isEmpty ? '—' : (row[col] ?? '')}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Stat({
  label,
  value,
  color = 'gray',
}: {
  label: string;
  value: number;
  color?: 'gray' | 'green' | 'yellow' | 'red';
}) {
  const bg = { gray: 'bg-gray-50', green: 'bg-green-50', yellow: 'bg-yellow-50', red: 'bg-red-50' }[color];
  const text = { gray: 'text-gray-900', green: 'text-gray-900', yellow: 'text-yellow-700', red: 'text-red-700' }[color];
  const sub = { gray: 'text-gray-500', green: 'text-gray-500', yellow: 'text-yellow-600', red: 'text-red-600' }[color];
  return (
    <div className={`${bg} rounded-lg p-3 text-center`}>
      <p className={`text-xl font-semibold ${text}`}>{value}</p>
      <p className={`text-xs ${sub}`}>{label}</p>
    </div>
  );
}
