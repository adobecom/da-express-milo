import { createTag } from '../../scripts/utils.js';
import createColorToolLayout from '../../scripts/color-shared/shell/layouts/createColorToolLayout.js';
import { createCheckerRenderer } from './renderers/createCheckerRenderer.js';
import { createPreviewRenderer } from './renderers/createPreviewRenderer.js';
import createContrastDataService from './services/createContrastDataService.js';

let layoutInstance = null;
let checkerInstance = null;
let previewInstance = null;

function parseConfig(block) {
  const config = {
    variant: 'checker',
    showEdit: true,
  };

  const rows = Array.from(block.children);
  rows.forEach((row) => {
    const cols = Array.from(row.children);
    if (cols.length >= 2) {
      const key = cols[0].textContent.trim().toLowerCase().replaceAll(/\s+/g, '');
      const value = cols[1].textContent.trim();
      if (key === 'variant') config.variant = value;
      else if (key === 'foreground') config.foreground = value;
      else if (key === 'background') config.background = value;
      else if (key === 'ctatext') config.ctaText = value;
      else if (key === 'mobilectatext') config.mobileCTAText = value;
      else if (key === 'showedit') config.showEdit = value.toLowerCase() === 'true';
      else if (key === 'showpalettename') config.showPaletteName = value.toLowerCase() === 'true';
      else if (key === 'editpalettename') config.editPaletteName = value.toLowerCase() === 'true';
    }
  });

  return config;
}

function mountTopbar(slot) {
  const container = createTag('div', { class: 'cc-topbar-container' });
  slot.appendChild(container);
  return {
    destroy() { container.remove(); },
  };
}

function mountContrastChecker(slot, { config, context }) {
  const container = createTag('div', { class: 'contrast-checker-container' });
  const dataService = createContrastDataService();

  const renderer = createCheckerRenderer({
    container,
    data: [],
    config,
    dataService,
  });

  renderer.render();

  renderer.on('contrast-change', (detail) => {
    context.set('palette', {
      colors: [detail.foreground, detail.background],
      name: 'Contrast Pair',
    });
  });

  slot.appendChild(container);

  return {
    destroy() {
      renderer.destroy();
      container.remove();
    },
  };
}

function mountPreviewPanel(slot, { context }) {
  const container = createTag('div', { class: 'cc-preview-container' });

  const renderer = createPreviewRenderer({
    container,
    context,
  });

  renderer.render();
  slot.appendChild(container);

  return {
    destroy() {
      renderer.destroy();
      container.remove();
    },
  };
}

function cleanup() {
  checkerInstance?.destroy();
  checkerInstance = null;
  previewInstance?.destroy();
  previewInstance = null;
  layoutInstance?.destroy();
  layoutInstance = null;
}

export default async function decorate(block) {
  cleanup();

  try {
    block.dataset.blockStatus = 'loading';

    const config = parseConfig(block);
    block.innerHTML = '';

    const fg = config.foreground ?? '#1B1B1B';
    const bg = config.background ?? '#FFFFFF';

    layoutInstance = await createColorToolLayout(block, {
      palette: { colors: [fg, bg], name: 'Contrast Pair' },
      toolbar: {
        showEdit: config.showEdit,
        showPaletteName: config.showPaletteName,
        editPaletteName: config.editPaletteName,
        ctaText: config.ctaText,
        mobileCTAText: config.mobileCTAText,
      },
    });

    mountTopbar(layoutInstance.slots.topbar);

    checkerInstance = mountContrastChecker(layoutInstance.slots.sidebar, {
      config,
      context: layoutInstance.context,
    });

    previewInstance = mountPreviewPanel(layoutInstance.slots.canvas, {
      context: layoutInstance.context,
    });

    block.classList.add('ax-shell-host', `contrast-checker-${config.variant}`);
    block.dataset.shellState = 'ready';
    block.dataset.blockStatus = 'loaded';
  } catch (error) {
    window.lana?.log(`Contrast Checker init error: ${error.message}`, {
      tags: 'contrast-checker,init',
    });
    block.dataset.blockStatus = 'error';
    cleanup();
    block.replaceChildren();
    block.append(createTag('p', { class: 'cc-error-message' }, 'Failed to load Contrast Checker.'));
  }
}
