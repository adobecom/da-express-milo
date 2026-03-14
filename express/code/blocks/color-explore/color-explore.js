import { parseBlockConfig } from './helpers/parseConfig.js';
import { createColorRenderer } from './factory/createColorRenderer.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';
import { createSwatchesRenderer } from '../../scripts/color-shared/renderers/createSwatchesRenderer.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';
import { createGradientPickerRebuildContent, loadGradientPickerRebuildStyles } from '../../scripts/color-shared/modal/createGradientPickerRebuildContent.js';
import { createColorDataService as createSharedColorDataService } from '../../scripts/color-shared/services/createColorDataService.js';
import loadCSS from '../../scripts/color-shared/utils/loadCss.js';

const VARIANTS = { STRIPS: 'strips', GRADIENTS: 'gradients' };
const VARIANT_CLASSES = { GRADIENTS: 'gradients', PALETTES: 'palettes' };
const DEFAULTS = {
  variant: VARIANTS.STRIPS,
  initialLoad: 24,
  loadMoreIncrement: 10,
  maxItems: 100,
  enableFilters: true,
  enableSearch: true,
  showReviewSection: false,
  enableGradientEditor: false,
  enableSizesDemo: false,
  useMockData: false,
  useMockFallback: true,
  apiEndpoint: '',
};
const CSS_CLASSES = { BLOCK: 'color-explore', CONTAINER: 'color-explore-container', LOADING: 'is-loading', ERROR: 'has-error' };
const EVENTS = { PALETTE_CLICK: 'palette-click', GRADIENT_CLICK: 'gradient-click', SEARCH: 'search', FILTER: 'filter', LOAD_MORE: 'load-more' };

const STRIP_SHARED_STYLES = [
  '/express/code/scripts/color-shared/components/strips/color-strip.css',
  '/express/code/scripts/color-shared/components/gradients/gradient-strip.css',
];

async function loadStripSharedStyles() {
  await Promise.all(
    STRIP_SHARED_STYLES.map(async (href) => {
      try {
        await loadCSS(href);
      } catch (error) {
        window.lana?.log(`[ColorExplore] Failed loading shared style ${href}: ${error?.message}`, {
          tags: 'color-explore,css',
          severity: 'error',
        });
      }
    }),
  );
}

function getVariantFromBlock(block) {
  if (block.classList.contains(VARIANT_CLASSES.GRADIENTS)) return VARIANTS.GRADIENTS;
  if (block.classList.contains(VARIANT_CLASSES.PALETTES)) return VARIANTS.STRIPS;
  return null;
}

function isSwatchesMode(config) {
  return config?.swatchesOnly === true
    || config?.contentMode === 'swatches'
    || config?.renderMode === 'swatches';
}

export default async function decorate(block) {
  if (block.dataset.blockStatus === 'loaded') return;

  try {
    await loadStripSharedStyles();

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
      const dataService = createSharedColorDataService({
        variant: 'gradients',
        initialLoad: config.initialLoad,
        maxItems: config.maxItems,
        apiEndpoint: config.apiEndpoint,
        useMockData: config.useMockData,
        useMockFallback: config.useMockFallback,
      });
      const initialData = await dataService.fetchData();
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
        apiEndpoint: config.apiEndpoint,
        useMockData: config.useMockData,
        useMockFallback: config.useMockFallback,
      });

      block.classList.add(CSS_CLASSES.LOADING);
      const data = await dataService.fetchData();
      block.classList.remove(CSS_CLASSES.LOADING);

      let renderer;
      if (isSwatchesMode(config)) {
        renderer = createSwatchesRenderer({ container, data, config });
      } else {
        renderer = createStripsRenderer({ container, data, config });
      }
      renderer.render?.(container);

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
