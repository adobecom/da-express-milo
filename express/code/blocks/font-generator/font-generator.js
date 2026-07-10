import { getLibs } from '../../scripts/utils.js';
import createSidePanel from './side-panel/output/side-panel.js';
import createFilterPanel from './side-panel/output/filter-panel.js';
import { setState, subscribe, initFromUrl } from './state.js';
import createFontCardGrid from './fontCardGrid.js';
import createToolbar from './toolbar.js';

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

// replaceKey() echoes the humanized key back when no placeholder is authored
// for it (e.g. "font-generator-placeholder" -> "font generator placeholder")
// rather than returning null/undefined, so callers can't rely on truthiness
// alone to detect a miss. Treat that echo as "not found" so authored fallback
// text — the actual, most up-to-date copy — wins until the row exists.
async function getPlaceholder(key) {
  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { replaceKey } = await import(`${getLibs()}/features/placeholders.js`);
  const value = await replaceKey(key, getConfig());
  return value && value !== key.replaceAll('-', ' ') ? value : null;
}

// Async-enhances the trigger label from placeholders so it stays translatable;
// keeps the authored fallback if the 'filter' placeholder is not defined.
async function localizeFilterTrigger(button) {
  try {
    const label = await getPlaceholder('filter');
    if (label) {
      const labelEl = button.querySelector('.filter-trigger-label');
      if (labelEl) labelEl.textContent = label;
      button.setAttribute('aria-label', label);
    }
  } catch (e) {
    // Placeholder lookup unavailable — keep the fallback label.
  }
}

// The drawer close button is icon-only; localize its accessible name, keeping
// the 'Close' fallback if the placeholder is undefined.
async function localizeCloseButton(button) {
  try {
    const label = await getPlaceholder('close');
    if (label) button.setAttribute('aria-label', label);
  } catch (e) {
    // Placeholder lookup unavailable — keep the fallback label.
  }
}

async function localizeAccordionTitle(panel) {
  try {
    const label = await getPlaceholder('categories');
    const title = panel.querySelector('.title');
    if (title) title.textContent = label || 'Categories';
  } catch (e) {
    // keep fallback
  }
}

async function localizeTryThese(panel) {
  try {
    const label = await getPlaceholder('try-these');
    const wrapper = panel.querySelector('.text-wrapper');
    if (wrapper) wrapper.textContent = label || 'Try these:';
  } catch (e) {
    // keep fallback
  }
}

async function localizeTextareaPlaceholder(panel) {
  try {
    const label = await getPlaceholder('font-generator-placeholder');
    const textarea = panel.querySelector('textarea.label');
    if (textarea) textarea.placeholder = label || 'Type the preview text you want to get started...';
  } catch (e) {
    // keep fallback
  }
}

export default async function decorate(block) {
  // Restore URL state before any component reads from the store.
  initFromUrl();

  const loading = new URLSearchParams(window.location.search).has('loading');
  const unsubscribeBlock = subscribe(({ loading: l }) => block.classList.toggle('loading', l));
  setState({ loading });

  const content = getContent();

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
  });
  filterPanel.id = panelId;

  const closeButton = filterPanel.querySelector('.filter-panel-close');
  if (closeButton) localizeCloseButton(closeButton);
  localizeAccordionTitle(filterPanel);

  const { panel: sidePanel, unsubscribe: unsubscribeSide } = createSidePanel({
    suggestions: content.suggestions,
  });
  localizeTryThese(sidePanel);
  localizeTextareaPlaceholder(sidePanel);

  sideCol.append(sidePanel, filterPanel, filterOverlay);

  const mainCol = document.createElement('div');
  mainCol.className = 'font-generator-col font-generator-col--main';

  grid.append(sideCol, mainCol);
  block.replaceChildren(grid);

  const { toolbar, filterTrigger, unsubscribe: unsubscribeToolbar } = createToolbar({ panelId });
  if (filterTrigger) localizeFilterTrigger(filterTrigger);
  mainCol.append(toolbar);

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
