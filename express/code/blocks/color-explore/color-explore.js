import { getLibs } from '../../scripts/utils.js';
import { parseBlockConfig } from './helpers/parseConfig.js';
import { CSS_CLASSES, VARIANTS, EVENTS } from './helpers/constants.js';
import { STRIP_CONTAINER_DEFAULTS } from '../../scripts/color-shared/components/strips/stripContainerDefaults.js';
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';
import { createStripContainerRenderer } from '../../scripts/color-shared/renderers/createStripContainerRenderer.js';
import { createPaletteSummaryRenderer } from '../../scripts/color-shared/renderers/createPaletteSummaryRenderer.js';
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

function wrapPaletteVariantLabels(container) {
  if (!container.classList.contains('palettes-variants')) return;
  container.querySelectorAll('.palette-card').forEach((card) => {
    if (card.closest('.color-explore-variant-wrap')) return;
    const sizeMatch = card.className.match(/palette-card--size-(l|m|s)/);
    const size = sizeMatch ? sizeMatch[1].toUpperCase() : '';
    const wrap = document.createElement('div');
    wrap.className = 'color-explore-variant-wrap';
    const label = document.createElement('span');
    label.className = 'color-explore-variant-size';
    label.textContent = size ? `Size ${size}` : '';
    card.parentNode.insertBefore(wrap, card);
    wrap.appendChild(label);
    wrap.appendChild(card);
  });
}

export default async function decorate(block) {
  try {
    if (block.dataset.colorExploreDecorated === 'true') return;

    const { loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`);
    const config = parseBlockConfig([...block.children]);
    if (config.variant !== VARIANTS.GRADIENTS) {
      config.variant = VARIANTS.PALETTES;
    }

    if (config.variant === VARIANTS.PALETTES) {
      config.stripOptions = config.stripOptions || { ...STRIP_CONTAINER_DEFAULTS };
      const urlOrientation = new URLSearchParams(window.location.search).get('orientation');
      if (urlOrientation === 'vertical' || urlOrientation === 'horizontal') {
        config.stripOptions.orientation = urlOrientation;
      }
    }
    loadVariantStyles(config.variant, loadStyle, getConfig().codeRoot);

    block.innerHTML = '';
    block.className = CSS_CLASSES.BLOCK;
    block.classList.add(`${CSS_CLASSES.BLOCK}--${config.variant}`);

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
      // Branch: palettes — strips, strip container, palette summary.
      const stripsConfig = { ...config };
      delete stripsConfig.stripOptions;
      const sectionStrips = document.createElement('div');
      sectionStrips.className = 'color-explore-section color-explore--strips';
      const labelStrips = document.createElement('h2');
      labelStrips.className = 'color-explore-variant-label';
      labelStrips.textContent = 'Strips';
      sectionStrips.appendChild(labelStrips);
      container.appendChild(sectionStrips);

      const stripContainerConfig = {
        ...config,
        stripOptions: config.stripOptions || { ...STRIP_CONTAINER_DEFAULTS },
      };
      const urlOrientation = new URLSearchParams(window.location.search).get('orientation');
      if (urlOrientation === 'vertical' || urlOrientation === 'horizontal') {
        stripContainerConfig.stripOptions.orientation = urlOrientation;
      }
      const sectionStripContainer = document.createElement('div');
      sectionStripContainer.className = 'color-explore-section color-explore--strip-container';
      const labelStripContainer = document.createElement('h2');
      labelStripContainer.className = 'color-explore-variant-label';
      labelStripContainer.textContent = 'Strip container';
      sectionStripContainer.appendChild(labelStripContainer);
      container.appendChild(sectionStripContainer);

      const sectionPaletteSummary = document.createElement('div');
      sectionPaletteSummary.className = 'color-explore-section color-explore--palette-summary';
      const labelPaletteSummary = document.createElement('h2');
      labelPaletteSummary.className = 'color-explore-variant-label';
      labelPaletteSummary.textContent = 'Palette summary';
      sectionPaletteSummary.appendChild(labelPaletteSummary);
      const paletteSummaryContent = document.createElement('div');
      sectionPaletteSummary.appendChild(paletteSummaryContent);
      container.appendChild(sectionPaletteSummary);

      const rendererStrips = createStripsRenderer({
        container: sectionStrips, data, config: stripsConfig,
      });
      const rendererStripContainer = createStripContainerRenderer({
        container: sectionStripContainer, data, config: stripContainerConfig,
      });
      const rendererPaletteSummary = createPaletteSummaryRenderer({
        container: paletteSummaryContent, data, config,
      });
      rendererStrips.render(sectionStrips);
      wrapPaletteVariantLabels(sectionStrips);
      rendererStripContainer.render(sectionStripContainer);
      rendererPaletteSummary.render(paletteSummaryContent);

      renderer = {
        ...rendererStrips,
        on(event, cb) {
          rendererStrips.on(event, cb);
          rendererStripContainer.on(event, cb);
          rendererPaletteSummary.on(event, cb);
          return this;
        },
        update(newData) {
          rendererStrips.update(newData);
          rendererStripContainer.update(newData);
          rendererPaletteSummary.update(newData);
          wrapPaletteVariantLabels(sectionStrips);
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
