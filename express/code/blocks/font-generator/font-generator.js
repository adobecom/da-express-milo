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

export default async function decorate(block) {
  // Restore URL state before any component reads from the store.
  initFromUrl();

  // Load the font catalog here in the block entry point, then hand it to the
  // store; every component reads the catalog from the store, none fetch.
  // The Typekit kit backing `fontSupported` loads in parallel — cards need it
  // active before they render so previews show in the intended face.
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
    return;
  }
  initFonts(fonts);

  // Await resolved copy before building any text-bearing component so the
  // user never sees English placeholder text swapped out (color-extract.js).
  const strings = await placeholdersPromise;
  const content = getContent(strings);

  const container = createTag('section', { class: 'fg-container' });
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

  container.append(sidebar, main);
  block.replaceChildren(container);

  const panelId = `font-generator-filters-${(filterPanelCount += 1)}`;
  const {
    toolbar, filterTrigger, unsubscribe: unsubscribeToolbar,
  } = createToolbar({ panelId, strings });
  main.append(toolbar);

  const { container: gridContainer, unsubscribe: unsubscribeGrid } = createFontCardGrid({
    cardCta: content.cardCta,
    fonts,
    strings,
  });
  main.append(gridContainer);

  const teardownDesktopFilters = await initFilters([desktopFiltersEl], {
    showCTA: true,
  });

  const panelController = await initPanel(block, {
    panelId,
    onOpenChange: (open) => filterTrigger.setAttribute('aria-expanded', String(open)),
  });
  filterTrigger.addEventListener('click', () => panelController.open());

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
