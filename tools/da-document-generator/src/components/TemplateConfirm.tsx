import { useEffect, useRef, useState } from 'react';
import { cat, fetchSheet, validateTemplate } from '../api/daApi';
import type { TemplateState } from '../types';

interface Props {
  state: TemplateState;
  onChange: (state: TemplateState) => void;
}

interface TemplateOption {
  productName: string;
  templatePath: string;
  outputDir: string;
}

const STATUS_BADGE: Record<string, string> = {
  ready: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  invalid: 'bg-red-100 text-red-700',
  error: 'bg-red-100 text-red-700',
};

const STATUS_CARD: Record<string, string> = {
  ready: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  invalid: 'bg-red-50 border-red-200',
  error: 'bg-red-50 border-red-200',
};

const STATUS_LABEL: Record<string, string> = {
  ready: 'Ready',
  warning: 'Warning',
  invalid: 'Invalid',
  error: 'Error',
};

const CONFIG_SHEET = '/adobecom/da-express-milo/drafts/maxn/document-generator/test-sheet';

export default function TemplateConfirm({ state, onChange }: Props) {
  const [options, setOptions] = useState<TemplateOption[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TemplateOption | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await fetchSheet(CONFIG_SHEET);
        const parsed: TemplateOption[] = rows
          .filter((r) => r['Template Path'])
          .map((r) => ({
            productName: r['Product Name'] ?? '',
            templatePath: r['Template Path'],
            outputDir: r['Output Directory'] ?? '',
          }));
        setOptions(parsed);
        if (parsed.length > 0) setSelected(parsed[0]);
      } catch (err) {
        setListError(err instanceof Error ? err.message : String(err));
      } finally {
        setListLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleConfirm() {
    if (!selected) return;
    const { templatePath, outputDir } = selected;
    onChange({ status: 'loading', html: null, sourcePath: templatePath, outputDir, placeholders: [], issues: [] });

    try {
      const html = await cat(templatePath);
      const validation = validateTemplate(html);
      onChange({ status: validation.status, html, sourcePath: templatePath, outputDir, placeholders: validation.placeholders, issues: validation.issues });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const is403 = msg.startsWith('403');
      const is404 = msg.startsWith('404');
      onChange({
        status: is403 || is404 ? 'invalid' : 'error',
        html: null,
        sourcePath: templatePath,
        outputDir,
        placeholders: [],
        issues: [
          is403 ? 'Access denied — confirm you are in the correct DA organization'
                : is404 ? 'Template not found — check the path and confirm you have access'
                : `Fetch error: ${msg}`,
        ],
      });
    }
  }

  useEffect(() => {
    if (!selected?.templatePath) return;
    const timer = setTimeout(() => { handleConfirm(); }, 600);
    return () => clearTimeout(timer);
  }, [selected]);

  const showResult = state.status !== 'idle' && state.status !== 'loading';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1" ref={dropdownRef}>
        {listLoading && (
          <p className="text-xs text-gray-400">Loading templates…</p>
        )}
        {listError && (
          <p className="text-xs text-red-500">Could not load config: {listError}</p>
        )}

        {!listLoading && options.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen((o) => !o)}
              className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left cursor-pointer"
            >
              <span className="font-medium text-gray-800">
                {selected?.productName ?? 'Select a template'}
              </span>
              <svg className="w-4 h-4 text-gray-400 shrink-0 ml-2" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {isOpen && (
              <ul className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                {options.map((opt) => (
                  <li
                    key={opt.templatePath}
                    onClick={() => { setSelected(opt); setIsOpen(false); }}
                    className={`px-3 py-2.5 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      selected?.templatePath === opt.templatePath ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800">{opt.productName}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{opt.templatePath}</p>
                    <p className="text-xs text-gray-400 truncate">{opt.outputDir}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 pl-1">
          Template config from{' '}
          <code className="bg-gray-100 px-1 rounded font-mono">{CONFIG_SHEET}</code>
        </p>
      </div>

      {showResult && (
        <div className={`rounded-xl p-4 border flex flex-col gap-3 ${STATUS_CARD[state.status]}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[state.status]}`}>
              {STATUS_LABEL[state.status]}
            </span>
            {state.sourcePath && (
              <a
                href={`https://da.live/edit#${state.sourcePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 break-all hover:text-blue-600 font-mono inline-flex items-center gap-1"
              >
                {state.sourcePath}
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
                  <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z"/>
                  <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z"/>
                </svg>
              </a>
            )}
          </div>

          {state.placeholders.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                Placeholders ({state.placeholders.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {state.placeholders.map((p) => (
                  <code key={p} className="text-xs bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                    {`{{${p}}}`}
                  </code>
                ))}
              </div>
            </div>
          )}

          {state.issues.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">Issues</p>
              <ul className="flex flex-col gap-1">
                {state.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-gray-700">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
