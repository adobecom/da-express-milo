import { parseBlockConfig } from './helpers/parseConfig.js';
import { CSS_CLASSES, VARIANTS, VARIANT_CLASSES, EVENTS } from './helpers/constants.js';
import { getGradientsMockData } from './helpers/gradientsMockData.js';
import { createColorRenderer } from './factory/createColorRenderer.js';
import { createColorModalManager } from './modal/createColorModalManager.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { getLibs } from '../../scripts/utils.js';
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';
import { createPaletteModal } from '../../scripts/color-shared/modal/createPaletteModal.js';
import { createColorDataService as createSharedColorDataService } from '../../scripts/color-shared/services/createColorDataService.js';

const COLOR_TOKENS_LOADED_KEY = 'colorExploreTokensLoaded';

function parseTokenPx(value) {
  if (!value || typeof value !== 'string') return 0;
  const num = parseFloat(value.trim().replace(/px$/, ''), 10);
  return Number.isNaN(num) ? 0 : num;
}

function getBreakpointsFromTokens() {
  const root = document.documentElement;
  const style = root instanceof Element ? getComputedStyle(root) : null;
  if (!style) return { m: 600, l: 1200, xl: 1680 };
  return {
    m: parseTokenPx(style.getPropertyValue('--Global-Device-Widths-device-min-width-m').trim()) || 600,
    l: parseTokenPx(style.getPropertyValue('--Global-Device-Widths-device-min-width-l').trim()) || 1200,
    xl: parseTokenPx(style.getPropertyValue('--Global-Device-Widths-device-min-width-xl').trim()) || 1680,
  };
}

function applyBreakpointClasses(block, bp) {
  const w = window.innerWidth;
  block.classList.toggle('mq-m', w >= bp.m);
  block.classList.toggle('mq-l', w >= bp.l);
  block.classList.toggle('mq-xl', w >= bp.xl);
}

function setupBreakpointClasses(block) {
  const bp = getBreakpointsFromTokens();
  const update = () => applyBreakpointClasses(block, bp);
  update();
  window.addEventListener('resize', update);
  const ro = new ResizeObserver(update);
  ro.observe(document.documentElement);
  block.dataset.breakpointObserver = 'true';
}

function hasTokenOnRoot(name) {
  const v = document.documentElement instanceof Element
    ? getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    : '';
  return v.length > 0 && v !== 'undefined';
}

async function loadColorTokens() {
  if (document.documentElement.dataset[COLOR_TOKENS_LOADED_KEY] === 'true') {
    return;
  }
  const { loadStyle } = await import(`${getLibs()}/utils/utils.js`);
  const tokenCheck = '--Global-Device-Widths-device-min-width-m';

  const tryLoad = (href) => new Promise((resolve) => {
    loadStyle(href, () => {
      requestAnimationFrame(() => {
        if (hasTokenOnRoot(tokenCheck)) {
          document.documentElement.dataset[COLOR_TOKENS_LOADED_KEY] = 'true';
        }
        resolve();
      });
    });
  });

  const scriptRelative = new URL('../../scripts/color-shared/color-tokens.css', import.meta.url).href;
  await tryLoad(scriptRelative);
  if (!hasTokenOnRoot(tokenCheck)) {
    await tryLoad('/express/code/scripts/color-shared/color-tokens.css');
  }
  if (!hasTokenOnRoot(tokenCheck)) {
    document.documentElement.dataset[COLOR_TOKENS_LOADED_KEY] = 'true';
  }
}

function getVariantFromBlock(block) {
  if (block.classList.contains(VARIANT_CLASSES.GRADIENTS)) return VARIANTS.GRADIENTS;
  if (block.classList.contains(VARIANT_CLASSES.PALETTES)) return VARIANTS.STRIPS;
  return null;
}

