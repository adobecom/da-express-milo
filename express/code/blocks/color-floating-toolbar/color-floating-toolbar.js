/* global globalThis */
import { initFloatingToolbar } from '../../scripts/color-shared/toolbar/createFloatingToolbar.js';
import { createTag } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

let currentInstance = null;

function parseConfig(block) {
  const config = {
    type: 'palette',
    variant: 'standalone',
    ctaText: 'Create with my color palette',
    mobileCTAText: 'Open palette in Adobe Express',
    showEdit: true,
    paletteData: null,
  };

  [...block.children].forEach((row) => {
    const cols = [...row.children];
    if (cols.length >= 2) {
      const key = cols[0].textContent.trim().toLowerCase().replaceAll(/\s+/g, '');
      const value = cols[1].textContent.trim();
      if (key === 'type') config.type = value;
      else if (key === 'variant') config.variant = value;
      else if (key === 'ctatext') config.ctaText = value;
      else if (key === 'mobilectatext') config.mobileCTAText = value;
      else if (key === 'showedit') config.showEdit = value.toLowerCase() === 'true';
      else if (key === 'palettedata') {
        try { config.paletteData = JSON.parse(value); } catch { /* ignore */ }
      }
    }
  });

  return config;
}

function bindStateManagement(toolbar, config, palette) {
  const stateKey = `color-floating-toolbar-${config.type}`;
  try {
    BlockMediator.set(stateKey, {
      palette,
      config: { type: config.type, variant: config.variant },
    });
    ['edit', 'share', 'download', 'save', 'cta'].forEach((event) => {
      toolbar.on(event, (detail) => {
        try {
          const state = BlockMediator.get(stateKey);
          BlockMediator.set(stateKey, { ...state, lastAction: event, ...detail });
        } catch { /* non-fatal */ }
      });
    });
  } catch { /* continue without state management */ }
}

export default async function decorate(el) {
  if (el.dataset.blockStatus === 'loaded') {
    currentInstance?.destroy();
  }
  el.dataset.blockStatus = 'loading';

  try {
    const config = parseConfig(el);
    el.replaceChildren();

    const { toolbar, palette } = await initFloatingToolbar(el, {
      type: config.type,
      variant: config.variant,
      ctaText: config.ctaText,
      mobileCTAText: config.mobileCTAText,
      showEdit: config.showEdit,
    });

    currentInstance = { toolbar, destroy: () => toolbar.destroy() };
    bindStateManagement(toolbar, config, palette);

    el.classList.add(`color-floating-toolbar-${config.type}`);
    el.dataset.blockStatus = 'loaded';
  } catch (error) {
    globalThis.lana?.log(`Color Floating Toolbar init error: ${error.message}`, {
      tags: 'color-floating-toolbar,init',
    });
    el.dataset.blockStatus = 'error';
    el.replaceChildren();
    el.append(createTag('p', { class: 'error-message' }, 'Failed to load toolbar.'));
  }
}
