import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import {
  fetchResults,
  isValidTemplate,
  getImageThumbnailSrc,
} from '../../scripts/template-utils.js';
import {
  trapFocus,
  handleEscapeClose,
  disableBackgroundScroll,
  restoreBackgroundScroll,
} from '../../scripts/color-shared/spectrum/utils/a11y.js';
import showCopyToast from '../../scripts/utils/copy-toast.js';
import createMiniEditorWidget from '../../scripts/widgets/mini-editor-widget/mini-editor-widget.js';

let createTag;
let loadStyle;
let getConfig;

const TEMPLATE_LIMIT = 8;
const DECO_CARD_COUNT = 8;

// Fallback used only if the Typekit kit fails to load or exposes no fonts
// (network failure, ad blocker, or API shape change) — see buildFontOptions.
const FALLBACK_FONT_OPTIONS = [
  { label: 'Sans', font: '"Cal Sans", "Inter", sans-serif' },
  { label: 'Serif', font: '"Source Serif 4", Georgia, serif', italic: true },
  { label: 'Script', font: '"Dancing Script", cursive', italic: true },
  { label: 'Bold', font: '"Poppins", sans-serif', weight: '700' },
  { label: 'Serious', font: 'Georgia, serif' },
];

// Adobe Fonts (Typekit) kit id — same lazy-load approach as font-generator.js:
// load the JS embed kit (works cross-domain) instead of the CSS endpoint
// (which 412s off non-allow-listed domains), and resolve on active/inactive
// so callers await real font readiness, not just script load.
const ADOBE_FONTS_KIT_ID = 'iqd6egj';

