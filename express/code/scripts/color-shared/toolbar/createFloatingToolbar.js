import { serviceManager } from '../../../libs/services/index.js';
import { createToolbar } from './createToolbarComponent.js';
import loadCSS from '../utils/loadCss.js';
import { createTag } from '../../utils.js';

// --- CURATED FALLBACK PALETTES (remove block to revert) ---
const FALLBACK_PALETTES = [
  { id: 'fall-1', name: 'Sunset Boulevard', colors: ['#F4845F', '#F7B267', '#F9D56E', '#F25C54', '#D62828'] },
  { id: 'fall-2', name: 'Ocean Depths', colors: ['#03045E', '#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8'] },
  { id: 'fall-3', name: 'Forest Canopy', colors: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#B7E4C7'] },
  { id: 'fall-4', name: 'Berry Crush', colors: ['#590D22', '#800F2F', '#A4133C', '#C9184A', '#FF4D6D'] },
  { id: 'fall-5', name: 'Golden Hour', colors: ['#FF6D00', '#FF8500', '#FF9E00', '#FFB600', '#FFCA3A'] },
  { id: 'fall-6', name: 'Lavender Fields', colors: ['#7B2D8E', '#9B5DE5', '#C77DFF', '#E0AAFF', '#F3D5FF'] },
  { id: 'fall-7', name: 'Coral Reef', colors: ['#F72585', '#B5179E', '#7209B7', '#560BAD', '#480CA8'] },
  { id: 'fall-8', name: 'Arctic Mist', colors: ['#D8E2DC', '#FFE5D9', '#FFCAD4', '#F4ACB7', '#9D8189'] },
];

function pickRandomFallback() {
  const pick = FALLBACK_PALETTES[Math.floor(Math.random() * FALLBACK_PALETTES.length)];
  return { ...pick, tags: [], author: null, likes: 0 };
}

async function ensureServices() {
  await serviceManager.init({ plugins: ['kuler', 'cclibrary'] });
}

async function getLibraryContext() {
  try {
    const provider = await serviceManager.getProvider('cclibrary');
    if (!provider) return { libraries: [], provider: null };

    const result = await provider.fetchUserLibraries();
    const all = result?.libraries ?? [];
    const writable = provider.filterWritableLibraries(all);

    const libraries = writable.map((lib) => ({
      id: lib.library_urn ?? lib.id,
      name: lib.name,
    }));

    return { libraries, provider };
  } catch (err) {
    window.lana?.log(`Toolbar init – CC Libraries fetch failed: ${err.message}`, {
      tags: 'color-floating-toolbar,init',
    });
    return { libraries: [], provider: null };
  }
}

function normalizeTheme(theme) {
  const ensureHash = (hex) => (hex.startsWith('#') ? hex : `#${hex}`);

  return {
    id: theme.id ?? '',
    name: theme.name ?? 'My Color Theme',
    colors: (theme.swatches ?? []).map((s) => {
      if (typeof s === 'string') return ensureHash(s);
      if (s.hex) return ensureHash(s.hex);
      if (s.color) return ensureHash(s.color);
      if (s.values && s.values.length >= 3) {
        const [r, g, b] = s.values.map((v) => Math.round(Number.parseFloat(v) * 255));
        return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      }
      return '#000000';
    }),
    tags: (theme.tags ?? []).map((t) => {
      if (typeof t === 'string') return t;
      return t?.tag ?? t?.name ?? '';
    }).filter(Boolean),
    author: theme.author ?? null,
    likes: theme.likes ?? 0,
  };
}

async function fetchRandomPalette() {
  try {
    const provider = await serviceManager.getProvider('kuler');
    if (!provider) return pickRandomFallback();

    const raw = await provider.exploreThemes({
      sort: 'random',
      time: 'all',
      page: 1,
    });

    const themes = raw?.themes ?? [];
    if (!themes.length) return pickRandomFallback();

    const pick = themes[Math.floor(Math.random() * themes.length)];
    return normalizeTheme(pick);
  } catch (err) {
    window.lana?.log(`Toolbar init – Kuler fetch failed: ${err.message}`, {
      tags: 'color-floating-toolbar,init',
    });
    return pickRandomFallback();
  }
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
    showPaletteName = true,
    editPaletteName = false,
    palette: providedPalette = null,
  } = options;

  const toolbarHref = new URL('./toolbar.css', import.meta.url).pathname;

  const [, fetchedPalette] = await Promise.all([
    ensureServices(),
    providedPalette ? Promise.resolve(null) : fetchRandomPalette(),
    loadCSS(toolbarHref),
  ]);

  const finalPalette = providedPalette ?? fetchedPalette ?? pickRandomFallback();

  const wrapper = createTag('div', { class: 'color-floating-toolbar-container' });
  const toolbar = createToolbar({
    palette: finalPalette,
    type,
    variant,
    ctaText,
    mobileCTAText,
    showEdit,
    showPaletteName,
    editPaletteName,
    getLibraryContext,
  });

  wrapper.appendChild(toolbar.element);
  container.appendChild(wrapper);

  let stickyRo = null;
  const isSticky = variant === 'sticky';

  if (isSticky) {
    container.classList.add('ax-toolbar-sticky-host');

    const updateToolbarHeight = () => {
      const h = wrapper.getBoundingClientRect().height;
      container.style.setProperty('--ax-toolbar-h', `${h}px`);
    };

    requestAnimationFrame(updateToolbarHeight);

    stickyRo = new ResizeObserver(updateToolbarHeight);
    stickyRo.observe(wrapper);
  }

  // --- RANDOM PALETTE OVERRIDE (remove block to revert) ---
  fetchRandomPalette().then((randomPalette) => {
    if (randomPalette?.colors?.length) {
      toolbar.updateSwatches(randomPalette.colors);
      const nameInput = wrapper.querySelector('#ax-palette-name-input');
      if (nameInput) nameInput.value = randomPalette.name;
      finalPalette.colors = randomPalette.colors;
      finalPalette.name = randomPalette.name;
    }
  }).catch(() => { /* keep provided palette on failure */ });

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
