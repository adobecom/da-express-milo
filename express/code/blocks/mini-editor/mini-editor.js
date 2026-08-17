import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import {
  trapFocus,
  handleEscapeClose,
  disableBackgroundScroll,
  restoreBackgroundScroll,
} from '../../scripts/color-shared/spectrum/utils/a11y.js';
import showCopyToast from '../../scripts/utils/copy-toast.js';
import MiniEditorCardExporter from '../../scripts/utils/mini-editor-card-export.js';
import { showExpressToast } from '../../scripts/color-shared/spectrum/components/express-toast.js';
import createMiniEditorWidget from '../../scripts/widgets/mini-editor-widget/mini-editor-widget.js';
import createMiniEditorModal from '../../scripts/widgets/mini-editor-modal/mini-editor-modal.js';
import getCardBackgrounds from './mini-editor-background-loader.js';
import getFontOptions from './mini-editor-fonts-loader.js';

let createTag;
let loadStyle;
let getConfig;
let replaceKey;

const TEMPLATE_LIMIT = 8;
const DECO_CARD_COUNT = 8;

// Module-level (not a DOM query) so two mini-editor blocks decorating
// concurrently on the same page can't both pass an empty check before either
// has appended its modal — only the first init() call builds one.
let modalPromise = null;

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

async function downloadCard(block, editor) {
  const downloadButton = block.querySelector('.me-action--download');
  if (downloadButton?.disabled) return;

  try {
    if (downloadButton) {
      downloadButton.disabled = true;
      downloadButton.setAttribute('aria-busy', 'true');
      await new Promise(requestAnimationFrame);
    }
    const model = editor?.getContentModel();
    if (!model) throw new Error('Mini-editor content model is unavailable');
    await MiniEditorCardExporter.download(model);
  } catch (error) {
    window.lana?.log(`Mini-editor download failed: ${error?.message || error}`, {
      tags: 'mini-editor,download',
      severity: 'error',
    });
    const message = await replaceKey('screenshot-download-failed', getConfig());
    await showExpressToast({ message, variant: 'negative' });
  } finally {
    if (downloadButton) {
      downloadButton.disabled = false;
      downloadButton.removeAttribute('aria-busy');
    }
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

  // The .expandable (table-layout) variant reserves its first two raw rows
  // for a background image and a section title (see collapsible-rows.js
  // buildTableLayout's rows.shift() calls) — those aren't quotes, and this
  // raw fallback has no way to tell them apart from real quote rows before
  // collapsible-rows decorates. Skip it there; the decorated-row path above
  // already handles that variant correctly once it has decorated.
  const rawRows = main.querySelectorAll('.collapsible-rows:not(.expandable) > div');
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
    const [firstCol] = cols;
    if (!props.contentRow && firstCol?.textContent.trim()) {
      props.contentRow = firstCol;
    }
  });

  return props;
}

// Above this, a decorative card (.me-deco-quote) would need to truncate —
// see truncateQuote in mini-editor-widget.js. Quote SELECTION (which quote
// goes on which card) prefers staying under this so a deco card only ever
// truncates when there's truly no untruncated quote left to give it.
const DECO_QUOTE_CHAR_LIMIT = 216;

/**
 * Pairs each fetched background card with a quote so every card/quote
 * combination is stable and reusable across the main widget, the desktop
 * decorative cards, and the tablet/mobile carousel — all three read from
 * this same list. Font is deliberately not part of this pairing: every
 * decorative card uses one fixed style (see .me-deco-quote), only the
 * editor's own widget has a font choice — see buildFontControl.
 *
 * cardSet[0] (the main widget's own card, no character limit — see
 * DECO_QUOTE_CHAR_LIMIT's own truncation in the widget) always gets the
 * first authored quote, same as before. For the decorative cards
 * (cardSet[1..]), quotes at or under DECO_QUOTE_CHAR_LIMIT are cycled
 * through first — every short quote gets used at least once before any
 * long quote is reused — since a card only needs to fall back to a long,
 * truncated quote once every short one has already been given a card.
 */
