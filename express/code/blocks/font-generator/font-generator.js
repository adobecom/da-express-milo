import createSidePanel from './side-panel/output/side-panel.js';
import createFilterPanel from './side-panel/output/filter-panel.js';
import { setState, subscribe, initFromUrl } from './state.js';
import createFontCardGrid from './fontCardGrid.js';
import createToolbar from './toolbar.js';
import loadFontGeneratorPlaceholders from './placeholders.js';

const CATEGORY_STYLES = {
  all: { fontId: 'bold-script' },
  glitch: { fontId: 'strikethrough' },
  symbol: { fontId: 'weights', fontSize: 12 },
};

let filterPanelCount = 0;

const DEFAULTS = {
  suggestions: [
    'The quick brown fox jumps over the lazy dog',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'Realigned equestrian fez bewilders picky monarch',
  ],
  promoTitle: 'Looking for more fonts?',
  promoCta: {
    text: 'Get Adobe Express Free',
    href: 'https://www.adobe.com/express/templates/',
  },
  cardCta: {
    text: 'Design With Style',
    href: 'https://www.adobe.com/express/templates/',
  },
};

function getContent() {
  const meta = (key) => document.head.querySelector(`meta[name="${key}"]`)?.content || null;

  const suggestionsRaw = meta('fg-suggestions');
  const suggestions = suggestionsRaw
    ? suggestionsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULTS.suggestions;

  return {
    suggestions,
    promoTitle: meta('fg-promo-title') ?? DEFAULTS.promoTitle,
    promoCta: {
      text: meta('fg-promo-cta-text') ?? DEFAULTS.promoCta.text,
      href: meta('fg-promo-cta-href') ?? DEFAULTS.promoCta.href,
    },
    cardCta: {
      text: meta('fg-card-cta-text') ?? DEFAULTS.cardCta.text,
      href: meta('fg-card-cta-href') ?? DEFAULTS.cardCta.href,
    },
  };
}

// Localizers below apply already-resolved strings from placeholders.js —
// loadFontGeneratorPlaceholders() has already handled batching the lookup
// and falling back to DEFAULT_PLACEHOLDERS, so these just apply the result.
function localizeFilterTrigger(button, label) {
  const labelEl = button.querySelector('.filter-trigger-label');
  if (labelEl) labelEl.textContent = label;
  button.setAttribute('aria-label', label);
}

function localizeCloseButton(button, label) {
  button.setAttribute('aria-label', label);
}

function localizeAccordionTitle(panel, label) {
  const title = panel.querySelector('.title');
  if (title) title.textContent = label;
}

function localizeTryThese(panel, label) {
  const wrapper = panel.querySelector('.text-wrapper');
  if (wrapper) wrapper.textContent = label;
}

function localizeTextareaPlaceholder(panel, label) {
  const textarea = panel.querySelector('textarea.label');
  if (textarea) textarea.placeholder = label;
}

export default async function decorate(block) {
  // Restore URL state before any component reads from the store.
  initFromUrl();

  const loading = new URLSearchParams(window.location.search).has('loading');
  const unsubscribeBlock = subscribe(({ loading: l }) => block.classList.toggle('loading', l));
  setState({ loading });

  const content = getContent();
  // Kicked off once here; awaited below once the DOM it localizes exists,
  // and threaded into createFilterPanel for the 'All' category label, which
  // needs it before the category cells are built.
  const stringsPromise = loadFontGeneratorPlaceholders();

  const grid = document.createElement('div');
  grid.className = 'font-generator-grid';

  const sideCol = document.createElement('div');
  sideCol.className = 'font-generator-col font-generator-col--side';

  const panelId = `font-generator-filters-${(filterPanelCount += 1)}`;
  const {
    panel: filterPanel,
    overlay: filterOverlay,
    unsubscribe: unsubscribeFilter,
  } = createFilterPanel({
    promoTitle: content.promoTitle,
    promoCta: content.promoCta,
    categoryStyles: CATEGORY_STYLES,
    allCategoryLabel: stringsPromise.then((strings) => strings.allCategory),
  });
  filterPanel.id = panelId;

  const closeButton = filterPanel.querySelector('.filter-panel-close');

  const { panel: sidePanel, unsubscribe: unsubscribeSide } = createSidePanel({
    suggestions: content.suggestions,
  });

  sideCol.append(sidePanel, filterPanel, filterOverlay);

  const mainCol = document.createElement('div');
  mainCol.className = 'font-generator-col font-generator-col--main';

  grid.append(sideCol, mainCol);
  block.replaceChildren(grid);

  const { toolbar, filterTrigger, unsubscribe: unsubscribeToolbar } = createToolbar({ panelId });
  mainCol.append(toolbar);

  stringsPromise.then((strings) => {
    if (filterTrigger) localizeFilterTrigger(filterTrigger, strings.filterTrigger);
    if (closeButton) localizeCloseButton(closeButton, strings.closeFilters);
    localizeAccordionTitle(filterPanel, strings.categories);
    localizeTryThese(sidePanel, strings.tryThese);
    localizeTextareaPlaceholder(sidePanel, strings.previewPlaceholder);
  });

  let unsubscribeGrid = () => {};
  createFontCardGrid({ cardCta: content.cardCta }).then(({ container, unsubscribe }) => {
    unsubscribeGrid = unsubscribe;
    mainCol.append(container);
  });

  const cleanup = () => {
    unsubscribeBlock();
    unsubscribeFilter();
    unsubscribeSide();
    unsubscribeToolbar();
    unsubscribeGrid();
  };
  const parent = block.parentElement;
  if (parent) {
    const observer = new MutationObserver(() => {
      if (!block.isConnected) {
        cleanup();
        observer.disconnect();
      }
    });
    observer.observe(parent, { childList: true });
  }
}
