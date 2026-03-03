import { useState } from 'react';
import { fetchProductFromTemplate } from './api/fetchProductFromTemplate';
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
  return lines.map((line) => {
    const firstCell = line.split(',')[0]?.trim() ?? '';
    return firstCell;
  }).filter(Boolean);
}

function App() {
  const [pastedIds, setPastedIds] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.name.endsWith('.csv')) {
      setUploadedFile(file);
    } else if (file) {
      setUploadedFile(null);
    }
  };

  const handleFetchOne = async () => {
    const idsFromPaste = parseIdsFromPaste(pastedIds);
    let idsFromCsv: string[] = [];
    if (uploadedFile) {
      const text = await uploadedFile.text();
      idsFromCsv = parseIdsFromCsv(text);
    }
    const firstId = idsFromPaste[0] ?? idsFromCsv[0] ?? null;
    if (!firstId) {
      console.warn('No ID found. Paste an ID or upload a CSV with at least one ID.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetchProductFromTemplate(firstId);
      console.log('API response for template ID', firstId, ':', response);
    } catch (err) {
      console.error('API error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold gradient-text">PDP Page Gen</h1>
          <p className="text-gray-600 mt-1">
            Upload a CSV or paste a list of IDs to generate DA docs.
          </p>
        </header>

        <div className="space-y-6">
          {/* CSV upload */}
          <section className="glass rounded-xl p-6 hover-lift transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Upload CSV</h2>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="text-gray-500">
                {uploadedFile ? uploadedFile.name : 'Click or drag CSV file here'}
              </span>
            </label>
          </section>

          {/* Paste IDs */}
          <section className="glass rounded-xl p-6 hover-lift transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Or paste IDs</h2>
            <textarea
              className="w-full h-40 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Paste one ID per line or comma-separated..."
              value={pastedIds}
              onChange={(e) => setPastedIds(e.target.value)}
            />
          </section>

          {/* Fetch first product */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleFetchOne}
              disabled={loading}
              className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Fetching…' : 'Fetch 1 product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
