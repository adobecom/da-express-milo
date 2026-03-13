import { announceToScreenReader } from '../spectrum/index.js';
import { isMobileViewport } from '../utils/utilities.js';
import { createIconButton } from '../utils/icons.js';
import { createEventBus } from '../utils/createEventBus.js';
import { createTag } from '../../utils.js';
import { loadButton, loadActionButton, loadTooltip } from '../spectrum/load-spectrum.js';
import { createThemeWrapper } from '../spectrum/utils/theme.js';
import { paletteToThemeData } from '../../../libs/services/providers/transforms.js';
import { serviceManager } from '../../../libs/services/core/ServiceManager.js';
import { triggerSignInFlow } from '../../../libs/services/middlewares/auth.middleware.js';

function interpolate(tpl, vars) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, v), tpl);
}

const TOOLBAR_DEFAULTS = {
  shareText: 'Check out this {{type}}: {{name}}\nColors: {{colors}}',
  sharedSuccessfully: 'Shared successfully',
  copiedToClipboard: 'Copied to clipboard',
  downloadStarted: 'Download started',
  edit: 'Edit',
  share: 'Share',
  download: 'Download',
  saveToLibrary: 'Save to library',
  swatchLabel: 'Color {{index}}: {{hex}}',
  swatchStripLabel: '{{count}} colors in {{type}}',
  gradientLabel: 'Gradient: {{stops}}',
  editPalette: 'Edit this color palette',
  sharePalette: 'Share this color palette',
  downloadPalette: 'Download this color palette',
  savePalette: 'Save this palette to your Library',
  toolbarLabel: '{{type}} toolbar',
  paletteName: 'Palette name',
  paletteNamePlaceholder: 'My Color Theme',
  ctaText: 'Create with my color palette',
};

/* ── Default Handlers ────────────────────────────────────────── */

async function handleShare({ name, colors, type }, t) {
  const text = interpolate(t.shareText, { type, name, colors: colors.join(', ') });
  try {
    await navigator.share({ title: name, text });
    announceToScreenReader(t.sharedSuccessfully);
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      announceToScreenReader(t.copiedToClipboard);
    } catch (err) {
      window.lana?.log(`Share/clipboard failed: ${err.message}`, {
        tags: 'color-floating-toolbar,share',
      });
    }
  }
}

