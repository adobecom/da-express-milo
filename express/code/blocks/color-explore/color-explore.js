import { parseBlockConfig } from './helpers/parseConfig.js';
import { CSS_CLASSES, VARIANTS, EVENTS } from './helpers/constants.js';
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';
import { createGradientsRenderer } from '../../scripts/color-shared/renderers/createGradientsRenderer.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';
import { createGradientPickerRebuildContent, ensureGradientPickerRebuildStyles } from '../../scripts/color-shared/modal/createGradientPickerRebuildContent.js';
import { createColorDataService } from '../../scripts/color-shared/services/createColorDataService.js';

export default async function decorate(block) {
  try {
    const rows = [...block.children];
    const config = parseBlockConfig(rows);

    block.innerHTML = '';
    block.className = CSS_CLASSES.BLOCK;
    block.classList.add(`${CSS_CLASSES.BLOCK}--${config.variant}`);

    const container = document.createElement('div');
    container.className = CSS_CLASSES.CONTAINER;
    block.appendChild(container);

    const dataService = createColorDataService({
      variant: config.variant,
      initialLoad: config.initialLoad,
      maxItems: config.maxItems,
    });

    block.classList.add(CSS_CLASSES.LOADING);
    const data = await dataService.fetchData();
    block.classList.remove(CSS_CLASSES.LOADING);

    let renderer;
    if (config.variant === VARIANTS.GRADIENTS) {
      renderer = createGradientsRenderer({ container, data, config });
    } else {
      renderer = createStripsRenderer({ container, data, config });
    }

    renderer.render(container);

    const modalManager = createModalManager();

    renderer.on(EVENTS.PALETTE_CLICK, async (palette) => {
      await ensureGradientPickerRebuildStyles();
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

    renderer.on(EVENTS.GRADIENT_CLICK, async (gradient) => {
      await ensureGradientPickerRebuildStyles();
      const g = gradient || {};
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[ColorExplore] ❌ Error:', error);
    block.classList.add(CSS_CLASSES.ERROR);
    block.innerHTML = `<p style="color: red;">Failed to load Color Explore: ${error.message}</p>`;
    block.setAttribute('data-failed', 'true');
  }
}
