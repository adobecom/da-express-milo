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

let createTag;

const TEMPLATE_LIMIT = 8;
const DECO_CARD_COUNT = 8;
const TABLET_BREAKPOINT = 1199;

const FONT_OPTIONS = [
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

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
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
    .map((item, index) => {
      const page = item.pages?.[0];
      /* eslint-disable no-underscore-dangle */
      const renditionHref = item._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href;
      const componentHref = item._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href;
      /* eslint-enable no-underscore-dangle */
      const bg = getImageThumbnailSrc(renditionHref, componentHref, page);
      return {
        id: item.id,
        bg,
        theme: index % 2 === 0 ? 'light' : 'dark',
      };
    })
    .filter((card) => !!card.bg);
}

/**
 * Pairs each fetched background card with a quote (and a font, cycling
 * through FONT_OPTIONS) so every card/quote/font combination is stable and
 * reusable across the main widget, the desktop decorative cards, and the
 * tablet/mobile carousel — all three read from this same list.
 */
function buildCardSet(cards, quotes) {
  return cards.map((card, i) => ({
    card,
    quote: quotes[i % quotes.length].quote,
    author: quotes[i % quotes.length].author,
    font: FONT_OPTIONS[i % FONT_OPTIONS.length],
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
  return createTag('div', { class: 'quote-maker-logo', 'aria-hidden': 'true' }, [
    getIconElementDeprecated('adobe-express-logo'),
  ]);
}

function buildContentHeader(props) {
  const header = createTag('div', { class: 'quote-maker-header' });
  header.append(buildLogo());
  if (props.contentRow) {
    header.append(...props.contentRow.childNodes);
  }
  return header;
}

/**
 * Builds one font-option button. Used to populate both the tablet/desktop
 * inline row and the mobile bottom-sheet grid from the same FONT_OPTIONS
 * list, so a single `selectFont` closure can keep both in sync regardless
 * of which one is visible at the current breakpoint.
 */
function buildFontButton(opt, index, onPick) {
  const style = [
    `font-family:${opt.font};`,
    opt.italic ? 'font-style:italic;' : '',
    opt.weight ? `font-weight:${opt.weight};` : '',
  ].join('');
  const btn = createTag('button', {
    type: 'button',
    class: `qm-font${index === 0 ? ' is-selected' : ''}`,
    style,
    'data-font': opt.font,
    role: 'option',
    'aria-selected': index === 0 ? 'true' : 'false',
  });
  btn.textContent = opt.label;
  btn.addEventListener('click', () => onPick(opt));
  return btn;
}

function buildFontControl(block, onSelect) {
  const control = createTag('button', {
    type: 'button',
    class: 'qm-control qm-control--font',
    'aria-expanded': 'false',
  });
  const pill = createTag('span', { class: 'qm-pill' });
  pill.textContent = FONT_OPTIONS[0].label;
  const label = createTag('span', { class: 'qm-control-label' });
  label.textContent = 'Font style';
  control.append(pill, label);

  const panel = createTag('div', {
    class: 'qm-row qm-row--fonts',
    role: 'listbox',
    'aria-label': 'Font style',
  });
  const sheetGrid = createTag('div', {
    class: 'qm-sheet-grid qm-sheet-grid--fonts',
    role: 'listbox',
    'aria-label': 'Font style',
  });

  function selectFont(opt) {
    block.style.setProperty('--qm-quote-font', opt.font);
    pill.textContent = opt.label;
    pill.style.fontFamily = opt.font;
    [panel, sheetGrid].forEach((container) => {
      container.querySelectorAll('.qm-font').forEach((f) => {
        const isMatch = f.dataset.font === opt.font;
        f.classList.toggle('is-selected', isMatch);
        f.setAttribute('aria-selected', String(isMatch));
      });
    });
  }

  const onPick = (opt) => {
    selectFont(opt);
    onSelect?.(opt);
  };
  FONT_OPTIONS.forEach((opt, index) => {
    panel.append(buildFontButton(opt, index, onPick));
    sheetGrid.append(buildFontButton(opt, index, onPick));
  });

  control.addEventListener('click', () => {
    const isOpen = block.getAttribute('data-qm-panel') === 'fonts';
    block.setAttribute('data-qm-panel', isOpen ? 'none' : 'fonts');
    control.setAttribute('aria-expanded', String(!isOpen));
  });

  return {
    control, panel, sheetGrid, selectFont,
  };
}

/**
 * Builds one background-colour swatch button. Shared between the inline
 * row and the mobile bottom-sheet grid, same rationale as buildFontButton.
 */
function buildSwatchButton(card, index, onPick) {
  const btn = createTag('button', {
    type: 'button',
    class: `qm-swatch-btn${index === 0 ? ' is-selected' : ''}`,
    'data-bg': card.bg,
    'data-theme': card.theme,
    role: 'option',
    'aria-selected': index === 0 ? 'true' : 'false',
    'aria-label': `Background ${index + 1}`,
  });
  const fill = createTag('span', {
    class: 'qm-swatch-fill',
    style: `background-image:url("${card.bg}")`,
  });
  btn.append(fill);
  btn.addEventListener('click', () => onPick(card));
  return btn;
}

function buildColorControl(block, cards, onSelect) {
  const control = createTag('button', {
    type: 'button',
    class: 'qm-control qm-control--colour',
    'aria-expanded': 'false',
  });
  const swatch = createTag('span', { class: 'qm-swatch' });
  const label = createTag('span', { class: 'qm-control-label' });
  label.textContent = 'Background colour';
  control.append(swatch, label);

  const panel = createTag('div', {
    class: 'qm-row qm-row--colour',
    role: 'listbox',
    'aria-label': 'Background colour',
  });
  // All fetched backgrounds (not just the desktop decoration subset), same
  // as the desktop inline row — the sheet's grid scrolls to fit them all.
  const sheetGrid = createTag('div', {
    class: 'qm-sheet-grid qm-sheet-grid--colour',
    role: 'listbox',
    'aria-label': 'Background colour',
  });

  function selectSwatch(bg, theme) {
    block.style.setProperty('--qm-card-bg', `url("${bg}")`);
    block.setAttribute('data-qm-theme', theme);
    swatch.style.backgroundImage = `url("${bg}")`;
    [panel, sheetGrid].forEach((container) => {
      container.querySelectorAll('.qm-swatch-btn').forEach((s) => {
        const isMatch = s.dataset.bg === bg;
        s.classList.toggle('is-selected', isMatch);
        s.setAttribute('aria-selected', String(isMatch));
      });
    });
  }

  const onPick = (card) => {
    selectSwatch(card.bg, card.theme);
    onSelect?.(card);
  };
  cards.forEach((card, index) => {
    panel.append(buildSwatchButton(card, index, onPick));
    sheetGrid.append(buildSwatchButton(card, index, onPick));
  });

  if (cards[0]) swatch.style.backgroundImage = `url("${cards[0].bg}")`;

  control.addEventListener('click', () => {
    const isOpen = block.getAttribute('data-qm-panel') === 'colour';
    block.setAttribute('data-qm-panel', isOpen ? 'none' : 'colour');
    control.setAttribute('aria-expanded', String(!isOpen));
  });

  return {
    control, panel, sheetGrid, selectSwatch,
  };
}

/**
 * Mobile-only bottom sheet (<=767px) for the font/colour pickers, per Figma
 * frames 0-18589/0-18658. Reuses the same open/close/focus-trap/scroll-lock
 * pattern as font-generator's panel.js. Driven by the same `data-qm-panel`
 * attribute the tablet/desktop inline row already uses — CSS alone decides
 * whether that attribute shows the inline row or this sheet at a given
 * breakpoint, so there's no JS branching on viewport width here.
 */
function buildBottomSheet(block, kind, title, contentEl) {
  const overlay = createTag('div', { class: 'qm-sheet-overlay', 'aria-hidden': 'true', inert: '' });
  const sheet = createTag('div', {
    class: 'qm-sheet',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': title,
    tabindex: '-1',
  });
  const handle = createTag('div', { class: 'qm-sheet-handle', 'aria-hidden': 'true' });
  const titleEl = createTag('p', { class: 'qm-sheet-title' });
  titleEl.textContent = title;
  sheet.append(handle, titleEl, contentEl);
  overlay.append(sheet);

  let focusTrap = null;
  let escapeRelease = null;
  let previouslyFocused = null;

  function close() {
    if (block.getAttribute('data-qm-panel') !== kind) return;
    block.setAttribute('data-qm-panel', 'none');
  }

  function onPanelChange() {
    const isOpen = block.getAttribute('data-qm-panel') === kind;
    overlay.classList.toggle('is-open', isOpen);
    overlay.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) {
      overlay.removeAttribute('inert');
      previouslyFocused = document.activeElement;
      disableBackgroundScroll();
      sheet.focus();
      focusTrap = trapFocus(sheet);
      escapeRelease = handleEscapeClose(sheet, close);
    } else {
      overlay.setAttribute('inert', '');
      restoreBackgroundScroll();
      focusTrap?.release();
      focusTrap = null;
      escapeRelease?.release();
      escapeRelease = null;
      previouslyFocused?.focus();
      previouslyFocused = null;
    }
  }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  return { overlay, onPanelChange };
}

function buildWidget(block, cardSet) {
  const widget = createTag('div', { class: 'quote-maker-widget' });
  const card = createTag('div', { class: 'qm-card' });

  const quoteWrap = createTag('div', {
    class: 'qm-quote-wrap',
    role: 'button',
    tabindex: '0',
    'aria-label': 'Copy quote to clipboard',
  });
  const quoteEl = createTag('p', { class: 'qm-quote' });
  const first = cardSet[0] || { quote: '', author: '' };
  quoteEl.textContent = first.quote;

  const tip = createTag('span', { class: 'qm-tip', 'aria-hidden': 'true' }, [
    createTag('span', { class: 'qm-tip-box' }, ['Click to copy quote']),
  ]);
  quoteWrap.append(quoteEl, tip);

  const authorEl = createTag('p', { class: 'qm-author' });
  authorEl.textContent = first.author;
  authorEl.style.display = first.author ? '' : 'none';

  card.append(quoteWrap, authorEl);
  widget.append(card);

  const doCopy = async () => {
    const ok = await copyToClipboard(quoteEl.textContent);
    if (ok) {
      quoteWrap.classList.add('is-copied');
      setTimeout(() => quoteWrap.classList.remove('is-copied'), 1200);
    }
  };
  quoteWrap.addEventListener('click', doCopy);
  quoteWrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      doCopy();
    }
  });

  if (first.card) {
    block.style.setProperty('--qm-card-bg', `url("${first.card.bg}")`);
    block.setAttribute('data-qm-theme', first.card.theme);
  }

  // Set by init() once the arc carousel exists, so picking a font/colour
  // here also updates the carousel's centre card on tablet/mobile — not
  // just the desktop widget's own .qm-card (which the CSS vars above
  // already cover regardless of listener wiring).
  let onFontOrColourPick = () => {};

  const controls = createTag('div', { class: 'qm-controls' });
  const {
    control: fontControl,
    panel: fontPanel,
    sheetGrid: fontSheetGrid,
    selectFont,
  } = buildFontControl(block, (font) => onFontOrColourPick({ font }));
  const {
    control: colourControl,
    panel: colourPanel,
    sheetGrid: colourSheetGrid,
    selectSwatch,
  } = buildColorControl(
    block,
    cardSet.map((c) => c.card),
    (bgCard) => onFontOrColourPick({ card: bgCard }),
  );
  controls.append(fontControl, colourControl);

  const panelWrap = createTag('div', { class: 'qm-panel' });
  panelWrap.append(fontPanel, colourPanel);

  const fontSheet = buildBottomSheet(block, 'fonts', 'Choose a font style', fontSheetGrid);
  const colourSheet = buildBottomSheet(block, 'colour', 'Choose a background colour', colourSheetGrid);

  widget.append(controls, panelWrap, fontSheet.overlay, colourSheet.overlay);

  // Single MutationObserver on data-qm-panel drives both sheets (mobile) and
  // the aria-expanded state on both trigger buttons (all breakpoints) — the
  // inline row's own visibility is pure CSS (`[data-qm-panel='fonts']`).
  const panelObserver = new MutationObserver(() => {
    const openPanel = block.getAttribute('data-qm-panel');
    fontControl.setAttribute('aria-expanded', String(openPanel === 'fonts'));
    colourControl.setAttribute('aria-expanded', String(openPanel === 'colour'));
    fontSheet.onPanelChange();
    colourSheet.onPanelChange();
  });
  panelObserver.observe(block, { attributes: true, attributeFilter: ['data-qm-panel'] });

  document.addEventListener('click', (e) => {
    if (!widget.contains(e.target)) {
      block.setAttribute('data-qm-panel', 'none');
    }
  });

  return {
    widget,
    useQuote: ({
      quote, author, card: bgCard, font,
    }) => {
      quoteEl.textContent = quote;
      authorEl.textContent = author || '';
      authorEl.style.display = author ? '' : 'none';
      if (bgCard) selectSwatch(bgCard.bg, bgCard.theme);
      if (font) selectFont(font);
    },
    onFontOrColourChange: (listener) => { onFontOrColourPick = listener; },
  };
}

