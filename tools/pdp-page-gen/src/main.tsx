import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setToken } from './api/daSourceApi';
import './index.css';
import App from './App';

const queryClient = new QueryClient();

async function initToken() {
  const localToken = import.meta.env.VITE_DA_TOKEN;
  if (localToken) {
    setToken(localToken);
    return;
  }
  try {
    const sdkUrl = 'https://da.live/nx/utils/sdk.js';
    const DA_SDK = await Promise.race([
      import(/* @vite-ignore */ sdkUrl),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SDK load timeout (10s)')), 10000)
      ),
    ]) as { default: Promise<{ token: string }> };
    const sdkData = await Promise.race([
      DA_SDK.default,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Token retrieval timeout (5s)')), 5000)
      ),
    ]) as { token: string };
    if (sdkData?.token) setToken(sdkData.token);
  } catch {
    setToken(null);
  }
}

function main() {
  const container = document.getElementById('root');
  if (!container) {
    console.error('Root element not found');
    return;
  }

  const root = createRoot(container);

  (async () => {
    await initToken();
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </StrictMode>
    );
  })();
}

main();
