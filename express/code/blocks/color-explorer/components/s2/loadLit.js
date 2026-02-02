/**
 * Load Lit from Milo following Express pattern with fallback chain
 * Dynamically injects import map so Spectrum components can import 'lit'
 * 
 * Fallback chain:
 * 1. Try Milo's lit-all.min.js (getLibs())
 * 2. If fails, try CDN (jsdelivr)
 * 3. If fails, try local /express/code/libs/deps/lit-all.min.js
 */
import { getLibs } from '../../../../scripts/utils.js';

let litLoaded = false;

/**
 * Loads Lit with fallback chain
 * @returns {Promise<void>}
 */
export async function loadLit() {
  if (litLoaded) return;

  const fallbackUrls = [];
  
  try {
    // Primary: Milo's Lit
    const miloLibs = getLibs();
    fallbackUrls.push({
      url: `${miloLibs}/deps/lit-all.min.js`,
      source: 'Milo',
    });
  } catch (error) {
    console.warn('[loadLit] Failed to get Milo libs path:', error);
  }

  // Fallback 1: CDN (jsdelivr)
  fallbackUrls.push({
    url: 'https://cdn.jsdelivr.net/npm/lit@3.1.0/index.min.js',
    source: 'CDN (jsdelivr)',
  });

  // Fallback 2: Local copy
  fallbackUrls.push({
    url: '/express/code/libs/deps/lit-all.min.js',
    source: 'Local',
  });

  let lastError = null;

  // Try each URL in fallback chain
  for (const { url, source } of fallbackUrls) {
    try {
      console.log(`[loadLit] Attempting to load Lit from ${source}: ${url}`);

      // Inject import map dynamically (needed for Spectrum bundle imports)
      if (!document.querySelector('script[type="importmap"]')) {
        const importMap = document.createElement('script');
        importMap.type = 'importmap';
        importMap.textContent = JSON.stringify({
          imports: {
            lit: url,
            'lit/': `${url}/`,
            '@lit/reactive-element': url,
            '@lit/reactive-element/': `${url}/`,
          },
        });
        document.head.prepend(importMap);
      }

      // Try to load Lit
      if (source === 'Milo') {
        // Use Milo's loadScript utility
        const miloLibs = getLibs();
        const { loadScript } = await import(`${miloLibs}/utils/utils.js`);
        await loadScript(url);
      } else {
        // Use simple script loading for CDN/local
        await loadScriptSimple(url);
      }

      console.log(`[loadLit] ✅ Successfully loaded Lit from ${source}`);
      litLoaded = true;
      return;
    } catch (error) {
      lastError = error;
      console.warn(`[loadLit] Failed to load Lit from ${source}:`, error.message);
      // Remove import map if it was added, so we can try next URL
      const importMap = document.querySelector('script[type="importmap"]');
      if (importMap) {
        importMap.remove();
      }
      // Continue to next fallback
    }
  }

  // All fallbacks failed
  const errorMsg = `Failed to load Lit from all sources: ${fallbackUrls.map(f => f.source).join(', ')}`;
  console.error(`[loadLit] ${errorMsg}`);
  window.lana?.log(errorMsg, { 
    error: lastError?.message,
    tags: 'color-explorer,lit,critical',
  });
  throw new Error(errorMsg);
}

/**
 * Simple script loader (fallback for CDN/local)
 * @param {string} url - Script URL
 * @returns {Promise<void>}
 */
function loadScriptSimple(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'module';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}
