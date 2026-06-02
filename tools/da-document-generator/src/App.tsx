import { useState } from 'react';
import CsvUpload from './components/CsvUpload';
import TemplateConfirm from './components/TemplateConfirm';
import GeneratePanel from './components/GeneratePanel';
import type { CsvRow, TemplateState } from './types';

const INITIAL_TEMPLATE: TemplateState = {
  status: 'idle',
  html: null,
  sourcePath: null,
  outputDir: null,
  outputDirValid: null,
  outputDirError: null,
  placeholders: [],
  issues: [],
};

export default function App() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [template, setTemplate] = useState<TemplateState>(INITIAL_TEMPLATE);
  const [csvReadiness, setCsvReadiness] = useState({ dataComplete: false, idsValid: false, noDuplicates: true });
  const [hasGeneratedResults, setHasGeneratedResults] = useState(false);

  const inputsReady = rows.length > 0;
  const templateReady =
    (template.status === 'ready' || template.status === 'warning') &&
    template.outputDirValid === true;
  const canGenerate = inputsReady && templateReady;

  const generateBlockReason: string | undefined =
    !csvReadiness.noDuplicates
      ? 'Fix duplicate template IDs or URL slugs before generating'
      : !csvReadiness.dataComplete && !csvReadiness.idsValid
      ? 'Fill in missing data and validate all template IDs before generating'
      : !csvReadiness.dataComplete
      ? 'Fill in all missing data before generating'
      : !csvReadiness.idsValid
      ? 'Validate all template IDs before generating'
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">DA Document Generator</h1>

        <div className="grid grid-cols-1 gap-4">
          <Panel step={1} title="Template" complete={templateReady} locked={hasGeneratedResults}>
            <TemplateConfirm state={template} onChange={setTemplate} disabled={hasGeneratedResults} />
          </Panel>

          <Panel step={2} title="Product Data" complete={inputsReady} locked={hasGeneratedResults}>
            <CsvUpload rows={rows} onChange={setRows} placeholders={template.placeholders} onReadinessChange={setCsvReadiness} disabled={hasGeneratedResults} />
          </Panel>
        </div>

        {canGenerate && <GeneratePanel rows={rows} template={template} generateBlockReason={generateBlockReason} onResultsChange={setHasGeneratedResults} />}
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
