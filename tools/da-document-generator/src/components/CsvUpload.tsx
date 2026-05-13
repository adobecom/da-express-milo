import { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { CsvRow, InputSummary } from '../types';

interface Props {
  rows: CsvRow[];
  onChange: (rows: CsvRow[]) => void;
}

const PLACEHOLDER_COLUMNS = ['template_id', 'url_slug', 'title'];
const PLACEHOLDER_ROW: CsvRow = { _id: 'placeholder', template_id: '-', url_slug: '-', title: '-' };

function computeSummary(rows: CsvRow[]): InputSummary {
  const total = rows.length;
  const withId = rows.filter((r) => r['template_id']?.trim() && r['url_slug']?.trim());
  const valid = withId.length;
  const missing = total - valid;

  const counts: Record<string, number> = {};
  for (const r of withId) {
    const id = r['template_id'].trim();
    counts[id] = (counts[id] ?? 0) + 1;
  }
  const duplicates = withId.filter((r) => counts[r['template_id'].trim()] > 1).length;

  return { total, valid, duplicates, missing };
}

export default function CsvUpload({ rows, onChange }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const summary = computeSummary(rows);
  const hasData = rows.length > 0;
  const tableColumns = hasData ? Object.keys(rows[0]).filter((k) => k !== '_id') : PLACEHOLDER_COLUMNS;
  const tableRows = hasData ? rows : [PLACEHOLDER_ROW];

  function parseCsv(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
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
      onChange(parsed);
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFile(file: File) {
    if (file.name.endsWith('.xlsx')) {
      parseXlsx(file);
    } else {
      parseCsv(file);
    }
  }

  return (
    <div className="flex flex-col gap-4">
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

      {hasData && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Total" value={summary.total} />
          <Stat
            label="Valid"
            value={summary.valid}
            color={summary.valid === summary.total ? 'green' : 'yellow'}
          />
          {summary.duplicates > 0 && (
            <Stat label="Duplicates" value={summary.duplicates} color="yellow" />
          )}
          {summary.missing > 0 && (
            <Stat label="Missing ID" value={summary.missing} color="red" />
          )}
        </div>
      )}

      <DataTable columns={tableColumns} rows={tableRows} placeholder={!hasData} />
    </div>
  );
}

function DataTable({
  columns,
  rows,
  placeholder,
}: {
  columns: string[];
  rows: CsvRow[];
  placeholder: boolean;
}) {
  return (
    <div className={`overflow-auto rounded-xl border border-gray-200 max-h-[420px] ${placeholder ? 'opacity-40' : ''}`}>
      <table className="text-xs w-full">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id} className="border-b border-gray-100 last:border-0">
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                  {row[col] ?? ''}
                </td>
              ))}
            </tr>
          ))}
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
