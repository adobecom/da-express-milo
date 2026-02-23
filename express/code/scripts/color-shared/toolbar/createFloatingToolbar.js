/* global globalThis */
import { serviceManager } from '../../../libs/services/index.js';
import { createToolbar } from './createToolbarComponent.js';
import { loadCSS } from '../utils/css.js';
import { createTag } from '../../utils.js';

const DEFAULT_PALETTE = {
  id: 'default',
  name: 'My Color Theme',
  colors: ['#1900ab', '#6bb1ff', '#ff7500', '#fffdeb', '#0076ff'],
  tags: [],
  author: null,
  likes: 0,
};

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
    globalThis.lana?.log(`Toolbar init – CC Libraries fetch failed: ${err.message}`, {
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
    if (!provider) return null;

    const raw = await provider.exploreThemes({
      sort: 'random',
      time: 'all',
      page: 1,
    });

    const themes = raw?.themes ?? [];
    if (!themes.length) return null;

    const pick = themes[Math.floor(Math.random() * themes.length)];
    return normalizeTheme(pick);
  } catch (err) {
    globalThis.lana?.log(`Toolbar init – Kuler fetch failed: ${err.message}`, {
      tags: 'color-floating-toolbar,init',
    });
    return null;
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
 * @returns {Promise<{ toolbar: Object, libraries: Array, palette: Object, destroy: Function }>}
 */
// eslint-disable-next-line import/prefer-default-export
export async function initFloatingToolbar(container, options = {}) {
  const {
    type = 'palette',
    variant = 'standalone',
    ctaText = 'Create with my color palette',
    mobileCTAText = 'Open palette in Adobe Express',
    showEdit = true,
  } = options;

  const cssReady = loadCSS(new URL('./toolbar.css', import.meta.url).pathname);

  const [, palette] = await Promise.all([
    ensureServices(),
    fetchRandomPalette(),
    cssReady,
  ]);

  const finalPalette = palette ?? DEFAULT_PALETTE;

  const wrapper = createTag('div', { class: 'color-floating-toolbar-container' });
  const toolbar = createToolbar({
    palette: finalPalette,
    type,
    variant,
    ctaText,
    mobileCTAText,
    showEdit,
    getLibraryContext,
  });

  wrapper.appendChild(toolbar.element);
  container.appendChild(wrapper);

  return {
    toolbar,
    palette: finalPalette,
    getLibraryContext,
    destroy() {
      toolbar.destroy();
    },
  };
}
