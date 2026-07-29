import { getLibs } from '../../scripts/utils.js';
import { trackColorBlockLoad } from '../../scripts/instrument.js';
import { parseBlockConfig } from './helpers/parseConfig.js';
import { createColorRenderer } from './factory/createColorRenderer.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';
import { createSwatchesRenderer } from '../../scripts/color-shared/renderers/createSwatchesRenderer.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';
import { createGradientModalContent, ensureGradientModalContentStyles } from '../../scripts/color-shared/modal/createGradientModalContent.js';
import { createColorDataService as createSharedColorDataService } from '../../scripts/color-shared/services/createColorDataService.js';
import { buildPaletteEditUrl, decorateAnalyticsAttributes } from '../../scripts/color-shared/utils/utilities.js';
import { createFiltersComponent } from '../../scripts/color-shared/components/createFiltersComponent.js';
import { createLoadingScreenComponent } from '../../scripts/color-shared/components/createLoadingScreenComponent.js';
import loadMiloStyle from '../../scripts/color-shared/utils/loadMiloStyle.js';
import { loadIconsRail } from '../../scripts/color-shared/spectrum/load-spectrum.js';
import loadColorExplorePlaceholders from '../../scripts/color-shared/i18n/loadColorExplorePlaceholders.js';
import loadColorSwatchRailPlaceholders from '../../scripts/color-shared/i18n/loadColorSwatchRailPlaceholders.js';
import loadColorFiltersPlaceholders from '../../scripts/color-shared/i18n/loadColorFiltersPlaceholders.js';
import loadColorModalPlaceholders from '../../scripts/color-shared/i18n/loadColorModalPlaceholders.js';

const VARIANTS = { STRIPS: 'strips', GRADIENTS: 'gradients' };
const VARIANT_CLASSES = { GRADIENTS: 'gradients', PALETTES: 'palettes' };
const THEME_URL_PARAM = 'theme';
const ITEM_ID_URL_PARAM = 'id';
const PENDING_GRADIENT_SESSION_KEY = 'color-explore-pending-gradient-id';
const THEME_URL_QUERY_VALUE = {
  [VARIANTS.GRADIENTS]: 'color-gradients',
  [VARIANTS.STRIPS]: 'color-palettes',
};
const DEFAULTS = {
  variant: VARIANTS.STRIPS,
  initialLoad: 24,
  loadMoreIncrement: 12,
  maxItems: 100,
  enableFilters: true,
  enableSearch: true,
  apiEndpoint: '',
  swatchVerticalMaxPerRow: 10,
};
const CSS_CLASSES = { BLOCK: 'color-explore', CONTAINER: 'color-explore-container', LOADING: 'is-loading', ERROR: 'has-error' };
const EVENTS = {
  PALETTE_CLICK: 'palette-click',
  PALETTE_EDIT: 'palette-edit',
  GRADIENT_CLICK: 'gradient-click',
  SHARE: 'share',
  SEARCH: 'search',
  FILTER: 'filter',
  LOAD_MORE: 'load-more',
};

const STRIP_SHARED_STYLES = [
  'scripts/color-shared/components/strips/color-strip.css',
  'scripts/color-shared/components/gradients/gradient-strip.css',
];
const LOAD_MORE_CLICK_HANDLERS = new WeakMap();

const GRID_BREAKPOINTS = [
  { minWidth: 1200, columns: 3 },
  { minWidth: 680, columns: 2 },
];

function getGridColumnCount() {
  if (typeof window === 'undefined') return 1;
  const width = window.innerWidth;
  for (const bp of GRID_BREAKPOINTS) {
    if (width >= bp.minWidth) return bp.columns;
  }
  return 1;
}

function alignToFullRow(count, totalAvailable) {
  if (totalAvailable <= count) return count;
  const cols = getGridColumnCount();
  if (cols <= 1) return count;
  const aligned = Math.floor(count / cols) * cols;
  return aligned > 0 ? aligned : count;
}

