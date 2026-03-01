import { getLibs } from '../../scripts/utils.js';
import { parseBlockConfig } from './helpers/parseConfig.js';
import { CSS_CLASSES, VARIANTS, EVENTS, DEFAULTS } from './helpers/constants.js';
import { STRIP_CONTAINER_DEFAULTS } from '../../scripts/color-shared/components/strips/stripContainerDefaults.js';
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';
import { createPaletteWCRenderer } from '../../scripts/color-shared/renderers/createPaletteWCRenderer.js';
import { createGradientsRenderer } from '../../scripts/color-shared/renderers/createGradientsRenderer.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';
import { createColorDataService } from '../../scripts/color-shared/services/createColorDataService.js';

function loadVariantStyles(variant, loadStyle, codeRoot) {
  const base = `${codeRoot}/scripts/color-shared`;
  if (variant === VARIANTS.GRADIENTS) {
    loadStyle(`${base}/components/gradients/gradient-card.css`);
    loadStyle(`${base}/components/gradients/gradient-modal-sizes.css`);
    loadStyle(`${base}/components/gradients/gradient-extract.css`);
  } else {
    loadStyle(`${base}/components/strips/color-strip.css`);
    loadStyle(`${base}/components/strips/color-strip-figma.css`);
  }
}

export default async function decorate(block) {
  try {
    if (block.dataset.colorExploreDecorated === 'true') return;

    const { loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`);
    const config = parseBlockConfig([...block.children]);
    if (config.variant !== VARIANTS.GRADIENTS) {
      config.variant = VARIANTS.PALETTES;
    }
    const reviewFromUrl = new URLSearchParams(window.location.search).get('review');
    if (reviewFromUrl === '1' || reviewFromUrl === 'true') {
      config.showReviewSection = true;
    }
    if (config.showReviewSection === undefined) {
      config.showReviewSection = DEFAULTS.showReviewSection;
    }

    if (config.variant === VARIANTS.PALETTES) {
      config.stripOptions = config.stripOptions || { ...STRIP_CONTAINER_DEFAULTS };
      const urlOrientation = new URLSearchParams(window.location.search).get('orientation');
      if (urlOrientation === 'horizontal') {
        config.stripOptions.orientation = urlOrientation;
      }
    }
    loadVariantStyles(config.variant, loadStyle, getConfig().codeRoot);

    block.innerHTML = '';
    block.className = CSS_CLASSES.BLOCK;
    block.classList.add(`${CSS_CLASSES.BLOCK}--${config.variant}`);
    if (config.variant === VARIANTS.STRIPS && config.stripVariant) {
      block.classList.add(`${CSS_CLASSES.BLOCK}--strip-${config.stripVariant}`);
    }

    const container = document.createElement('div');
    container.className = CSS_CLASSES.CONTAINER;
    block.appendChild(container);

    if (config.variant === VARIANTS.GRADIENTS) {
      const listEl = document.createElement('div');
      listEl.className = CSS_CLASSES.LIST_CONTAINER;
      container.appendChild(listEl);
    }

    const dataService = createColorDataService({
      variant: config.variant,
      initialLoad: config.initialLoad,
      maxItems: config.maxItems,
    });

    block.classList.add(CSS_CLASSES.LOADING);
    const data = await dataService.fetchData();
    block.classList.remove(CSS_CLASSES.LOADING);

    const stripsConfig = config.variant === VARIANTS.STRIPS
      ? { ...config, showAllPaletteVariants: true }
      : config;
    let renderer;
    if (config.variant === VARIANTS.GRADIENTS) {
      // Branch: gradients — many sub-variants (Grid, Modal, Extract)
      const GROUPS = [
        { title: 'Grid', types: ['grid-l', 'grid-m', 'grid-s'] },
        { title: 'Modal', types: ['modal-l', 'modal-m', 'modal-s'] },
        { title: 'Extract', types: ['extract-l', 'extract-s'] },
      ];
      const renderers = [];
      GROUPS.forEach((group) => {
        const groupWrap = document.createElement('div');
        groupWrap.className = 'color-explore-gradient-variant-group';
        const titleEl = document.createElement('h3');
        titleEl.className = 'color-explore-gradient-variant-title';
        titleEl.textContent = group.title;
        groupWrap.appendChild(titleEl);
        group.types.forEach((gradientType) => {
          const slot = document.createElement('div');
          groupWrap.appendChild(slot);
          const r = createGradientsRenderer({
            container: slot,
            data,
            config,
            type: gradientType,
            gradientIndex: gradientType.startsWith('grid-') || gradientType.startsWith('extract-') ? 0 : 1,
          });
          renderers.push(r);
        });
        container.appendChild(groupWrap);
      });
      renderer = Object.assign(renderers[0], {
        update(newData) {
          renderers.forEach((r) => r.update(newData));
        },
      });
    } else {
      // Palettes: same as Gradients — demo/review container first (40px padding, 1360px content), then normal grid flow.
      const stripContainerConfig = {
        ...config,
        stripOptions: config.stripOptions || { ...STRIP_CONTAINER_DEFAULTS },
      };
      const urlOrientation = new URLSearchParams(window.location.search).get('orientation');
      if (urlOrientation === 'horizontal') {
        stripContainerConfig.stripOptions.orientation = urlOrientation;
      }

      // 1) Demo / review section: variants only (no search, no filter). 40px padding, 1360px content.
      const reviewSection = document.createElement('div');
      reviewSection.className = 'color-explore-review-section';
      reviewSection.setAttribute('data-review-section', 'true');
      const reviewIntro = document.createElement('p');
      reviewIntro.className = 'color-explore-review-section__intro';
      reviewIntro.textContent = 'This static section is to illustrate Design intent. Full integration to come. However, you can take a look at the early integration below.';
      reviewSection.appendChild(reviewIntro);
      const reviewInner = document.createElement('div');
      reviewInner.className = 'color-explore-review-section__content';
      reviewSection.appendChild(reviewInner);
      const demoContainer = document.createElement('div');
      demoContainer.className = 'color-explore-demo-container';
      demoContainer.setAttribute('data-demo-viewport', '1360');
      reviewInner.appendChild(demoContainer);
      container.appendChild(reviewSection);

      const factoryConfig = { ...config, showDemoVariants: true };
      const rendererFactory = createStripsRenderer({
        container: demoContainer, data, config: factoryConfig,
      });
      rendererFactory.render(demoContainer);

      // 2) Label and normal flow: grid with palette strips + filters (default strips renderer).
      const normalFlowLabel = document.createElement('h2');
      normalFlowLabel.className = 'color-explore-early-integration-label';
      normalFlowLabel.textContent = 'Early Integration Sneak Peek, not in scope';
      container.appendChild(normalFlowLabel);
      const normalFlowSection = document.createElement('div');
      normalFlowSection.className = 'color-explore-section color-explore--palettes-grid';
      container.appendChild(normalFlowSection);

      const rendererNormal = createStripsRenderer({
        container: normalFlowSection, data, config: stripContainerConfig,
      });
      rendererNormal.render(normalFlowSection);

      renderer = {
        ...rendererNormal,
        on(event, cb) {
          rendererFactory.on(event, cb);
          rendererNormal.on(event, cb);
          return this;
        },
        update(newData) {
          rendererFactory.update(newData);
          rendererNormal.update(newData);
        },
      };
    }

    const modalManager = createModalManager();

    renderer.on(EVENTS.PALETTE_CLICK, (palette) => {
      modalManager.openPaletteModal(palette);
    });

    renderer.on(EVENTS.GRADIENT_CLICK, (gradient) => {
      modalManager.openGradientModal(gradient);
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
    block.dataset.colorExploreDecorated = 'true';
  } catch (error) {
    // eslint-disable-next-line no-console -- report block failure
    console.error('[ColorExplore] Error:', error);
    delete block.dataset.colorExploreDecorated;
    block.rendererInstance = null;
    block.modalManagerInstance = null;
    block.dataServiceInstance = null;
    block.classList.add(CSS_CLASSES.ERROR);
    block.innerHTML = `<p style="color: red;">Failed to load Color Explore: ${error.message}</p>`;
    block.setAttribute('data-failed', 'true');
  }
}
