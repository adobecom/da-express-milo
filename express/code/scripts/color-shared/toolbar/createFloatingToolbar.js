import { serviceManager } from '../../../libs/services/index.js';
import { createToolbar } from './createToolbarComponent.js';
import { createTag, getLibs } from '../../utils.js';
import { showExpressToast } from '../spectrum/components/express-toast.js';

const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
const NETWORK_ERROR_MESSAGE = 'Network request failed. Check your connection or try again.';

const TOOLBAR_I18N_MAP = {
  shareText: 'color-toolbar-share-text',
  sharedSuccessfully: 'color-toolbar-shared-successfully',
  copiedToClipboard: 'color-toolbar-copied-to-clipboard',
  downloadStarted: 'color-toolbar-download-started',
  edit: 'color-toolbar-edit',
  share: 'color-toolbar-share',
  download: 'color-toolbar-download',
  saveToLibrary: 'color-toolbar-save-to-library',
  swatchLabel: 'color-toolbar-swatch-label',
  swatchStripLabel: 'color-toolbar-swatch-strip-label',
  gradientLabel: 'color-toolbar-gradient-label',
  editPalette: 'color-toolbar-edit-palette',
  sharePalette: 'color-toolbar-share-palette',
  downloadPalette: 'color-toolbar-download-palette',
  savePalette: 'color-toolbar-save-palette',
  toolbarLabel: 'color-toolbar-label',
  paletteName: 'color-toolbar-palette-name',
  paletteNamePlaceholder: 'color-toolbar-palette-placeholder',
  ctaText: 'color-toolbar-cta',
};

const DRAWER_I18N_MAP = {
  title: 'color-drawer-title',
  paletteName: 'color-drawer-palette-name',
  saveTo: 'color-drawer-save-to',
  tags: 'color-drawer-tags',
  tagsPlaceholder: 'color-drawer-tags-placeholder',
  saveToLibrary: 'color-drawer-save-to-library',
  signInToSave: 'color-drawer-sign-in-to-save',
  myLibrary: 'color-drawer-my-library',
  createNewLibrary: 'color-drawer-create-new-library',
  enterLibraryName: 'color-drawer-enter-library-name',
  create: 'color-drawer-create',
  creating: 'color-drawer-creating',
  libraryCreated: 'color-drawer-library-created',
  createLibraryFailed: 'color-drawer-create-library-failed',
  createNotSignedIn: 'color-drawer-create-not-signed-in',
  noLibraries: 'color-drawer-no-libraries',
  unableToSave: 'color-drawer-unable-to-save',
  selectLibrary: 'color-drawer-select-library',
  savedSuccessfully: 'color-drawer-saved-successfully',
  saveFailed: 'color-drawer-save-failed',
  saveFailedAria: 'color-drawer-save-failed-aria',
  untitledTheme: 'color-drawer-untitled-theme',
  untitledGradient: 'color-drawer-untitled-gradient',
  saving: 'color-drawer-saving',
  gradientLabel: 'color-drawer-gradient-label',
  paletteLabel: 'color-drawer-palette-label',
  keywordSuggestions: 'color-drawer-keyword-suggestions',
  yourLibrary: 'color-drawer-your-library',
};

async function loadI18nStrings() {
  try {
    const [{ getConfig }, { replaceKeyArray }] = await Promise.all([
      import(`${getLibs()}/utils/utils.js`),
      import(`${getLibs()}/features/placeholders.js`),
    ]);
    const config = getConfig();

    const toolbarProps = Object.keys(TOOLBAR_I18N_MAP);
    const toolbarKeys = Object.values(TOOLBAR_I18N_MAP);
    const drawerProps = Object.keys(DRAWER_I18N_MAP);
    const drawerKeys = Object.values(DRAWER_I18N_MAP);

    const allValues = await replaceKeyArray([...toolbarKeys, ...drawerKeys], config);

    const toolbarI18n = {};
    toolbarProps.forEach((prop, i) => {
      const val = allValues[i];
      if (val && val !== toolbarKeys[i].replaceAll('-', ' ')) toolbarI18n[prop] = val;
    });

    const drawerI18n = {};
    drawerProps.forEach((prop, i) => {
      const val = allValues[toolbarKeys.length + i];
      if (val && val !== drawerKeys[i].replaceAll('-', ' ')) drawerI18n[prop] = val;
    });

    return { toolbarI18n, drawerI18n };
  } catch {
    return { toolbarI18n: {}, drawerI18n: {} };
  }
}

async function ensureServices() {
  await serviceManager.init({ plugins: ['cclibrary'] });
}