async function handleOpenInExpress({ id, name, colors }) {
  const isSignedIn = await triggerSignInFlow();
  if (!isSignedIn) return;

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

async function handleDownload(palette, t) {
  try {
    const themeData = paletteToThemeData(palette);
    const downloadProvider = await serviceManager.getProvider('download');
    await downloadProvider.downloadJPEG(themeData);
    announceToScreenReader(t.downloadStarted);
  } catch (err) {
    window.lana?.log(`Download failed: ${err.message}`, {
      tags: 'color-floating-toolbar,download',
    });
  }
}

let activeDrawer = null;

async function handleSave(
  palette,
  type,
  container,
  libraries,
  ccLibraryProvider,
  libCtxCache,
  drawerI18n,
) {
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
      onLibraryCreated: (newLib) => {
        if (libCtxCache) libCtxCache.libraries.push(newLib);
      },
      i18n: drawerI18n,
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

/* ── Tooltip Helper ──────────────────────────────────────────── */

function attachTooltip(actionBtn, text) {
  const tooltip = document.createElement('sp-tooltip');
  tooltip.setAttribute('self-managed', '');
  tooltip.setAttribute('placement', 'top');
  tooltip.textContent = text;
  actionBtn.appendChild(tooltip);
}

/* ── DOM Builders ────────────────────────────────────────────── */

function createSwatchStrip(colors, type, t) {
  const safeColors = colors ?? [];
  const count = Math.min(safeColors.length, 10);
  const swatches = safeColors.slice(0, 10).map((hex, i) => createTag('div', {
    class: 'ax-swatch',
    style: `background-color:${hex}`,
    'aria-label': interpolate(t.swatchLabel, { index: i + 1, hex }),
  }));
  return createTag('div', {
    class: 'ax-swatch-strip',
    'aria-label': interpolate(t.swatchStripLabel, { count, type }),
  }, swatches);
}

function createGradientStrip(colors, angle, t) {
  const stops = colors ?? [];
  const deg = angle ?? 135;
  const css = `linear-gradient(${deg}deg, ${stops.join(', ')})`;
  return createTag('div', {
    class: 'ax-swatch-strip ax-gradient-strip',
    style: `background: ${css}`,
    'aria-label': interpolate(t.gradientLabel, { stops: stops.join(' \u2192 ') }),
  });
}

function createColorStrip(colors, type, angle, t) {
  return type === 'gradient'
    ? createGradientStrip(colors, angle, t)
    : createSwatchStrip(colors, type, t);
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

/* ── Toolbar Builders ────────────────────────────────────────── */

function buildPaletteSummary(colors, type, angle, showEdit, onEditClick, t) {
  const paletteSummary = createTag('div', { class: 'ax-palette-summary' });
  paletteSummary.appendChild(createColorStrip(colors, type, angle, t));
  if (showEdit) {
    const editBtn = createIconButton({
      icon: 'Edit',
      label: t.editPalette,
      size: 'm',
      onClick: onEditClick,
    });
    attachTooltip(editBtn, t.edit);
    paletteSummary.appendChild(editBtn);
  }
  return paletteSummary;
}

function buildActionButtons(handlers, t) {
  const actions = createTag('div', { class: 'ax-toolbar-actions' });

  const shareBtn = createIconButton({
    icon: 'ShareAndroid',
    label: t.sharePalette,
    size: 'm',
    onClick: handlers.onShare,
  });
  attachTooltip(shareBtn, t.share);
  actions.appendChild(shareBtn);

  const downloadBtn = createIconButton({
    icon: 'Download',
    label: t.downloadPalette,
    size: 'm',
    onClick: handlers.onDownload,
  });
  attachTooltip(downloadBtn, t.download);
  actions.appendChild(downloadBtn);

  const ccLibBtn = createIconButton({
    icon: 'CCLibrary',
    label: t.savePalette,
    size: 'm',
    onClick: handlers.onSave,
  });
  attachTooltip(ccLibBtn, t.saveToLibrary);
  actions.appendChild(ccLibBtn);

  return { actions, ccLibBtn };
}

function buildCTAButton(getCTAText, onClick) {
  const ctaBtn = document.createElement('sp-button');
  ctaBtn.setAttribute('variant', 'accent');
  ctaBtn.setAttribute('size', 'l');
  ctaBtn.textContent = getCTAText();
  ctaBtn.addEventListener('click', onClick);
  return ctaBtn;
}

function buildPaletteNameField(name, editPaletteName, t) {
  const nameField = createTag('div', { class: 'ax-palette-name' });
  const nameLabel = createTag('label', {
    class: 'ax-palette-name-label',
    for: 'ax-palette-name-input',
  }, t.paletteName);
  const inputAttrs = {
    type: 'text',
    id: 'ax-palette-name-input',
    class: 'ax-palette-name-input',
    value: name,
    placeholder: t.paletteNamePlaceholder,
  };
  if (!editPaletteName) {
    inputAttrs.readonly = '';
    inputAttrs.tabindex = '-1';
  }
  const nameInput = createTag('input', inputAttrs);
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);
  return { nameField, nameInput };
}

function setupResponsiveLayout(nameField, ctaBtn, paletteSummary) {
  const desktopMql = window.matchMedia('(min-width: 1200px)');

  const repositionNameField = () => {
    if (desktopMql.matches) {
      ctaBtn.before(nameField);
    } else {
      paletteSummary.insertBefore(nameField, paletteSummary.firstChild);
    }
  };

  repositionNameField();
  desktopMql.addEventListener('change', repositionNameField);
  return { desktopMql, repositionNameField };
}

function loadSpectrumDeps() {
  Promise.all([loadButton(), loadActionButton(), loadTooltip()]).catch((err) => {
    window.lana?.log(`Spectrum load failed: ${err.message}`, {
      tags: 'color-floating-toolbar,spectrum',
    });
  });
}

/* ── Main Export ──────────────────────────────────────────────── */

// eslint-disable-next-line import/prefer-default-export
export function createToolbar(options) {
  const {
    palette = {},
    type = 'palette',
    variant = 'standalone',
    ctaText,
    mobileCTAText,
    showEdit = true,
    showPalette = true,
    showPaletteName = true,
    editPaletteName = false,
    editPaletteLink = null,
    getLibraryContext,
    onEdit,
    onCTA,
    i18n = {},
    drawerI18n = {},
    deps = {},
  } = options;

  const t = { ...TOOLBAR_DEFAULTS, ...i18n };

  const effectiveShowEdit = showPalette && showEdit;

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
    'aria-label': interpolate(t.toolbarLabel, { type }),
  });

  if (variant === 'sticky') {
    toolbar.classList.add('ax-toolbar-sticky');
  }

  if (!showPalette) {
    toolbar.classList.add('ax-toolbar-no-palette');
  }

  const { on, emit } = createEventBus(toolbar, 'color-floating-toolbar');

  const getPaletteWithName = () => ({ ...palette, name: nameInput?.value ?? name });

  const getCTAText = () => (isMobileViewport()
    ? (mobileCTAText || t.ctaText)
    : (ctaText || t.ctaText));

  /* ── Build DOM ── */

  const paletteSlot = createTag('div', { class: 'ax-palette-slot' });
  const swatchBand = createSwatchBand(colors, type, palette.angle);
  paletteSlot.appendChild(swatchBand);
  toolbar.appendChild(paletteSlot);

  const main = createTag('div', { class: 'ax-toolbar-main' });

  const paletteSummary = buildPaletteSummary(colors, type, palette.angle, effectiveShowEdit, () => {
    if (editPaletteLink) {
      window.location.href = editPaletteLink;
    } else {
      onEdit?.(getPaletteWithName());
    }
    emit('edit', { palette: getPaletteWithName() });
  }, t);

  const { actions, ccLibBtn } = buildActionButtons({
    onShare: async () => {
      await handleShare({ name: getPaletteWithName().name, colors, type }, t);
      emit('share', { palette: getPaletteWithName() });
    },
    onDownload: async () => {
      const currentPalette = getPaletteWithName();
      await handleDownload(currentPalette, t);
      emit('download', { palette: currentPalette });
    },
    onSave: async () => {
      const ctx = await fetchLibCtxOnce();
      const { libraries, provider: ccLibraryProvider } = ctx;
      await handleSave(
        getPaletteWithName(),
        type,
        ccLibBtn,
        libraries,
        ccLibraryProvider,
        libCtxCache,
        drawerI18n,
      );
      emit('save', { palette: getPaletteWithName() });
    },
  }, t);

  const actionContainer = createTag('div', { class: 'ax-action-container' });
  actionContainer.appendChild(paletteSummary);
  actionContainer.appendChild(actions);
  main.appendChild(actionContainer);

  const ctaBtn = buildCTAButton(getCTAText, () => {
    (onCTA ?? handleOpenInExpress)(getPaletteWithName());
    emit('cta', { palette: getPaletteWithName() });
  });
  main.appendChild(ctaBtn);

  let desktopMql = null;
  let repositionNameField = null;

  if (showPaletteName) {
    let nameField;
    ({ nameField, nameInput } = buildPaletteNameField(name, editPaletteName, t));
    ({ desktopMql, repositionNameField } = setupResponsiveLayout(
      nameField,
      ctaBtn,
      paletteSummary,
    ));
  }

  toolbar.appendChild(main);

  const theme = createThemeWrapper();
  theme.appendChild(toolbar);

  const { loadDeps = loadSpectrumDeps } = deps;
  loadDeps();

  const mql = window.matchMedia('(max-width: 599px)');
  const mqlHandler = () => { ctaBtn.textContent = getCTAText(); };
  mql.addEventListener('change', mqlHandler);

  return {
    element: theme,
    paletteSlot,
    on,
    emit,
    sticky: variant === 'sticky',
    getState: () => ({ palette: getPaletteWithName() }),
    updateSwatches(newColors, paletteData) {
      const oldStrip = paletteSummary.querySelector('.ax-swatch-strip');
      if (oldStrip) {
        oldStrip.replaceWith(createColorStrip(newColors, type, palette.angle, t));
      }
      const oldBand = toolbar.querySelector('.ax-swatch-band');
      if (oldBand) {
        oldBand.replaceWith(createSwatchBand(newColors, type, palette.angle));
      }
      palette.colors = newColors;
      if (paletteData?.accessibilityData) {
        palette.accessibilityData = paletteData.accessibilityData;
      }
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
