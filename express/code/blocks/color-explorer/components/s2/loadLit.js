/**
 * Load Lit from Milo following Express pattern
 * Dynamically injects import map so Spectrum components can import 'lit'
 */
import { getLibs } from '../../../../scripts/utils.js';

let litLoaded = false;

/**
 * Loads Lit from Milo and sets up import map
 * @returns {Promise<void>}
 */
export async function loadLit() {
  if (litLoaded) return;

  try {
    const miloLibs = getLibs();
    const litUrl = `${miloLibs}/deps/lit-all.min.js`;

    // Inject import map dynamically (needed for Spectrum bundle imports)
    if (!document.querySelector('script[type="importmap"]')) {
      const importMap = document.createElement('script');
      importMap.type = 'importmap';
      importMap.textContent = JSON.stringify({
        imports: {
          lit: litUrl,
          'lit/': `${litUrl}/`,
          '@lit/reactive-element': litUrl,
          '@lit/reactive-element/': `${litUrl}/`,
        },
      });
      document.head.prepend(importMap);
    }

    // Preload Lit (browser will cache it)
    const { loadScript } = await import(`${miloLibs}/utils/utils.js`);
    await loadScript(litUrl);

    litLoaded = true;
  } catch (error) {
    window.lana?.log('Failed to load Lit from Milo', { error: error.message });
    throw error;
  }
}
