import { parseBlockConfig } from './helpers/parseConfig.js';
import { createColorRenderer } from './factory/createColorRenderer.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';
import { createSwatchesRenderer } from '../../scripts/color-shared/renderers/createSwatchesRenderer.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';
import { createGradientPickerRebuildContent, loadGradientPickerRebuildStyles } from '../../scripts/color-shared/modal/createGradientPickerRebuildContent.js';
import { createColorDataService as createSharedColorDataService } from '../../scripts/color-shared/services/createColorDataService.js';
import { createFiltersComponent } from '../../scripts/color-shared/components/createFiltersComponent.js';
import loadCSS from '../../scripts/color-shared/utils/loadCss.js';
import { loadIconsRail } from '../../scripts/color-shared/spectrum/load-spectrum.js';

const VARIANTS = { STRIPS: 'strips', GRADIENTS: 'gradients' };
const VARIANT_CLASSES = { GRADIENTS: 'gradients', PALETTES: 'palettes' };
const DEFAULTS = {
  variant: VARIANTS.STRIPS,
  initialLoad: 24,
  loadMoreIncrement: 10,
  maxItems: 100,
  enableFilters: true,
  enableSearch: true,
  useMockData: false,
  useMockFallback: true,
  apiEndpoint: '',
};
const CSS_CLASSES = { BLOCK: 'color-explore', CONTAINER: 'color-explore-container', LOADING: 'is-loading', ERROR: 'has-error' };
const EVENTS = {
  PALETTE_CLICK: 'palette-click',
  GRADIENT_CLICK: 'gradient-click',
  SHARE: 'share',
  SEARCH: 'search',
  FILTER: 'filter',
  LOAD_MORE: 'load-more',
};

const STRIP_SHARED_STYLES = [
  '/express/code/scripts/color-shared/components/strips/color-strip.css',
  '/express/code/scripts/color-shared/components/gradients/gradient-strip.css',
];
const LOAD_MORE_CLICK_HANDLERS = new WeakMap();

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

async function createBlockLoadMoreControl(container, onClick, options = {}) {
  const { iconSize = 'xl' } = options;
  await loadIconsRail();

  let root = container.querySelector(':scope > .load-more-container[data-owner="color-explore"]');
  if (!root) {
    root = document.createElement('div');
    root.className = 'load-more-container';
    root.dataset.owner = 'color-explore';

    const button = document.createElement('button');
    button.className = 'load-more-btn';
    button.type = 'button';

    const icon = document.createElement('sp-icon-add');
    icon.className = 'load-more-icon';
    icon.setAttribute('size', iconSize);
    icon.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'button-text';

    button.appendChild(icon);
    button.appendChild(text);
    root.appendChild(button);
    container.appendChild(root);
  }

  const button = root.querySelector('button');
  const text = root.querySelector('.button-text');
  const icon = root.querySelector('sp-icon-add');

  if (icon && icon.getAttribute('size') !== iconSize) {
    icon.setAttribute('size', iconSize);
  }

  const previousClickHandler = LOAD_MORE_CLICK_HANDLERS.get(button);
  if (previousClickHandler) {
    button.removeEventListener('click', previousClickHandler);
  }

  const handleLoadMoreClick = async () => {
    if (button.disabled) return;
    button.disabled = true;
    try {
      await onClick?.();
    } finally {
      button.disabled = false;
    }
  };

  button.addEventListener('click', handleLoadMoreClick);
  LOAD_MORE_CLICK_HANDLERS.set(button, handleLoadMoreClick);

  return {
    update(remaining) {
      if (remaining <= 0) {
        root.style.display = 'none';
        return;
      }
      text.textContent = 'Load more';
      button.setAttribute('aria-label', 'Load more items');
      root.style.display = 'flex';
    },
    destroy() {
      const clickHandler = LOAD_MORE_CLICK_HANDLERS.get(button);
      if (clickHandler) {
        button.removeEventListener('click', clickHandler);
        LOAD_MORE_CLICK_HANDLERS.delete(button);
      }
      root?.remove();
    },
  };
}

async function createBlockFilterControl(container, variant, onFilterChange) {
  const header = container.querySelector('.explore-header, .gradients-header');
  if (!header) return null;

  const filters = await createFiltersComponent({
    variant,
    onFilterChange,
  });

  if (!(filters?.element instanceof Node)) return null;
  header.appendChild(filters.element);
  await filters.waitForReady?.();

  return {
    destroy() {
      filters.reset?.();
      filters.element?.remove?.();
    },
  };
}

