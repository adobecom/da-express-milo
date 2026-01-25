/**
 * Color Explorer Hybrid - Entry Point (Hardcoded POC)
 * 
 * Simple implementation to test the Gradients renderer
 */

import { createColorRenderer } from './factory/createColorRenderer.js';

/**
 * Main decorate function - Entry point
 * @param {HTMLElement} block - Block element
 */
export default async function decorate(block) {
  console.log('[ColorExplorerHybrid] 🚀 Block loaded - Hardcoded Gradients POC');

  try {
    // Clear block
    block.innerHTML = '';
    block.className = 'color-explorer-hybrid';

    // Hardcoded configuration for POC
    const config = {
      variant: 'gradients',
      initialLoad: 24,
      loadMoreIncrement: 10,
      maxItems: 34,
    };

    console.log('[ColorExplorerHybrid] Configuration:', config);

    // Create container
    const container = document.createElement('div');
    container.className = 'color-explorer-container';
    block.appendChild(container);

    // Create renderer via factory
    const renderer = createColorRenderer(config.variant, {
      container,
      data: [], // Hardcoded data is in the renderer
      config,
    });

    console.log('[ColorExplorerHybrid] ✅ Renderer created');

    // Store renderer instance for future use
    block.rendererInstance = renderer;

    console.log('[ColorExplorerHybrid] ✅ Initialization complete');
  } catch (error) {
    console.error('[ColorExplorerHybrid] ❌ Error:', error);
    block.innerHTML = '<p style="color: red;">Failed to load Color Explorer: ' + error.message + '</p>';
    block.setAttribute('data-failed', 'true');
  }
}
