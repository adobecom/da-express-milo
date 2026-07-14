import { createTag, getMetadata } from '../../scripts/utils.js';
import createTextInput from './textInput.js';
import initFilters from './filters.js';
import initPanel from './panel.js';
import { initFromUrl, initFonts } from './state.js';
import createFontCardGrid from './fontCardGrid.js';
import createToolbar from './toolbar.js';
import loadFontGeneratorPlaceholders from './placeholders.js';

let filterPanelCount = 0;

// Kick off the placeholder lookup at module load (mirrors color-extract.js's
// placeholdersPromise) so it resolves before decorate needs it. Awaited up
// front so components render with final copy — no English-then-swap flash.
const placeholdersPromise = loadFontGeneratorPlaceholders();

const DEFAULTS = {
  suggestions: [
    'The quick brown fox jumps over the lazy dog',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'Realigned equestrian fez bewilders picky monarch',
  ],
  cardCta: {
    text: 'Design With Style',
    href: 'https://www.adobe.com/express/templates/',
  },
};

function getContent() {
  const suggestionsRaw = getMetadata('fg-suggestions');
  const suggestions = suggestionsRaw
    ? suggestionsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULTS.suggestions;

  return {
    suggestions,
    cardCta: {
      text: getMetadata('fg-card-cta-text') || DEFAULTS.cardCta.text,
      href: getMetadata('fg-card-cta-href') || DEFAULTS.cardCta.href,
    },
  };
}

export default async function decorate(block) {
  // Restore URL state before any component reads from the store.
  initFromUrl();

  // Load the font catalog here in the block entry point, then hand it to the
  // store; every component reads the catalog from the store, none fetch.
  let fonts = [];
  try {
    const res = await fetch(new URL('./font-sheets/font-styles.json', import.meta.url).href);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fonts = (await res.json()).fonts ?? [];
  } catch (e) {
    window.lana?.log(`font-generator: failed to load font-styles.json: ${e?.message || e}`, { tags: 'font-generator', severity: 'error' });
    return;
  }
  initFonts(fonts);

  const content = getContent();
  // Await resolved copy before building any text-bearing component so the
  // user never sees English placeholder text swapped out (color-extract.js).
  const strings = await placeholdersPromise;

  const container = createTag('section', { class: 'fg-container' });
  const sidebar = createTag('div', { class: 'fg-sidebar' });
  const main = createTag('div', { class: 'fg-main' });

  const { panel: textInput, unsubscribe: unsubscribeTextInput } = createTextInput({
    suggestions: content.suggestions,
    strings,
  });

  // Desktop-inline filters instance; the mobile/tablet instance lives inside
  // panel.js's own drawer, mounted separately below. .fg-sidebar drives
  // filters.js/font-generator.css's desktop-inline-vs-mobile-panel visibility
  // toggle (Megan Thomas, MWPW-189432).
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
