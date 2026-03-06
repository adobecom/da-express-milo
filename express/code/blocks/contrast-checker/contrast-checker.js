import { createTag } from '../../scripts/utils.js';
import { createContrastRenderer } from './factory/createContrastRenderer.js';
import createContrastDataService from './services/createContrastDataService.js';
import { initFloatingToolbar } from '../../scripts/color-shared/toolbar/createFloatingToolbar.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

let currentToolbarInstance = null;

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

function buildContrastPalette(fg, bg) {
  return {
    id: 'contrast-pair',
    name: 'Contrast Pair',
    colors: [fg, bg],
    tags: [],
  };
}

export default async function decorate(block) {
  if (block.dataset.blockStatus === 'loaded') {
    currentToolbarInstance?.destroy();
  }

  try {
    block.dataset.blockStatus = 'loading';
    block.innerHTML = '';

    const config = parseConfig(block);
    const dataService = createContrastDataService();

    const fg = config.foreground ?? '#1B1B1B';
    const bg = config.background ?? '#FFFFFF';

    const stateKey = `contrast-checker-${config.variant}`;
    BlockMediator.set(stateKey, {
      foreground: fg,
      background: bg,
      ratio: null,
      wcagResults: null,
    });

    const container = createTag('div', { class: 'contrast-checker-container' });
    block.appendChild(container);

    const renderer = createContrastRenderer(config.variant, {
      container,
      data: [],
      config,
      dataService,
      stateKey,
    });

    renderer.render();

    const toolbarContainer = createTag('div', { class: 'cc-toolbar-wrapper' });
    block.appendChild(toolbarContainer);

    const { toolbar, destroy: destroyToolbar } = await initFloatingToolbar(
      toolbarContainer,
      {
        type: 'palette',
        variant: 'sticky',
        ctaText: config.ctaText ?? 'Create with my color palette',
        mobileCTAText: config.mobileCTAText ?? 'Create with my color palette',
        showEdit: config.showEdit ?? true,
        showPalette: config.showPalette ?? true,
        showPaletteName: config.showPaletteName ?? true,
        editPaletteName: config.editPaletteName ?? true,
        palette: buildContrastPalette(fg, bg),
        //Add an additional prop for edit pallete link
      },
    );

    currentToolbarInstance = { toolbar, destroy: destroyToolbar };

    renderer.on('contrast-change', (detail) => {
      const currentState = BlockMediator.get(stateKey);
      BlockMediator.set(stateKey, {
        ...currentState,
        foreground: detail.foreground,
        background: detail.background,
        ratio: detail.ratio,
        wcagResults: {
          normalAA: detail.normalAA,
          largeAA: detail.largeAA,
          normalAAA: detail.normalAAA,
          largeAAA: detail.largeAAA,
          uiComponents: detail.uiComponents,
        },
      });

      toolbar.updateSwatches([detail.foreground, detail.background]);
    });

    block.classList.add(`contrast-checker-${config.variant}`);
    block.dataset.blockStatus = 'loaded';
  } catch (error) {
    window.lana?.log(`Contrast Checker init error: ${error.message}`, {
      tags: 'contrast-checker,init',
    });
    block.dataset.blockStatus = 'error';
    currentToolbarInstance?.destroy();
    currentToolbarInstance = null;
    block.replaceChildren();
    block.append(createTag('p', { class: 'cc-error-message' }, 'Failed to load Contrast Checker.'));
  }
}
