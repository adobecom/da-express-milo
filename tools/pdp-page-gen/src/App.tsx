import { useState } from 'react';
import {
  fetchProductFromTemplate,
  type ProductFromTemplateResponse,
} from './api/fetchProductFromTemplate';
import {
  urlToSourcePath,
  cat,
  postDoc,
  pathToSourcePath,
} from './api/daSourceApi';
import './App.css';

function parseIdsFromPaste(text: string): string[] {
  return text
    .split(/[\n,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseIdsFromCsv(csvText: string): string[] {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  return lines
    .map((line) => {
      const firstCell = line.split(',')[0]?.trim() ?? '';
      return firstCell;
    })
    .filter(Boolean);
}

const PATH_PREFIX = '/drafts/jingle/pdp-page-gen/';

/** Default URL for "Link to Template Page" (used by Confirm / cat). */
const DEFAULT_TEMPLATE_PAGE_URL =
  'https://main--da-express-milo--adobecom.aem.live/drafts/jingle/pdp-page-gen/template';

/** Convert product title to path: spaces → dashes, all lowercase */
function titleToPath(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, '-');
}

export interface TableRow {
  path: string;
  title: string;
  description: string;
  templateId: string;
}

function responseToRow(
  res: ProductFromTemplateResponse,
  templateId: string,
): TableRow {
  const title = res.product?.title ?? '';
  const description = res.product?.description ?? '';
  const slug = titleToPath(title);
  return {
    path: slug ? `${PATH_PREFIX}${slug}` : PATH_PREFIX,
    title,
    description,
    templateId,
  };
}

/** Stable key for a row: title, or templateId when title is empty (e.g. deduped empty-title rows). */
function getRowKey(row: TableRow): string {
  return row.title || row.templateId;
}

function App() {
  const [pastedIds, setPastedIds] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pageUrl, setPageUrl] = useState(DEFAULT_TEMPLATE_PAGE_URL);
  const [templateHtml, setTemplateHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [generatingRow, setGeneratingRow] = useState<string | null>(null);
  const [generatedRows, setGeneratedRows] = useState<Set<string>>(new Set());
  const [generatedEditUrls, setGeneratedEditUrls] = useState<
    Record<string, string>
  >({});
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const toggleRow = (rowKey: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  const handleGenerate = async (rowKey: string) => {
    const row = tableRows.find((r) => getRowKey(r) === rowKey);
    if (!row) return;
    if (!templateHtml) {
      alert('No template loaded. Hit Confirm first.');
      return;
    }
    setGeneratingRow(rowKey);
    try {
      const html = templateHtml
        .replace(/\[\[title\]\]/g, row.title)
        .replace(/\[\[description\]\]/g, row.description)
        .replace(/\[\[template-id\]\]/g, row.templateId);
      const dest = pathToSourcePath(row.path);
      const res = await postDoc(dest, html);
      setGeneratedRows((prev) => new Set(prev).add(rowKey));
      const editUrl = res.source?.editUrl;
      if (editUrl)
        setGeneratedEditUrls((prev) => ({ ...prev, [row.path]: editUrl }));
      console.log('Doc created:', dest);
    } catch (err) {
      console.error('Generate failed:', err);
    } finally {
      setGeneratingRow(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.name.endsWith('.csv')) {
      setUploadedFile(file);
    } else if (file) {
      setUploadedFile(null);
    }
  };

  const handleConfirm = async () => {
    const url = pageUrl.trim();
    if (!url) {
      console.warn('No page URL entered.');
      return;
    }
    setConfirmLoading(true);
    try {
      const sourcePath = urlToSourcePath(url);
      const html = await cat(sourcePath);
      setTemplateHtml(html);
    } catch (err) {
      console.error('Failed to fetch page via DA source:', err);
      setTemplateHtml(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleFetchList = async () => {
    const idsFromPaste = parseIdsFromPaste(pastedIds);
    let idsFromCsv: string[] = [];
    if (uploadedFile) {
      const text = await uploadedFile.text();
      idsFromCsv = parseIdsFromCsv(text);
    }
    const ids = idsFromPaste.length > 0 ? idsFromPaste : idsFromCsv;
    if (ids.length === 0) {
      console.warn('No IDs found. Paste IDs or upload a CSV.');
      return;
    }
    setLoading(true);
    try {
      const responses = await Promise.all(
        ids.map((id) => fetchProductFromTemplate(id)),
      );
      const rows = ids.map((id, i) => responseToRow(responses[i], id));
      // Dedupe by product title; keep last occurrence's data (description, path, templateId, etc.)
      const order: string[] = [];
      const byTitle = new Map<string, TableRow>();
      for (const row of rows) {
        const key = row.title;
        if (!byTitle.has(key)) order.push(key);
        byTitle.set(key, row);
      }
      setTableRows(order.map((k) => byTitle.get(k)!));
    } catch (err) {
      console.error('API error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 sm:p-8">
      <div className="w-full max-w-full mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold gradient-text">PDP Page Gen</h1>
          <p className="text-gray-600 mt-1">
            Upload a CSV or paste a list of IDs to generate DA docs.
          </p>
        </header>

        <div className="space-y-6">
          {/* Upload areas: 6/12 each on md+, full width on small */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="glass rounded-xl p-6 hover-lift transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Upload CSV
              </h2>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <span className="text-gray-500">
                  {uploadedFile
                    ? uploadedFile.name
                    : 'Click or drag CSV file here'}
                </span>
              </label>
            </section>
            <section className="glass rounded-xl p-6 hover-lift transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Or paste IDs
              </h2>
              <textarea
                className="w-full h-40 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Paste one ID per line or comma-separated..."
                value={pastedIds}
                onChange={(e) => setPastedIds(e.target.value)}
              />
            </section>
            {/* Page URL: full width on desktop */}
            <section className="glass rounded-xl p-6 hover-lift transition-shadow md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Link to Template Page
              </h2>
              <div className="flex w-full gap-2 items-center">
                <input
                  type="url"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  placeholder="https://www.adobe.com/express/create/print/business-card/green-and-white-personal-business-card"
                  className="min-w-0 flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirmLoading}
                  className="px-4 py-2 rounded-lg font-medium bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {confirmLoading ? 'Fetching…' : 'Confirm'}
                </button>
                {templateHtml !== null && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-sm font-medium">
                    <span
                      className="w-2 h-2 rounded-full bg-green-500"
                      aria-hidden
                    />{' '}
                    Template ready
                  </span>
                )}
              </div>
            </section>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleFetchList}
              disabled={loading}
              className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Fetching…' : 'Fetch products'}
            </button>
          </div>

          {/* Table: 12/12; on small screens rows stack (Path/Title/Description per row) */}
          {tableRows.length > 0 && (
            <section className="w-full glass rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Products
              </h2>
              <div className="mb-4 text-gray-700">
                Folder:{' '}
                <a
                  href="https://da.live/#/adobecom/da-express-milo/drafts/jingle/pdp-page-gen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  {PATH_PREFIX}
                </a>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  Bulk Generate
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                >
                  Bulk Preview
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                >
                  Bulk Publish
                </button>
              </div>
              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <colgroup>
                    <col className="w-10" />
                    <col className="w-1/4" />
                    <col className="w-1/4" />
                    <col className="w-1/3" />
                    <col className="w-52" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-700" />
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Path
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Title
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Description
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => {
                      const rowKey = getRowKey(row);
                      return (
                      <tr
                        key={rowKey}
                        className={`border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer select-none ${selectedRows.has(rowKey) ? 'bg-purple-50/80' : ''}`}
                        onClick={() => toggleRow(rowKey)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && toggleRow(rowKey)}
                      >
                        <td
                          className="py-2 px-2 align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRows.has(rowKey)}
                            onChange={() => toggleRow(rowKey)}
                            className="rounded border-gray-300"
                            aria-label={`Select ${row.title || rowKey}`}
                          />
                        </td>
                        <td className="py-2 px-4 text-gray-800 font-mono text-sm break-words align-top overflow-hidden">
                          {generatedEditUrls[row.path] ? (
                            <a
                              href={generatedEditUrls[row.path]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {row.path}
                            </a>
                          ) : (
                            row.path
                          )}
                        </td>
                        <td className="py-2 px-4 text-gray-800 break-words align-top overflow-hidden">
                          {row.title}
                        </td>
                        <td className="py-2 px-4 text-gray-600 text-sm break-words align-top overflow-hidden">
                          {row.description}
                        </td>
                        <td
                          className="py-2 px-4 align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleGenerate(rowKey)}
                              disabled={
                                generatingRow !== null || generatedRows.has(rowKey)
                              }
                              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                            >
                              {generatingRow === rowKey
                                ? 'Generating…'
                                : generatedRows.has(rowKey)
                                  ? 'Generated'
                                  : 'Generate'}
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                            >
                              Publish
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Small screens: stacked rows (no table, natural wrap) */}
              <div className="md:hidden space-y-4">
                {tableRows.map((row) => {
                  const rowKey = getRowKey(row);
                  return (
                  <div
                    key={rowKey}
                    className={`border rounded-lg p-4 cursor-pointer select-none ${selectedRows.has(rowKey) ? 'border-purple-400 bg-purple-50/80' : 'border-gray-200 bg-white/80'}`}
                    onClick={() => toggleRow(rowKey)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleRow(rowKey)}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowKey)}
                        onChange={() => toggleRow(rowKey)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300"
                        aria-label={`Select ${row.title || rowKey}`}
                      />
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerate(rowKey);
                          }}
                          disabled={
                            generatingRow !== null || generatedRows.has(rowKey)
                          }
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                        >
                          {generatingRow === rowKey
                            ? 'Generating…'
                            : generatedRows.has(rowKey)
                              ? 'Generated'
                              : 'Generate'}
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                        >
                          Publish
                        </button>
                      </div>
                    </div>
                    <div className="text-gray-700 font-semibold text-sm mb-1">
                      Path
                    </div>
                    {generatedEditUrls[row.path] ? (
                      <a
                        href={generatedEditUrls[row.path]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline font-mono text-sm break-words"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.path}
                      </a>
                    ) : (
                      <span className="font-mono text-sm break-words">
                        {row.path}
                      </span>
                    )}
                    <div className="text-gray-700 font-semibold text-sm mt-3 mb-1">
                      Title
                    </div>
                    <div className="text-gray-800 break-words">{row.title}</div>
                    <div className="text-gray-700 font-semibold text-sm mt-3 mb-1">
                      Description
                    </div>
                    <div className="text-gray-600 text-sm break-words">
                      {row.description}
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
