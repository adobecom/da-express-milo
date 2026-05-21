import { useState } from 'react';
import CsvUpload from './components/CsvUpload';
import TemplateConfirm from './components/TemplateConfirm';
import GeneratePanel from './components/GeneratePanel';
import type { CsvRow, TemplateState } from './types';

const INITIAL_TEMPLATE: TemplateState = {
  status: 'idle',
  html: null,
  sourcePath: null,
  placeholders: [],
  issues: [],
};

export default function App() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [template, setTemplate] = useState<TemplateState>(INITIAL_TEMPLATE);
  const [csvReadiness, setCsvReadiness] = useState({ dataComplete: false, idsValid: false });

  const inputsReady = rows.length > 0;
  const templateReady = template.status === 'ready' || template.status === 'warning';
  const canGenerate = inputsReady && templateReady;

  const generateBlockReason: string | undefined =
    !csvReadiness.dataComplete && !csvReadiness.idsValid
      ? 'Fill in missing data and validate all template IDs before generating'
      : !csvReadiness.dataComplete
      ? 'Fill in all missing data before generating'
      : !csvReadiness.idsValid
      ? 'Validate all template IDs before generating'
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">DA Document Generator</h1>

        <div className="grid grid-cols-1 gap-4">
          <Panel step={1} title="Template" complete={templateReady}>
            <TemplateConfirm state={template} onChange={setTemplate} />
          </Panel>

          <Panel step={2} title="Product Data" complete={inputsReady}>
            <CsvUpload rows={rows} onChange={setRows} placeholders={template.placeholders} onReadinessChange={setCsvReadiness} />
          </Panel>
        </div>

        {canGenerate && <GeneratePanel rows={rows} template={template} generateBlockReason={generateBlockReason} />}
      </div>
    </div>
  );
}

function Panel({
  step,
  title,
  complete,
  children,
}: {
  step: number;
  title: string;
  complete: boolean;
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
      </div>
      {children}
    </div>
  );
}
