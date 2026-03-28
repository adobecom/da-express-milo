import { parseBlockConfig } from './helpers/parseConfig.js';
import { createColorRenderer } from './factory/createColorRenderer.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';
import { createSwatchesRenderer } from '../../scripts/color-shared/renderers/createSwatchesRenderer.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';
import { createGradientPickerRebuildContent, loadGradientPickerRebuildStyles } from '../../scripts/color-shared/modal/createGradientPickerRebuildContent.js';
import { createColorDataService as createSharedColorDataService } from '../../scripts/color-shared/services/createColorDataService.js';
import { createFiltersComponent } from '../../scripts/color-shared/components/createFiltersComponent.js';
import { loadComponentStyles } from '../../scripts/color-shared/utils/loadComponentStyles.js';
import { createLoadingScreenComponent } from '../../scripts/color-shared/components/createLoadingScreenComponent.js';
import { loadIconsRail } from '../../scripts/color-shared/spectrum/load-spectrum.js';
import { createColorPaletteParamApi, normalizeHex } from '../../scripts/color-shared/utils/utilities.js';

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
  loadingScreenDemo: false,
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
const PALETTE_EDITOR_DEFAULT_URL = '/color-wheel';
const PALETTE_EDITOR_DEMO_HOST = 'methomas-sidebar-with-fixes--da-express-milo--adobecom.aem.live';
const PALETTE_EDITOR_DEMO_URL = 'https://methomas-sidebar-with-fixes--da-express-milo--adobecom.aem.live/drafts/methomas/color/color-palette-sidebar';
const colorPaletteParamApi = createColorPaletteParamApi();

const STRIP_SHARED_STYLES = [
  '../../scripts/color-shared/components/strips/color-strip.css',
  '../../scripts/color-shared/components/gradients/gradient-strip.css',
];
const LOAD_MORE_CLICK_HANDLERS = new WeakMap();
const LOADING_DEMO_QUERY_PARAM = 'colorExploreLoadingDemo';

async function loadStripSharedStyles() {
  await Promise.all(
    STRIP_SHARED_STYLES.map(async (href) => {
      try {
        await loadComponentStyles(href, import.meta.url);
      } catch (error) {
        window.lana?.log(`[ColorExplore] Failed loading shared style ${href}: ${error?.message}`, {
          tags: 'color-explore,css',
          severity: 'error',
        });
      }
    }),
  );
}

function isLoadingDemoMode(config = {}) {
  if (config?.loadingScreenDemo === true) return true;
  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search || '');
    const value = (params.get(LOADING_DEMO_QUERY_PARAM) || '').trim().toLowerCase();
    return value === '1' || value === 'true';
  } catch {
    return false;
  }
}

function normalizeLoadingDemoVariant(variant) {
  return variant === VARIANTS.GRADIENTS ? VARIANTS.GRADIENTS : VARIANTS.STRIPS;
}

export function mountLoadingScreenDemo(container, options = {}) {
  if (!container || typeof container.replaceChildren !== 'function') {
    return {
      ready: Promise.resolve(),
      destroy() {},
    };
  }

  const countCandidate = Number(options.cardCount ?? options.initialLoad);
  const cardCount = Number.isFinite(countCandidate) && countCandidate > 0
    ? Math.floor(countCandidate)
    : DEFAULTS.initialLoad;

  const loading = createLoadingScreenComponent({
    variant: normalizeLoadingDemoVariant(options.variant),
    cardCount,
  });

  container.replaceChildren(loading.element);
  const ready = loading.show();

  return {
    ready,
    destroy() {
      loading.hide?.();
      if (loading.element?.parentElement === container) {
        container.replaceChildren();
      }
    },
  };
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

function resolvePaletteEditorBaseUrl(currentUrl) {
  if (currentUrl?.hostname === PALETTE_EDITOR_DEMO_HOST) {
    return PALETTE_EDITOR_DEMO_URL;
  }
  return PALETTE_EDITOR_DEFAULT_URL;
}

function resolvePaletteHexesForUrl(paletteData = {}) {
  const fromColors = Array.isArray(paletteData?.colors) ? paletteData.colors : [];
  const fromCoreColors = Array.isArray(paletteData?.coreColors) ? paletteData.coreColors : [];
  const fromSwatches = Array.isArray(paletteData?.swatches) ? paletteData.swatches : [];

  let source = fromSwatches;
  if (fromColors.length) {
    source = fromColors;
  } else if (fromCoreColors.length) {
    source = fromCoreColors;
  }

  return source.flatMap((entry) => {
    let candidate = '';
    if (typeof entry === 'string') {
      candidate = entry;
    } else if (entry && typeof entry === 'object') {
      candidate = entry.hex || entry.color || entry.value || '';
    }

    return String(candidate)
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => normalizeHex(segment))
      .filter(Boolean);
  });
}