async function getLibraryContext() {
  try {
    const provider = await serviceManager.getProvider('cclibrary');
    if (!provider) return { libraries: [], provider: null };

    const result = await provider.fetchUserLibraries({}, { throwOnError: true });
    const all = result?.libraries ?? [];
    const writable = provider.filterWritableLibraries(all);

    const libraries = writable.map((lib) => ({
      id: lib.library_urn ?? lib.id,
      name: lib.name,
    }));

    return { libraries, provider };
  } catch (err) {
    const isNetworkError = err?.code === NETWORK_ERROR_CODE;
    window.lana?.log(
      `Toolbar init — CC Libraries fetch failed: ${err?.message}${isNetworkError ? ` (${err?.code})` : ''}`,
      { tags: 'color-floating-toolbar,init' },
    );
    if (isNetworkError) {
      showExpressToast({
        variant: 'negative',
        message: NETWORK_ERROR_MESSAGE,
      });
    }
    return { libraries: [], provider: null };
  }
}

const TOOLBAR_CSS_PATH = 'scripts/color-shared/toolbar/toolbar.css';

let miloStyleLoaderPromise = null;

async function loadMiloStyle(path) {
  if (!miloStyleLoaderPromise) {
    miloStyleLoaderPromise = import(`${getLibs()}/utils/utils.js`)
      .then(({ loadStyle, getConfig }) => ({ loadStyle, getConfig }));
  }

  const { loadStyle, getConfig } = await miloStyleLoaderPromise;
  const codeRoot = getConfig?.()?.codeRoot || '/express/code';
  const href = path.startsWith('/') ? path : `${codeRoot}/${path}`;

  return new Promise((resolve) => {
    loadStyle(href, () => resolve());
  });
}

async function loadToolbarDependencies(providedPalette, deps = {}) {
  const {
    initServices = () => ensureServices(),
    loadStyles = () => loadMiloStyle(TOOLBAR_CSS_PATH),
  } = deps;

  await Promise.all([initServices(), loadStyles()]);

  return providedPalette;
}

function setupStickyBehavior(container, wrapper) {
  container.classList.add('ax-toolbar-sticky-host');
  wrapper.classList.add('ax-toolbar-sticky-wrapper');

  const updateToolbarHeight = () => {
    const h = wrapper.getBoundingClientRect().height;
    container.style.setProperty('--ax-toolbar-h', `${h}px`);
  };

  requestAnimationFrame(updateToolbarHeight);

  const ro = new ResizeObserver(updateToolbarHeight);
  ro.observe(wrapper);
  return ro;
}

/**
 * Programmatically initialize and render the color floating toolbar
 * with live data from CC Libraries and Kuler.
 *
 * @param {HTMLElement} container - DOM element to mount into
 * @param {Object}  [options]
 * @param {string}  [options.type='palette']
 * @param {string}  [options.variant='standalone']
 * @param {string}  [options.ctaText]
 * @param {string}  [options.mobileCTAText]
 * @param {boolean} [options.showEdit=true]
 * @param {boolean} [options.showPaletteName=true]
 * @param {Object}  [options.palette] - Pre-built palette; skips Kuler fetch when provided
 * @returns {Promise<{ toolbar: Object, libraries: Array, palette: Object, destroy: Function }>}
 */
// eslint-disable-next-line import/prefer-default-export
export async function initFloatingToolbar(container, options = {}) {
  const {
    type = 'palette',
    variant = 'standalone',
    ctaText,
    mobileCTAText,
    showEdit = true,
    showPalette = true,
    showPaletteName = true,
    editPaletteName = false,
    editPaletteLink = null,
    palette: providedPalette = null,
    deps = {},
  } = options;

  const [finalPalette, { toolbarI18n, drawerI18n }] = await Promise.all([
    loadToolbarDependencies(providedPalette, deps),
    loadI18nStrings(),
  ]);
  if (!finalPalette) return null;

  const wrapper = createTag('div', { class: 'color-floating-toolbar-container' });
  const toolbar = createToolbar({
    palette: finalPalette,
    type,
    variant,
    ctaText,
    mobileCTAText,
    showEdit,
    showPalette,
    showPaletteName,
    editPaletteName,
    editPaletteLink,
    getLibraryContext,
    i18n: toolbarI18n,
    drawerI18n,
  });

  wrapper.appendChild(toolbar.element);
  container.appendChild(wrapper);

  let stickyRo = null;
  if (variant === 'sticky') {
    stickyRo = setupStickyBehavior(container, wrapper);
  }

  return {
    toolbar,
    palette: finalPalette,
    getLibraryContext,
    destroy() {
      stickyRo?.disconnect();
      toolbar.destroy();
    },
  };
}
