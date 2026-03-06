import { parseBlockConfig } from './helpers/parseConfig.js';
import { getGradientsMockData } from './demo/gradientDemo.js';
import { createColorRenderer } from './factory/createColorRenderer.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';
import { createGradientPickerRebuildContent, loadGradientPickerRebuildStyles } from '../../scripts/color-shared/modal/createGradientPickerRebuildContent.js';
import { createColorDataService as createSharedColorDataService } from '../../scripts/color-shared/services/createColorDataService.js';

const VARIANTS = { STRIPS: 'strips', GRADIENTS: 'gradients' };
const VARIANT_CLASSES = { GRADIENTS: 'gradients', PALETTES: 'palettes' };
const DEFAULTS = {
  variant: VARIANTS.STRIPS,
  initialLoad: 24,
  loadMoreIncrement: 10,
  maxItems: 100,
  enableFilters: false,
  enableSearch: true,
  enableGradientEditor: false, /* dev only: set true when using mock data */
  enableSizesDemo: false, /* dev only: set true when using mock data */
};
const CSS_CLASSES = { BLOCK: 'color-explore', CONTAINER: 'color-explore-container', LOADING: 'is-loading', ERROR: 'has-error' };
const EVENTS = { PALETTE_CLICK: 'palette-click', GRADIENT_CLICK: 'gradient-click', SEARCH: 'search', FILTER: 'filter', LOAD_MORE: 'load-more' };

const COLOR_TOKENS_LOADED_KEY = 'colorExploreTokensLoaded';

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
  /* Tokens from styles.css (loaded by Express); just mark if present. */
  const tokenCheck = '--spacing-100';
  if (hasTokenOnRoot(tokenCheck)) {
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
    const config = parseBlockConfig(rows, DEFAULTS);
    if (variantFromClass) config.variant = variantFromClass;

    block.dataset.blockStatus = 'loading';
    block.innerHTML = '';
    block.className = CSS_CLASSES.BLOCK;
    const variantClass = config.variant === VARIANTS.GRADIENTS
      ? VARIANT_CLASSES.GRADIENTS
      : VARIANT_CLASSES.PALETTES;
    block.classList.add(variantClass);
    block.classList.add(`${CSS_CLASSES.BLOCK}--${config.variant}`);

    const container = document.createElement('div');
    container.className = CSS_CLASSES.CONTAINER;
    block.appendChild(container);

    if (config.variant === VARIANTS.GRADIENTS) {
      const initialData = getGradientsMockData();
      /* Dev only: enable demo sections when using mock data; remove when wiring real data */
      config.enableSizesDemo = true;
      config.enableGradientEditor = true;
      const dataService = createSharedColorDataService({
        variant: 'gradients',
        initialLoad: config.initialLoad,
        maxItems: config.maxItems,
      });
      const modalManager = createModalManager();
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

      renderer.on('item-click', async (item) => {
        await loadGradientPickerRebuildStyles();
        const currentState = BlockMediator.get(stateKey);
        BlockMediator.set(stateKey, { ...currentState, selectedItem: item });
        const g = item || {};
        modalManager.open({
          title: g.name || 'Gradient',
          showTitle: false,
          content: () => createGradientPickerRebuildContent(g, {
            likesCount: '1.2K',
            creatorName: g.creator?.name ?? 'nicolagilroy',
            creatorImageUrl: g.creator?.imageUrl ?? g.creatorImageUrl,
            tags: ['Orange', 'Cinematic', 'Summer', 'Water'],
          }),
        });
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

      renderer.on(EVENTS.PALETTE_CLICK, async (palette) => {
        await loadGradientPickerRebuildStyles();
        const p = palette || {};
        modalManager.open({
          title: p.name || 'Palette',
          showTitle: false,
          content: () => createGradientPickerRebuildContent(p, {
            likesCount: '1.2K',
            creatorName: p.creator?.name ?? 'nicolagilroy',
            creatorImageUrl: p.creator?.imageUrl ?? p.creatorImageUrl,
            tags: ['Orange', 'Cinematic', 'Summer', 'Water'],
          }),
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
    window.lana?.log(`[ColorExplore] ❌ Error: ${error}`, { tags: 'color-explore', severity: 'error' });
    block.classList.add(CSS_CLASSES.ERROR);
    block.dataset.blockStatus = '';
    block.innerHTML = `<p style="color: red;">Failed to load Color Explore: ${error.message}</p>`;
    block.setAttribute('data-failed', 'true');
  }
}