function buildDecoCard(entry, useQuote) {
  const {
    card, quote, author, font,
  } = entry;
  const deco = createTag('div', { class: 'qm-deco', 'data-theme': card.theme, tabindex: '-1' });
  const cardWrap = createTag('div', { class: 'qm-deco-card-wrap' });
  const inner = createTag('div', {
    class: 'qm-deco-card',
    style: `background-image:url("${card.bg}")`,
  });
  const quoteP = createTag('p', {
    class: 'qm-deco-quote',
    style: `font-family:${font.font};${font.italic ? 'font-style:italic;' : ''}`,
  });
  quoteP.textContent = quote;
  inner.append(quoteP);
  if (author) {
    const authorP = createTag('p', { class: 'qm-deco-author' });
    authorP.textContent = author;
    inner.append(authorP);
  }

  const actions = createTag('div', { class: 'qm-deco-actions' });
  const useBtn = createTag('button', { type: 'button', class: 'qm-deco-use' });
  useBtn.textContent = 'Use this quote';
  useBtn.addEventListener('click', () => useQuote(entry));

  const copyBtn = createTag('button', {
    type: 'button',
    class: 'qm-deco-copy',
    'aria-label': 'Copy quote',
  }, [getIconElementDeprecated('copy')]);
  copyBtn.addEventListener('click', async () => {
    const ok = await copyToClipboard(quote);
    if (ok) {
      copyBtn.classList.add('is-copied');
      setTimeout(() => copyBtn.classList.remove('is-copied'), 1200);
    }
  });

  actions.append(useBtn, copyBtn);
  cardWrap.append(inner, actions);
  deco.append(cardWrap);
  return deco;
}

