/**
 * Color Extract Block
 * 
 * Independent block for the Extract page (Extract colors from images)
 * 
 * Variants:
 * - palette (default) - Extract palette
 * - gradient - Extract gradient
 * 
 * Configuration:
 * - Variant: palette | gradient
 * - Max Colors: Number (default: 10)
 * - Enable Image Upload: Boolean (default: true)
 * - Enable URL Input: Boolean (default: true)
 * 
 * Dependencies:
 * - scripts/color-shared/renderers/createExtractRenderer.js
 * - scripts/color-shared/modal/createModalManager.js
 * 
 * Figma Reference: TBD (Extract Page)
 */

import { parseBlockConfig } from './helpers/parseConfig.js';
import { CSS_CLASSES, EVENTS } from './helpers/constants.js';
import { createExtractRenderer } from '../../scripts/color-shared/renderers/createExtractRenderer.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';

/**
 * Main decorate function - Entry point
 * @param {HTMLElement} block - Block element
 */
export default async function decorate(block) {
  console.log('[ColorExtract] 🚀 Block loaded');

  try {
    // 1. Parse configuration
    const rows = [...block.children];
    const config = parseBlockConfig(rows);
    console.log('[ColorExtract] Configuration:', config);

    // 2. Clear block and set up structure
    block.innerHTML = '';
    block.className = CSS_CLASSES.BLOCK;
    block.classList.add(`${CSS_CLASSES.BLOCK}--${config.variant}`);

    // 3. Create container
    const container = document.createElement('div');
    container.className = CSS_CLASSES.CONTAINER;
    block.appendChild(container);

    // 4. Create renderer
    const renderer = createExtractRenderer({
      container,
      config,
    });

    // 5. Render initial UI
    renderer.render(container);

    // 6. Initialize modal manager
    const modalManager = createModalManager();

    // 7. Set up event listeners
    renderer.on(EVENTS.IMAGE_UPLOAD, async (imageData) => {
      console.log('[ColorExtract] Image uploaded');
      block.classList.add(CSS_CLASSES.LOADING);
      // TODO: Extract colors from image
      // const colors = await extractColorsFromImage(imageData);
      // renderer.update(colors);
      block.classList.remove(CSS_CLASSES.LOADING);
    });

    renderer.on(EVENTS.PALETTE_CLICK, (palette) => {
      console.log('[ColorExtract] Palette clicked:', palette);
      modalManager.openPaletteModal(palette);
    });

    renderer.on(EVENTS.GRADIENT_CLICK, (gradient) => {
      console.log('[ColorExtract] Gradient clicked:', gradient);
      modalManager.openGradientModal(gradient);
    });

    // 8. Store instances
    block.rendererInstance = renderer;
    block.modalManagerInstance = modalManager;

    console.log('[ColorExtract] ✅ Initialization complete');
  } catch (error) {
    console.error('[ColorExtract] ❌ Error:', error);
    block.classList.add(CSS_CLASSES.ERROR);
    block.innerHTML = `<p style="color: red;">Failed to load Color Extract: ${error.message}</p>`;
  }
}
