import createSidePanel from './side-panel/side-panel.js';
import initFilters from './filters.js';
import initPanel from './panel.js';
import { setState, subscribe, initFromUrl } from './state.js';
import createFontCardGrid from './fontCardGrid.js';
import createToolbar from './toolbar.js';
import loadFontGeneratorPlaceholders from './placeholders.js';

let filterPanelCount = 0;

const DEFAULTS = {
  suggestions: [
    'The quick brown fox jumps over the lazy dog',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'Realigned equestrian fez bewilders picky monarch',
  ],
  promo: {
    title: 'Looking for more fonts?',
    cta: {
      text: 'Go to Adobe Fonts',
      href: 'https://fonts.adobe.com',
    },
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
    promo: {
      title: meta('fg-promo-title') ?? DEFAULTS.promo.title,
      cta: {
        text: meta('fg-promo-cta-text') ?? DEFAULTS.promo.cta.text,
        href: meta('fg-promo-cta-href') ?? DEFAULTS.promo.cta.href,
      },
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
  const stringsPromise = loadFontGeneratorPlaceholders();

  const grid = document.createElement('div');
  grid.className = 'font-generator-grid';

  // fg-sidebar drives filters.js/font-generator.css's desktop-inline-vs-
  // mobile-panel visibility toggle (Megan Thomas, MWPW-189432).
  const sideCol = document.createElement('div');
  sideCol.className = 'font-generator-col font-generator-col--side fg-sidebar';

  const { panel: sidePanel, unsubscribe: unsubscribeSide } = createSidePanel({
    suggestions: content.suggestions,
  });

  // Desktop-inline filters instance; the mobile/tablet instance lives inside
  // panel.js's own drawer, mounted separately below.
  const desktopFiltersEl = document.createElement('div');
  desktopFiltersEl.className = 'fg-filters';

  sideCol.append(sidePanel, desktopFiltersEl);

  const mainCol = document.createElement('div');
  mainCol.className = 'font-generator-col font-generator-col--main';

  grid.append(sideCol, mainCol);
  block.replaceChildren(grid);

  const panelId = `font-generator-filters-${(filterPanelCount += 1)}`;
  const { toolbar, filterTrigger, unsubscribe: unsubscribeToolbar } = createToolbar({ panelId });
  mainCol.append(toolbar);

  stringsPromise.then((strings) => {
    localizeFilterTrigger(filterTrigger, strings.filterTrigger);
    localizeTryThese(sidePanel, strings.tryThese);
    localizeTextareaPlaceholder(sidePanel, strings.previewPlaceholder);
  });

  // filters.js reads allFonts from the store once, at init, to build the
  // category list — the font sheet must already be loaded (and allFonts
  // populated) before this runs, or the category list renders empty. allFonts
  // (not activeFonts) is used so a URL-restored filter can't narrow the
  // catalog before the categories are derived.
  const { container: gridContainer, unsubscribe: unsubscribeGrid } = await createFontCardGrid({
    cardCta: content.cardCta,
  });
  mainCol.append(gridContainer);

  const teardownDesktopFilters = await initFilters([desktopFiltersEl], {
    showCTA: true,
    promo: content.promo,
  });

  const panelController = await initPanel(block, {
    panelId,
    promo: content.promo,
    onOpenChange: (open) => filterTrigger.setAttribute('aria-expanded', String(open)),
  });
  filterTrigger.addEventListener('click', () => panelController.open());

  const cleanup = () => {
    unsubscribeBlock();
    unsubscribeSide();
    unsubscribeToolbar();
    unsubscribeGrid();
    teardownDesktopFilters();
    panelController.destroy();
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
