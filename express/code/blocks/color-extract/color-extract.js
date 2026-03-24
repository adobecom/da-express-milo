import { parseBlockConfig } from './helpers/parseConfig.js';
import { CSS_CLASSES, EVENTS } from './helpers/constants.js';
import { createExtractRenderer } from '../../scripts/color-shared/renderers/createExtractRenderer.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';

export default async function decorate(block) {
  try {
    const rows = [...block.children];
    const config = parseBlockConfig(rows);

    block.innerHTML = '';
    block.className = CSS_CLASSES.BLOCK;
    block.classList.add(`${CSS_CLASSES.BLOCK}--${config.variant}`);

    const container = document.createElement('div');
    container.className = CSS_CLASSES.CONTAINER;
    block.appendChild(container);

    const renderer = createExtractRenderer({
      container,
      config,
    });

    renderer.render(container);

    const modalManager = createModalManager();

    renderer.on(EVENTS.IMAGE_UPLOAD, async (imageData) => {
      block.classList.add(CSS_CLASSES.LOADING);
      block.classList.remove(CSS_CLASSES.LOADING);
    });

    renderer.on(EVENTS.PALETTE_CLICK, (palette) => {
      modalManager.openPaletteModal(palette);
    });

    renderer.on(EVENTS.GRADIENT_CLICK, (gradient) => {
      modalManager.openGradientModal(gradient);
    });

    block.rendererInstance = renderer;
    block.modalManagerInstance = modalManager;
  } catch (error) {
    console.error('[ColorExtract] ❌ Error:', error);
    block.classList.add(CSS_CLASSES.ERROR);
    block.innerHTML = `<p style="color: red;">Failed to load Color Extract: ${error.message}</p>`;
  }
}
