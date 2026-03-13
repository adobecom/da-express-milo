import { createTag } from '../../scripts/utils.js';
import createColorToolLayout from '../../scripts/color-shared/shell/layouts/createColorToolLayout.js';
import { createCheckerRenderer } from './renderers/createCheckerRenderer.js';
import { createPreviewRenderer } from './renderers/createPreviewRenderer.js';
import createContrastDataService from './services/createContrastDataService.js';
import createKulerPaletteService from './services/createKulerPaletteService.js';
import { CONTRAST_PRESETS, DEFAULT_ACTION_MENU_CONFIG } from './utils/contrastConstants.js';
import { hsvToRgb, rgbToHex } from './utils/contrastUtils.js';
import { isMobileViewport } from '../../scripts/color-shared/utils/utilities.js';

let layoutInstance = null;
let checkerInstance = null;
let previewInstance = null;

function parseContent(block) {
  const layout = {};
  const preview = {};
  const rows = Array.from(block.children);

  rows.forEach((row) => {
    const cols = Array.from(row.children);
    if (cols.length < 2) return;

    const key = cols[0].textContent.trim().toLowerCase().replaceAll(/[-_\s]+/g, '');
    const valueCol = cols[1];

    switch (key) {
      case 'pageheading': {
        const h = valueCol.querySelector('h1, h2, h3, h4, h5, h6');
        if (h) layout.heading = h.cloneNode(true);
        break;
      }
      case 'pagesubheading': {
        const p = valueCol.querySelector('p') || valueCol;
        const textContent = p.textContent?.trim();
        if (textContent) {
          layout.paragraph = createTag('p', {}, textContent);
        }
        break;
      }
      case 'previewblockheading': {
        const h = valueCol.querySelector('h1, h2, h3, h4, h5, h6');
        preview.heading = h ? h.textContent.trim() : valueCol.textContent.trim();
        break;
      }
      case 'previewblockdescription': {
        const p = valueCol.querySelector('p') || valueCol;
        preview.description = p.textContent?.trim() || '';
        break;
      }
      case 'previewblockbutton': {
        const a = valueCol.querySelector('a');
        preview.ctaText = a ? a.textContent.trim() : valueCol.textContent.trim();
        break;
      }
      case 'previewblockimage': {
        const pic = valueCol.querySelector('picture');
        if (pic) preview.image = pic.cloneNode(true);
        break;
      }
      default:
        break;
    }
  });

  return { layout, preview };
}

function getDefaultConfig() {
  return {
    variant: 'checker',
    showEdit: true,
  };
}

function pickRandomPreset() {
  const preset = CONTRAST_PRESETS[Math.floor(Math.random() * CONTRAST_PRESETS.length)];
  const toHex = ([h, s, v]) => {
    const { r, g, b } = hsvToRgb(h, s / 100, v / 100);
    return rgbToHex(r, g, b);
  };
  const colors = [toHex(preset.fg), toHex(preset.bg)];
  return { foreground: colors[0], background: colors[1], colors, name: 'Random Preset' };
}

async function getPalette(config) {
  if (config.foreground && config.background) {
    const colors = [config.foreground, config.background];
    return { foreground: colors[0], background: colors[1], colors, name: 'Custom Palette' };
  }

  const kulerService = createKulerPaletteService();
  const palette = await kulerService.fetchRandomPalette();
  if (palette) {
    const dataService = createContrastDataService();
    const { brightest, darkest } = dataService.findBrightestAndDarkest(palette.colors);
    return { foreground: brightest, background: darkest, colors: palette.colors, name: palette.name };
  }

  return pickRandomPreset();
}

async function mountContrastChecker(slot, { config, layout, initialPalette }) {
  const container = createTag('div', { class: 'contrast-checker-container' });
  const dataService = createContrastDataService();
  const { foreground, background, name, colors } = initialPalette;
  const context = layout.context;

  const rendererConfig = {
    ...config,
    initialForeground: foreground,
    initialBackground: background,
  };

  const renderer = createCheckerRenderer({
    container,
    data: [],
    config: rendererConfig,
    dataService,
    actionMenu: layout.actionMenu,
  });

  renderer.on('contrast-change', (detail) => {
    const currentPalette = context.get('palette');
    const originalColors = currentPalette?.colors || colors;

    context.set('palette', {
      colors: originalColors,
      selectedForeground: detail.foreground,
      selectedBackground: detail.background,
      name: name,
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

function mountPreviewPanel(slot, { context, preview }) {
  const container = createTag('div', { class: 'cc-preview-container' });

  const renderer = createPreviewRenderer({
    container,
    context,
    preview,
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

    const { layout, preview } = parseContent(block);
    const config = getDefaultConfig();
    block.innerHTML = '';

    const initialPalette = await getPalette(config);
    layoutInstance = await createColorToolLayout(block, {
      dependencies: {
        services: ['kuler'],
      },
      palette: {
        colors: initialPalette.colors,
        name: initialPalette.name,
      },
      toolbar: {
        variant: isMobileViewport() ? 'sticky' : 'standalone',
        showEdit: false,
        showPalette: true,
        showPaletteName: isMobileViewport(),
        editPaletteName: false,
      },
      content: {
        heading: layout.heading,
        paragraph: layout.paragraph,
        icon: true,
      },
      actionMenu: {
        ...DEFAULT_ACTION_MENU_CONFIG,
        id: 'contrast-checker-menu',
        type: isMobileViewport() ? 'nav-only' : 'full',
        activeId: 'contrast',
        onUndo: () => checkerInstance?.renderer?.handleUndo?.(),
        onRedo: () => checkerInstance?.renderer?.handleRedo?.(),
      },
    });

    checkerInstance = await mountContrastChecker(layoutInstance.slots.sidebar, {
      config,
      layout: layoutInstance,
      initialPalette,
    });

    previewInstance = mountPreviewPanel(layoutInstance.slots.canvas, {
      context: layoutInstance.context,
      preview,
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
