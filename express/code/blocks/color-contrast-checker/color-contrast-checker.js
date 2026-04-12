import { createTag } from '../../scripts/utils.js';
import { trackColorBlockLoad } from '../../scripts/instrument.js';
import createColorToolLayout from '../../scripts/color-shared/shell/layouts/createColorToolLayout.js';
import { createContrastRenderer } from './factory/createContrastRenderer.js';
import loadContrastCheckerPlaceholders from './utils/placeholders.js';
import { createPreviewRenderer } from './renderers/createPreviewRenderer.js';
import createContrastDataService from './services/createContrastDataService.js';
import { createDefaultActionMenuConfig } from './utils/contrastConstants.js';
import parseContent from './utils/parseContent.js';
import syncPaletteSelections from './utils/paletteState.js';
import { isMobileOrTabletViewport, createColorPaletteParamApi } from '../../scripts/color-shared/utils/utilities.js';
import adoptHeadline from '../../scripts/color-shared/utils/adoptHeadline.js';

const blockInstances = new WeakMap();

function getDefaultConfig() {
  return {
    variant: 'checker',
    showEdit: true,
  };
}

function getPalette(strings) {
  const { getResolvedPalette, getResolvedPaletteName } = createColorPaletteParamApi();
  const colors = getResolvedPalette();
  const name = getResolvedPaletteName() || strings.randomPresetName;

  const dataService = createContrastDataService();
  const { brightest, darkest } = dataService.findBrightestAndDarkest(colors);

  return {
    foreground: brightest || colors[0],
    background: darkest || colors[1],
    colors,
    name,
  };
}

async function mountContrastChecker(slot, { config, layout, initialPalette }) {
  const container = createTag('div', { class: 'color-contrast-checker-container' });
  const dataService = createContrastDataService();
  const { foreground, background, name, colors } = initialPalette;
  const { context, actionMenu } = layout;

  const rendererConfig = {
    ...config,
    initialForeground: foreground,
    initialBackground: background,
  };

  const renderer = createContrastRenderer('checker', {
    container,
    data: [],
    config: rendererConfig,
    dataService,
    context,
    actionMenu,
  });

  renderer.on('contrast-change', (detail) => {
    const currentPalette = context.get('palette');
    const currentColors = currentPalette?.colors || colors;
    const previousForeground = currentPalette?.selectedForeground ?? foreground;
    const previousBackground = currentPalette?.selectedBackground ?? background;

    const normalize = (h) => (typeof h === 'string' ? h.trim().toUpperCase() : '');
    const fgInPalette = currentColors.some((c) => normalize(c) === normalize(detail.foreground));
    const bgInPalette = currentColors.some((c) => normalize(c) === normalize(detail.background));

    const nextColors = (fgInPalette && bgInPalette)
      ? currentColors
      : syncPaletteSelections(
        currentColors,
        previousForeground,
        previousBackground,
        detail.foreground,
        detail.background,
      );

    context.set('palette', {
      colors: nextColors,
      selectedForeground: detail.foreground,
      selectedBackground: detail.background,
      name,
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

function mountPreviewPanel(slot, { context, preview, strings }) {
  const container = createTag('div', { class: 'cc-preview-container' });

  const renderer = createPreviewRenderer({
    container,
    context,
    preview,
    strings,
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

function cleanup(block) {
  const instance = blockInstances.get(block);
  if (!instance) return;

  instance.destroy();
  blockInstances.delete(block);
}

export default async function decorate(block) {
  cleanup(block);

  let layoutInstance = null;
  let checkerInstance = null;
  let previewInstance = null;
  block.dataset.blockStatus = 'loading';

  const { preview } = parseContent(block);
  const strings = await loadContrastCheckerPlaceholders();

  const destroyInstance = () => {
    checkerInstance?.destroy();
    checkerInstance = null;
    previewInstance?.destroy();
    previewInstance = null;
    layoutInstance?.destroy();
    layoutInstance = null;
  };

  try {
    const config = {
      ...getDefaultConfig(),
      strings,
    };
    block.replaceChildren();

    const initialPalette = getPalette(strings);
    layoutInstance = await createColorToolLayout(block, {
      layoutSpans: {
        tablet: { sidebar: 6, canvas: 6 },
        desktop: { sidebar: 4, canvas: 8 },
      },
      palette: {
        colors: initialPalette.colors,
        name: initialPalette.name,
      },
      toolbar: {
        variant: 'sticky-on-scroll',
        showEdit: false,
        showPaletteName: true,
        editPaletteName: false,
      },
      actionMenu: {
        ...createDefaultActionMenuConfig(strings),
        id: 'color-contrast-checker-menu',
        type: isMobileOrTabletViewport() ? 'nav-only' : 'full',
        activeId: 'contrast',
        getName: () => initialPalette.name,
      },
    });

    await layoutInstance.actionMenuReady;

    layoutInstance.actionMenu?.pushState?.(initialPalette.colors);

    checkerInstance = await mountContrastChecker(layoutInstance.slots.sidebar, {
      config,
      layout: layoutInstance,
      initialPalette,
    });

    const previewSlot = checkerInstance.renderer.getPreviewMountPoint?.()
      || layoutInstance.slots.canvas;

    previewInstance = mountPreviewPanel(previewSlot, {
      context: layoutInstance.context,
      preview,
      strings,
    });

    checkerInstance.renderer.on('contrast-highlight', (detail) => {
      previewInstance.renderer.highlightRegion?.(detail.region);
    });

    blockInstances.set(block, {
      destroy: destroyInstance,
    });

    adoptHeadline(block, layoutInstance);
    block.dataset.shellState = 'ready';
    block.dataset.blockStatus = 'loaded';
    trackColorBlockLoad('color-contrast-checker');
  } catch (error) {
    window.lana?.log(`Contrast Checker init error: ${error.message}`, {
      tags: 'color-contrast-checker,init',
      severity: 'error',
    });
    block.dataset.blockStatus = 'error';
    destroyInstance();
    block.replaceChildren();
    block.append(createTag('p', { class: 'cc-error-message' }, strings.errorMessage));
  }
}
