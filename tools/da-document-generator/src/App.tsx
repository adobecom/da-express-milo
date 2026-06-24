import { useEffect, useState } from 'react';
import CsvUpload from './components/CsvUpload';
import GeneratePanel from './components/GeneratePanel';
import { fetchSheet } from './api/daApi';
import type { CsvRow, ProductTypeConfig } from './types';

const CONFIG_SHEET = '/adobecom/da-express-milo/drafts/maxn/doc-generator-presets';

export default function App() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [csvReadiness, setCsvReadiness] = useState({ dataComplete: false, idsValid: false, noDuplicates: true });
  const [hasGeneratedResults, setHasGeneratedResults] = useState(false);
  const [productTypeConfigs, setProductTypeConfigs] = useState<ProductTypeConfig[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    fetchSheet(CONFIG_SHEET)
      .then((sheetRows) => {
        setProductTypeConfigs(
          sheetRows
            .filter((r) => r['Product Type'] && r['Template Path'])
            .map((r) => ({
              productType: r['Product Type'],
              templatePath: r['Template Path'],
              outputDir: r['Output Directory'] ?? '',
            })),
        );
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        const is403 = msg.startsWith('403');
        const is404 = msg.startsWith('404');
        setConfigError(
          is403
            ? '403 — Access Denied: You do not have access to the config sheet. Check your active Organization in DA and reload.'
            : is404
            ? '404 — Config sheet not found. Confirm the sheet path is correct.'
            : `Error loading config: ${msg}`,
        );
      })
      .finally(() => setConfigLoading(false));
  }, []);

  const inputsReady = rows.length > 0;
  const allRowsHaveProductType = inputsReady && rows.every((r) => !!r.product_type?.trim());
  const canGenerate = inputsReady;

  const generateBlockReason: string | undefined =
    !allRowsHaveProductType
      ? 'Run Hydrate to assign product types before generating'
      : !csvReadiness.noDuplicates
      ? 'Fix duplicate product IDs or URL slugs before generating'
      : !csvReadiness.dataComplete && !csvReadiness.idsValid
      ? 'Fill in missing data and validate all product IDs before generating'
      : !csvReadiness.dataComplete
      ? 'Fill in all missing data before generating'
      : !csvReadiness.idsValid
      ? 'Validate all product IDs before generating'
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">DA Document Generator</h1>

        {configLoading && (
          <p className="text-xs text-gray-400">Loading config…</p>
        )}
        {configError && (
          <p className="text-xs text-red-500">{configError}</p>
        )}

        <div className="grid grid-cols-1 gap-4">
          <Panel step={1} title="Product Data" complete={inputsReady} locked={hasGeneratedResults}>
            <CsvUpload rows={rows} onChange={setRows} onReadinessChange={setCsvReadiness} disabled={hasGeneratedResults} />
          </Panel>
        </div>

        {canGenerate && (
          <GeneratePanel
            rows={rows}
            productTypeConfigs={productTypeConfigs}
            generateBlockReason={generateBlockReason}
            onResultsChange={setHasGeneratedResults}
          />
        )}
      </div>
    </div>
  );
}

function Panel({
  step,
  title,
  complete,
  locked,
  children,
}: {
  step: number;
  title: string;
  complete: boolean;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            complete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {complete ? '✓' : step}
        </span>
        <h2 className="font-medium text-gray-900">{title}</h2>
        {locked && (
          <span className="ml-1 text-xs text-amber-600 font-medium flex items-center gap-1">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
              <path fillRule="evenodd" d="M8 1a3 3 0 0 0-3 3v1H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm1.5 4V4a1.5 1.5 0 0 0-3 0v1h3Z" clipRule="evenodd" />
            </svg>
            Locked
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
