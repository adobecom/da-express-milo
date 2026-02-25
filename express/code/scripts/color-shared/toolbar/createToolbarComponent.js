import { announceToScreenReader, isMobileViewport } from '../utils/accessibility.js';
import { createIconButton } from '../utils/icons.js';
import { createEventBus } from '../utils/createEventBus.js';
import { createTag } from '../../utils.js';
import { loadButton, loadActionButton } from '../spectrum/load-spectrum.js';
import { createThemeWrapper } from '../spectrum/utils/theme.js';
import { paletteToThemeData } from '../../../libs/services/providers/transforms.js';
import { serviceManager } from '../../../libs/services/core/ServiceManager.js';
import { DownloadTopics } from '../../../libs/services/plugins/download/topics.js';

/* ── Default Handlers ────────────────────────────────────────── */

async function handleShare({ name, colors, type }) {
  const text = `Check out this ${type}: ${name}\nColors: ${colors.join(', ')}`;
  try {
    await navigator.share({ title: name, text });
    announceToScreenReader('Shared successfully');
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      announceToScreenReader('Copied to clipboard');
    } catch (err) {
      window.lana?.log(`Share/clipboard failed: ${err.message}`, {
        tags: 'color-floating-toolbar,share',
      });
    }
  }
}

async function handleOpenInExpress({ id, name, colors }) {
  const { getTrackingAppendedURL } = await import('../../branchlinks.js');

  const baseUrl = 'https://new.express.adobe.com/new';
  const url = new URL(await getTrackingAppendedURL(baseUrl, {
    placement: 'color-explorer',
  }));

  const colorPaletteData = { id, colors };
  if (name) colorPaletteData.name = name;

  url.searchParams.set('colorPalette', JSON.stringify(colorPaletteData));
  url.searchParams.set('selected-prop', 'theme');
  url.searchParams.set('entryPoint', 'color-explorer');

  window.open(url.toString(), '_blank');
}

async function handleDownload(palette) {
  try {
    const themeData = paletteToThemeData(palette);
    const downloadPlugin = await serviceManager.loadPlugin('download');
    await downloadPlugin.dispatch(DownloadTopics.FILE.JPEG, themeData);
    announceToScreenReader('Download started');
  } catch (err) {
    window.lana?.log(`Download failed: ${err.message}`, {
      tags: 'color-floating-toolbar,download',
    });
  }
}

let activeDrawer = null;

async function handleSave(palette, type, container, libraries, ccLibraryProvider) {
  try {
    if (activeDrawer?.isOpen) {
      activeDrawer.close();
      activeDrawer = null;
      return;
    }

    const { createDrawer } = await import('./createDrawerComponent.js');
    const drawerOpts = {
      paletteData: palette,
      type,
      anchorElement: container,
      onSave: () => { activeDrawer = null; },
      onClose: () => { activeDrawer = null; },
      ccLibraryProvider,
    };
    if (libraries?.length) drawerOpts.libraries = libraries;
    activeDrawer = await createDrawer(drawerOpts);
    activeDrawer.open();
  } catch (err) {
    window.lana?.log(`Save drawer failed: ${err.message}`, {
      tags: 'color-floating-toolbar,save',
    });
  }
}

/* ── DOM Builders ────────────────────────────────────────────── */

function createSwatchStrip(colors, type) {
  const safeColors = colors ?? [];
  const count = Math.min(safeColors.length, 10);
  const swatches = safeColors.slice(0, 10).map((hex, i) => createTag('div', {
    class: 'ax-swatch',
    style: `background-color:${hex}`,
    'aria-label': `Color ${i + 1}: ${hex}`,
  }));
  return createTag('div', {
    class: 'ax-swatch-strip',
    'aria-label': `${count} colors in ${type}`,
  }, swatches);
}

function createGradientStrip(colors, angle = 135) {
  const stops = colors ?? [];
  const css = `linear-gradient(${angle}deg, ${stops.join(', ')})`;
  return createTag('div', {
    class: 'ax-swatch-strip ax-gradient-strip',
    style: `background: ${css}`,
    'aria-label': `Gradient: ${stops.join(' \u2192 ')}`,
  });
}

function createColorStrip(colors, type, angle) {
  return type === 'gradient'
    ? createGradientStrip(colors, angle)
    : createSwatchStrip(colors, type);
}

function createSwatchBand(colors, type, angle) {
  if (type === 'gradient') {
    const stops = colors ?? [];
    const css = `linear-gradient(${angle ?? 135}deg, ${stops.join(', ')})`;
    return createTag('div', {
      class: 'ax-swatch-band',
      style: `background: ${css}`,
      'aria-hidden': 'true',
    });
  }
  const safeColors = colors ?? [];
  const swatches = safeColors.slice(0, 10).map((hex) => createTag('div', {
    class: 'ax-swatch',
    style: `background-color:${hex}`,
  }));
  return createTag('div', { class: 'ax-swatch-band', 'aria-hidden': 'true' }, swatches);
}

/* ── Main Export ──────────────────────────────────────────────── */

