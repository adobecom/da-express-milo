/**
 * Color Explorer Hybrid - Entry Point
 * 
 * WIREFRAME FILE - Shows structure and flow
 * 
 * Responsibilities:
 * - Parse authoring configuration
 * - Determine variant (strips, gradients, extract)
 * - Create appropriate renderer via factory
 * - Handle global lifecycle & events
 * 
 * Does NOT:
 * - Render UI directly
 * - Manipulate DOM (delegates to renderer)
 * - Fetch data directly (uses service)
 */

import { createTag } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

// Factory & Services
import { createColorRenderer } from './factory/createColorRenderer.js';
import { createColorDataService } from './services/createColorDataService.js';

/**
 * Parse configuration from block authoring
 * @param {HTMLElement} block - Block element
 * @returns {Object} Configuration object
 */
function parseConfig(block) {
  const config = {
    variant: 'strips', // Default variant
    apiEndpoint: '/api/color/palettes',
    limit: 24,
    searchEnabled: true,
    filters: {
      type: true,
      category: true,
      time: true,
    },
  };

  // Determine variant from class
  if (block.classList.contains('gradients')) {
    config.variant = 'gradients';
    config.apiEndpoint = '/api/color/gradients';
  } else if (block.classList.contains('extract')) {
    config.variant = 'extract';
    config.apiEndpoint = null; // No API for image upload
    config.searchEnabled = false;
  }

  // Parse additional config from block table (future)
  // TODO: Parse table rows for custom config

  return config;
}

/**
 * Set up global event listeners
 * @param {Object} renderer - Renderer instance
 * @param {HTMLElement} block - Block element
 */
function setupGlobalEvents(renderer, block) {
  // Listen to renderer events
  renderer.on('item-click', (detail) => {
    console.log('[Entry Point] Item clicked:', detail);
    // TODO: Open modal, emit analytics, etc.
  });

  renderer.on('search', (detail) => {
    console.log('[Entry Point] Search:', detail);
    // TODO: Fetch filtered data, update renderer
  });

  renderer.on('filter-change', (detail) => {
    console.log('[Entry Point] Filter change:', detail);
    // TODO: Fetch filtered data, update renderer
  });

  // Cleanup on block removal
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node === block) {
          renderer.destroy?.();
          observer.disconnect();
        }
      });
    });
  });
  observer.observe(block.parentElement, { childList: true });
}

/**
 * Main decorate function - Entry point
 * @param {HTMLElement} block - Block element
 */
export default async function decorate(block) {
  try {
    // Clear authored content
    block.innerHTML = '';

    // 1. Parse configuration from authoring
    const config = parseConfig(block);
    console.log('[Entry Point] Config:', config);

    // 2. Create data service
    const dataService = createColorDataService(config);

    // 3. Fetch initial data
    const data = await dataService.fetch();
    console.log('[Entry Point] Data fetched:', data.length, 'items');

    // 4. Initialize state management
    const stateKey = `color-explorer-hybrid-${config.variant}`;
    BlockMediator.set(stateKey, {
      variant: config.variant,
      data,
      selectedItem: null,
      searchQuery: '',
      filters: {},
    });

    // 5. Create renderer via factory
    const renderer = createColorRenderer(config.variant, {
      data,
      config,
      dataService,
      stateKey,
    });
    console.log('[Entry Point] Renderer created:', config.variant);

    // 6. Render to DOM
    renderer.render(block);

    // 7. Set up global event listeners
    setupGlobalEvents(renderer, block);

    console.log('[Entry Point] ✅ Initialization complete');
  } catch (error) {
    console.error('[Entry Point] ❌ Error:', error);
    block.innerHTML = '<p>Failed to load color explorer.</p>';
    block.setAttribute('data-failed', 'true');
  }
}
