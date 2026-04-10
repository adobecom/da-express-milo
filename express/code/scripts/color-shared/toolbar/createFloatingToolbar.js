import { serviceManager } from '../../../libs/services/index.js';
import { createToolbar } from './createToolbarComponent.js';
import { createTag, getLibs } from '../../utils.js';
import loadMiloStyle from '../utils/loadMiloStyle.js';
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
  urlCopiedToClipboard: 'color-toolbar-url-copied-to-clipboard',
  shareFailed: 'color-toolbar-share-failed',
  networkError: 'color-toolbar-network-error',
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
  tagFieldHelp: 'color-drawer-tag-field-help',
  tagRemoveAriaLabel: 'color-drawer-tag-remove-aria-label',
  libraryCreatedToast: 'color-drawer-library-created-toast',
  createLibraryFailedToast: 'color-drawer-create-library-failed-toast',
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

async function getLibraryContext(networkErrorMsg = NETWORK_ERROR_MESSAGE) {
  try {
    if (!window.adobeIMS?.isSignedInUser()) return { libraries: [], provider: null };

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
      { tags: 'color-floating-toolbar,init', severity: 'error' },
    );
    if (isNetworkError) {
      showExpressToast({
        variant: 'negative',
        message: networkErrorMsg,
      });
    }
    return { libraries: [], provider: null };
  }
}

const TOOLBAR_CSS_PATH = 'scripts/color-shared/toolbar/toolbar.css';

async function loadToolbarDependencies(providedPalette, deps = {}) {
  const {
    initServices = () => ensureServices(),
    loadStyles = () => loadMiloStyle(TOOLBAR_CSS_PATH),
  } = deps;

  await Promise.all([initServices(), loadStyles()]);

  return providedPalette;
}

function clearStickyBehavior(wrapper, reserveContainer, scrollObserver) {
  scrollObserver?.disconnect();
  wrapper.classList.remove('ax-toolbar-sticky-wrapper', 'ax-toolbar-exiting', 'ax-toolbar-fade-out', 'ax-toolbar-fade-in');
  wrapper.parentElement?.querySelector('.ax-toolbar-scroll-sentinel')?.remove();

  if (!reserveContainer) return;

  reserveContainer.classList.remove('ax-toolbar-sticky-host');
  reserveContainer.style.removeProperty('--ax-toolbar-h');
}

function setupStickyBehavior(wrapper, options = {}) {
  const {
    reserveContainer = null,
    reserveSpace = true,
  } = options;

  if (reserveSpace && reserveContainer) {
    // Lock the reserve height to the standalone layout BEFORE going fixed.
    // This prevents layout shift — the space left behind matches what was there.
    const h = wrapper.getBoundingClientRect().height;
    reserveContainer.classList.add('ax-toolbar-sticky-host');
    reserveContainer.style.setProperty('--ax-toolbar-h', `${h}px`);
  }

  wrapper.classList.add('ax-toolbar-sticky-wrapper');
}

/**
 * Programmatically initialize and render the color floating toolbar
 * with live data from CC Libraries and Kuler.
 *
 * @param {HTMLElement} container - DOM element to mount into
 * @param {Object}  [options]
 * @param {string}  [options.type='palette']        - 'palette' | 'gradient'
 * @param {string}  [options.variant='standalone']   - Positioning behavior:
 *   'standalone' — inline, no sticky positioning
 *   'sticky'     — always fixed to bottom of viewport
 *   'sticky-on-scroll' — inline until scrolled past, then fixed
 * @param {string}  [options.standaloneAppearance='standalone'] - Visual style when
 *   toolbar is in its inline (non-sticky) state:
 *   'standalone' — default inline look (swatch strip, no band/shadow)
 *   'raised'     — sticky visuals (swatch band, shadow) without sticky positioning
 * @param {boolean} [options.reserveSpace=true]
 * @param {string}  [options.ctaText]
 * @param {string}  [options.mobileCTAText]
 * @param {boolean} [options.showEdit=true]
 * @param {boolean} [options.showPalette=true]
 * @param {boolean} [options.showPaletteName=true]
 * @param {boolean} [options.editPaletteName=false]
 * @param {string}  [options.editPaletteLink=null]
 * @param {Object}  [options.palette] - Pre-built palette; skips Kuler fetch when provided
 * @returns {Promise<{ toolbar, palette, getLibraryContext, wrapper, mount, setVariant, destroy }>}
 */
