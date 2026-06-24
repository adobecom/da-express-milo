import { useEffect, useRef, useState } from 'react';
import { cat, checkDirectoryExists, fetchSheet, validateTemplate } from '../api/daApi';
import type { DirectoryCheckResult } from '../api/daApi';
import type { ProductTypeConfig } from '../types';

interface Props {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  onOverrideChange: (config: ProductTypeConfig | undefined) => void;
  disabled?: boolean;
}

interface TemplateOption {
  productName: string;
  templatePath: string;
  outputDir: string;
}

interface ValidationState {
  status: 'idle' | 'loading' | 'ready' | 'warning' | 'invalid' | 'error';
  html: string | null;
  sourcePath: string;
  outputDir: string;
  outputDirValid: boolean | null;
  outputDirError: string | null;
  placeholders: string[];
  issues: string[];
}

const INITIAL_VALIDATION: ValidationState = {
  status: 'idle',
  html: null,
  sourcePath: '',
  outputDir: '',
  outputDirValid: null,
  outputDirError: null,
  placeholders: [],
  issues: [],
};

const STATUS_CARD: Record<string, string> = {
  ready: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  invalid: 'bg-red-50 border-red-200',
  error: 'bg-red-50 border-red-200',
};

const CONFIG_SHEET = '/adobecom/da-express-milo/drafts/maxn/doc-generator-presets';

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
      <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z"/>
      <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z"/>
    </svg>
  );
}

