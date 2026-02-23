import { createTag } from '../../scripts/utils.js';
import { createContrastRenderer } from './factory/createContrastRenderer.js';
import { createContrastDataService } from './services/createContrastDataService.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

function parseConfig(block) {
  const config = {
    variant: 'checker',
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
    }
  });

  return config;
}

export default async function decorate(block) {
  if (block.dataset.blockStatus === 'loaded') return;

  try {
    block.dataset.blockStatus = 'loading';
    block.innerHTML = '';

    const config = parseConfig(block);
    const dataService = createContrastDataService();

    const stateKey = `contrast-checker-${config.variant}`;
    BlockMediator.set(stateKey, {
      foreground: config.foreground ?? '#1B1B1B',
      background: config.background ?? '#FFFFFF',
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
    });

    block.classList.add(`contrast-checker-${config.variant}`);
    block.dataset.blockStatus = 'loaded';
  } catch (error) {
    window.lana?.log(`Contrast Checker init error: ${error.message}`, {
      tags: 'contrast-checker,init',
    });
    block.dataset.blockStatus = 'error';
    block.replaceChildren();
    block.append(createTag('p', { class: 'cc-error-message' }, 'Failed to load Contrast Checker.'));
  }
}