// eslint-disable-next-line import/prefer-default-export
export function createToolbar(options) {
  const {
    palette = {},
    type = 'palette',
    variant = 'standalone',
    ctaText = 'Create with my color palette',
    mobileCTAText = 'Create with my color palette',
    showEdit = true,
    sticky = false,
    showPaletteName = true,
    getLibraryContext,
    onEdit,
    onCTA,
  } = options;

  let libCtxCache = null;
  async function fetchLibCtxOnce() {
    if (!libCtxCache && getLibraryContext) libCtxCache = await getLibraryContext();
    return libCtxCache ?? { libraries: [], provider: null };
  }

  const { name = '', colors = [] } = palette;
  let nameInput = null;

  const toolbar = createTag('div', {
    class: `ax-toolbar ax-toolbar-${variant}`,
    role: 'toolbar',
    'aria-label': `${type} toolbar`,
  });

  if (sticky) {
    toolbar.classList.add('ax-toolbar-sticky');
  }

  const { on, emit } = createEventBus(toolbar, 'color-floating-toolbar');

  const getPaletteWithName = () => ({ ...palette, name: nameInput?.value ?? name });

  const getCTAText = () => (isMobileViewport() ? mobileCTAText : ctaText);

  /* ── Build DOM ── */

  const swatchBand = createSwatchBand(colors, type, palette.angle);
  toolbar.appendChild(swatchBand);

  const main = createTag('div', { class: 'ax-toolbar-main' });

  const paletteSummary = createTag('div', { class: 'ax-palette-summary' });
  paletteSummary.appendChild(createColorStrip(colors, type, palette.angle));
  if (showEdit) {
    paletteSummary.appendChild(createIconButton({
      icon: 'Edit',
      label: 'Edit this color palette',
      size: 'm',
      onClick: () => {
        onEdit?.(getPaletteWithName());
        emit('edit', { palette: getPaletteWithName() });
      },
    }));
  }
  const actionContainer = createTag('div', { class: 'ax-action-container' });
  actionContainer.appendChild(paletteSummary);

  const actions = createTag('div', { class: 'ax-toolbar-actions' });
  actions.appendChild(createIconButton({
    icon: 'ShareAndroid',
    label: 'Share this color palette',
    size: 'm',
    onClick: async () => {
      await handleShare({ name: getPaletteWithName().name, colors, type });
      emit('share', { palette: getPaletteWithName() });
    },
  }));

  actions.appendChild(createIconButton({
    icon: 'Download',
    label: 'Download this color palette',
    size: 'm',
    onClick: async () => {
      const currentPalette = getPaletteWithName();
      await handleDownload(currentPalette);
      emit('download', { palette: currentPalette });
    },
  }));

  const ccLibBtn = createIconButton({
    icon: 'CCLibrary',
    label: 'Save this palette to your Library',
    size: 'm',
    onClick: async () => {
      const { libraries, provider: ccLibraryProvider } = await fetchLibCtxOnce();
      await handleSave(getPaletteWithName(), type, ccLibBtn, libraries, ccLibraryProvider);
      emit('save', { palette: getPaletteWithName() });
    },
  });
  actions.appendChild(ccLibBtn);

  actionContainer.appendChild(actions);
  main.appendChild(actionContainer);

  let nameField = null;
  let desktopMql = null;
  let repositionNameField = null;

  if (showPaletteName) {
    nameField = createTag('div', { class: 'ax-palette-name' });
    const nameLabel = createTag('label', {
      class: 'ax-palette-name-label',
      for: 'ax-palette-name-input',
    }, 'Palette name');
    nameInput = createTag('input', {
      type: 'text',
      id: 'ax-palette-name-input',
      class: 'ax-palette-name-input',
      value: name,
      placeholder: 'My Color Theme',
    });
    nameField.appendChild(nameLabel);
    nameField.appendChild(nameInput);
  }

  const ctaBtn = document.createElement('sp-button');
  ctaBtn.setAttribute('variant', 'accent');
  ctaBtn.setAttribute('size', 'xl');
  ctaBtn.textContent = getCTAText();
  ctaBtn.addEventListener('click', () => {
    (onCTA ?? handleOpenInExpress)(getPaletteWithName());
    emit('cta', { palette: getPaletteWithName() });
  });
  main.appendChild(ctaBtn);

  if (showPaletteName && nameField) {
    desktopMql = window.matchMedia('(min-width: 1200px)');

    repositionNameField = () => {
      if (desktopMql.matches) {
        ctaBtn.before(nameField);
      } else {
        paletteSummary.insertBefore(nameField, paletteSummary.firstChild);
      }
    };

    repositionNameField();
    desktopMql.addEventListener('change', repositionNameField);
  }

  toolbar.appendChild(main);

  const theme = createThemeWrapper();
  theme.appendChild(toolbar);

  Promise.all([loadButton(), loadActionButton()]).catch((err) => {
    window.lana?.log(`Spectrum load failed: ${err.message}`, {
      tags: 'color-floating-toolbar,spectrum',
    });
  });

  const mql = window.matchMedia('(max-width: 599px)');
  const mqlHandler = () => { ctaBtn.textContent = getCTAText(); };
  mql.addEventListener('change', mqlHandler);

  return {
    element: theme,
    on,
    emit,
    sticky,
    getState: () => ({ palette: getPaletteWithName() }),
    updateSwatches(newColors) {
      const oldStrip = paletteSummary.querySelector('.ax-swatch-strip');
      if (oldStrip) {
        oldStrip.replaceWith(createColorStrip(newColors, type, palette.angle));
      }
      const oldBand = toolbar.querySelector('.ax-swatch-band');
      if (oldBand) {
        oldBand.replaceWith(createSwatchBand(newColors, type, palette.angle));
      }
      palette.colors = newColors;
    },
    destroy: () => {
      mql.removeEventListener('change', mqlHandler);
      if (desktopMql && repositionNameField) {
        desktopMql.removeEventListener('change', repositionNameField);
      }
      theme.remove();
    },
  };
}