function buildPaletteEditorUrl(palette, sourceHref) {
  const paletteData = palette || {};
  const fallbackHref = sourceHref
    || (typeof window !== 'undefined' ? window.location.href : PALETTE_EDITOR_DEFAULT_URL);
  let currentUrl;
  try {
    currentUrl = new URL(fallbackHref);
  } catch {
    return PALETTE_EDITOR_DEFAULT_URL;
  }

  const baseUrl = resolvePaletteEditorBaseUrl(currentUrl);
  let targetUrl;
  try {
    targetUrl = new URL(baseUrl, currentUrl);
  } catch {
    targetUrl = new URL(PALETTE_EDITOR_DEFAULT_URL, currentUrl);
  }

  const paletteColors = resolvePaletteHexesForUrl(paletteData);
  colorPaletteParamApi.setOnUrl(targetUrl, paletteColors);

  if (!targetUrl.searchParams.has('martech') && currentUrl.searchParams.has('martech')) {
    targetUrl.searchParams.set('martech', currentUrl.searchParams.get('martech'));
  }

  return targetUrl.toString();
}

function navigateToPaletteEditor(palette = {}) {
  if (typeof window === 'undefined') return;
  const destination = buildPaletteEditorUrl(palette);
  window.location.assign(destination);
}

function mergeLoadMoreData(currentData, moreData) {
  if (!Array.isArray(moreData) || moreData.length === 0) {
    return currentData;
  }
  if (!Array.isArray(currentData) || currentData.length === 0) {
    return moreData;
  }
  if (moreData.length >= currentData.length) {
    return moreData;
  }

  const knownIds = new Set(
    currentData
      .map((item) => item?.id)
      .filter(Boolean),
  );
  const delta = moreData.filter((item) => {
    const id = item?.id;
    if (!id || knownIds.has(id)) return false;
    knownIds.add(id);
    return true;
  });

  return delta.length > 0 ? [...currentData, ...delta] : currentData;
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

    button.append(icon, text);
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

    if (isLoadingDemoMode(config)) {
      const loadingDemo = mountLoadingScreenDemo(container, {
        variant: config.variant,
        cardCount: config.initialLoad,
      });
      block.addEventListener('block-unload', () => loadingDemo.destroy(), { once: true });
      await loadingDemo.ready;
      block.dataset.blockStatus = 'loaded';
      return;
    }

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

      const cleanupDualMode = () => {
        cleanupActiveView();
        modalManager.destroy?.();
        block.rendererInstance = null;
        block.modalManagerInstance = null;
        block.dataServiceInstance = null;
        block.filtersControlInstance = null;
      };

      block.addEventListener('block-unload', cleanupDualMode, { once: true });

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
          try {
            allData = await activeDataService.fetchData();
          } finally {
            block.classList.remove(CSS_CLASSES.LOADING);
          }
          visibleCount = Math.min(config.initialLoad, allData.length);

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
            const nextTarget = visibleCount + Math.max(1, Number(config.loadMoreIncrement) || 10);
            if (nextTarget > allData.length) {
              const moreData = await activeDataService.loadMore();
              allData = mergeLoadMoreData(allData, moreData);
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

          floatingSearchHandler = async (e) => {
            const { query } = e.detail;
            block.classList.add(CSS_CLASSES.LOADING);
            allData = await activeDataService.search(query);
            visibleCount = Math.min(config.initialLoad, allData.length);
            await activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
            block.classList.remove(CSS_CLASSES.LOADING);
          };
          document.addEventListener('floating-search:submit', floatingSearchHandler);

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
          try {
            allData = await activeDataService.fetchData();
          } finally {
            block.classList.remove(CSS_CLASSES.LOADING);
          }
          visibleCount = Math.min(config.initialLoad, allData.length);

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
            const nextTarget = visibleCount + Math.max(1, Number(config.loadMoreIncrement) || 10);
            if (nextTarget > allData.length) {
              const moreData = await activeDataService.loadMore();
              allData = mergeLoadMoreData(allData, moreData);
            }
            visibleCount = Math.min(nextTarget, allData.length);
            activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
          }, { iconSize: config.loadMoreIconSize || 'xl' });
          updateLoadMoreState();

          activeRenderer.on(EVENTS.PALETTE_CLICK, (palette) => {
            navigateToPaletteEditor(palette || {});
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
          const nextTarget = visibleCount + Math.max(1, Number(config.loadMoreIncrement) || 10);
          if (nextTarget > allData.length) {
            const moreData = await dataService.loadMore();
            allData = mergeLoadMoreData(allData, moreData);
          }
          visibleCount = Math.min(nextTarget, allData.length);
          renderer.update(allData.slice(0, visibleCount));
          loadMoreControl.update(Math.max(0, allData.length - visibleCount));
        }, { iconSize: config.loadMoreIconSize || 'xl' })
        : null;
      loadMoreControl?.update(Math.max(0, allData.length - visibleCount));

      const modalManager = createModalManager();

      renderer.on(EVENTS.PALETTE_CLICK, (palette) => {
        navigateToPaletteEditor(palette || {});
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
