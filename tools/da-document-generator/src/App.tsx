import { useState } from 'react';
import CsvUpload from './components/CsvUpload';
import GeneratePanel from './components/GeneratePanel';
import TemplateOverridePanel from './components/TemplateOverridePanel';
import type { CsvRow, ProductTypeConfig } from './types';

export const DEFAULT_CONFIG_SHEET = '/adobecom/da-express-milo/doc-generator-presets';

export default function App() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<CsvRow[]>([]);
  const [csvReadiness, setCsvReadiness] = useState({ dataComplete: false, idsValid: false, noDuplicates: true });
  const [hasGeneratedResults, setHasGeneratedResults] = useState(false);
  const [configSheetPath, setConfigSheetPath] = useState(DEFAULT_CONFIG_SHEET);
  const [productTypeConfigs, setProductTypeConfigs] = useState<ProductTypeConfig[]>([]);
  const [templateOverrideEnabled, setTemplateOverrideEnabled] = useState(false);
  const [overrideConfig, setOverrideConfig] = useState<ProductTypeConfig | undefined>(undefined);

  function handleConfigSheetLoad(path: string, configs: ProductTypeConfig[]) {
    setConfigSheetPath(path);
    setProductTypeConfigs(configs);
  }

  const inputsReady = rows.length > 0;
  const allRowsHaveProductType = selectedRows.length > 0 && selectedRows.every((r) => !!r.product_type?.trim());
  const canGenerate = inputsReady;

  const missingProductTypes = !templateOverrideEnabled && productTypeConfigs.length > 0
    ? [...new Set(selectedRows.map((r) => r.product_type?.trim()).filter(Boolean) as string[])]
        .filter((pt) => !productTypeConfigs.some((c) => c.productType === pt))
    : [];

  const generateBlockReason: string | undefined =
    selectedRows.length === 0
      ? 'Select at least one row to generate'
      : templateOverrideEnabled && !overrideConfig
      ? 'Select a valid template override or uncheck the override option to continue'
      : !templateOverrideEnabled && !allRowsHaveProductType
      ? 'Run Hydrate to assign product types before generating'
      : !templateOverrideEnabled && missingProductTypes.length > 0
      ? `Config sheet missing entries for: ${missingProductTypes.join(', ')}`
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

        <TemplateOverridePanel
          enabled={templateOverrideEnabled}
          onEnabledChange={setTemplateOverrideEnabled}
          onOverrideChange={setOverrideConfig}
          disabled={hasGeneratedResults}
          configSheetPath={configSheetPath}
          onConfigSheetLoad={handleConfigSheetLoad}
          missingProductTypes={missingProductTypes}
        />

        <div className="grid grid-cols-1 gap-4">
          <Panel step={2} title="Product Data" complete={inputsReady} locked={hasGeneratedResults}>
            <CsvUpload rows={rows} onChange={setRows} onReadinessChange={setCsvReadiness} onSelectionChange={setSelectedRows} disabled={hasGeneratedResults} />
          </Panel>
        </div>

        {canGenerate && (
          <GeneratePanel
            rows={selectedRows}
            productTypeConfigs={productTypeConfigs}
            overrideConfig={overrideConfig}
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
