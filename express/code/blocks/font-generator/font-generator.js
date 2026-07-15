import { createTag, getMetadata } from '../../scripts/utils.js';
import createTextInput from './textInput.js';
import initFilters from './filters.js';
import initPanel from './panel.js';
import { initFromUrl, initFonts } from './state.js';
import createFontCardGrid from './fontCardGrid.js';
import createToolbar from './toolbar.js';
import loadFontGeneratorPlaceholders from './placeholders.js';

let filterPanelCount = 0;

// Adobe Fonts (Typekit) kit holding the families referenced by `fontSupported`
// in font-styles.json (Gothic A1, Noto Sans, …). The names the kit exposes in
// CSS must match each font's `fontSupported` value for cards to render in the
// intended face.
const ADOBE_FONTS_KIT_ID = 'iqd6egj';

// This kit's web-project CSS endpoint (use.typekit.net/<id>.css) is domain-
// locked and 412s off allow-listed domains, but the JS embed kit serves
// anywhere — so we load the script and let Typekit inject the @font-face rules.
// The promise resolves on the active/inactive callbacks so callers still await
// real readiness rather than just script load.
function loadWebFonts() {
  const config = { kitId: ADOBE_FONTS_KIT_ID, scriptTimeout: 3000, async: true };
  return new Promise((resolve) => {
    const runTypekit = () => {
      try {
        window.Typekit.load({ ...config, active: resolve, inactive: resolve });
      } catch {
        resolve();
      }
    };
    if (window.Typekit) {
      runTypekit();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://use.typekit.net/${ADOBE_FONTS_KIT_ID}.js`;
    script.async = true;
    script.addEventListener('load', runTypekit, { once: true });
    script.addEventListener('error', resolve, { once: true });
    document.head.append(script);
  });
}

// Kick off the placeholder lookup at module load (mirrors color-extract.js's
// placeholdersPromise) so it resolves before decorate needs it. Awaited up
// front so components render with final copy — no English-then-swap flash.
const placeholdersPromise = loadFontGeneratorPlaceholders();

const DEFAULTS = {
  cardCtaHref: 'https://www.adobe.com/express/templates/',
};

function makeSkelCard() {
  const card = document.createElement('div');
  card.className = 'fg-sk-card';

  const body = document.createElement('div');
  body.className = 'fg-sk-card-body';
  const copyBtn = document.createElement('div');
  copyBtn.className = 'fg-sk-copy-btn';
  const preview = document.createElement('div');
  preview.className = 'fg-sk-preview';
  body.append(copyBtn, preview);

  const footer = document.createElement('div');
  footer.className = 'fg-sk-card-footer';
  const name = document.createElement('div');
  name.className = 'fg-sk-name';
  const cta = document.createElement('div');
  cta.className = 'fg-sk-cta';
  footer.append(name, cta);

  card.append(body, footer);
  return card;
}

function createSkeleton() {
  const root = document.createElement('section');
  root.className = 'fg-sk';
  root.setAttribute('aria-hidden', 'true');

  const sidebar = document.createElement('div');
  sidebar.className = 'fg-sk-sidebar';
  const textInput = document.createElement('div');
  textInput.className = 'fg-sk-text-input';
  const filters = document.createElement('div');
  filters.className = 'fg-sk-filters';

  const filterLabel = document.createElement('div');
  filterLabel.className = 'fg-sk-filter-label';

  const filterGrid = document.createElement('div');
  filterGrid.className = 'fg-sk-filter-grid';
  const filterBtn = document.createElement('div');
  filterBtn.className = 'fg-sk-filter-btn';
  for (let i = 0; i < 4; i += 1) {
    filterGrid.append(i === 0 ? filterBtn : filterBtn.cloneNode(true));
  }

  const promo = document.createElement('div');
  promo.className = 'fg-sk-promo';

  filters.append(filterLabel, filterGrid, promo);
  sidebar.append(textInput, filters);

  const main = document.createElement('div');
  main.className = 'fg-sk-main';

  const toolbar = document.createElement('div');
  toolbar.className = 'fg-sk-toolbar';

  const tbLeft = document.createElement('div');
  tbLeft.className = 'fg-sk-toolbar-left';
  const layoutBtns = document.createElement('div');
  layoutBtns.className = 'fg-sk-layout-btns';
  const layoutBtn = document.createElement('div');
  layoutBtn.className = 'fg-sk-layout-btn';
  layoutBtns.append(layoutBtn, layoutBtn.cloneNode(true));
  const countPill = document.createElement('div');
  countPill.className = 'fg-sk-count';
  const filterTrigger = document.createElement('div');
  filterTrigger.className = 'fg-sk-filter-trigger';
  tbLeft.append(layoutBtns, countPill, filterTrigger);

  const tbRight = document.createElement('div');
  tbRight.className = 'fg-sk-toolbar-right';
  const slider = document.createElement('div');
  slider.className = 'fg-sk-slider';
  tbRight.append(slider);

  toolbar.append(tbLeft, tbRight);

  const grid = document.createElement('div');
  grid.className = 'fg-sk-grid';
  const cardTemplate = makeSkelCard();
  for (let i = 0; i < 12; i += 1) {
    grid.append(i === 0 ? cardTemplate : cardTemplate.cloneNode(true));
  }

  const loadMore = document.createElement('div');
  loadMore.className = 'fg-sk-load-more';

  main.append(toolbar, grid, loadMore);
  root.append(sidebar, main);
  return root;
}

function getContent(strings = {}) {
  // Authored fg-suggestions metadata wins; otherwise the placeholder default
  // (comma-separated) supplies localizable sample text.
  const suggestionsRaw = getMetadata('fg-suggestions') || strings.suggestions || '';
  const suggestions = suggestionsRaw.split(',').map((s) => s.trim()).filter(Boolean);

  return {
    suggestions,
    cardCta: {
      text: getMetadata('fg-card-cta-text') || strings.cardCtaText,
      href: getMetadata('fg-card-cta-href') || DEFAULTS.cardCtaHref,
    },
  };
}

// Load the font catalog here in the block entry point, then hand it to the
// store; every component reads the catalog from the store, none fetch.
// The Typekit kit backing `fontSupported` loads in parallel — cards need it
// active before they render so previews show in the intended face.
async function decorateAsync(block) {
  let fonts = [];
  try {
    const [res] = await Promise.all([
      fetch(new URL('./font-sheets/font-styles.json', import.meta.url).href),
      loadWebFonts(),
    ]);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fonts = (await res.json()).fonts ?? [];
  } catch (e) {
    window.lana?.log(`font-generator: failed to load font-styles.json: ${e?.message || e}`, { tags: 'font-generator', severity: 'error' });
    block.replaceChildren();
    return;
  }
  initFonts(fonts);

  // Await resolved copy before building any text-bearing component so the
  // user never sees English placeholder text swapped out (color-extract.js).
  const strings = await placeholdersPromise;
  const content = getContent(strings);

  // Build the full component tree hidden alongside the skeleton so Spectrum
  // web components can upgrade before the skeleton is removed.
  const container = createTag('section', { class: 'fg-container fg-loading' });
  const sidebar = createTag('div', { class: 'fg-sidebar' });
  const main = createTag('div', { class: 'fg-main' });

  const { panel: textInput, unsubscribe: unsubscribeTextInput } = createTextInput({
    suggestions: content.suggestions,
    strings,
  });

  // Desktop-inline filters instance; the mobile/tablet instance lives inside
  // the panel's own drawer, mounted separately below. .fg-sidebar drives the
  // desktop-inline-vs-mobile-panel visibility toggle in font-generator.css.
  const desktopFiltersEl = createTag('div', { class: 'fg-filters' });

  sidebar.append(textInput, desktopFiltersEl);

  const panelId = `font-generator-filters-${(filterPanelCount += 1)}`;
  const {
    toolbar, filterTrigger, unsubscribe: unsubscribeToolbar,
  } = createToolbar({ panelId, strings });

  const { container: gridContainer, unsubscribe: unsubscribeGrid } = createFontCardGrid({
    cardCta: content.cardCta,
    fonts,
    strings,
  });

  main.append(toolbar, gridContainer);
  container.append(sidebar, main);

  // Add hidden container to the block so WC can upgrade while skeleton shows.
  block.append(container);

  const teardownDesktopFilters = await initFilters([desktopFiltersEl], {
    showCTA: true,
  });

  const panelController = await initPanel(block, {
    panelId,
    onOpenChange: (open) => filterTrigger.setAttribute('aria-expanded', String(open)),
  });
  filterTrigger.addEventListener('click', () => panelController.open());

  // Everything is ready — swap skeleton for the fully-initialized container.
  block.querySelector('.fg-sk')?.remove();
  container.classList.remove('fg-loading');

  const cleanup = () => {
    unsubscribeTextInput();
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

export default function decorate(block) {
  block.replaceChildren(createSkeleton());
  if (new URLSearchParams(window.location.search).has('fg-skeleton')) return;

  // Restore URL state before any component reads from the store.
  initFromUrl();
  decorateAsync(block);
}
