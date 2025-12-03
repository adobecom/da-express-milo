import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setToken, updatePageUrl, loadPagesData, savePagesData } from './utils.js';
import { testDAApi } from './api/testApi';
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
        
        console.log('⏳ Waiting for authentication token...');
        const sdkData = await Promise.race([
          DA_SDK.default,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Token retrieval timeout (5s)')), 5000)
          )
        ]) as { token: string };
        
        console.log('🔍 SDK Data received:', sdkData);
        
        const { token } = sdkData;
        
        if (!token) {
          throw new Error('No authentication token received from DA SDK');
        }
        
        console.log('✅ Authentication token received');
        setToken(token);
      }

      // Expose utility functions to window for console access
      (window as unknown as Record<string, unknown>).__DA_UTILS__ = {
        updatePageUrl,
        loadPagesData,
        savePagesData
      };
      console.log('💡 Utility functions available: window.__DA_UTILS__');

      // Test DA API - check console for data shapes
      testDAApi()
        .then(result => {
          console.log('');
          console.log('📊 API Test Summary:');
          console.log(result.summary);
          // Store in window for manual exploration in console
          (window as unknown as Record<string, unknown>).__DA_TEST_RESULTS__ = result;
          console.log('💡 Tip: Access results via window.__DA_TEST_RESULTS__ in console');
        })
        .catch((err) => {
          console.error('API test failed:', err);
        });

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
