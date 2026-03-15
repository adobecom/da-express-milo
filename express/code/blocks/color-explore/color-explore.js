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

async function createBlockLoadMoreControl(container, onClick, options = {}) {
  const { iconSize = 'xl' } = options;
  await loadIconsRail();

  let themeHost = container.querySelector('sp-theme[data-owner="color-explore-load-more"]');
  if (!themeHost) {
    const existingTheme = container.querySelector(':scope > sp-theme');
    if (existingTheme) {
      themeHost = existingTheme;
    } else {
      themeHost = document.createElement('sp-theme');
      themeHost.dataset.owner = 'color-explore-load-more';
      themeHost.setAttribute('system', 'spectrum-two');
      themeHost.setAttribute('color', 'light');
      themeHost.setAttribute('scale', 'medium');
      container.appendChild(themeHost);
    }
  }

  let root = themeHost.querySelector('.load-more-container[data-owner="color-explore"]');
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
    themeHost.appendChild(root);
  }

  const button = root.querySelector('button');
  const text = root.querySelector('.button-text');
  const icon = root.querySelector('sp-icon-add');

  if (icon && icon.getAttribute('size') !== iconSize) {
    icon.setAttribute('size', iconSize);
  }

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    try {
      await onClick?.();
    } finally {
      button.disabled = false;
    }
  });

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
      root?.remove();
    },
  };
}

function ensureResultsHeaderAtBlockLevel(container) {
  const gradientsSection = container.querySelector('.gradients-main-section');
  const directHeader = container.querySelector(':scope > .gradients-header, :scope > .results-header');

  if (directHeader) {
    directHeader.classList.add('gradients-header');
    directHeader.classList.add('results-header');
    gradientsSection?.querySelectorAll(':scope > .gradients-header').forEach((header) => header.remove());
    return directHeader;
  }

  const nestedHeader = gradientsSection?.querySelector(':scope > .gradients-header, :scope > .results-header');
  if (!nestedHeader || !gradientsSection) return null;

  const sectionHost = gradientsSection.parentElement;
  if (sectionHost === container) {
    container.insertBefore(nestedHeader, gradientsSection);
  } else if (sectionHost) {
    container.insertBefore(nestedHeader, sectionHost);
  }

  const resolvedHeader = container.querySelector(':scope > .gradients-header, :scope > .results-header');
  if (resolvedHeader) {
    resolvedHeader.classList.add('gradients-header');
    resolvedHeader.classList.add('results-header');
    gradientsSection.querySelectorAll(':scope > .gradients-header').forEach((header) => header.remove());
  }
  return resolvedHeader;
}