async function loadStripSharedStyles() {
  await Promise.all(
    STRIP_SHARED_STYLES.map(async (href) => {
      try {
        await loadMiloStyle(href);
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

function getVariantFromThemeUrlParam() {
  if (typeof window === 'undefined') return null;
  const t = new URLSearchParams(window.location.search).get(THEME_URL_PARAM);
  if (t === THEME_URL_QUERY_VALUE[VARIANTS.GRADIENTS]) return VARIANTS.GRADIENTS;
  if (t === THEME_URL_QUERY_VALUE[VARIANTS.STRIPS]) return VARIANTS.STRIPS;
  return null;
}

function syncColorExploreThemeUrl(variant) {
  if (typeof window === 'undefined') return;
  const value = THEME_URL_QUERY_VALUE[variant];
  if (!value) return;
  const url = new URL(window.location.href);
  url.searchParams.set(THEME_URL_PARAM, value);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

function isSwatchesMode(config) {
  return config?.swatchesOnly === true
    || config?.contentMode === 'swatches'
    || config?.renderMode === 'swatches';
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
  const { iconSize = 'xl', strings } = options;
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
      text.textContent = strings?.loadMore ?? 'Load more';
      button.setAttribute('aria-label', strings?.loadMoreAria ?? 'Load more gradients');
      decorateAnalyticsAttributes(button, { linkLabel: strings?.loadMore ?? 'Load more' });
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

async function createBlockFilterControl(container, variant, onFilterChange, strings) {
  const filters = await createFiltersComponent({
    variant,
    onFilterChange,
    ...(strings ? { strings } : {}),
  });

  if (!(filters?.element instanceof Node)) return null;
  filters.element.setAttribute('data-owner', 'color-explore-filters');

  return {
    element: filters.element,
    async attachToHeader() {
      const header = container.querySelector('.explore-header, .gradients-header');
      if (!header) return false;
      header.querySelectorAll(':scope > .filters-container').forEach((node) => {
        if (node !== filters.element) node.remove();
      });
      if (filters.element.parentElement !== header) header.appendChild(filters.element);
      try {
        await filters.waitForReady?.();
      } catch (error) {
        window.lana?.log(`[ColorExplore] Filters waitForReady failed: ${error?.message}`, {
          tags: 'color-explore,filters',
          severity: 'warning',
        });
      }
      return true;
    },
    destroy() {
      filters.reset?.();
      filters.element?.remove?.();
    },
  };
}

export default async function decorate(block) {
  if (block.dataset.blockStatus === 'loaded' || block.dataset.blockStatus === 'loading') return;

  try {
    const variantFromClass = getVariantFromBlock(block);
    const rows = [...block.children];
    const config = parseBlockConfig(rows, DEFAULTS);
    config.variant = getVariantFromThemeUrlParam() ?? variantFromClass ?? config.variant;

    block.dataset.blockStatus = 'loading';
    const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
    const { locale } = getConfig();
    const colorWheelPath = `${locale.contentRoot}/create/color-wheel`;
    const placeholdersPromise = loadColorExplorePlaceholders();
    const colorSwatchRailStringsPromise = loadColorSwatchRailPlaceholders();
    const colorFiltersStringsPromise = loadColorFiltersPlaceholders();
    const colorModalStringsPromise = loadColorModalPlaceholders();
    block.replaceChildren();
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

    const isGradients = config.variant === VARIANTS.GRADIENTS;
    const showLoadingSkeleton = () => {
      const header = document.createElement('div');
      header.className = 'explore-header';
      const titleEl = document.createElement(isGradients ? 'h2' : 'span');
      titleEl.className = isGradients ? 'gradients-title' : 'results-count';
      titleEl.textContent = '\u00a0';
      header.appendChild(titleEl);
      const section = document.createElement('section');
      section.className = 'explore-main-section';
      const loadingScreen = createLoadingScreenComponent({
        variant: isGradients ? 'gradients' : 'strips',
        cardCount: 6,
      });
      section.appendChild(loadingScreen.element);
      loadingScreen.show();
      container.replaceChildren(header, section);
    };
    showLoadingSkeleton();
    const [placeholders] = await Promise.all([placeholdersPromise, loadStripSharedStyles()]);

    if (config.variant === VARIANTS.GRADIENTS || config.variant === VARIANTS.STRIPS) {
      const gradientsDataService = createSharedColorDataService({
        variant: VARIANTS.GRADIENTS,
        initialLoad: config.initialLoad,
        maxItems: config.maxItems,
        apiEndpoint: config.apiEndpoint,
      });
      const palettesDataService = createSharedColorDataService({
        variant: 'palettes',
        initialLoad: config.initialLoad,
        maxItems: config.maxItems,
        apiEndpoint: config.apiEndpoint,
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
      let isSearchActive = false;
      let currentColumnCount = getGridColumnCount();
      let hasCompletedInitialModeMount = false;

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

      const gridResizeObserver = new ResizeObserver(() => {
        const newCols = getGridColumnCount();
        if (newCols === currentColumnCount || isMounting) return;
        currentColumnCount = newCols;
        const aligned = alignToFullRow(visibleCount, allData.length);
        if (aligned !== visibleCount) {
          visibleCount = aligned;
          activeRenderer?.update(allData.slice(0, visibleCount));
          updateLoadMoreState();
        }
      });
      gridResizeObserver.observe(container);

      const cleanupActiveView = () => {
        filtersControl?.destroy?.();
        filtersControl = null;
        loadMoreControl?.destroy?.();
        loadMoreControl = null;
        activeRenderer?.destroy?.();
        activeRenderer = null;
        isSearchActive = false;
        container.classList.remove('color-explorer-strips');
        if (floatingSearchHandler) {
          document.removeEventListener('floating-search:submit', floatingSearchHandler);
          floatingSearchHandler = null;
        }
      };

      const cleanupDualMode = () => {
        gridResizeObserver.disconnect();
        cleanupActiveView();
        modalManager.destroy?.();
        block.rendererInstance = null;
        block.modalManagerInstance = null;
        block.dataServiceInstance = null;
        block.filtersControlInstance = null;
      };

      block.addEventListener('block-unload', cleanupDualMode, { once: true });

      const openModalForItem = async (item, fallbackTitle) => {
        await ensureGradientModalContentStyles();
        const content = item || {};
        modalManager.open({
          title: content.name || fallbackTitle,
          showTitle: false,
          content: async () => {
            const modalStrings = await colorModalStringsPromise;
            return createGradientModalContent(content, {
              likesCount: content.likes ?? content.likesCount ?? 0,
              liked: content.liked ?? false,
              creatorName: content.creator?.name ?? '',
              creatorImageUrl: content.creator?.imageUrl ?? content.creatorImageUrl,
              tags: item.tags ?? [],
              onLikeToggle: async ({ id, liked }) => activeDataService.toggleLike({ id, liked }),
              strings: modalStrings,
            });
          },
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
          if (hasCompletedInitialModeMount) syncColorExploreThemeUrl(VARIANTS.GRADIENTS);
          block.dispatchEvent(new CustomEvent('color-explore:mode-change', { detail: { mode: VARIANTS.GRADIENTS }, bubbles: true }));

          let gradientFilterHandler = null;
          filtersControl = await createBlockFilterControl(
            container,
            VARIANTS.GRADIENTS,
            (filters) => gradientFilterHandler?.(filters),
            await colorFiltersStringsPromise,
          );

          const urlQuery = new URLSearchParams(window.location.search).get('q');
          if (urlQuery) {
            const searchResults = await activeDataService.search(urlQuery);
            if (searchResults.length > 0) {
              allData = searchResults;
              isSearchActive = true;
            } else {
              allData = await activeDataService.fetchData();
            }
          } else {
            allData = await activeDataService.fetchData();
          }
          if (!isSearchActive) {
            allData = activeDataService.filter({ sort: 'most-popular' });
          }
          visibleCount = alignToFullRow(
            Math.min(config.initialLoad, allData.length),
            allData.length,
          );

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
            placeholders,
          });

          await activeRenderer.render();

          await filtersControl?.attachToHeader?.();

          // Explore contract: filters are always rendered for gradients/palettes.
          gradientFilterHandler = async (filters) => {
            filterInteractionSuppressUntil = Date.now() + 350;
            isSearchActive = false;
            if (filters?.contentType === 'color-palettes') {
              await mountStripsMode();
              return;
            }
            block.classList.add(CSS_CLASSES.LOADING);
            allData = await activeDataService.filter(filters);
            visibleCount = alignToFullRow(
              Math.min(config.initialLoad, allData.length),
              allData.length,
            );
            await activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
            block.classList.remove(CSS_CLASSES.LOADING);
          };

          loadMoreControl = await createBlockLoadMoreControl(container, async () => {
            const nextTarget = visibleCount + Math.max(1, Number(config.loadMoreIncrement) || 10);
            if (nextTarget > allData.length) {
              const moreData = isSearchActive
                ? await activeDataService.searchMore()
                : await activeDataService.loadMore();
              allData = mergeLoadMoreData(allData, moreData);
            }
            visibleCount = alignToFullRow(Math.min(nextTarget, allData.length), allData.length);
            await activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
          }, { iconSize: config.loadMoreIconSize || 'xl', strings: placeholders });
          updateLoadMoreState();

          activeRenderer.on(EVENTS.GRADIENT_CLICK, async ({ gradient }) => {
            const item = gradient || {};
            const currentState = BlockMediator.get(stateKey);
            BlockMediator.set(stateKey, { ...currentState, selectedItem: item });
            if (item.id) {
              try {
                sessionStorage.setItem(PENDING_GRADIENT_SESSION_KEY, String(item.id));
              } catch { /* sessionStorage unavailable */ }
            }
            await openModalForItem(item, placeholders.modalDefaultGradientTitle);
          });

          floatingSearchHandler = async (e) => {
            const { query } = e.detail;
            block.classList.add(CSS_CLASSES.LOADING);
            if (!query) {
              isSearchActive = false;
              allData = await activeDataService.fetchData();
              document.dispatchEvent(new CustomEvent('color-explore:results-found', { bubbles: true }));
            } else {
              const searchResults = await activeDataService.search(query);
              if (searchResults.length === 0) {
                isSearchActive = false;
                allData = await activeDataService.fetchData();
                document.dispatchEvent(new CustomEvent('color-explore:empty-result', { detail: { query }, bubbles: true }));
              } else {
                isSearchActive = true;
                allData = searchResults;
                document.dispatchEvent(new CustomEvent('color-explore:results-found', { bubbles: true }));
              }
            }
            visibleCount = alignToFullRow(
              Math.min(config.initialLoad, allData.length),
              allData.length,
            );
            await activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
            block.classList.remove(CSS_CLASSES.LOADING);
          };
          document.addEventListener('floating-search:submit', floatingSearchHandler);

          if (urlQuery && !isSearchActive) {
            document.dispatchEvent(new CustomEvent('color-explore:empty-result', { detail: { query: urlQuery }, bubbles: true }));
          } else if (urlQuery) {
            document.dispatchEvent(new CustomEvent('color-explore:results-found', { bubbles: true }));
          }

          const isInitialGradientMount = !hasCompletedInitialModeMount;
          if (!hasCompletedInitialModeMount) hasCompletedInitialModeMount = true;
          if (isInitialGradientMount) {
            const searchParams = new URLSearchParams(window.location.search);
            let itemId = searchParams.get(ITEM_ID_URL_PARAM);
            if (!itemId && searchParams.has('url')) {
              // susi-light appends a `url` tracking param on sign-in redirect;
              // use it as a signal that we're returning from sign-in and should
              // restore the gradient the user was trying to save.
              itemId = sessionStorage.getItem(PENDING_GRADIENT_SESSION_KEY) || null;
            }
            try {
              sessionStorage.removeItem(PENDING_GRADIENT_SESSION_KEY);
            } catch { /* sessionStorage unavailable */ }
            if (itemId) {
              const url = new URL(window.location.href);
              url.searchParams.delete(ITEM_ID_URL_PARAM);
              window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
              const item = allData.find((g) => String(g.id) === String(itemId))
                ?? await activeDataService.getTheme(itemId);
              if (item) {
                await openModalForItem(item, placeholders.modalDefaultGradientTitle);
              }
            }
          }
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
          if (hasCompletedInitialModeMount) syncColorExploreThemeUrl(VARIANTS.STRIPS);
          block.dispatchEvent(new CustomEvent('color-explore:mode-change', { detail: { mode: VARIANTS.STRIPS }, bubbles: true }));

          let stripsFilterHandler = null;
          filtersControl = await createBlockFilterControl(
            container,
            VARIANTS.STRIPS,
            (filters) => stripsFilterHandler?.(filters),
            await colorFiltersStringsPromise,
          );

          const urlQuery = new URLSearchParams(window.location.search).get('q');
          if (urlQuery) {
            const searchResults = await activeDataService.search(urlQuery);
            if (searchResults.length > 0) {
              allData = searchResults;
              isSearchActive = true;
            } else {
              allData = await activeDataService.fetchData();
            }
          } else {
            allData = await activeDataService.fetchData();
          }
          if (!isSearchActive) {
            allData = activeDataService.filter({ sort: 'most-popular' });
          }
          const alignedCount = Math.min(config.initialLoad, allData.length);
          visibleCount = alignToFullRow(alignedCount, allData.length);

          activeRenderer = createStripsRenderer({
            container,
            data: allData.slice(0, visibleCount),
            strings: await colorFiltersStringsPromise,
            paletteCardStrings: await placeholdersPromise,
            config: {
              ...config,
              variant: VARIANTS.STRIPS,
              renderGridVariant: 'summary',
              initialActivationSuppressUntil: filterInteractionSuppressUntil,
            },
          });
          await activeRenderer.render?.(container);

          await filtersControl?.attachToHeader?.();

          stripsFilterHandler = async (filters) => {
            filterInteractionSuppressUntil = Date.now() + 350;
            isSearchActive = false;
            if (filters?.contentType === 'color-gradients') {
              await mountGradientsMode();
              return;
            }
            block.classList.add(CSS_CLASSES.LOADING);
            allData = await activeDataService.filter(filters);
            visibleCount = alignToFullRow(
              Math.min(config.initialLoad, allData.length),
              allData.length,
            );
            activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
            block.classList.remove(CSS_CLASSES.LOADING);
          };

          loadMoreControl = await createBlockLoadMoreControl(container, async () => {
            const nextTarget = visibleCount + Math.max(1, Number(config.loadMoreIncrement) || 10);
            if (nextTarget > allData.length) {
              const moreData = isSearchActive
                ? await activeDataService.searchMore()
                : await activeDataService.loadMore();
              allData = mergeLoadMoreData(allData, moreData);
            }
            visibleCount = alignToFullRow(Math.min(nextTarget, allData.length), allData.length);
            activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
          }, { iconSize: config.loadMoreIconSize || 'xl', strings: placeholders });
          updateLoadMoreState();

          activeRenderer.on(EVENTS.PALETTE_CLICK, async (palette) => {
            await modalManager.openPaletteSwatchesModal(
              palette || {},
              {
                verticalMaxPerRow: config.swatchVerticalMaxPerRow,
                onLikeToggle: async ({ id, liked }) => activeDataService.toggleLike({ id, liked }),
                modalStrings: await colorModalStringsPromise,
                colorSwatchRailStrings: await colorSwatchRailStringsPromise,
              },
            );
          });
          activeRenderer.on(EVENTS.PALETTE_EDIT, (palette) => {
            const colors = palette?.colors || [];
            const name = palette?.name || '';
            const editUrl = buildPaletteEditUrl(colorWheelPath, colors, name);
            window.location.href = editUrl;
          });
          activeRenderer.on(EVENTS.SHARE, async ({ palette }) => {
            await modalManager.openPaletteSwatchesModal(
              palette || {},
              {
                verticalMaxPerRow: config.swatchVerticalMaxPerRow,
                onLikeToggle: async ({ id, liked }) => activeDataService.toggleLike({ id, liked }),
                modalStrings: await colorModalStringsPromise,
                colorSwatchRailStrings: await colorSwatchRailStringsPromise,
              },
            );
          });

          activeRenderer.on(EVENTS.SEARCH, async ({ query }) => {
            isSearchActive = !!query;
            block.classList.add(CSS_CLASSES.LOADING);
            allData = await activeDataService.search(query);
            visibleCount = alignToFullRow(
              Math.min(config.initialLoad, allData.length),
              allData.length,
            );
            activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
            block.classList.remove(CSS_CLASSES.LOADING);
          });

          floatingSearchHandler = async (e) => {
            const { query } = e.detail;
            block.classList.add(CSS_CLASSES.LOADING);
            if (!query) {
              isSearchActive = false;
              allData = await activeDataService.fetchData();
              document.dispatchEvent(new CustomEvent('color-explore:results-found', { bubbles: true }));
            } else {
              const searchResults = await activeDataService.search(query);
              if (searchResults.length === 0) {
                isSearchActive = false;
                allData = await activeDataService.fetchData();
                document.dispatchEvent(new CustomEvent('color-explore:empty-result', { detail: { query }, bubbles: true }));
              } else {
                isSearchActive = true;
                allData = searchResults;
                document.dispatchEvent(new CustomEvent('color-explore:results-found', { bubbles: true }));
              }
            }
            visibleCount = alignToFullRow(
              Math.min(config.initialLoad, allData.length),
              allData.length,
            );
            activeRenderer.update(allData.slice(0, visibleCount));
            updateLoadMoreState();
            block.classList.remove(CSS_CLASSES.LOADING);
          };
          document.addEventListener('floating-search:submit', floatingSearchHandler);

          if (urlQuery && !isSearchActive) {
            document.dispatchEvent(new CustomEvent('color-explore:empty-result', { detail: { query: urlQuery }, bubbles: true }));
          } else if (urlQuery) {
            document.dispatchEvent(new CustomEvent('color-explore:results-found', { bubbles: true }));
          }

          const isInitialStripsMount = !hasCompletedInitialModeMount;
          if (!hasCompletedInitialModeMount) hasCompletedInitialModeMount = true;
          if (isInitialStripsMount) {
            const itemId = new URLSearchParams(window.location.search).get(ITEM_ID_URL_PARAM);
            if (itemId) {
              const url = new URL(window.location.href);
              url.searchParams.delete(ITEM_ID_URL_PARAM);
              window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
              const item = await activeDataService.getTheme(itemId);
              if (item) {
                await modalManager.openPaletteSwatchesModal(item, {
                  verticalMaxPerRow: config.swatchVerticalMaxPerRow,
                  onLikeToggle: async ({ id, liked }) => (
                    activeDataService.toggleLike({ id, liked })
                  ),
                  modalStrings: await colorModalStringsPromise,
                  colorSwatchRailStrings: await colorSwatchRailStringsPromise,
                  initialFocusSelector: () => null,
                });
              }
            }
          }
          publishInstances();
        } finally {
          isMounting = false;
        }
      };

      const mountFn = activeMode === VARIANTS.GRADIENTS ? mountGradientsMode : mountStripsMode;
      mountFn()
        .then(() => {
          block.dataset.blockStatus = 'loaded';
        })
        .catch((err) => {
          window.lana?.log(`[ColorExplore] Mount error: ${err?.message}`, { tags: 'color-explore', severity: 'error' });
          block.dataset.blockStatus = '';
        });
    } else {
      const dataService = createSharedColorDataService({
        variant: config.variant,
        initialLoad: config.initialLoad,
        maxItems: config.maxItems,
        apiEndpoint: config.apiEndpoint,
      });

      (async () => {
        const urlQuery = new URLSearchParams(window.location.search).get('q');
        let isSearchActive = false;
        let allData;
        if (urlQuery) {
          const searchResults = await dataService.search(urlQuery);
          if (searchResults.length > 0) {
            allData = searchResults;
            isSearchActive = true;
          } else {
            allData = await dataService.fetchData();
          }
        } else {
          allData = await dataService.fetchData();
        }
        const alignedCount = Math.min(config.initialLoad, allData.length);
        let visibleCount = alignToFullRow(alignedCount, allData.length);

        let renderer;
        if (isSwatchesMode(config)) {
          const colorSwatchRailStrings = await colorSwatchRailStringsPromise;
          renderer = createSwatchesRenderer({
            container,
            data: allData,
            config: { ...config, colorSwatchRailStrings },
          });
        } else {
          renderer = createStripsRenderer({
            container,
            data: allData.slice(0, visibleCount),
            strings: await colorFiltersStringsPromise,
            paletteCardStrings: await placeholdersPromise,
            config,
          });
        }
        if (renderer.render) renderer.render(container);
        const loadMoreControl = !isSwatchesMode(config)
          ? await createBlockLoadMoreControl(container, async () => {
            const nextTarget = visibleCount + Math.max(1, Number(config.loadMoreIncrement) || 10);
            if (nextTarget > allData.length) {
              const moreData = isSearchActive
                ? await dataService.searchMore()
                : await dataService.loadMore();
              allData = mergeLoadMoreData(allData, moreData);
            }
            visibleCount = alignToFullRow(Math.min(nextTarget, allData.length), allData.length);
            renderer.update(allData.slice(0, visibleCount));
            loadMoreControl.update(Math.max(0, allData.length - visibleCount));
          }, { iconSize: config.loadMoreIconSize || 'xl', strings: placeholders })
          : null;
        loadMoreControl?.update(Math.max(0, allData.length - visibleCount));

        let elseCurrentColumnCount = getGridColumnCount();
        const elseResizeObserver = new ResizeObserver(() => {
          const newCols = getGridColumnCount();
          if (newCols === elseCurrentColumnCount || isSwatchesMode(config)) return;
          elseCurrentColumnCount = newCols;
          const aligned = alignToFullRow(visibleCount, allData.length);
          if (aligned !== visibleCount) {
            visibleCount = aligned;
            renderer.update(allData.slice(0, visibleCount));
            loadMoreControl?.update(Math.max(0, allData.length - visibleCount));
          }
        });
        elseResizeObserver.observe(container);

        const modalManager = createModalManager();

        renderer.on(EVENTS.PALETTE_CLICK, async (palette) => {
          await modalManager.openPaletteSwatchesModal(
            palette || {},
            {
              verticalMaxPerRow: config.swatchVerticalMaxPerRow,
              onLikeToggle: async ({ id, liked }) => dataService.toggleLike({ id, liked }),
              modalStrings: await colorModalStringsPromise,
              colorSwatchRailStrings: await colorSwatchRailStringsPromise,
            },
          );
        });
        renderer.on(EVENTS.PALETTE_EDIT, (palette) => {
          const colors = palette?.colors || [];
          const name = palette?.name || '';
          const editUrl = buildPaletteEditUrl(colorWheelPath, colors, name);
          window.location.href = editUrl;
        });
        renderer.on(EVENTS.SHARE, async ({ palette }) => {
          await modalManager.openPaletteSwatchesModal(
            palette || {},
            {
              verticalMaxPerRow: config.swatchVerticalMaxPerRow,
              onLikeToggle: async ({ id, liked }) => dataService.toggleLike({ id, liked }),
              modalStrings: await colorModalStringsPromise,
              colorSwatchRailStrings: await colorSwatchRailStringsPromise,
            },
          );
        });

        renderer.on(EVENTS.SEARCH, async ({ query }) => {
          isSearchActive = !!query;
          block.classList.add(CSS_CLASSES.LOADING);
          allData = await dataService.search(query);
          visibleCount = alignToFullRow(
            Math.min(config.initialLoad, allData.length),
            allData.length,
          );
          renderer.update(isSwatchesMode(config) ? allData : allData.slice(0, visibleCount));
          loadMoreControl?.update(Math.max(0, allData.length - visibleCount));
          block.classList.remove(CSS_CLASSES.LOADING);
        });

        renderer.on(EVENTS.FILTER, async (filters) => {
          isSearchActive = false;
          block.classList.add(CSS_CLASSES.LOADING);
          allData = await dataService.filter(filters);
          visibleCount = alignToFullRow(
            Math.min(config.initialLoad, allData.length),
            allData.length,
          );
          renderer.update(isSwatchesMode(config) ? allData : allData.slice(0, visibleCount));
          loadMoreControl?.update(Math.max(0, allData.length - visibleCount));
          block.classList.remove(CSS_CLASSES.LOADING);
        });

        const floatingHandler = async (e) => {
          const { query } = e.detail;
          block.classList.add(CSS_CLASSES.LOADING);
          if (!query) {
            isSearchActive = false;
            allData = await dataService.fetchData();
            document.dispatchEvent(new CustomEvent('color-explore:results-found', { bubbles: true }));
          } else {
            const searchResults = await dataService.search(query);
            if (searchResults.length === 0) {
              isSearchActive = false;
              allData = await dataService.fetchData();
              document.dispatchEvent(new CustomEvent('color-explore:empty-result', { detail: { query }, bubbles: true }));
            } else {
              isSearchActive = true;
              allData = searchResults;
              document.dispatchEvent(new CustomEvent('color-explore:results-found', { bubbles: true }));
            }
          }
          visibleCount = alignToFullRow(
            Math.min(config.initialLoad, allData.length),
            allData.length,
          );
          renderer.update(isSwatchesMode(config) ? allData : allData.slice(0, visibleCount));
          loadMoreControl?.update(Math.max(0, allData.length - visibleCount));
          block.classList.remove(CSS_CLASSES.LOADING);
        };
        document.addEventListener('floating-search:submit', floatingHandler);

        if (urlQuery && !isSearchActive) {
          document.dispatchEvent(new CustomEvent('color-explore:empty-result', { detail: { query: urlQuery }, bubbles: true }));
        } else if (urlQuery) {
          document.dispatchEvent(new CustomEvent('color-explore:results-found', { bubbles: true }));
        }

        block.addEventListener('block-unload', () => {
          elseResizeObserver.disconnect();
          document.removeEventListener('floating-search:submit', floatingHandler);
        }, { once: true });

        block.rendererInstance = renderer;
        block.modalManagerInstance = modalManager;
        block.dataServiceInstance = dataService;
        block.dataset.blockStatus = 'loaded';
      })().catch((err) => {
        window.lana?.log(`[ColorExplore] Mount error: ${err?.message}`, { tags: 'color-explore', severity: 'error' });
        block.dataset.blockStatus = '';
      });
    }

    trackColorBlockLoad('color-explore');
  } catch (error) {
    window.lana?.log(`[ColorExplore] ❌ Error: ${error}`, { tags: 'color-explore', severity: 'error' });
    block.classList.add(CSS_CLASSES.ERROR);
    block.dataset.blockStatus = '';
    const errMsg = document.createElement('p');
    errMsg.textContent = 'Failed to load Color Explore';
    block.appendChild(errMsg);
    block.setAttribute('data-failed', 'true');
  }
}
