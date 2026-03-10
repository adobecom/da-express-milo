import { createTag } from '../../scripts/utils.js';
import createColorToolLayout from '../../scripts/color-shared/shell/layouts/createColorToolLayout.js';
import { createCheckerRenderer } from './renderers/createCheckerRenderer.js';
import { createPreviewRenderer } from './renderers/createPreviewRenderer.js';
import createContrastDataService from './services/createContrastDataService.js';
import { COLOR_CONTRAST_CHECKED_TAGS, CONTRAST_PRESETS } from './utils/contrastConstants.js';
import { hsvToRgb, rgbToHex } from './utils/contrastUtils.js';

let layoutInstance = null;
let checkerInstance = null;
let previewInstance = null;

function isContentRow(cols) {
  return Array.from(cols).some((col) => col.querySelector('picture, img, h1, h2, h3, h4, h5, h6'));
}

function parseContent(block) {
  const content = {};
  const rows = Array.from(block.children);

  rows.forEach((row) => {
    const cols = Array.from(row.children);
    if (cols.length < 2 || !isContentRow(cols)) return;

    const [colA, colB] = cols;
    const imgInA = colA.querySelector('picture, img');
    const textCol = imgInA ? colB : colA;
    const imageCol = imgInA ? colA : colB;

    const h = textCol.querySelector('h1, h2, h3, h4, h5, h6');
    if (h) content.heading = h.textContent.trim();

    const paragraphs = textCol.querySelectorAll('p');
    paragraphs.forEach((p) => {
      if (!p.querySelector('a') && p.textContent.trim()) {
        content.body = p.textContent.trim();
      }
    });

    const a = textCol.querySelector('a');
    if (a) content.ctaText = a.textContent.trim();

    const pic = imageCol.querySelector('picture');
    if (pic) content.image = pic.cloneNode(true);
  });

  return content;
}

function parseConfig(block) {
  const config = {
    variant: 'checker',
    showEdit: true,
  };

  const rows = Array.from(block.children);
  rows.forEach((row) => {
    const cols = Array.from(row.children);
    if (cols.length >= 2 && !isContentRow(cols)) {
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
      else if (key === 'editpalettelink') config.editPaletteLink = value;
    }
  });

  return config;
}

function pickRandomPreset() {
  const preset = CONTRAST_PRESETS[Math.floor(Math.random() * CONTRAST_PRESETS.length)];
  const toHex = ([h, s, v]) => {
    const { r, g, b } = hsvToRgb(h, s / 100, v / 100);
    return rgbToHex(r, g, b);
  };
  return { fg: toHex(preset.fg), bg: toHex(preset.bg) };
}

function mountTopbar(slot) {
  const container = createTag('div', { class: 'cc-topbar-container' });
  slot.appendChild(container);
  return {
    destroy() { container.remove(); },
  };
}

async function mountContrastChecker(slot, { config, context }) {
  const container = createTag('div', { class: 'contrast-checker-container' });
  const dataService = createContrastDataService();

  const renderer = createCheckerRenderer({
    container,
    data: [],
    config,
    dataService,
  });

  renderer.on('contrast-change', (detail) => {
    context.set('palette', {
      colors: [detail.foreground, detail.background],
      name: 'Contrast Pair',
      tags: [...COLOR_CONTRAST_CHECKED_TAGS],
      accessibilityData: { wcagLevel: dataService.getWCAGLevel(detail) },
    });
  });

  await renderer.render();

  slot.appendChild(container);

  return {
    renderer,
    destroy() {
      renderer.destroy();
      container.remove();
    },
  };
}

function mountPreviewPanel(slot, { context, content }) {
  const container = createTag('div', { class: 'cc-preview-container' });

  const renderer = createPreviewRenderer({
    container,
    context,
    content,
  });

  renderer.render();
  slot.appendChild(container);

  return {
    renderer,
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

    const content = parseContent(block);
    const config = parseConfig(block);
    block.innerHTML = '';

    let fg = config.foreground;
    let bg = config.background;
    if (!fg && !bg) {
      const preset = pickRandomPreset();
      fg = preset.fg;
      bg = preset.bg;
    }
    fg = fg ?? '#1F1F1F4D';
    bg = bg ?? '#FFFFFF';

    layoutInstance = await createColorToolLayout(block, {
      palette: {
        colors: [fg, bg],
        name: 'Contrast Pair',
        tags: [...COLOR_CONTRAST_CHECKED_TAGS],
      },
      toolbar: {
        showEdit: false,
        showPaletteName: config.showPaletteName,
        editPaletteName: config.editPaletteName,
        ctaText: config.ctaText,
        mobileCTAText: config.mobileCTAText,
      },
      dependencies: {
        spectrum: ['tabs'],
      },
    });

    mountTopbar(layoutInstance.slots.topbar);

    checkerInstance = await mountContrastChecker(layoutInstance.slots.sidebar, {
      config,
      context: layoutInstance.context,
    });

    previewInstance = mountPreviewPanel(layoutInstance.slots.canvas, {
      context: layoutInstance.context,
      content,
    });

    checkerInstance.renderer.on('contrast-highlight', (detail) => {
      previewInstance.renderer.highlightRegion?.(detail.region);
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