// eslint-disable-next-line import/prefer-default-export
export async function initFloatingToolbar(container, options = {}) {
  const {
    type = 'palette',
    variant = 'standalone',
    reserveSpace = true,
    ctaText,
    mobileCTAText,
    showEdit = true,
    showPalette = true,
    showPaletteName = true,
    editPaletteName = false,
    editPaletteLink = null,
    standaloneAppearance = 'standalone',
    palette: providedPalette = null,
    deps = {},
  } = options;

  // 'raised' gives sticky visuals (band, shadow) without sticky positioning
  const resolvedStandaloneVariant = standaloneAppearance === 'raised' ? 'sticky' : 'standalone';

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
    getLibraryContext: () => getLibraryContext(toolbarI18n.networkError),
    i18n: toolbarI18n,
    drawerI18n,
  });

  wrapper.appendChild(toolbar.element);
  container.appendChild(wrapper);

  let stickyIo = null;
  let stickyReserveContainer = null;
  let currentContainer = container;

  const mount = (nextContainer) => {
    if (!nextContainer || nextContainer === currentContainer) return;
    nextContainer.appendChild(wrapper);
    currentContainer = nextContainer;
  };

  function resolveReserveContainer(variantOptions) {
    return variantOptions.reserveContainer || currentContainer;
  }

  function activateSticky(variantOptions) {
    wrapper.classList.remove('ax-toolbar-exiting', 'ax-toolbar-fade-in');
    wrapper.classList.add('ax-toolbar-fade-out');

    setupStickyBehavior(wrapper, {
      reserveContainer: stickyReserveContainer,
      reserveSpace: variantOptions.reserveSpace ?? reserveSpace,
    });
    toolbar.setVariant?.('sticky');
    wrapper.classList.remove('ax-toolbar-fade-out');
  }

  function clearStickyClasses() {
    wrapper.classList.remove('ax-toolbar-sticky-wrapper', 'ax-toolbar-exiting');
    stickyReserveContainer.classList.remove('ax-toolbar-sticky-host');
    stickyReserveContainer.style.removeProperty('--ax-toolbar-h');
    toolbar.setVariant?.(resolvedStandaloneVariant);
    wrapper.classList.add('ax-toolbar-fade-in');
    wrapper.addEventListener('animationend', () => wrapper.classList.remove('ax-toolbar-fade-in'), { once: true });
  }

  function deactivateSticky() {
    if (!wrapper.classList.contains('ax-toolbar-sticky-wrapper')) {
      clearStickyClasses();
      return;
    }

    wrapper.classList.add('ax-toolbar-exiting');

    const { animationDuration } = getComputedStyle(wrapper);
    if (animationDuration && animationDuration !== '0s') {
      wrapper.addEventListener('animationend', () => clearStickyClasses(), { once: true });
    } else {
      clearStickyClasses();
    }
  }

  function observeStickyOnScroll(variantOptions) {
    if (typeof IntersectionObserver === 'undefined') return;
    const sentinel = createTag('div', { class: 'ax-toolbar-scroll-sentinel', 'aria-hidden': 'true' });
    wrapper.before(sentinel);

    let isSticky = false;

    stickyIo = new IntersectionObserver((entries) => {
      const entry = entries[0];
      const shouldStick = Boolean(entry)
        && !entry.isIntersecting
        && entry.boundingClientRect.top < 0;

      if (shouldStick === isSticky) return;
      isSticky = shouldStick;

      if (shouldStick) activateSticky(variantOptions);
      else deactivateSticky();
    }, { threshold: 0 });
    stickyIo.observe(sentinel);
  }

  function resetStickyState() {
    clearStickyBehavior(wrapper, stickyReserveContainer, stickyIo);
    stickyIo = null;
    stickyReserveContainer = null;
  }

  const setVariant = (nextVariant, variantOptions = {}) => {
    resetStickyState();

    if (nextVariant === 'sticky-on-scroll') {
      toolbar.setVariant?.(resolvedStandaloneVariant);
      stickyReserveContainer = resolveReserveContainer(variantOptions);
      observeStickyOnScroll(variantOptions);
      return;
    }

    toolbar.setVariant?.(nextVariant === 'standalone' ? resolvedStandaloneVariant : nextVariant);

    if (nextVariant === 'sticky') {
      stickyReserveContainer = resolveReserveContainer(variantOptions);
      activateSticky(variantOptions);
    }
  };

  setVariant(variant, {
    reserveContainer: container,
    reserveSpace,
  });

  return {
    toolbar,
    palette: finalPalette,
    getLibraryContext,
    wrapper,
    mount,
    setVariant,
    destroy() {
      clearStickyBehavior(wrapper, stickyReserveContainer, stickyIo);
      toolbar.destroy();
      wrapper.remove();
    },
  };
}
