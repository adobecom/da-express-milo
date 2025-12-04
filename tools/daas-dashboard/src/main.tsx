import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setToken, updatePageUrl, loadPagesData, savePagesData } from './utils.js';
import { LoadingScreen, ErrorScreen } from './components/InitializationScreens';
import './index.css';
import App from './App.tsx';

// Function to initialize the app
export function initTemplatesAsAService(containerId = 'root') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  const root = createRoot(container);

  // Show loading screen initially
  root.render(
    <StrictMode>
      <LoadingScreen message="Loading DA SDK..." />
    </StrictMode>
  );

  // Dynamically import and initialize DA SDK
  (async () => {
    try {
      // Check for local development token first
      const localToken = import.meta.env.VITE_DA_TOKEN;
      
      if (localToken) {
        console.log('🔧 Using local development token from .env');
        setToken(localToken);
        
        // Try to load DA SDK for inspection (non-blocking)
        try {
          console.log('🔍 Attempting to load DA SDK for inspection...');
          const DA_SDK = await import('https://da.live/nx/utils/sdk.js');
          console.log('🔍 DA_SDK object:', DA_SDK);
          console.log('🔍 DA_SDK keys:', Object.keys(DA_SDK));
          console.log('🔍 DA_SDK.default (promise):', DA_SDK.default);
          
          // Await the promise to see what's inside
          const sdkData = await DA_SDK.default;
          console.log('🔍 SDK Data (resolved):', sdkData);
          console.log('🔍 SDK Data type:', typeof sdkData);
          console.log('🔍 SDK Data keys:', Object.keys(sdkData));
          console.log('🔍 SDK Data constructor:', sdkData.constructor?.name);
          
          // If it's an object, log its properties
          if (typeof sdkData === 'object' && sdkData !== null) {
            const dataObj = sdkData as unknown as Record<string, unknown>;
            for (const key of Object.keys(dataObj)) {
              console.log(`🔍   - ${key}:`, typeof dataObj[key], dataObj[key]);
            }
            
            // Check for methods on the prototype
            const proto = Object.getPrototypeOf(sdkData);
            const methods = Object.getOwnPropertyNames(proto).filter(name => 
              name !== 'constructor' && typeof proto[name] === 'function'
            );
            if (methods.length > 0) {
              console.log('🔍 SDK Methods:', methods);
            }
          }
        } catch {
          console.log('ℹ️  DA SDK not available (expected in local dev)');
        }
      } else {
        console.log('🔄 Initializing DA SDK...');
        
        // Dynamic import of DA SDK with timeout
        const DA_SDK = await Promise.race([
          import('https://da.live/nx/utils/sdk.js'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SDK load timeout (10s)')), 10000)
          )
        ]) as { default: Promise<{ token: string }> };

        console.log('✅ DA SDK loaded');
        console.log('🔍 DA_SDK object:', DA_SDK);
        console.log('🔍 DA_SDK keys:', Object.keys(DA_SDK));
        console.log('🔍 DA_SDK.default type:', typeof DA_SDK.default);
        
        console.log('⏳ Waiting for authentication token...');
        const sdkData = await Promise.race([
          DA_SDK.default,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Token retrieval timeout (5s)')), 5000)
          )
        ]) as { token: string };
        
        console.log('🔍 SDK Data received:', sdkData);
        console.log('🔍 SDK Data keys:', Object.keys(sdkData));
        console.log('🔍 SDK Data methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(sdkData)));
        
        const { token } = sdkData;
        
        if (!token) {
          throw new Error('No authentication token received from DA SDK');
        }
        
        console.log('✅ Authentication token received');
        setToken(token);
      }

      // Log what DA-related objects exist on window
      const win = window as unknown as Record<string, unknown>;
      console.log('🔍 Window DA objects:', {
        adobeIMS: typeof win.adobeIMS,
        DA: typeof win.DA,
        daApi: typeof win.daApi,
        hlx: typeof win.hlx
      });
      
      // Expose utility functions to window for console access
      const { batchCheckStatus } = await import('./api/daApi');
      (window as unknown as Record<string, unknown>).__DA_UTILS__ = {
        updatePageUrl,
        loadPagesData,
        savePagesData,
        batchCheckStatus
      };
      console.log('💡 Utility functions available: window.__DA_UTILS__');
      console.log('💡 To check status: await window.__DA_UTILS__.batchCheckStatus(["/path/to/page.html"])');

      // Render the actual app
      console.log('✅ Rendering app...');
      root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      console.log('⚠️  Attempting to run in offline mode with mock data...');
      console.log('💡 To use live data, run this app from within DA.live');
      
      // Try to run without authentication (using mock data)
      try {
        root.render(
          <StrictMode>
            <App />
          </StrictMode>
        );
        console.log('✅ Running in offline mode - dashboard will use mock data');
        console.log('💡 Check the dashboard - it should now be visible with sample data');
      } catch (fallbackError) {
        console.error('❌ Offline mode also failed:', fallbackError);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        root.render(
          <StrictMode>
            <ErrorScreen error={errorMessage} />
          </StrictMode>
        );
      }
    }
  })();
}

// Auto-initialize if running in browser and root element exists
if (typeof window !== 'undefined' && document.getElementById('root')) {
  initTemplatesAsAService('root');
}
