import { serviceManager } from '../../../libs/services/index.js';
import { createToolbar } from './createToolbarComponent.js';
import loadCSS from '../utils/loadCss.js';
import { createTag } from '../../utils.js';
import { showExpressToast } from '../spectrum/components/express-toast.js';

const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
const NETWORK_ERROR_MESSAGE = 'Network request failed. Check your connection or try again.';

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

async function loadToolbarDependencies(providedPalette, deps = {}) {
  const {
    initServices = () => ensureServices(),
    loadStyles = () => loadCSS(new URL('./toolbar.css', import.meta.url).pathname),
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
    ctaText = 'Create with my color palette',
    mobileCTAText = 'Create with my color palette',
    showEdit = true,
    showPalette = true,
    showPaletteName = true,
    editPaletteName = false,
    palette: providedPalette = null,
    deps = {},
  } = options;

  const finalPalette = await loadToolbarDependencies(providedPalette, deps);
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
    getLibraryContext,
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