function buildDecoCards(cardSet, useQuote) {
  const wrap = createTag('div', { class: 'quote-maker-decorations', 'aria-hidden': 'true' });
  // cardSet[0] powers the main widget; decorative cards use the rest.
  const decoEntries = cardSet.slice(1, 1 + DECO_CARD_COUNT);
  decoEntries.forEach((entry, i) => {
    const deco = buildDecoCard(entry, useQuote);
    deco.classList.add(`qm-deco--${i + 1}`);
    wrap.append(deco);
  });
  return wrap;
}

/**
 * Builds one of the three carousel cards. Unlike a fixed prev/centre/next
 * slot (which would only ever swap content, never actually move — nothing
 * to transition), each of these 3 elements keeps its own content across a
 * navigation and is reassigned to a *different role's position* — that's
 * what makes the 1s transform transition on .qm-arc-card actually animate
 * a visible slide/rotate between roles instead of an instant content pop.
 */
function buildArcCard(onActivate) {
  const el = createTag('div', {
    class: 'qm-arc-card',
    role: 'option',
    'aria-selected': 'false',
    tabindex: '-1',
  });
  const quoteP = createTag('p', { class: 'qm-arc-quote' });
  const authorP = createTag('p', { class: 'qm-arc-author' });
  el.append(quoteP, authorP);
  el.addEventListener('click', () => onActivate(el));

  function render(entry) {
    el.dataset.theme = entry.card.theme;
    el.style.backgroundImage = `url("${entry.card.bg}")`;
    quoteP.textContent = entry.quote;
    quoteP.style.fontFamily = entry.font.font;
    quoteP.style.fontStyle = entry.font.italic ? 'italic' : '';
    authorP.textContent = entry.author || '';
    authorP.style.display = entry.author ? '' : 'none';
  }

  function setRole(role, { instant = false } = {}) {
    // The recycled card (the one that just left the deck at one edge to
    // re-enter, with new content, at the other edge) needs to land in its
    // new role's position without visibly sliding there — so its role
    // change is applied with the transition switched off for one frame,
    // then restored, rather than animating over the 1s duration like the
    // other two cards' prev<->centre<->next moves.
    if (instant) el.style.transition = 'none';
    el.classList.remove('qm-arc-card--prev', 'qm-arc-card--center', 'qm-arc-card--next');
    el.classList.add(`qm-arc-card--${role}`);
    el.setAttribute('aria-selected', String(role === 'center'));
    el.setAttribute('tabindex', role === 'center' ? '0' : '-1');
    el.style.cursor = role === 'center' ? 'default' : 'pointer';
    el.style.pointerEvents = role === 'center' ? 'none' : 'auto';
    if (instant) {
      el.getBoundingClientRect(); // force reflow so the instant jump commits
      el.style.transition = '';
    }
  }

  return {
    el, render, setRole,
  };
}