export default function TemplateOverridePanel({ enabled, onEnabledChange, onOverrideChange, disabled = false }: Props) {
  const [options, setOptions] = useState<TemplateOption[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TemplateOption | null>(null);
  const [validation, setValidation] = useState<ValidationState>(INITIAL_VALIDATION);
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const is403 = msg.startsWith('403');
        const is404 = msg.startsWith('404');
        setListError(
          is403
            ? '403 — Access Denied: You do not have access to the template config sheet. You may be signed in to the wrong Organization, check your active Organization in DA and try reloading.'
            : is404
            ? '404 — Not Found: The template config sheet could not be found. Confirm the sheet path is correct.'
            : `Error loading template config: ${msg}`,
        );
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
    setValidation({ ...INITIAL_VALIDATION, status: 'loading', sourcePath: templatePath, outputDir });

    const [htmlResult, dirCheck] = await Promise.allSettled([
      cat(templatePath),
      checkDirectoryExists(outputDir),
    ]);

    const dirResult: DirectoryCheckResult = dirCheck.status === 'fulfilled'
      ? dirCheck.value
      : { valid: false, error: 'Could not reach DA to verify directory' };

    if (htmlResult.status === 'rejected') {
      const msg = htmlResult.reason instanceof Error ? htmlResult.reason.message : String(htmlResult.reason);
      const is403 = msg.startsWith('403');
      const is404 = msg.startsWith('404');
      setValidation({
        status: is403 || is404 ? 'invalid' : 'error',
        html: null,
        sourcePath: templatePath,
        outputDir,
        outputDirValid: dirResult.valid,
        outputDirError: dirResult.error ?? null,
        placeholders: [],
        issues: [
          is403 ? 'Access denied — confirm you are in the correct DA organization'
                : is404 ? 'Template not found — check the path and confirm you have access'
                : `Fetch error: ${msg}`,
        ],
      });
      onOverrideChange(undefined);
      return;
    }

    const html = htmlResult.value;
    const result = validateTemplate(html);
    const newStatus = result.status;
    setValidation({
      status: newStatus,
      html,
      sourcePath: templatePath,
      outputDir,
      outputDirValid: dirResult.valid,
      outputDirError: dirResult.error ?? null,
      placeholders: result.placeholders,
      issues: result.issues,
    });

    if (newStatus === 'ready' || newStatus === 'warning') {
      onOverrideChange({ productType: '', templatePath, outputDir });
    } else {
      onOverrideChange(undefined);
    }
  }

  useEffect(() => {
    if (!enabled || disabled || !selected?.templatePath) return;
    const timer = setTimeout(() => { handleConfirm(); }, 600);
    return () => clearTimeout(timer);
  }, [selected, enabled, disabled]);

  function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {
    onEnabledChange(e.target.checked);
    if (!e.target.checked) {
      setSelected(null);
      setValidation(INITIAL_VALIDATION);
      onOverrideChange(undefined);
    }
  }

  const showResult = validation.status !== 'idle' && validation.status !== 'loading';
  const templateValid = validation.status === 'ready' || validation.status === 'warning';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleCheckbox}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium text-gray-900">Override template</span>
        </label>
        <span className="ml-auto text-gray-400 text-sm">{enabled ? '▼' : '▶'}</span>
      </div>
      <p className="text-xs text-gray-500">
        Optionally select a template to use for all documents, overriding per-product-type routing.
      </p>

      {enabled && (
        <div className="flex flex-col gap-4 pt-2 border-t border-gray-100">
          <div className="flex flex-col gap-1" ref={dropdownRef}>
            {listLoading && (
              <p className="text-xs text-gray-400">Loading templates…</p>
            )}
            {listError && (
              <p className="text-xs text-red-500 pl-1">{listError}</p>
            )}

            {!listLoading && options.length > 0 && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => { if (!disabled) setIsOpen((o) => !o); }}
                  disabled={disabled}
                  className={`w-full flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none text-left transition-colors ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <span className="font-medium text-gray-800">
                    {selected?.productName || selected?.templatePath || 'Select a template'}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 shrink-0 ml-2" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {disabled && (
                  <div className="absolute bottom-full left-0 mb-1.5 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity duration-150">
                    Reset results to change the template override
                  </div>
                )}

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
                        <p className="text-sm font-medium text-gray-800">{opt.productName || opt.templatePath}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5"><span className="font-medium">Template Path:</span> {opt.templatePath}</p>
                        <p className="text-xs text-gray-400 truncate"><span className="font-medium">Output Directory:</span> {opt.outputDir}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="text-xs text-gray-400 pl-1">
              Template options are loaded from{' '}
              <a
                href={`https://da.live/sheet#${CONFIG_SHEET}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-gray-500 hover:text-blue-600 inline-flex items-center gap-0.5"
              >
                <code className="bg-gray-100 px-1 rounded">{CONFIG_SHEET}</code>
                <ExternalLinkIcon />
              </a>
              {' '}— add new template document / output directory options directly in that sheet.
            </p>
          </div>

          {showResult && (
            <div className={`rounded-xl p-4 border flex flex-col gap-3 ${STATUS_CARD[validation.status]}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Template Path</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  templateValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {templateValid ? 'Valid' : 'Invalid'}
                </span>
              </div>

              {validation.sourcePath && (
                <a
                  href={`https://da.live/edit#${validation.sourcePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 break-all hover:text-blue-600 font-mono inline-flex items-center gap-1"
                >
                  {validation.sourcePath}
                  <ExternalLinkIcon />
                </a>
              )}

              {validation.placeholders.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">
                    Placeholders ({validation.placeholders.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {validation.placeholders.map((p) => (
                      <code key={p} className="text-xs bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                        {`{{${p}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {validation.issues.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">Issues</p>
                  <ul className="flex flex-col gap-1">
                    {validation.issues.map((issue, i) => (
                      <li key={i} className="text-xs text-gray-700">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {validation.outputDir && validation.outputDirValid !== null && (
            <div className={`rounded-xl p-4 border flex flex-col gap-3 ${
              validation.outputDirValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Output Directory</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  validation.outputDirValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {validation.outputDirValid ? 'Valid' : 'Invalid'}
                </span>
              </div>

              <a
                href={`https://da.live/#${validation.outputDir}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 break-all hover:text-blue-600 font-mono inline-flex items-center gap-1"
              >
                {validation.outputDir}
                <ExternalLinkIcon />
              </a>

              {!validation.outputDirValid && validation.outputDirError && (
                <p className="text-xs text-red-600">{validation.outputDirError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
