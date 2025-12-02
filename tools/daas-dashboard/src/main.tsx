import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { setToken } from './utils.js';
import './index.css';
import App from './App.tsx';

const { token } = await DA_SDK;
setToken(token);

// Function to initialize the app
export function initTemplatesAsAService(containerId = 'root') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Auto-initialize if running in browser and root element exists
if (typeof window !== 'undefined' && document.getElementById('root')) {
  initTemplatesAsAService('root');
}