function loadWebFonts() {
  return new Promise((resolve) => {
    const runTypekit = () => {
      try {
        window.Typekit.load({
          kitId: ADOBE_FONTS_KIT_ID,
          scriptTimeout: 3000,
          async: true,
          active: resolve,
          inactive: resolve,
        });
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

// Turns a Typekit family slug ("gothic-a1", "source-han-sans-japanese") into
// a human label ("Gothic A1", "Source Han Sans Japanese") for the font pill/
// buttons — Typekit's font list exposes no display name, only this slug.
function familySlugToLabel(family) {
  return family
    .split('-')
    .map((part) => (part.length <= 2 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)))
    .join(' ');
}

/**
 * Reads the fonts the loaded Typekit kit actually exposes (window.Typekit
 * .fonts.fonts — each entry's `family` is both its slug and the exact CSS
 * font-family name Typekit registered, confirmed via document.fonts) and
 * turns them into FONT_OPTIONS entries, instead of a hand-authored list that
 * can silently drift from whatever the kit (ADOBE_FONTS_KIT_ID) actually
 * contains. Variants of the same family (weight/style) collapse into one
 * option that offers italic/bold if any variant of that family has it.
 * Falls back to FALLBACK_FONT_OPTIONS if the kit failed to load or exposes
 * nothing, so the UI still has font choices to show.
 */
function buildFontOptions() {
  const entries = window.Typekit?.fonts?.fonts;
  if (!Array.isArray(entries) || !entries.length) return FALLBACK_FONT_OPTIONS;

  const byFamily = new Map();
  entries.forEach(({ family, weight, style }) => {
    if (!family) return;
    const existing = byFamily.get(family) || { italic: false, bold: false };
    if (style === 'italic') existing.italic = true;
    if (weight === '700' || weight === 'bold') existing.bold = true;
    byFamily.set(family, existing);
  });
  if (!byFamily.size) return FALLBACK_FONT_OPTIONS;

  return Array.from(byFamily, ([family, { italic, bold }]) => {
    const option = { label: familySlugToLabel(family), font: `"${family}", var(--body-font-family, sans-serif)` };
    if (italic) option.italic = true;
    if (bold) option.weight = '700';
    return option;
  });
}

/**
 * Copies the quote and, when present, its author (as "quote — author") so
 * pasted text always carries attribution instead of the quote alone. Shows
 * the shared bottom toast on success, per Figma node 0-19315 — every copy
 * action on the page uses this same toast, not just the mini-editor's own.
 */
async function copyQuoteToClipboard(quote, author) {
  const text = author ? `${quote} — ${author}` : quote;
  try {
    await navigator.clipboard.writeText(text);
    showCopyToast('Quote copied to clipboard');
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads quote + author pairs authored in this same page's collapsible-rows
 * block(s). Works whether collapsible-rows has already decorated
 * (`.collapsible-row-header` / `.collapsible-row-sub-header`) or not yet
 * (raw authored two-column `<div>` rows), since decoration order across
 * blocks on a page isn't guaranteed. Author is optional per row.
 */
function getPageQuotes() {
  const main = document.querySelector('main');
  if (!main) return [];

  const decoratedRowSelector = [
    '.collapsible-rows .collapsible-row-wrapper',
    '.collapsible-rows .collapsible-row-accordion',
  ].join(', ');
  const decoratedRows = main.querySelectorAll(decoratedRowSelector);
  if (decoratedRows.length) {
    return Array.from(decoratedRows, (row) => {
      const quote = row.querySelector('.collapsible-row-header')?.textContent.trim() || '';
      const authorEl = row.querySelector('.collapsible-row-sub-header');
      const author = authorEl?.textContent.trim() || '';
      return { quote, author };
    }).filter((q) => !!q.quote);
  }

  const rawRows = main.querySelectorAll('.collapsible-rows > div');
  return Array.from(rawRows, (row) => {
    const cols = row.querySelectorAll(':scope > div');
    return {
      quote: cols[0]?.textContent.trim() || '',
      author: cols[1]?.textContent.trim() || '',
    };
  }).filter((q) => !!q.quote);
}

function constructProps(block) {
  const props = {
    collectionId: '',
    limit: TEMPLATE_LIMIT,
    topics: '',
  };

  Array.from(block.children).forEach((row) => {
    const cols = row.querySelectorAll(':scope > div');
    const key = cols[0]?.textContent.trim().toLowerCase();
    const knownKeys = ['collection id', 'limit', 'topics'];
    if (cols.length >= 2 && knownKeys.includes(key)) {
      const value = cols[1].textContent.trim();
      if (!value) return;
      if (key === 'collection id') {
        props.collectionId = value.replaceAll('\\:', ':');
      } else if (key === 'limit') {
        const n = parseInt(value, 10);
        if (!Number.isNaN(n) && n > 0) props.limit = n;
      } else if (key === 'topics') {
        props.topics = value;
      }
      return;
    }
    // Content row: heading/subcopy/CTA authored in the first column,
    // regardless of whether DA left a trailing empty second column.
    if (!props.contentRow && cols[0]?.textContent.trim()) {
      props.contentRow = cols[0];
    }
  });

  return props;
}

function buildRecipe(props) {
  const params = new URLSearchParams();
  params.set('limit', String(props.limit));
  if (props.collectionId) params.set('collectionId', props.collectionId);
  if (props.topics) params.set('topics', props.topics);
  return params.toString();
}

async function fetchCardBackgrounds(props) {
  const recipe = buildRecipe(props);
  const res = await fetchResults(recipe);
  if (!res?.items?.length) return [];

  return res.items
    .filter((item) => isValidTemplate(item))
    .slice(0, props.limit)
    .map((item) => {
      const page = item.pages?.[0];
      /* eslint-disable no-underscore-dangle */
      const renditionHref = item._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href;
      const componentHref = item._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href;
      /* eslint-enable no-underscore-dangle */
      const bg = getImageThumbnailSrc(renditionHref, componentHref, page);
      return { id: item.id, bg };
    })
    .filter((card) => !!card.bg);
}

/**
 * Pairs each fetched background card with a quote so every card/quote
 * combination is stable and reusable across the main widget, the desktop
 * decorative cards, and the tablet/mobile carousel — all three read from
 * this same list. Font is deliberately not part of this pairing: every
 * decorative card uses one fixed style (see .me-deco-quote), only the
 * editor's own widget has a font choice — see buildFontControl.
 */
function buildCardSet(cards, quotes) {
  return cards.map((card, i) => ({
    card,
    quote: quotes[i % quotes.length].quote,
    author: quotes[i % quotes.length].author,
  }));
}

/**
 * Milo's decorateButtons only matches `em a` / `strong a` / `p > a strong`
 * (see libs/utils/decorate.js), so a plain `<p><a>` authored here — with no
 * bold/italic wrapper — isn't picked up. Rather than depend on authors
 * remembering to wrap the CTA in `<strong>`, style it directly as a button.
 */
function decorateCta(header) {
  const cta = header.querySelector('a');
  cta?.classList.add('button');
  cta?.classList.add('accent');
}

function buildLogo() {
  return createTag('div', { class: 'mini-editor-logo', 'aria-hidden': 'true' }, [
    getIconElementDeprecated('adobe-express-logo'),
  ]);
}

function buildContentHeader(props) {
  const header = createTag('div', { class: 'mini-editor-header' });
  header.append(buildLogo());
  if (props.contentRow) {
    header.append(...props.contentRow.childNodes);
  }
  return header;
}

export default async function init(block) {
  ({ createTag, loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`));
  loadStyle(`${getConfig().codeRoot}/scripts/widgets/mini-editor-widget/mini-editor-widget.css`);

  const props = constructProps(block);
  block.innerHTML = '';

  const header = buildContentHeader(props);
  block.append(header);
  decorateCta(header);

  const quotes = getPageQuotes();

  try {
    const [cards] = await Promise.all([fetchCardBackgrounds(props), loadWebFonts()]);
    if (!cards.length || !quotes.length) {
      block.closest('.section')?.remove();
      return;
    }
    // Built only once loadWebFonts() has resolved, so this reflects whatever
    // families the Typekit kit actually loaded rather than a guessed list.
    const fontOptions = buildFontOptions();
    const cardSet = buildCardSet(cards, quotes);

    const editor = await createMiniEditorWidget({
      root: block,
      // No top action bar in the current design — reserved by the widget API.
      topActions: [],
      fontOptions,
      backgrounds: { cardSet, decoCount: DECO_CARD_COUNT },
      a11y: {
        trapFocus,
        handleEscapeClose,
        disableBackgroundScroll,
        restoreBackgroundScroll,
        copyQuoteToClipboard,
      },
      deps: { createTag, getIconElementDeprecated },
    });

    // Decorations are appended to the header (not the stage) so they can be
    // positioned to span from just below the header down to the editor's
    // bottom edge, per the Figma reference, without extending past it.
    header.append(editor.decorations);
    block.append(editor.stage);
  } catch (error) {
    window.lana?.log(`Error in mini-editor: ${error?.message || error}`, {
      tags: 'mini-editor',
      severity: 'error',
    });
    block.closest('.section')?.remove();
  }
}