/**
 * Tablet/mobile carousel: exactly 3 cards (prev/centre/next) — never more,
 * so nothing off-screen is ever clickable. Clicking an arrow rotates which
 * *role* (and therefore which fixed CSS position/rotation) each of the 3
 * existing card elements occupies, so every navigation is a real transform
 * change on real elements — driven entirely by the 1s CSS transition on
 * .qm-arc-card, not a JS-animated or instantly-popped content swap. Only
 * the card moving furthest (the one leaving `next` on a "next" click, or
 * leaving `prev` on a "prev" click) needs its content replaced, since it's
 * re-entering the deck one step further round; the other two just carry
 * their existing content into their new role.
 */
function buildArcCarousel(cardSet, useQuote) {
  const root = createTag('div', { class: 'qm-arc' });
  const total = cardSet.length;
  let activeIndex = 0;
  // The centre card can be patched independently of cardSet (e.g. the
  // widget's own font/colour controls, which apply on top of whichever
  // entry is currently active) — centreOverride holds that patch and is
  // reset whenever navigation moves a *different* entry into the centre.
  let centreOverride = null;

  const onActivate = (el) => {
    if (el.classList.contains('qm-arc-card--prev')) goPrev(); // eslint-disable-line no-use-before-define
    else if (el.classList.contains('qm-arc-card--next')) goNext(); // eslint-disable-line no-use-before-define
  };
  const cardA = buildArcCard(onActivate);
  const cardB = buildArcCard(onActivate);
  const cardC = buildArcCard(onActivate);
  // roles[i] tracks which role each of cardA/B/C currently occupies, so
  // navigation can rotate them without re-deriving role from DOM classes.
  const cards = [cardA, cardB, cardC];
  let roles = ['prev', 'center', 'next'];

  function applyRoles() {
    cards.forEach((card, i) => card.setRole(roles[i]));
  }

  function centerEntry() {
    return { ...cardSet[activeIndex], ...centreOverride };
  }

  function renderAll() {
    const prevIndex = ((activeIndex - 1) % total + total) % total;
    const nextIndex = (activeIndex + 1) % total;
    cards[roles.indexOf('prev')].render(cardSet[prevIndex]);
    cards[roles.indexOf('center')].render(centerEntry());
    cards[roles.indexOf('next')].render(cardSet[nextIndex]);
  }

  function goNext() {
    activeIndex = (activeIndex + 1) % total;
    centreOverride = null;
    // The card that was centre slides to prev; the card that was next
    // slides into centre (both keep their existing content — that's what
    // the 1s CSS transition actually animates). The card that was prev is
    // recycled: it jumps instantly (no transition) to the next position
    // with new content, rather than visibly sliding across the centre.
    const recycled = cards[roles.indexOf('prev')];
    cards[roles.indexOf('center')].setRole('prev');
    cards[roles.indexOf('next')].setRole('center');
    recycled.setRole('next', { instant: true });
    roles = roles.map((role) => ({ center: 'prev', next: 'center', prev: 'next' }[role]));
    const newNextIndex = (activeIndex + 1) % total;
    recycled.render(cardSet[newNextIndex]);
    cards[roles.indexOf('center')].render(centerEntry());
    useQuote(cardSet[activeIndex]);
  }

  function goPrev() {
    activeIndex = ((activeIndex - 1) % total + total) % total;
    centreOverride = null;
    // Mirror of goNext: centre slides to next, prev slides into centre,
    // and the card that was next is recycled — instantly, new content —
    // to become the new prev.
    const recycled = cards[roles.indexOf('next')];
    cards[roles.indexOf('center')].setRole('next');
    cards[roles.indexOf('prev')].setRole('center');
    recycled.setRole('prev', { instant: true });
    roles = roles.map((role) => ({ center: 'next', prev: 'center', next: 'prev' }[role]));
    const newPrevIndex = ((activeIndex - 1) % total + total) % total;
    recycled.render(cardSet[newPrevIndex]);
    cards[roles.indexOf('center')].render(centerEntry());
    useQuote(cardSet[activeIndex]);
  }

  // Applied from the widget's font/colour pickers (see buildWidget) so
  // selecting a font or background there updates the arc's centre card
  // exactly as it already updates the desktop widget's own .qm-card.
  function updateCentre(patch) {
    centreOverride = { ...centreOverride, ...patch };
    cards[roles.indexOf('center')].render(centerEntry());
  }

  applyRoles();
  renderAll();
  root.append(cardA.el, cardB.el, cardC.el);

  const prevBtn = createTag('button', {
    type: 'button',
    class: 'qm-arc-nav qm-arc-nav--prev',
    'aria-label': 'Previous template',
  }, [getIconElementDeprecated('s2-chevron-left')]);
  const nextBtn = createTag('button', {
    type: 'button',
    class: 'qm-arc-nav qm-arc-nav--next',
    'aria-label': 'Next template',
  }, [getIconElementDeprecated('s2-chevron-right')]);
  root.append(prevBtn, nextBtn);

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);

  return { root, updateCentre };
}

