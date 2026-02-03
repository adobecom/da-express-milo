/**
 * Color Explore Block
 * 
 * Independent block for the Explore page (Palettes/Gradients search results)
 * 
 * Variants:
 * - strips (default) - Display palette strips
 * - gradients - Display gradients
 * 
 * Configuration:
 * - Variant: strips | gradients
 * - Initial Load: Number (default: 24)
 * - Load More Increment: Number (default: 10)
 * - Max Items: Number (default: 100)
 * - Enable Filters: Boolean (default: true)
 * - Enable Search: Boolean (default: true)
 * 
 * Dependencies:
 * - scripts/color-shared/renderers/createStripsRenderer.js
 * - scripts/color-shared/renderers/createGradientsRenderer.js
 * - scripts/color-shared/modal/createModalManager.js
 * - scripts/color-shared/services/createColorDataService.js
 * 
 * Figma References:
 * - Strips: 5504-181748 (Explore Palettes)
 * - Gradients: 5504-181749 (Explore Gradients)
 */

import { parseBlockConfig } from './helpers/parseConfig.js';
import { CSS_CLASSES, VARIANTS, EVENTS } from './helpers/constants.js';
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';
import { createGradientsRenderer } from '../../scripts/color-shared/renderers/createGradientsRenderer.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';
import { createColorDataService } from '../../scripts/color-shared/services/createColorDataService.js';

/**
 * Main decorate function - Entry point
 * @param {HTMLElement} block - Block element
 */
export default async function decorate(block) {
  console.log('[ColorExplore] 🚀 Block loaded');

  try {
    // 1. Parse configuration from block content
    const rows = [...block.children];
    const config = parseBlockConfig(rows);
    console.log('[ColorExplore] Configuration:', config);

    // 2. Clear block and set up structure
    block.innerHTML = '';
    block.className = CSS_CLASSES.BLOCK;
    block.classList.add(`${CSS_CLASSES.BLOCK}--${config.variant}`);

    // 3. Create container
    const container = document.createElement('div');
    container.className = CSS_CLASSES.CONTAINER;
    block.appendChild(container);

    // 4. Initialize data service
    const dataService = createColorDataService({
      variant: config.variant,
      initialLoad: config.initialLoad,
      maxItems: config.maxItems,
    });

    // 5. Fetch initial data
    block.classList.add(CSS_CLASSES.LOADING);
    const data = await dataService.fetchData();
    block.classList.remove(CSS_CLASSES.LOADING);

    console.log('[ColorExplore] Data loaded:', data.length, 'items');

    // 6. Create renderer based on variant
    let renderer;
    if (config.variant === VARIANTS.GRADIENTS) {
      renderer = createGradientsRenderer({
        container,
        data,
        config,
      });
    } else {
      // Default to strips
      renderer = createStripsRenderer({
        container,
        data,
        config,
      });
    }

    // 7. Render initial UI
    renderer.render(container);

    // 8. Initialize modal manager
    const modalManager = createModalManager();

    // 9. Set up event listeners
    renderer.on(EVENTS.PALETTE_CLICK, (palette) => {
      console.log('[ColorExplore] Palette clicked:', palette);
      modalManager.openPaletteModal(palette);
    });

    renderer.on(EVENTS.GRADIENT_CLICK, (gradient) => {
      console.log('[ColorExplore] Gradient clicked:', gradient);
      modalManager.openGradientModal(gradient);
    });

    renderer.on(EVENTS.SEARCH, async ({ query }) => {
      console.log('[ColorExplore] Search:', query);
      block.classList.add(CSS_CLASSES.LOADING);
      const searchResults = await dataService.search(query);
      renderer.update(searchResults);
      block.classList.remove(CSS_CLASSES.LOADING);
    });

    renderer.on(EVENTS.FILTER, async (filters) => {
      console.log('[ColorExplore] Filter:', filters);
      block.classList.add(CSS_CLASSES.LOADING);
      const filteredResults = await dataService.filter(filters);
      renderer.update(filteredResults);
      block.classList.remove(CSS_CLASSES.LOADING);
    });

    renderer.on(EVENTS.LOAD_MORE, async () => {
      console.log('[ColorExplore] Load more');
      block.classList.add(CSS_CLASSES.LOADING);
      const moreData = await dataService.loadMore();
      renderer.update(moreData);
      block.classList.remove(CSS_CLASSES.LOADING);
    });

    // 10. Listen for search-bar block events (if present)
    document.addEventListener('floating-search:submit', async (e) => {
      const { query } = e.detail;
      console.log('[ColorExplore] Search from search-bar:', query);
      block.classList.add(CSS_CLASSES.LOADING);
      const searchResults = await dataService.search(query);
      renderer.update(searchResults);
      block.classList.remove(CSS_CLASSES.LOADING);
    });

    // 11. Store instances for cleanup/debugging
    block.rendererInstance = renderer;
    block.modalManagerInstance = modalManager;
    block.dataServiceInstance = dataService;

    console.log('[ColorExplore] ✅ Initialization complete');
  } catch (error) {
    console.error('[ColorExplore] ❌ Error:', error);
    block.classList.add(CSS_CLASSES.ERROR);
    block.innerHTML = `<p style="color: red;">Failed to load Color Explore: ${error.message}</p>`;
    block.setAttribute('data-failed', 'true');
  }
}
