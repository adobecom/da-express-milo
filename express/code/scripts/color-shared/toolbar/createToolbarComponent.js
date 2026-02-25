import { announceToScreenReader, isMobileViewport } from '../utils/accessibility.js';
import { createIconButton } from '../utils/icons.js';
import { createEventBus } from '../utils/createEventBus.js';
import { createTag } from '../../utils.js';
import { loadButton, loadActionButton } from '../spectrum/load-spectrum.js';
import { createThemeWrapper } from '../spectrum/utils/theme.js';

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

function handleOpenInExpress({ id }) {
  const params = new URLSearchParams({ colorThemeId: id, referrer: 'color-explorer' });
  window.open(`https://new.express.adobe.com/new?${params}`, '_blank');
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

function createDrawerLine() {
  return createTag('div', { class: 'ax-drawer-line', 'aria-hidden': 'true' });
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

  const { on, emit } = createEventBus(toolbar, 'color-floating-toolbar');

  const getPaletteWithName = () => ({ ...palette, name: nameInput?.value ?? name });

  const getCTAText = () => (isMobileViewport() ? mobileCTAText : ctaText);

  /* ── Build DOM ── */

  toolbar.appendChild(createDrawerLine());

  const main = createTag('div', { class: 'ax-toolbar-main' });

  const paletteSummary = createTag('div', { class: 'ax-palette-summary' });
  paletteSummary.appendChild(createSwatchStrip(colors, type));
  if (showEdit) {
    paletteSummary.appendChild(createIconButton({
      icon: 'Edit',
      label: 'Edit this color palette',
      onClick: () => {
        onEdit?.(getPaletteWithName());
        emit('edit', { palette: getPaletteWithName() });
      },
    }));
  }
  main.appendChild(paletteSummary);

  const actions = createTag('div', { class: 'ax-toolbar-actions' });
  actions.appendChild(createIconButton({
    icon: 'ShareAndroid',
    label: 'Share this color palette',
    onClick: async () => {
      await handleShare({ name: getPaletteWithName().name, colors, type });
      emit('share', { palette: getPaletteWithName() });
    },
  }));

  actions.appendChild(createIconButton({
    icon: 'Download',
    label: 'Download this color palette',
    onClick: () => {
      emit('download', { palette: getPaletteWithName() });
    },
  }));

  const ccLibBtn = createIconButton({
    icon: 'CCLibrary',
    label: 'Save this palette to your Library',
    onClick: async () => {
      const { libraries, provider: ccLibraryProvider } = await fetchLibCtxOnce();
      await handleSave(getPaletteWithName(), type, ccLibBtn, libraries, ccLibraryProvider);
      emit('save', { palette: getPaletteWithName() });
    },
  });
  actions.appendChild(ccLibBtn);

  main.appendChild(actions);

  const nameField = createTag('div', { class: 'ax-palette-name' });
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
  main.appendChild(nameField);

  const ctaBtn = document.createElement('sp-button');
  ctaBtn.setAttribute('variant', 'accent');
  ctaBtn.setAttribute('size', 'xl');
  ctaBtn.textContent = getCTAText();
  ctaBtn.addEventListener('click', () => {
    (onCTA ?? handleOpenInExpress)(getPaletteWithName());
    emit('cta', { palette: getPaletteWithName() });
  });
  main.appendChild(ctaBtn);

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
    getState: () => ({ palette: getPaletteWithName() }),
    updateSwatches(newColors) {
      const oldStrip = paletteSummary.querySelector('.ax-swatch-strip');
      if (oldStrip) {
        oldStrip.replaceWith(createSwatchStrip(newColors, type));
      }
      palette.colors = newColors;
    },
    destroy: () => {
      mql.removeEventListener('change', mqlHandler);
      theme.remove();
    },
  };
}