export default async function init(block) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));

  const props = constructProps(block);
  block.innerHTML = '';
  block.setAttribute('data-qm-panel', 'none');

  const header = buildContentHeader(props);
  block.append(header);
  decorateCta(header);

  const quotes = getPageQuotes();

  loadWebFonts();

  try {
    const cards = await fetchCardBackgrounds(props);
    if (!cards.length || !quotes.length) {
      block.closest('.section')?.remove();
      return;
    }
    const cardSet = buildCardSet(cards, quotes);
    // Same 9 entries (the widget's own + the 8 desktop decorations) power
    // the tablet/mobile arc carousel, so it cycles through the identical
    // set of quote/background/font combinations as the desktop zig-zag.
    const arcCardSet = [cardSet[0], ...cardSet.slice(1, 1 + DECO_CARD_COUNT)];

    const stage = createTag('div', { class: 'quote-maker-stage' });
    const { widget, useQuote, onFontOrColourChange } = buildWidget(block, cardSet);
    const decorations = buildDecoCards(cardSet, useQuote);
    const { root: arcCarousel, updateCentre } = buildArcCarousel(arcCardSet, useQuote);
    onFontOrColourChange(updateCentre);
    // Decorations are appended to the header (not the stage) so they can be
    // positioned to span from just below the header down to the editor's
    // bottom edge, per the Figma reference, without extending past it.
    header.append(decorations);
    // The arc carousel is inserted inside the widget, in the same flow slot
    // as .qm-card (which .qm-carousel-mode hides), rather than as a sibling
    // of the widget in the stage — the stage's flex row would otherwise
    // squeeze both side by side instead of the arc taking .qm-card's place.
    widget.querySelector('.qm-card').after(arcCarousel);
    stage.append(widget);
    block.append(stage);

    const isSmallViewport = () => window.innerWidth <= TABLET_BREAKPOINT;
    const syncViewportMode = () => {
      block.classList.toggle('qm-carousel-mode', isSmallViewport());
    };
    syncViewportMode();
    window.addEventListener('resize', syncViewportMode);
  } catch (error) {
    window.lana?.log(`Error in quote-maker: ${error?.message || error}`, {
      tags: 'quote-maker',
      severity: 'error',
    });
    block.closest('.section')?.remove();
  }
}