function buildCardSet(cards, quotes) {
  const decoSlotCount = Math.max(0, cards.length - 1);
  const [firstQuote] = quotes;
  const shortQuotes = quotes.filter((q) => q.quote.length <= DECO_QUOTE_CHAR_LIMIT);
  const longQuotes = quotes.filter((q) => q.quote.length > DECO_QUOTE_CHAR_LIMIT);

  // Round-robins `pool` to exactly `count` entries — used to fill deco
  // slots with short quotes first, reusing each one only after every other
  // short quote already has a slot, then the same for long quotes.
  const takeRoundRobin = (pool, count) => Array.from(
    { length: Math.min(count, pool.length ? count : 0) },
    (_, i) => pool[i % pool.length],
  );

  const decoQuotes = shortQuotes.length >= decoSlotCount
    ? takeRoundRobin(shortQuotes, decoSlotCount)
    : [...takeRoundRobin(shortQuotes, shortQuotes.length),
      ...takeRoundRobin(longQuotes, decoSlotCount - shortQuotes.length)];

  return cards.map((card, i) => {
    const { quote, author } = i === 0 ? firstQuote : decoQuotes[i - 1];
    return { card, quote, author };
  });
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
  ({ replaceKey } = await import(`${getLibs()}/features/placeholders.js`));
  loadStyle(`${getConfig().codeRoot}/scripts/widgets/mini-editor-widget/mini-editor-widget.css`);
  loadStyle(`${getConfig().codeRoot}/scripts/widgets/mini-editor-modal/mini-editor-modal.css`);

  const props = constructProps(block);
  block.innerHTML = '';

  // Wraps the block's whole rendered output in Spectrum's own theme host so
  // its design-token CSS custom properties (--spectrum-*) are actually
  // defined for descendants — without it, the topActions icons (real
  // Spectrum Web Components, see mini-editor-widget.js) fall back to
  // unstyled defaults and don't match the intended look.
  await import('../../scripts/widgets/spectrum/dist/theme.js');
  const themeHost = createTag('sp-theme', {
    system: 'spectrum-two', color: 'light', scale: 'medium', dir: 'ltr',
  });
  block.append(themeHost);

  const header = buildContentHeader(props);
  themeHost.append(header);
  decorateCta(header);

  const quotes = getPageQuotes();

  try {
    // Backgrounds and fonts load in parallel — the font loader owns its own
    // source selection (Typekit vs fallback fonts); backgrounds always fetch
    // from the template service.
    const [cards, fontOptions] = await Promise.all([
      getCardBackgrounds(props),
      getFontOptions(),
    ]);
    if (!cards.length || !quotes.length) {
      block.closest('.section')?.remove();
      return;
    }
    const cardSet = buildCardSet(cards, quotes);
    const a11y = {
      trapFocus,
      handleEscapeClose,
      disableBackgroundScroll,
      restoreBackgroundScroll,
      copyQuoteToClipboard,
    };
    const deps = { createTag, getIconElementDeprecated };

    let editor;
    const getShareContent = async (action, strings) => {
      if (action.value === 'whatsapp') {
        return { data: { whatsappText: `${strings.heading}: ${window.location.href}` } };
      }
      const model = editor?.getContentModel();
      if (!model) throw new Error('Mini-editor content model is unavailable');
      const blob = await MiniEditorCardExporter.createCardBlob(model);
      const file = new File([blob], 'quote-card.png', { type: blob.type || 'image/png' });
      return {
        share: { title: strings.heading, files: [file] },
        clipboard: { files: [file] },
      };
    };

    editor = await createMiniEditorWidget({
      root: block,
      topActions: [
        { type: 'edit', onClick: () => console.info('mini-editor: edit action not yet implemented') },
        {
          type: 'share',
          shareMenu: {
            heading: { key: 'mini-editor-share-image', fallback: 'Share image' },
            actions: [
              {
                value: 'whatsapp',
                type: 'custom',
                label: { key: 'share-menu-whatsapp', fallback: 'WhatsApp' },
                icon: () => createTag('sp-icon', {
                  src: '/express/code/icons/S2_Icon_WhatsApp_20_N.svg',
                  size: 'm',
                }),
                onSelect: ({ data }) => {
                  const text = encodeURIComponent(data.whatsappText);
                  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
                },
              },
              {
                value: 'copy',
                type: 'copy',
                label: { key: 'mini-editor-copy-image', fallback: 'Copy image' },
                success: {
                  key: 'mini-editor-image-copied',
                  fallback: 'Image copied to clipboard',
                },
                icon: () => createTag('sp-icon-image'),
              },
              {
                value: 'more',
                type: 'native',
                label: { key: 'share-menu-more-options', fallback: 'More options' },
                icon: () => createTag('sp-icon-more'),
                fallback: 'copy',
                dismissOnSelect: () => window.matchMedia('(pointer: coarse)').matches,
              },
            ],
            feedback: {
              failed: {
                key: 'mini-editor-share-failed',
                fallback: 'Unable to share this design.',
              },
            },
            getContent: getShareContent,
            notify: async ({ message, variant, action }) => {
              if (variant === 'positive' && action.type === 'copy') {
                await showCopyToast(message);
              } else {
                await showExpressToast({ message, variant });
              }
            },
          },
        },
        { type: 'download', onClick: () => downloadCard(block, editor) },
      ],
      fontOptions,
      backgrounds: { cardSet, decoCount: DECO_CARD_COUNT },
      a11y,
      deps,
    });

    // Decorations are appended to the header (not the stage) so they can be
    // positioned to span from just below the header down to the editor's
    // bottom edge, per the Figma reference, without extending past it.
    header.append(editor.decorations);
    themeHost.append(editor.stage);

    // "Create a design" on collapsible-rows' quotes (see collapsible-rows.js)
    // opens this modal — showing just the centre editor card, identically
    // across desktop/tablet/mobile — instead of scrolling to this inline
    // block. One modal per page regardless of how many mini-editor blocks
    // are authored (modalPromise, not a DOM query, so two blocks decorating
    // concurrently can't both build one), reusing this block's own fetched
    // cards/fonts.
    modalPromise ??= createMiniEditorModal({
      fontOptions,
      backgrounds: { cardSet, decoCount: DECO_CARD_COUNT },
      a11y,
      deps,
    }).then((modal) => {
      document.body.append(modal.el);
      return modal;
    });
    await modalPromise;
  } catch (error) {
    window.lana?.log(`Error in mini-editor: ${error?.message || error}`, {
      tags: 'mini-editor',
      severity: 'error',
    });
    block.closest('.section')?.remove();
  }

  const miniEditor = document.querySelector('.mini-editor');
  miniEditor.querySelector('.mini-editor-header a.quick-link').tabIndex = 1;
}