export default async function decorate(block) {
  if (block.dataset.blockStatus === 'loaded') return;

  try {
    await loadColorTokens();

    const variantFromClass = getVariantFromBlock(block);
    const rows = [...block.children];
    const config = parseBlockConfig(rows);
    if (variantFromClass) config.variant = variantFromClass;

    block.dataset.blockStatus = 'loading';
    block.innerHTML = '';
    block.className = CSS_CLASSES.BLOCK;
    const variantClass = config.variant === VARIANTS.GRADIENTS ? VARIANT_CLASSES.GRADIENTS : VARIANT_CLASSES.PALETTES;
    block.classList.add(variantClass);
    block.classList.add(`${CSS_CLASSES.BLOCK}--${config.variant}`);

    const container = document.createElement('div');
    container.className = CSS_CLASSES.CONTAINER;
    block.appendChild(container);

    if (!block.dataset.breakpointObserver) setupBreakpointClasses(block);

    if (config.variant === VARIANTS.GRADIENTS) {
      const initialData = getGradientsMockData();
      const dataService = createSharedColorDataService({
        variant: 'gradients',
        initialLoad: config.initialLoad,
        maxItems: config.maxItems,
      });
      const modalManager = createColorModalManager(config);
      const stateKey = `color-explore-${config.variant}`;

      BlockMediator.set(stateKey, {
        selectedItem: null,
        currentData: initialData,
        allData: initialData,
        searchQuery: '',
        totalCount: initialData.length,
      });

      const renderer = createColorRenderer(config.variant, {
        container,
        data: initialData,
        config,
        dataService,
        modalManager,
        stateKey,
      });

      await renderer.render();

      renderer.on('item-click', (item) => {
        const currentState = BlockMediator.get(stateKey);
        BlockMediator.set(stateKey, { ...currentState, selectedItem: item });
        modalManager.open(item, config.variant);
      });

      block.classList.add(`color-explore-${config.variant}`);
      block.rendererInstance = renderer;
      block.modalManagerInstance = modalManager;
      block.dataServiceInstance = dataService;
    } else {
      const dataService = createSharedColorDataService({
        variant: config.variant,
        initialLoad: config.initialLoad,
        maxItems: config.maxItems,
      });

      block.classList.add(CSS_CLASSES.LOADING);
      const data = await dataService.fetchData();
      block.classList.remove(CSS_CLASSES.LOADING);

      const renderer = createStripsRenderer({ container, data, config });
      renderer.render(container);

      const modalManager = createModalManager();

      renderer.on(EVENTS.PALETTE_CLICK, (palette) => {
        const paletteContent = createPaletteModal(palette || {});
        modalManager.open({
          title: palette?.name || 'Palette',
          content: paletteContent.element,
          onClose: () => paletteContent.destroy?.(),
        });
      });

      renderer.on(EVENTS.SEARCH, async ({ query }) => {
        block.classList.add(CSS_CLASSES.LOADING);
        const searchResults = await dataService.search(query);
        renderer.update(searchResults);
        block.classList.remove(CSS_CLASSES.LOADING);
      });

      renderer.on(EVENTS.FILTER, async (filters) => {
        block.classList.add(CSS_CLASSES.LOADING);
        const filteredResults = await dataService.filter(filters);
        renderer.update(filteredResults);
        block.classList.remove(CSS_CLASSES.LOADING);
      });

      renderer.on(EVENTS.LOAD_MORE, async () => {
        block.classList.add(CSS_CLASSES.LOADING);
        const moreData = await dataService.loadMore();
        renderer.update(moreData);
        block.classList.remove(CSS_CLASSES.LOADING);
      });

      document.addEventListener('floating-search:submit', async (e) => {
        const { query } = e.detail;
        block.classList.add(CSS_CLASSES.LOADING);
        const searchResults = await dataService.search(query);
        renderer.update(searchResults);
        block.classList.remove(CSS_CLASSES.LOADING);
      });

      block.rendererInstance = renderer;
      block.modalManagerInstance = modalManager;
      block.dataServiceInstance = dataService;
    }

    block.dataset.blockStatus = 'loaded';
  } catch (error) {
    console.error('[ColorExplore] ❌ Error:', error);
    block.classList.add(CSS_CLASSES.ERROR);
    block.dataset.blockStatus = '';
    block.innerHTML = `<p style="color: red;">Failed to load Color Explore: ${error.message}</p>`;
    block.setAttribute('data-failed', 'true');
  }
}