async function createBlockFiltersControl(container, variant, onFilterChange) {
  const header = ensureResultsHeaderAtBlockLevel(container);
  if (!header) return null;

  const existing = header.querySelector(':scope > .filters-container[data-owner="color-explore"]');
  if (existing) {
    return {
      destroy() {
        existing.remove();
      },
    };
  }

  const filters = await createFiltersComponent({
    variant,
    onFilterChange,
  });

  if (!(filters?.element instanceof Node)) return null;
  filters.element.dataset.owner = 'color-explore';
  header.appendChild(filters.element);

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

    const container = document.createElement('div');
    container.className = CSS_CLASSES.CONTAINER;
    block.appendChild(container);

    if (config.variant === VARIANTS.GRADIENTS) {
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

      let activeMode = VARIANTS.GRADIENTS;
      let activeRenderer = null;
      let activeDataService = gradientsDataService;
      let allData = [];
      let visibleCount = 0;
      let loadMoreControl = null;
      let filtersControl = null;
      let floatingSearchHandler = null;

      const setModeClasses = (variant) => {
        block.classList.remove(VARIANT_CLASSES.GRADIENTS, VARIANT_CLASSES.PALETTES);
        block.classList.remove(`${CSS_CLASSES.BLOCK}--${VARIANTS.GRADIENTS}`);
        block.classList.remove(`${CSS_CLASSES.BLOCK}--${VARIANTS.STRIPS}`);
        block.classList.remove(`color-explore-${VARIANTS.GRADIENTS}`);
        block.classList.remove(`color-explore-${VARIANTS.STRIPS}`);

        const nextVariantClass = variant === VARIANTS.GRADIENTS
          ? VARIANT_CLASSES.GRADIENTS
          : VARIANT_CLASSES.PALETTES;
        block.classList.add(nextVariantClass);
        block.classList.add(`${CSS_CLASSES.BLOCK}--${variant}`);
        block.classList.add(`color-explore-${variant}`);
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
        ensureResultsHeaderAtBlockLevel(container);

        filtersControl = config.enableFilters !== false
          ? await createBlockFiltersControl(container, VARIANTS.GRADIENTS, async (filters) => {
            if (filters?.contentType === 'color-palettes') {
              await mountStripsMode();
              return;
            }
            block.classList.add(CSS_CLASSES.LOADING);
            allData = await activeDataService.filter(filters);
            visibleCount = Math.min(config.initialLoad, allData.length);
            await activeRenderer.update(allData.slice(0, visibleCount));
            ensureResultsHeaderAtBlockLevel(container);
            updateLoadMoreState();
            block.classList.remove(CSS_CLASSES.LOADING);
          })
          : null;

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
          ensureResultsHeaderAtBlockLevel(container);
          updateLoadMoreState();
        }, { iconSize: config.loadMoreIconSize || 'xl' });
        updateLoadMoreState();

        activeRenderer.on('item-click', async (item) => {
          const currentState = BlockMediator.get(stateKey);
          BlockMediator.set(stateKey, { ...currentState, selectedItem: item });
          await openModalForItem(item, 'Gradient');
        });

        publishInstances();
      };

      mountStripsMode = async () => {
        cleanupActiveView();
        activeMode = VARIANTS.STRIPS;
        activeDataService = palettesDataService;
        setModeClasses(VARIANTS.STRIPS);

        block.classList.add(CSS_CLASSES.LOADING);
        allData = await activeDataService.fetchData();
        visibleCount = Math.min(config.initialLoad, allData.length);
        block.classList.remove(CSS_CLASSES.LOADING);

        if (isSwatchesMode(config)) {
          activeRenderer = createSwatchesRenderer({
            container,
            data: allData,
            config: { ...config, variant: VARIANTS.STRIPS },
          });
        } else {
          activeRenderer = createStripsRenderer({
            container,
            data: allData.slice(0, visibleCount),
            config: { ...config, variant: VARIANTS.STRIPS },
          });
        }
        await activeRenderer.render?.(container);
        ensureResultsHeaderAtBlockLevel(container);

        if (!isSwatchesMode(config)) {
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
        }

        activeRenderer.on(EVENTS.PALETTE_CLICK, async (palette) => {
          await openModalForItem(palette, 'Palette');
        });

        activeRenderer.on(EVENTS.SEARCH, async ({ query }) => {
          block.classList.add(CSS_CLASSES.LOADING);
          allData = await activeDataService.search(query);
          visibleCount = Math.min(config.initialLoad, allData.length);
          activeRenderer.update(isSwatchesMode(config) ? allData : allData.slice(0, visibleCount));
          updateLoadMoreState();
          block.classList.remove(CSS_CLASSES.LOADING);
        });

        activeRenderer.on(EVENTS.FILTER, async (filters) => {
          if (filters?.contentType === 'color-gradients') {
            await mountGradientsMode();
            return;
          }
          block.classList.add(CSS_CLASSES.LOADING);
          allData = await activeDataService.filter(filters);
          visibleCount = Math.min(config.initialLoad, allData.length);
          activeRenderer.update(isSwatchesMode(config) ? allData : allData.slice(0, visibleCount));
          updateLoadMoreState();
          block.classList.remove(CSS_CLASSES.LOADING);
        });

        floatingSearchHandler = async (e) => {
          const { query } = e.detail;
          block.classList.add(CSS_CLASSES.LOADING);
          allData = await activeDataService.search(query);
          visibleCount = Math.min(config.initialLoad, allData.length);
          activeRenderer.update(isSwatchesMode(config) ? allData : allData.slice(0, visibleCount));
          updateLoadMoreState();
          block.classList.remove(CSS_CLASSES.LOADING);
        };
        document.addEventListener('floating-search:submit', floatingSearchHandler);

        publishInstances();
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

      document.addEventListener('floating-search:submit', async (e) => {
        const { query } = e.detail;
        block.classList.add(CSS_CLASSES.LOADING);
        allData = await dataService.search(query);
        visibleCount = Math.min(config.initialLoad, allData.length);
        renderer.update(isSwatchesMode(config) ? allData : allData.slice(0, visibleCount));
        loadMoreControl?.update(Math.max(0, allData.length - visibleCount));
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
