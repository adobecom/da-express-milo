import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import {
  trapFocus,
  handleEscapeClose,
  disableBackgroundScroll,
  restoreBackgroundScroll,
} from '../../scripts/color-shared/spectrum/utils/a11y.js';
import showCopyToast from '../../scripts/utils/copy-toast.js';
import createMiniEditorWidget from '../../scripts/widgets/mini-editor-widget/mini-editor-widget.js';
import getCardBackgrounds from './mini-editor-background-loader.js';
import getFontOptions from './mini-editor-fonts-loader.js';

let createTag;
let loadStyle;
let getConfig;

const TEMPLATE_LIMIT = 8;
const DECO_CARD_COUNT = 8;

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
  // codeRoot lets the background loader resolve bundled static images against
  // the deploy path when no collectionId is authored (see
  // mini-editor-background-loader).
  props.codeRoot = getConfig().codeRoot;
  block.innerHTML = '';

  const header = buildContentHeader(props);
  block.append(header);
  decorateCta(header);

  const quotes = getPageQuotes();

  try {
    // Backgrounds and fonts load in parallel — each loader owns its own
    // source selection (static vs fetched cards / Typekit vs fallback fonts).
    const [cards, fontOptions] = await Promise.all([
      getCardBackgrounds(props),
      getFontOptions(),
    ]);
    if (!cards.length || !quotes.length) {
      block.closest('.section')?.remove();
      return;
    }
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