export default async function decorate(block) {
  if (block.dataset.blockStatus === 'loaded' || block.dataset.blockStatus === 'loading') return;

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

    const themeHost = document.createElement('sp-theme');
    themeHost.setAttribute('system', 'spectrum-two');
    themeHost.setAttribute('color', 'light');
    themeHost.setAttribute('scale', 'medium');
    block.appendChild(themeHost);

    const container = document.createElement('div');
    container.className = CSS_CLASSES.CONTAINER;
    themeHost.appendChild(container);

    if (config.variant === VARIANTS.GRADIENTS || config.variant === VARIANTS.STRIPS) {
      const gradientsDataService = createSharedColorDataService({
        variant: VARIANTS.GRADIENTS,
        initialLoad: config.initialLoad,
        maxItems: config.maxItems,
        apiEndpoint: config.apiEndpoint,
        useMockData: config.useMockData,
        useMockFallback: config.useMockFallback,
      });
      const palettesDataService = createSharedColorDataService({
        variant: 'palettes',
        initialLoad: config.initialLoad,
        maxItems: config.maxItems,
        apiEndpoint: config.apiEndpoint,
        useMockData: config.useMockData,
        useMockFallback: config.useMockFallback,
      });
      const modalManager = createModalManager();
      const stateKey = `color-explore-${VARIANTS.GRADIENTS}`;

      let activeMode = config.variant === VARIANTS.GRADIENTS ? VARIANTS.GRADIENTS : VARIANTS.STRIPS;
      let activeRenderer = null;
      let activeDataService = config.variant === VARIANTS.GRADIENTS
        ? gradientsDataService
        : palettesDataService;
      let allData = [];
      let visibleCount = 0;
      let loadMoreControl = null;
      let filtersControl = null;
      let floatingSearchHandler = null;
      let isMounting = false;
      let filterInteractionSuppressUntil = 0;

      const setModeClasses = (variant) => {
        block.classList.remove(VARIANT_CLASSES.GRADIENTS, VARIANT_CLASSES.PALETTES);
        block.classList.remove(`${CSS_CLASSES.BLOCK}--${VARIANTS.GRADIENTS}`);
        block.classList.remove(`${CSS_CLASSES.BLOCK}--${VARIANTS.STRIPS}`);

        const nextVariantClass = variant === VARIANTS.GRADIENTS
          ? VARIANT_CLASSES.GRADIENTS
          : VARIANT_CLASSES.PALETTES;
        block.classList.add(nextVariantClass);
        block.classList.add(`${CSS_CLASSES.BLOCK}--${variant}`);
      };

      const updateLoadMoreState = () => {
        loadMoreControl?.update(Math.max(0, allData.length - visibleCount));
      };

      const cleanupActiveView = () => {
        filtersControl?.destroy?.();
        filtersControl = null;
        loadMoreControl?.destroy?.();
        loadMoreControl = null;
        activeRenderer?.destroy?.();
        activeRenderer = null;
        container.classList.remove('color-explorer-strips');
        if (floatingSearchHandler) {
          document.removeEventListener('floating-search:submit', floatingSearchHandler);
          floatingSearchHandler = null;
        }
      };

      const openModalForItem = async (item, fallbackTitle) => {
        await loadGradientPickerRebuildStyles();
        const content = item || {};
        modalManager.open({
          title: content.name || fallbackTitle,
          showTitle: false,
          content: () => createGradientPickerRebuildContent(content, {
            likesCount: '1.2K',
            creatorName: content.creator?.name ?? 'nicolagilroy',
            creatorImageUrl: content.creator?.imageUrl ?? content.creatorImageUrl,
            tags: ['Orange', 'Cinematic', 'Summer', 'Water'],
          }),
        });
      };

      const publishInstances = () => {
        block.rendererInstance = activeRenderer;
        block.modalManagerInstance = modalManager;
        block.dataServiceInstance = activeDataService;
        block.filtersControlInstance = filtersControl;
      };

      let mountStripsMode;

      const mountGradientsMode = async () => {
        if (isMounting) return;
        isMounting = true;
        try {
          cleanupActiveView();
          activeMode = VARIANTS.GRADIENTS;
          activeDataService = gradientsDataService;
          setModeClasses(VARIANTS.GRADIENTS);

          block.classList.add(CSS_CLASSES.LOADING);
          allData = await activeDataService.fetchData();
          visibleCount = Math.min(config.initialLoad, allData.length);
          block.classList.remove(CSS_CLASSES.LOADING);

          BlockMediator.set(stateKey, {
            selectedItem: null,
            currentData: allData,
            allData,
            searchQuery: '',
            totalCount: allData.length,
          });

          const rendererConfig = {
            ...config,
            initialLoad: Math.max(config.maxItems || 100, allData.length || config.initialLoad),
            loadMoreIncrement: Math.max(config.maxItems || 100, config.loadMoreIncrement || 10),
            useInternalLoadMore: false,
            initialActivationSuppressUntil: filterInteractionSuppressUntil,
          };

          activeRenderer = createColorRenderer(VARIANTS.GRADIENTS, {
            container,
            data: allData.slice(0, visibleCount),
            config: rendererConfig,
            dataService: activeDataService,
            modalManager,
            stateKey,
          });

          await activeRenderer.render();

          // Explore contract: filters are always rendered for gradients/palettes.
          filtersControl = await createBlockFilterControl(
            container,
            VARIANTS.GRADIENTS,
            async (filters) => {
              filterInteractionSuppressUntil = Date.now() + 350;
              if (filters?.contentType === 'color-palettes') {
                await mountStripsMode();
                return;
              }
              block.classList.add(CSS_CLASSES.LOADING);
              allData = await activeDataService.filter(filters);
              visibleCount = Math.min(config.initialLoad, allData.length);
              await activeRenderer.update(allData.slice(0, visibleCount));
              updateLoadMoreState();
              block.classList.remove(CSS_CLASSES.LOADING);
            },
          );

          loadMoreControl = await createBlockLoadMoreControl(container, async () => {
            const nextTarget = Math.min(
              visibleCount + config.loadMoreIncrement,
              config.maxItems || Number.POSITIVE_INFINITY,
            );
            if (nextTarget > allData.length) {
              const moreData = await activeDataService.loadMore();
              if (Array.isArray(moreData)) {
                allData = moreData;
              }
            }
            visibleCount = Math.min(nextTarget, allData.length);
            await activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
          }, { iconSize: config.loadMoreIconSize || 'xl' });
          updateLoadMoreState();

          activeRenderer.on(EVENTS.GRADIENT_CLICK, async ({ gradient }) => {
            const item = gradient || {};
            const currentState = BlockMediator.get(stateKey);
            BlockMediator.set(stateKey, { ...currentState, selectedItem: item });
            await openModalForItem(item, 'Gradient');
          });

          publishInstances();
        } finally {
          isMounting = false;
        }
      };

      mountStripsMode = async () => {
        if (isMounting) return;
        isMounting = true;
        try {
          cleanupActiveView();
          activeMode = VARIANTS.STRIPS;
          activeDataService = palettesDataService;
          setModeClasses(VARIANTS.STRIPS);

          block.classList.add(CSS_CLASSES.LOADING);
          allData = await activeDataService.fetchData();
          visibleCount = Math.min(config.initialLoad, allData.length);
          block.classList.remove(CSS_CLASSES.LOADING);

          activeRenderer = createStripsRenderer({
            container,
            data: allData.slice(0, visibleCount),
            config: {
              ...config,
              variant: VARIANTS.STRIPS,
              renderGridVariant: 'summary',
            },
          });
          await activeRenderer.render?.(container);

          filtersControl = await createBlockFilterControl(
            container,
            VARIANTS.STRIPS,
            async (filters) => {
              filterInteractionSuppressUntil = Date.now() + 350;
              if (filters?.contentType === 'color-gradients') {
                await mountGradientsMode();
                return;
              }
              block.classList.add(CSS_CLASSES.LOADING);
              allData = await activeDataService.filter(filters);
              visibleCount = Math.min(config.initialLoad, allData.length);
              activeRenderer.update(allData.slice(0, visibleCount));
              updateLoadMoreState();
              block.classList.remove(CSS_CLASSES.LOADING);
            },
          );

          loadMoreControl = await createBlockLoadMoreControl(container, async () => {
            const nextTarget = Math.min(
              visibleCount + config.loadMoreIncrement,
              config.maxItems || Number.POSITIVE_INFINITY,
            );
            if (nextTarget > allData.length) {
              const moreData = await activeDataService.loadMore();
              if (Array.isArray(moreData)) {
                allData = moreData;
              }
            }
            visibleCount = Math.min(nextTarget, allData.length);
            activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
          }, { iconSize: config.loadMoreIconSize || 'xl' });
          updateLoadMoreState();

          activeRenderer.on(EVENTS.PALETTE_CLICK, async (palette) => {
            await modalManager.openPaletteSwatchesModal(palette || {});
          });
          activeRenderer.on(EVENTS.SHARE, async ({ palette }) => {
            await modalManager.openPaletteSwatchesModal(palette || {});
          });

          activeRenderer.on(EVENTS.SEARCH, async ({ query }) => {
            block.classList.add(CSS_CLASSES.LOADING);
            allData = await activeDataService.search(query);
            visibleCount = Math.min(config.initialLoad, allData.length);
            activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
            block.classList.remove(CSS_CLASSES.LOADING);
          });

          floatingSearchHandler = async (e) => {
            const { query } = e.detail;
            block.classList.add(CSS_CLASSES.LOADING);
            allData = await activeDataService.search(query);
            visibleCount = Math.min(config.initialLoad, allData.length);
            activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
            block.classList.remove(CSS_CLASSES.LOADING);
          };
          document.addEventListener('floating-search:submit', floatingSearchHandler);

          publishInstances();
        } finally {
          isMounting = false;
        }
      };

      if (activeMode === VARIANTS.GRADIENTS) {
        await mountGradientsMode();
      } else {
        await mountStripsMode();
      }
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
      let allData = await dataService.fetchData();
      let visibleCount = Math.min(config.initialLoad, allData.length);
      block.classList.remove(CSS_CLASSES.LOADING);

      let renderer;
      if (isSwatchesMode(config)) {
        renderer = createSwatchesRenderer({ container, data: allData, config });
      } else {
        renderer = createStripsRenderer({
          container,
          data: allData.slice(0, visibleCount),
          config,
        });
      }
      await renderer.render?.(container);
      const loadMoreControl = !isSwatchesMode(config)
        ? await createBlockLoadMoreControl(container, async () => {
          const nextTarget = Math.min(
            visibleCount + config.loadMoreIncrement,
            config.maxItems || Number.POSITIVE_INFINITY,
          );
          if (nextTarget > allData.length) {
            const moreData = await dataService.loadMore();
            if (Array.isArray(moreData)) {
              allData = moreData;
            }
          }
          visibleCount = Math.min(nextTarget, allData.length);
          renderer.update(allData.slice(0, visibleCount));
          loadMoreControl.update(Math.max(0, allData.length - visibleCount));
        }, { iconSize: config.loadMoreIconSize || 'xl' })
        : null;
      loadMoreControl?.update(Math.max(0, allData.length - visibleCount));

      const modalManager = createModalManager();

      renderer.on(EVENTS.PALETTE_CLICK, async (palette) => {
        await modalManager.openPaletteSwatchesModal(palette || {});
      });
      renderer.on(EVENTS.SHARE, async ({ palette }) => {
        await modalManager.openPaletteSwatchesModal(palette || {});
      });

      renderer.on(EVENTS.SEARCH, async ({ query }) => {
        block.classList.add(CSS_CLASSES.LOADING);
        allData = await dataService.search(query);
        visibleCount = Math.min(config.initialLoad, allData.length);
        renderer.update(isSwatchesMode(config) ? allData : allData.slice(0, visibleCount));
        loadMoreControl?.update(Math.max(0, allData.length - visibleCount));
        block.classList.remove(CSS_CLASSES.LOADING);
      });

      renderer.on(EVENTS.FILTER, async (filters) => {
        block.classList.add(CSS_CLASSES.LOADING);
        allData = await dataService.filter(filters);
        visibleCount = Math.min(config.initialLoad, allData.length);
        renderer.update(isSwatchesMode(config) ? allData : allData.slice(0, visibleCount));
        loadMoreControl?.update(Math.max(0, allData.length - visibleCount));
        block.classList.remove(CSS_CLASSES.LOADING);
      });

      const floatingHandler = async (e) => {
        const { query } = e.detail;
        block.classList.add(CSS_CLASSES.LOADING);
        allData = await dataService.search(query);
        visibleCount = Math.min(config.initialLoad, allData.length);
        renderer.update(isSwatchesMode(config) ? allData : allData.slice(0, visibleCount));
        loadMoreControl?.update(Math.max(0, allData.length - visibleCount));
        block.classList.remove(CSS_CLASSES.LOADING);
      };
      document.addEventListener('floating-search:submit', floatingHandler);
      block.addEventListener('block-unload', () => document.removeEventListener('floating-search:submit', floatingHandler), { once: true });

      block.rendererInstance = renderer;
      block.modalManagerInstance = modalManager;
      block.dataServiceInstance = dataService;
    }

    block.dataset.blockStatus = 'loaded';
  } catch (error) {
    window.lana?.log(`[ColorExplore] ❌ Error: ${error}`, { tags: 'color-explore', severity: 'error' });
    block.classList.add(CSS_CLASSES.ERROR);
    block.dataset.blockStatus = '';
    const errMsg = document.createElement('p');
    errMsg.textContent = `Failed to load Color Explore: ${error.message}`;
    block.appendChild(errMsg);
    block.setAttribute('data-failed', 'true');
  }
}
