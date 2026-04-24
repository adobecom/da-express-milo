import { useState } from 'react';
import { getToken, postDoc } from './api/daApi';

const TEST_PATH = '/adobecom/da-express-milo/drafts/maxn/document-generator';
const TEST_HTML = '<html><body><header></header><main><div><p>Document Generator Test</p></div></main><footer></footer></body></html>';

type Result =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; editUrl: string | undefined }
  | { status: 'error'; message: string };

export default function App() {
  const [result, setResult] = useState<Result>({ status: 'idle' });
  const hasToken = !!getToken();

  async function handleCreate() {
    setResult({ status: 'loading' });
    try {
      const res = await postDoc(TEST_PATH, TEST_HTML);
      setResult({ status: 'success', editUrl: res.source?.editUrl });
    } catch (err) {
      setResult({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">DA Document Generator</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${hasToken ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {hasToken ? 'Token ready' : 'No token'}
          </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-1">Target document</p>
          <code className="text-xs break-all">{TEST_PATH}</code>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={result.status === 'loading' || !hasToken}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {result.status === 'loading' ? 'Creating…' : 'Create Test Document'}
        </button>

        {result.status === 'success' && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex flex-col gap-2">
            <p className="text-sm font-medium text-green-800">Document created successfully</p>
            {result.editUrl && (
              <a
                href={result.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                Open in DA →
              </a>
            )}
          </div>
        )}

        {result.status === 'error' && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-800 mb-1">Error</p>
            <p className="text-xs text-red-700 break-all">{result.message}</p>
          </div>
        )}

        {!hasToken && (
          <p className="text-xs text-gray-500 text-center">
            Set <code className="bg-gray-100 px-1 rounded">VITE_DA_TOKEN</code> in <code className="bg-gray-100 px-1 rounded">.env.local</code> to test locally
          </p>
        )}
      </div>
    </div>
  );
}
