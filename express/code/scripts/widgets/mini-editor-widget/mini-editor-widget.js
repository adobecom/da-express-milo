/**
 * Mini Editor Widget
 *
 * A configurable in-page quote-editing surface. It renders one editing stage
 * that adapts across breakpoints from the same config — the desktop widget
 * card + zig-zag decorative previews, and the tablet/mobile 3-card arc
 * carousel — plus the shared font/background controls (inline expanding rows
 * on tablet/desktop, bottom sheets on mobile). The caller supplies the data
 * (content header, font options, background cards, quotes); the widget owns
 * all rendering, interaction, and animation, so a block only has to fetch
 * data and mount the result. Pass `decorations: false` to skip the
 * decorative cards / arc carousel entirely and render just the centre editor
 * card, e.g. for a host that shows the widget inside a modal.
 *
 * UI/UX is intentionally identical to the original in-block implementation —
 * this widget is an extraction of that surface, not a redesign. It is plain
 * vanilla DOM with one exception: the top-right action bar (`topActions`,
 * Figma node 1099-5050) renders real Spectrum Web Components icons
 * (`sp-icon-*`), lazily loaded from `../spectrum/dist/icons-workflow.js`
 * only when `topActions` is non-empty — no `<sp-theme>`/Spectrum design
 * tokens are required, since the icons are sized/coloured directly via their
 * own `--mod-icon-size`/`--mod-icon-color` CSS hooks (see mini-editor-widget.css).
 *
 * Usage:
 *   import createMiniEditorWidget from
 *     '../../scripts/widgets/mini-editor-widget/mini-editor-widget.js';
 *
 *   const editor = await createMiniEditorWidget({
 *     root: block,          // element the widget sets state attrs/vars on
 *     content: headerEl,    // authored heading/subcopy/CTA lockup
 *     topActions: [         // top-right hover action bar (Figma 1099-5050)
 *       { type: 'edit', onClick: onEdit },
 *       { type: 'share', onClick: onShare },
 *       { type: 'download', onClick: onDownload },
 *     ],
 *     fontOptions: [...],   // { label, font, italic, weight }
 *     backgrounds: {        // our fetched card set + quotes
 *       cardSet: [{ card: { id, bg }, quote, author }, ...],
 *       decoCount: 8,
 *     },
 *   });
 *   stageParent.append(editor.stage);
 *   headerEl.append(editor.decorations);
 */

let createTag;
let getIconElementDeprecated;

const DECO_CARD_COUNT = 8;
const DECO_QUOTE_CHAR_LIMIT = 216;
const EDITOR_QUOTE_CHAR_LIMIT = 248;

/**
 * Truncates display text at a whole-word boundary within `limit` characters,
 * appending "…" — never mid-word. Display-only: callers keep the original,
 * untruncated string for copy-to-clipboard and accessible names, so nothing
 * a user actually acts on is ever silently shortened.
 */
function truncateQuote(quote, limit) {
  if (quote.length <= limit) return quote;
  const cut = quote.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed}…`;
}

/**
 * True at the same <=767px width mini-editor-widget.css switches the inline
 * font/colour row for the mobile bottom sheet. Checked live (not cached) at
 * each click site that needs it, since panelMode itself is a static string
 * baked in at widget creation and can't otherwise react to a resize/rotation
 * while a host (e.g. the modal) stays open across it.
 */
function isMobileSheetWidth() {
  return window.matchMedia('(width <= 767px)').matches;
}

// On a touch/coarse-pointer device (tablet, phone), use the shorter of
// width/height rather than window.innerWidth alone — a physical device's
// short axis is orientation-independent, so this keeps the same tablet from
// flipping into the desktop zig-zag layout just because rotating to
// landscape made innerWidth exceed the breakpoint. Plain mouse/desktop
// windows don't have a fixed physical "short side" (resizing changes both
// dimensions independently), so they keep the simple width-only check —
// otherwise a short-but-wide desktop browser window would wrongly be
// treated as a tablet. Checked live (not cached), same rationale as
// isMobileSheetWidth above — this also gates whether the keyboard-only
// "Skip quote suggestions" CTA (only meaningful for reaching the desktop
// zig-zag deco cards, which don't exist in arc/carousel mode) is built at
// all, so it must react to the same breakpoint the carousel mode itself does.
const TABLET_BREAKPOINT = 1199;
function isSmallViewport() {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const size = isTouchDevice
    ? Math.min(window.innerWidth, window.innerHeight)
    : window.innerWidth;
  return size <= TABLET_BREAKPOINT;
}

/**
 * Wires roving-tabindex keyboard navigation across a row of `role="option"`
 * buttons (the font row's .me-font buttons, the colour row's .me-swatch-btn
 * buttons) — only one option is ever a real Tab stop at a time (tabindex 0,
 * the rest -1), Left/Right arrows move that stop between siblings, and Tab
 * from the current stop always exits the row via `onTabOut` rather than
 * advancing to the next sibling. This is deliberate, not just "how roving
 * tabindex usually works": `control`'s own explicit tabindex (9/10, see
 * buildFontControl/buildColorControl) sits in this widget's page-wide
 * sequential numbering (1-10+, see buildMiniEditorActions/getQuoteWrap),
 * while these options default to tabindex 0/-1 — mixing the two means a
 * plain Tab press from a tabindex=0 option would resume the browser's
 * *global* ascending-tabindex sweep (landing wherever the next positive
 * tabindex element on the page is, not necessarily this row's intended
 * next stop), so `onTabOut` is called explicitly with `preventDefault()`
 * instead of ever letting native Tab traversal decide.
 */
function wireOptionRowRoving(panel, optionSelector, onTabOut) {
  function optionsOf() {
    return [...panel.querySelectorAll(optionSelector)];
  }

  // Every option starts at tabindex=-1 (not a Tab stop) except whichever one
  // is already the current selection, so opening the row never introduces
  // more than the one roving Tab stop the pattern expects.
  function initTabindexes() {
    const options = optionsOf();
    const selectedIndex = Math.max(0, options.findIndex((o) => o.classList.contains('is-selected')));
    options.forEach((opt, i) => { opt.tabIndex = i === selectedIndex ? 0 : -1; });
  }
  initTabindexes();

  function focusOption(index) {
    const options = optionsOf();
    if (!options.length) return;
    const clamped = ((index % options.length) + options.length) % options.length;
    options.forEach((opt, i) => { opt.tabIndex = i === clamped ? 0 : -1; });
    options[clamped].focus();
  }

  panel.addEventListener('keydown', (e) => {
    const options = optionsOf();
    const currentIndex = options.indexOf(document.activeElement);
    if (currentIndex === -1) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusOption(currentIndex + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusOption(currentIndex - 1);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      onTabOut();
    }
  });

  // Re-run after a click-driven selection change (see selectFont/selectSwatch
  // callers) so the roving Tab stop follows whichever option is now
  // is-selected, instead of staying on whatever was current before the click.
  return { focusFirst: () => focusOption(0), syncTabindexes: initTabindexes };
}

// Same focusable-element set as this codebase's shared a11y.js FOCUSABLE
// (not imported directly — that module's copy is private/unexported), used
// below purely to find where real page tab order resumes after this widget.
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * First element in true document order, matching FOCUSABLE_SELECTOR, that
 * sits entirely after `root` (i.e. not a descendant of it) — used by the
 * Skip-quote-suggestions CTA (below) to jump past the *whole* `.mini-editor`
 * block on Enter/Space, landing wherever the page's own natural Tab order
 * would go next, rather than merely skipping the deco cards within it.
 */
function findNextFocusableAfter(root) {
  const candidates = [...document.querySelectorAll(FOCUSABLE_SELECTOR)];
  return candidates.find((el) => {
    if (root.contains(el)) return false;
    // DOCUMENT_POSITION_FOLLOWING (4): true only when el comes after root in
    // the document, filtering out anything before .mini-editor on the page.
    return !!(root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
}

/**
 * Keyboard-only "Skip quote suggestions" CTA, per Figma node 54:11762. Not a
 * normal Tab stop (tabindex=-1 at rest, never visible) — it only exists to
 * bridge keyboard traversal from the font/colour controls to the desktop
 * zig-zag deco cards (see createMiniEditorWidget's setDecoChainTarget),
 * appearing solely when Tab lands here from the colour control or its open
 * row of swatches (see buildColorControl's onTabOut). Tab moves on into the
 * deco cards' own guided chain; Enter/Space does the opposite — it skips
 * past the *entire* .mini-editor block (not just the deco chain), landing
 * on whatever the page's real Tab order has next after this widget, via
 * findNextFocusableAfter.
 */
function buildSkipQuoteSuggestionsCta(root) {
  const element = createTag('button', {
    type: 'button',
    class: 'me-skip-suggestions',
    tabindex: '-1',
  });
  element.textContent = 'Skip quote suggestions';

  // Set once the deco cards exist (see createMiniEditorWidget) — Tab moves
  // on into them; Enter/Space (below) skips past the whole block instead.
  let onTabOut = null;

  function hide() {
    element.classList.remove('is-visible');
    element.tabIndex = -1;
  }

  function show() {
    element.classList.add('is-visible');
    element.tabIndex = 0;
    element.focus();
  }

  element.addEventListener('blur', hide);
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      hide();
      findNextFocusableAfter(root)?.focus();
    } else if (e.key === 'Tab' && !e.shiftKey && onTabOut) {
      e.preventDefault();
      onTabOut();
    }
  });

  return {
    element,
    show,
    hide,
    setTabOutTarget: (fn) => { onTabOut = fn; },
  };
}

/**
 * Builds one font-option button. Used to populate both the tablet/desktop
 * inline row and the mobile bottom-sheet grid from the same fontOptions
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
    class: `me-font${index === 0 ? ' is-selected' : ''}`,
    style,
    'data-font': opt.font,
    role: 'option',
    'aria-selected': index === 0 ? 'true' : 'false',
  });
  btn.textContent = opt.label;
  btn.addEventListener('click', () => onPick(opt));
  return btn;
}

function buildFontControl(root, fontOptions, onSelect, panelMode, onTabOutOfOptions) {
  const control = createTag('button', {
    type: 'button',
    tabIndex: 9,
    class: 'me-control me-control--font',
    'aria-expanded': 'false',
  });
  const pill = createTag('span', { class: 'me-pill' });
  pill.textContent = fontOptions[0].label;
  const label = createTag('span', { class: 'me-control-label' });
  label.textContent = 'Font style';
  control.append(pill, label);

  const panel = createTag('div', {
    class: 'me-row me-row--fonts',
    role: 'listbox',
    'aria-label': 'Font style',
  });
  const sheetGrid = createTag('div', {
    class: 'me-sheet-grid me-sheet-grid--fonts',
    role: 'listbox',
    'aria-label': 'Font style',
  });

  let roving;
  function selectFont(opt) {
    root.style.setProperty('--me-quote-font', opt.font);
    root.style.setProperty('--me-quote-font-style', opt.italic ? 'italic' : 'normal');
    root.style.setProperty('--me-quote-font-weight', opt.weight || 'normal');
    pill.textContent = opt.label;
    pill.style.fontFamily = opt.font;
    pill.style.fontStyle = opt.italic ? 'italic' : 'normal';
    pill.style.fontWeight = opt.weight || 'normal';
    [panel, sheetGrid].forEach((container) => {
      container.querySelectorAll('.me-font').forEach((f) => {
        const isMatch = f.dataset.font === opt.font;
        f.classList.toggle('is-selected', isMatch);
        f.setAttribute('aria-selected', String(isMatch));
      });
    });
    roving?.syncTabindexes();
  }

  const onPick = (opt) => {
    selectFont(opt);
    onSelect?.(opt);
  };
  fontOptions.forEach((opt, index) => {
    panel.append(buildFontButton(opt, index, onPick));
    sheetGrid.append(buildFontButton(opt, index, onPick));
  });

  // Applies fontOptions[0] as --me-quote-font immediately, instead of
  // leaving the block on its CSS default (--body-font-family) until the
  // user's first click — the first .me-font button already renders
  // is-selected, so the quote itself should match on load, not just the
  // control's own affordances.
  selectFont(fontOptions[0]);

  // Desktop inline row only (see wireOptionRowRoving) — the mobile bottom
  // sheet's own grid keeps native default tab order, out of scope here.
  roving = wireOptionRowRoving(panel, '.me-font', () => onTabOutOfOptions?.());

  control.addEventListener('click', () => {
    const isOpen = root.getAttribute('data-me-panel') === 'fonts';
    // In always-open-inline mode (the modal, tablet/desktop only — mobile
    // falls back to the normal bottom-sheet toggle below), one panel must
    // always stay open — clicking the already-open control's own trigger is
    // a no-op instead of collapsing to 'none', since there is no "both
    // closed" state for this host to fall back to.
    if (panelMode === 'always-open-inline' && isOpen && !isMobileSheetWidth()) return;
    root.setAttribute('data-me-panel', isOpen ? 'none' : 'fonts');
    control.setAttribute('aria-expanded', String(!isOpen));
  });

  // Enter/Space on the trigger itself opens the row via the click handler
  // above (native <button> behaviour). Tab, once the row is open, moves
  // straight to the first option instead of wherever native tab order would
  // otherwise land — the options themselves default to tabindex=-1 (see
  // wireOptionRowRoving), so without this the row would look open but be
  // unreachable by keyboard.
  control.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    if (root.getAttribute('data-me-panel') !== 'fonts' || isMobileSheetWidth()) return;
    e.preventDefault();
    roving.focusFirst();
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
    class: `me-swatch-btn${index === 0 ? ' is-selected' : ''}`,
    'data-bg': card.bg,
    role: 'option',
    'aria-selected': index === 0 ? 'true' : 'false',
    'aria-label': `Background ${index + 1}`,
  });
  const fill = createTag('span', {
    class: 'me-swatch-fill',
    style: `background-image:url("${card.bg}")`,
  });
  btn.append(fill);
  btn.addEventListener('click', () => onPick(card));
  return btn;
}

function buildColorControl(root, cards, onSelect, panelMode, onTabOut) {
  const control = createTag('button', {
    type: 'button',
    class: 'me-control me-control--colour',
    'aria-expanded': 'false',
    tabIndex: 10,
  });
  const swatch = createTag('span', { class: 'me-swatch' });
  // "colour" drops on mobile (label reads "Background" only there) — kept
  // as a separate span hidden via CSS rather than swapping textContent, so
  // there's no JS branching on viewport width for what's purely a label fit.
  const label = createTag('span', { class: 'me-control-label' }, [
    'Background',
    createTag('span', { class: 'me-control-label-suffix' }, [' colour']),
  ]);
  control.append(swatch, label);

  const panel = createTag('div', {
    class: 'me-row me-row--colour',
    role: 'listbox',
    'aria-label': 'Background colour',
  });
  // All fetched backgrounds (not just the desktop decoration subset), same
  // as the desktop inline row — the sheet's grid scrolls to fit them all.
  const sheetGrid = createTag('div', {
    class: 'me-sheet-grid me-sheet-grid--colour',
    role: 'listbox',
    'aria-label': 'Background colour',
  });

  let roving;
  function selectSwatch(bg) {
    root.style.setProperty('--me-card-bg', `url("${bg}")`);
    swatch.style.backgroundImage = `url("${bg}")`;
    [panel, sheetGrid].forEach((container) => {
      container.querySelectorAll('.me-swatch-btn').forEach((s) => {
        const isMatch = s.dataset.bg === bg;
        s.classList.toggle('is-selected', isMatch);
        s.setAttribute('aria-selected', String(isMatch));
      });
    });
    roving?.syncTabindexes();
  }

  const onPick = (card) => {
    selectSwatch(card.bg);
    onSelect?.(card);
  };
  cards.forEach((card, index) => {
    panel.append(buildSwatchButton(card, index, onPick));
    sheetGrid.append(buildSwatchButton(card, index, onPick));
  });

  if (cards[0]) swatch.style.backgroundImage = `url("${cards[0].bg}")`;

  // Same rationale as buildFontControl's roving — Tab from any swatch (not
  // just the current one) always exits via onTabOut (the Skip-quote-
  // suggestions CTA on desktop, or straight past .mini-editor on small
  // viewports where that CTA doesn't exist — see buildWidget's wiring),
  // never advances between swatches (that's Left/Right's job). This inline
  // row is shown down to the small-app-frame/arc breakpoint, not just
  // desktop widths — only the narrower <=767px bottom sheet replaces it
  // (see isMobileSheetWidth), so this wiring applies at both.
  roving = wireOptionRowRoving(panel, '.me-swatch-btn', () => onTabOut?.());

  control.addEventListener('click', () => {
    const isOpen = root.getAttribute('data-me-panel') === 'colour';
    // See buildFontControl's identical guard for always-open-inline mode.
    if (panelMode === 'always-open-inline' && isOpen && !isMobileSheetWidth()) return;
    root.setAttribute('data-me-panel', isOpen ? 'none' : 'colour');
    control.setAttribute('aria-expanded', String(!isOpen));
  });

  // Tab off the trigger itself — whether or not its row is open — always
  // goes via onTabOut (same destination as tabbing out of the open row's own
  // swatches, see above): the colour control is the last of the two
  // pickers, so nothing else in this control->options chain follows it.
  // isMobileSheetWidth (<=767px, narrower than the small-app-frame/arc
  // breakpoint) is the one range this is skipped for — the bottom sheet's
  // own focus handling takes over there instead.
  control.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    if (isMobileSheetWidth()) return;
    const isOpen = root.getAttribute('data-me-panel') === 'colour';
    if (isOpen) {
      e.preventDefault();
      roving.focusFirst();
    } else {
      e.preventDefault();
      onTabOut?.();
    }
  });

  return {
    control, panel, sheetGrid, selectSwatch,
  };
}

/**
 * Mobile-only bottom sheet (<=767px) for the font/colour pickers, per Figma
 * frames 0-18589/0-18658. Reuses the same open/close/focus-trap/scroll-lock
 * pattern as font-generator's panel.js. Driven by the same `data-me-panel`
 * attribute the tablet/desktop inline row already uses — CSS alone decides
 * whether that attribute shows the inline row or this sheet at a given
 * breakpoint, so there's no JS branching on viewport width here.
 */
function buildBottomSheet(root, a11y, kind, title, contentEl) {
  const {
    trapFocus, handleEscapeClose, disableBackgroundScroll, restoreBackgroundScroll,
  } = a11y;
  const overlay = createTag('div', { class: 'me-sheet-overlay', 'aria-hidden': 'true', inert: '' });
  const sheet = createTag('div', {
    class: 'me-sheet',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': title,
    tabindex: '-1',
  });
  const handle = createTag('div', { class: 'me-sheet-handle', 'aria-hidden': 'true' });
  const titleEl = createTag('p', { class: 'me-sheet-title' });
  titleEl.textContent = title;
  sheet.append(handle, titleEl, contentEl);
  overlay.append(sheet);

  function close() {
    if (root.getAttribute('data-me-panel') !== kind) return;
    root.setAttribute('data-me-panel', 'none');
  }

  function onPanelChange() {
    const isOpen = root.getAttribute('data-me-panel') === kind;
    overlay.classList.toggle('is-open', isOpen);
    overlay.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) {
      overlay.removeAttribute('inert');
      disableBackgroundScroll();
    } else {
      overlay.setAttribute('inert', '');
      restoreBackgroundScroll();
    }
  }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  return { overlay, onPanelChange };
}

// Fixed per Figma node 1099-5050 — topActions only ever picks which of these
// 3 to show and supplies their handler, it doesn't define new icons/labels.
// Tag names are real Spectrum Web Components icons (see the dynamic import
// in createMiniEditorWidget) — all 3 are already part of the curated
// icons-workflow bundle (scripts/widgets/spectrum/build.mjs).
const TOP_ACTION_DEFS = {
  edit: { label: 'Edit', icon: 'sp-icon-edit' },
  share: { label: 'Share', icon: 'sp-icon-share-android' },
  download: { label: 'Download', icon: 'sp-icon-download' },
};

/**
 * Top-right hover action bar, per Figma node 1099-5050. Callback props (not
 * events) — matches this file's existing intra-widget wiring
 * (onSelect/onFontOrColourChange) rather than the CustomEvent used for
 * mini-editor:use-quote, which exists only to decouple separate blocks.
 * `topActions` is `[{ type: 'edit'|'share'|'download', onClick }, ...]` —
 * only the types actually supplied are rendered, in the given order.
 * Icon elements must be Spectrum custom elements already registered by the
 * time this runs — see the icons-workflow.js dynamic import in
 * createMiniEditorWidget, which awaits before calling buildWidget.
 */
async function buildMiniEditorActions(topActions = []) {
  const bar = createTag('div', { class: 'me-actions' });
  const menuApis = [];
  const supportedActions = topActions.filter(({ type }) => TOP_ACTION_DEFS[type]);
  const baseTabIndex = 5;
  for (const [index, { type, onClick, shareMenu }] of supportedActions.entries()) {
    const def = TOP_ACTION_DEFS[type];
    const icon = createTag(def.icon, { class: 'me-action-icon', 'aria-hidden': 'true' });
    const btn = createTag('button', {
      tabIndex: baseTabIndex + index,
      type: 'button',
      class: `me-action me-action--${type}`,
      'aria-label': def.label,
    }, [icon]);
    if (shareMenu) {
      const { default: createShareMenuWidget } = await import(
        '../share-menu-widget/share-menu-widget.js'
      );
      const menuApi = await createShareMenuWidget({ trigger: btn, ...shareMenu });
      menuApis.push(menuApi);
      bar.append(menuApi.element);
    } else {
      btn.addEventListener('click', () => onClick?.());
      bar.append(btn);
    }
  }
  bar.destroy = () => menuApis.forEach((api) => api.destroy());
  return bar;
}

async function buildWidget(root, a11y, cardSet, fontOptions, topActions, panelMode, decorationsEnabled) {
  const widget = createTag('div', { class: 'mini-editor-widget' });
  const card = createTag('div', { class: 'me-card' });
  const first = cardSet[0] || { quote: '', author: '' };
  let contentModel = {
    quote: first.quote,
    author: first.author || '',
    backgroundUrl: first.card?.bg || '',
    font: {
      family: fontOptions[0]?.font || 'sans-serif',
      style: fontOptions[0]?.italic ? 'italic' : 'normal',
      weight: fontOptions[0]?.weight || 'normal',
    },
  };

  const updateContentModel = (patch) => {
    contentModel = {
      ...contentModel,
      ...patch,
      font: patch.font ? { ...contentModel.font, ...patch.font } : contentModel.font,
    };
  };

  const quoteWrap = createTag('div', {
    class: 'me-quote-wrap',
    role: 'button',
    tabindex: '8',
    'aria-describedby': 'me-quote-wrap-hint',
  });
  const quoteEl = createTag('div', { class: 'me-quote' });
  // The full, untruncated quote — kept separate from quoteEl's own display
  // text (which truncates at EDITOR_QUOTE_CHAR_LIMIT) so copy-to-clipboard
  // and the accessible name below always use the complete text, never the
  // "…"-shortened version sighted users see on a long quote.
  let currentQuote = first.quote;
  const renderQuote = (quote) => {
    currentQuote = quote;
    const truncated = truncateQuote(quote, EDITOR_QUOTE_CHAR_LIMIT);
    quoteEl.textContent = truncated;
    // Only needed once the display text is actually shortened — leaving
    // this off otherwise keeps aria-describedby (below) as the sole
    // accessible-name influence, same as before, for the common case.
    if (truncated === quote) quoteWrap.removeAttribute('aria-label');
    else quoteWrap.setAttribute('aria-label', quote);
  };

  // aria-describedby (not aria-label) so the accessible name stays the
  // visible quote text itself — an aria-label here would replace it
  // entirely, leaving screen reader users with "Copy quote to clipboard,
  // button" and no indication of which quote (see label-content-name-mismatch).
  // Overridden with an explicit aria-label (see renderQuote above) only
  // when the visible text is truncated, so the accessible name is always
  // the full quote in that case instead of the shortened text it would
  // otherwise default to.
  const hint = createTag('span', { id: 'me-quote-wrap-hint', class: 'sr-only' }, ['Copy quote to clipboard']);
  const tip = createTag('span', { class: 'me-tip', 'aria-hidden': 'true' }, [
    createTag('span', { class: 'me-tip-box' }, ['Click to copy quote']),
  ]);
  quoteWrap.append(quoteEl, hint, tip);
  renderQuote(first.quote);

  const authorEl = createTag('div', { class: 'me-author' });
  authorEl.textContent = first.author;
  authorEl.style.display = first.author ? '' : 'none';

  card.append(quoteWrap, authorEl);
  widget.append(card);

  // Sibling of .me-card/.me-arc, not nested inside .me-card, so the same
  // element and top-right CSS anchor (against .mini-editor-widget) work
  // unchanged whether the desktop card or the tablet/mobile arc carousel is
  // the one currently visible.
  const actions = await buildMiniEditorActions(topActions);
  widget.append(actions);

  const doCopy = async () => {
    // currentQuote (not quoteEl.textContent) — the full quote, even when
    // the visible text is truncated (see renderQuote).
    const ok = await a11y.copyQuoteToClipboard(currentQuote, authorEl.textContent);
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
    root.style.setProperty('--me-card-bg', `url("${first.card.bg}")`);
  }

  // Set by the widget factory once the arc carousel exists, so picking a
  // font/colour here also updates the carousel's centre card on tablet/mobile
  // — not just the desktop widget's own .me-card (which the CSS vars above
  // already cover regardless of listener wiring).
  let onFontOrColourPick = () => {};

  // Keyboard-only "Skip quote suggestions" CTA, per Figma node 54:11762 — see
  // buildSkipQuoteSuggestionsCta below. Its only purpose is to bridge Tab
  // traversal from the colour control/swatches to the desktop zig-zag deco
  // cards (see createMiniEditorWidget's setDecoChainTarget wiring), so it's
  // never built at all when those don't exist: on small viewports (the arc
  // carousel replaces them, see .me-carousel-mode) or when a host opted out
  // of decorations entirely (e.g. the "Create a design" modal).
  const skipCta = (!decorationsEnabled || isSmallViewport()) ? null : buildSkipQuoteSuggestionsCta(root);

  const controls = createTag('div', { class: 'me-controls' });
  const {
    control: fontControl,
    panel: fontPanel,
    sheetGrid: fontSheetGrid,
    selectFont,
  } = buildFontControl(
    root,
    fontOptions,
    (font) => onFontOrColourPick({ font }),
    panelMode,
    () => colourControl.focus(),
  );
  const {
    control: colourControl,
    panel: colourPanel,
    sheetGrid: colourSheetGrid,
    selectSwatch,
  } = buildColorControl(
    root,
    cardSet.map((c) => c.card),
    (bgCard) => onFontOrColourPick({ card: bgCard }),
    panelMode,
    // No Skip-quote-suggestions CTA to hand off to on small viewports (see
    // skipCta above — the deco cards it bridges to don't exist there, the
    // arc carousel replaces them) — Tab out of the colour control/swatches
    // goes straight past the whole .mini-editor block instead, same
    // destination the CTA's own Enter/Space would otherwise land on.
    () => (skipCta ? skipCta.show() : findNextFocusableAfter(root)?.focus()),
  );
  controls.append(fontControl, colourControl);

  const panelWrap = createTag('div', { class: 'me-panel' });
  panelWrap.append(fontPanel, colourPanel);

  const fontSheet = buildBottomSheet(root, a11y, 'fonts', 'Choose a font style', fontSheetGrid);
  const colourSheet = buildBottomSheet(root, a11y, 'colour', 'Choose a background colour', colourSheetGrid);

  widget.append(controls, panelWrap, fontSheet.overlay, colourSheet.overlay);
  if (skipCta) widget.append(skipCta.element);

  // Single MutationObserver on data-me-panel drives both sheets (mobile) and
  // the aria-expanded state on both trigger buttons (all breakpoints) — the
  // inline row's own visibility is pure CSS (`[data-me-panel='fonts']`).
  const panelObserver = new MutationObserver(() => {
    const openPanel = root.getAttribute('data-me-panel');
    fontControl.setAttribute('aria-expanded', String(openPanel === 'fonts'));
    colourControl.setAttribute('aria-expanded', String(openPanel === 'colour'));
    fontSheet.onPanelChange();
    colourSheet.onPanelChange();

  });
  panelObserver.observe(root, { attributes: true, attributeFilter: ['data-me-panel'] });

  const onDocClick = (e) => {
    // always-open-inline (the modal) on tablet/desktop: one of font/colour
    // always stays open — including against the very "Create a design"
    // click that opens the modal in the first place, which document-click-
    // bubbles here same as any other outside click. Mobile falls back to
    // the normal bottom-sheet behaviour (close on outside click), same as
    // the inline block.
    if (panelMode === 'always-open-inline' && !isMobileSheetWidth()) return;
    if (!widget.contains(e.target)) {
      root.setAttribute('data-me-panel', 'none');
    }
  };
  document.addEventListener('click', onDocClick);

  return {
    widget,
    useQuote: ({
      quote, author, card: bgCard, font,
    }) => {
      updateContentModel({
        quote,
        author: author || '',
        ...(bgCard ? { backgroundUrl: bgCard.bg } : {}),
        ...(font ? {
          font: {
            family: font.font,
            style: font.italic ? 'italic' : 'normal',
            weight: font.weight || 'normal',
          },
        } : {}),
      });
      renderQuote(quote);
      authorEl.textContent = author || '';
      authorEl.style.display = author ? '' : 'none';
      if (bgCard) selectSwatch(bgCard.bg);
      if (font) selectFont(font);
    },
    getContentModel: () => ({ ...contentModel, font: { ...contentModel.font } }),
    onFontOrColourChange: (listener) => {
      onFontOrColourPick = (patch) => {
        if (patch.font) {
          updateContentModel({
            font: {
              family: patch.font.font,
              style: patch.font.italic ? 'italic' : 'normal',
              weight: patch.font.weight || 'normal',
            },
          });
        }
        if (patch.card) updateContentModel({ backgroundUrl: patch.card.bg });
        listener(patch);
      };
    },
    // Wired by createMiniEditorWidget once the deco cards exist (buildWidget
    // itself has no knowledge of them — see buildSkipQuoteSuggestionsCta).
    // A no-op when skipCta wasn't built at all (small viewport).
    setDecoChainTarget: (fn) => skipCta?.setTabOutTarget(fn),
    destroy: () => {
      actions.destroy();
      panelObserver.disconnect();
      document.removeEventListener('click', onDocClick);
    },
  };
}

function buildDecoCard(a11y, entry, useQuote) {
  const { card, quote, author } = entry;
  const deco = createTag('div', { class: 'me-deco', tabindex: '-1' });
  const cardWrap = createTag('div', { class: 'me-deco-card-wrap' });
  // .me-deco-card is the outer sizing/rotation box and anchors the actions
  // row below it (`top: 100%`, see CSS) — it must stay unclipped for that,
  // so the background image + rounded-corner clipping live one level in,
  // on .me-deco-card-inner, instead of on this element directly like before
  // (when the card's fixed height made the two concerns interchangeable).
  const inner = createTag('div', { class: 'me-deco-card' });
  const clipped = createTag('div', {
    class: 'me-deco-card-inner',
    style: `background-image:url("${card.bg}")`,
  });
  inner.append(clipped);
  // Fixed font/style for every card — see .me-deco-quote in CSS — so no
  // per-instance font styling here; only the editor's own selection varies.
  // Display text only truncates at DECO_QUOTE_CHAR_LIMIT (buildCardSet in
  // mini-editor.js already prefers quotes under this limit for these cards,
  // so this is a rarely-hit fallback) — `quote` itself stays untruncated
  // below, for useQuote/copy/aria so nothing a user acts on is ever
  // silently shortened.
  const quoteP = createTag('p', { class: 'me-deco-quote' });
  quoteP.textContent = truncateQuote(quote, DECO_QUOTE_CHAR_LIMIT);
  clipped.append(quoteP);
  if (author) {
    const authorP = createTag('p', { class: 'me-deco-author' });
    authorP.textContent = author;
    clipped.append(authorP);
  }

  const actions = createTag('div', { class: 'me-deco-actions' });
  const attribution = author ? `"${quote}" — ${author}` : `"${quote}"`;
  const useBtn = createTag('button', {
    type: 'button',
    class: 'me-deco-use',
    'aria-label': `Use this quote: ${attribution}`,
  });
  useBtn.textContent = 'Use this quote';
  useBtn.addEventListener('click', () => useQuote(entry));

  const copyBtn = createTag('button', {
    type: 'button',
    class: 'me-deco-copy',
    'aria-label': `Copy quote: ${attribution}`,
  }, [createTag('sp-icon-copy', { class: 'me-deco-copy-icon', 'aria-hidden': 'true' })]);
  copyBtn.addEventListener('click', async () => {
    const ok = await a11y.copyQuoteToClipboard(quote, author);
    if (ok) {
      copyBtn.classList.add('is-copied');
      setTimeout(() => copyBtn.classList.remove('is-copied'), 1200);
    }
  });

  actions.append(useBtn, copyBtn);
  // Child of .me-deco-card (not a sibling in cardWrap) so its `top: 100%`
  // (see CSS) resolves against the card's own actual height — which now
  // varies with quote length (see .me-deco-card's min-height) — instead of
  // a fixed pixel guess that only ever matched the card's old fixed height.
  inner.append(actions);
  cardWrap.append(inner);
  deco.append(cardWrap);
  return deco;
}

// Cards 1-8 (see buildDecoCards) group into 4 vertical columns of 2, each
// its own flex container (see .me-deco-col--* in CSS) so a column's cards
// space apart via `gap` — which adapts as a card's own height varies with
// its quote length — rather than the fixed-pixel absolute positions this
// replaced. Column membership mirrors the original zig-zag exactly: cards
// 1/3 and 5/7 were always the "far" columns (bigger inter-card gap), 2/4
// and 6/8 the "near" columns (smaller gap) — see the far/near CSS classes.
const DECO_COLUMNS = [
  { cardIndexes: [0, 2], className: 'me-deco-col--far-left' },
  { cardIndexes: [1, 3], className: 'me-deco-col--near-left' },
  { cardIndexes: [4, 6], className: 'me-deco-col--far-right' },
  { cardIndexes: [5, 7], className: 'me-deco-col--near-right' },
];

function buildDecoCards(a11y, cardSet, useQuote) {
  // Not aria-hidden: unlike a purely decorative background image, each card
  // here holds two real, focusable actions ("Use this quote" / "Copy quote")
  // — hiding the wrapper from assistive tech would leave those buttons in
  // the tab order but silently unannounced (see aria-hidden-focus).
  const wrap = createTag('div', { class: 'mini-editor-decorations' });
  // cardSet[0] powers the main widget; decorative cards use the rest.
  const decoEntries = cardSet.slice(1, 1 + DECO_CARD_COUNT);
  const decos = decoEntries.map((entry, i) => {
    const deco = buildDecoCard(a11y, entry, useQuote);
    deco.classList.add(`me-deco--${i + 1}`);
    return deco;
  });
  DECO_COLUMNS.forEach(({ cardIndexes, className }) => {
    const col = createTag('div', { class: `me-deco-col ${className}` });
    cardIndexes.forEach((idx) => { if (decos[idx]) col.append(decos[idx]); });
    if (col.children.length) wrap.append(col);
  });
  return wrap;
}

// Keyboard traversal order for the deco cards' actions once reached via the
// Skip-quote-suggestions CTA — deliberately not DOM/visual order (which is
// 1,3,2,4,5,7,6,8, see DECO_COLUMNS): this is the order design specified for
// this guided chain specifically.
const DECO_TAB_CHAIN_ORDER = [2, 4, 6, 8, 1, 3, 5, 7];

/**
 * Chains Tab across every .me-deco-use/.me-deco-copy pair, in
 * DECO_TAB_CHAIN_ORDER rather than DOM order, and returns a function that
 * focuses the very first button in that chain (deco-2's "Use this quote") —
 * the entry point wired to the Skip-quote-suggestions CTA's Tab handler (see
 * createMiniEditorWidget). Every button in the chain gets an explicit
 * tabindex=-1: like the font/colour rows' roving options (see
 * wireOptionRowRoving), these buttons default to tabindex=0, which the
 * browser visits only after every explicit positive-tabindex element on the
 * page (see this widget's 1-10+ sequence) — left at the default, a plain Tab
 * off the last button in the chain would jump to whatever tabindex=0/default
 * element is next in the document instead of anywhere in this chain, and a
 * shift+Tab back into the chain from outside would land on an arbitrary
 * button instead of consistently re-entering where intended.
 */
function wireDecoTabChain(decorations) {
  const buttons = DECO_TAB_CHAIN_ORDER.flatMap((cardNum) => {
    const card = decorations.querySelector(`.me-deco--${cardNum}`);
    return [card.querySelector('.me-deco-use'), card.querySelector('.me-deco-copy')];
  });
  buttons.forEach((btn, i) => {
    btn.tabIndex = -1;
    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || e.shiftKey) return;
      const next = buttons[i + 1];
      if (!next) return;
      e.preventDefault();
      next.focus();
    });
  });
  return () => buttons[0]?.focus();
}

/**
 * Builds one of the three carousel cards. Unlike a fixed prev/centre/next
 * slot (which would only ever swap content, never actually move — nothing
 * to transition), each of these 3 elements keeps its own content across a
 * navigation and is reassigned to a *different role's position* — that's
 * what makes the 1s transform transition on .me-arc-card actually animate
 * a visible slide/rotate between roles instead of an instant content pop.
 */
const ROLE_CLASSES = ['me-arc-card--prev', 'me-arc-card--center', 'me-arc-card--next', 'me-arc-card--stage-prev', 'me-arc-card--stage-next'];

function buildArcCard(onActivate, a11y, tabIndex) {
  const el = createTag('div', {
    class: 'me-arc-card',
    role: 'option',
    'aria-selected': 'false',
    tabindex: tabIndex,
    'aria-describedby': 'me-arc-card-hint',
  });
  // quoteP/authorP live inside quoteWrap (not directly in el) purely so the
  // centre role can reuse .me-quote-wrap's existing CSS (frosted
  // hover/focus background, tip visibility, is-copied state) via a
  // descendant selector off el's own :hover/:focus-visible — see
  // .me-arc-card--center:hover .me-quote-wrap in the CSS. quoteWrap itself
  // has no role/tabindex/listeners of its own: el (role="option", already
  // the roving-tabindex focus target for prev/centre/next) stays the one
  // real interactive element, so this never nests two focusable elements.
  const quoteP = createTag('div', { class: 'me-arc-quote' });
  const authorP = createTag('div', { class: 'me-arc-author' });
  const quoteWrap = createTag('div', { class: 'me-quote-wrap', tabIndex: (tabIndex == -1 ? -1 : 8) });
  const hint = createTag('span', { id: 'me-arc-card-hint', class: 'sr-only' }, ['Copy quote to clipboard']);
  const tip = createTag('span', { class: 'me-tip', 'aria-hidden': 'true' }, [
    createTag('span', { class: 'me-tip-box' }, ['Click to copy quote']),
  ]);
  quoteWrap.append(quoteP, hint, tip);
  el.append(quoteWrap, authorP);


  // currentQuote/currentAuthor (not quoteP.textContent) — the full quote,
  // even when the visible text is truncated (see render below), same
  // reasoning as buildWidget's own currentQuote.
  let currentQuote = '';
  let currentAuthor = '';
  const doCopy = async () => {
    const ok = await a11y.copyQuoteToClipboard(currentQuote, currentAuthor);
    if (ok) {
      quoteWrap.classList.add('is-copied');
      setTimeout(() => quoteWrap.classList.remove('is-copied'), 1200);
    }
  };

  // Centre copies its quote on click/Enter/Space (same action as
  // .me-quote-wrap on desktop); prev/next instead navigate via onActivate,
  // same as before this card ever supported copying.
  quoteWrap.addEventListener('click', () => {
    if (el.classList.contains('me-arc-card--center')) doCopy();
    else onActivate(el);
  });
  quoteWrap.addEventListener('keydown', (e) => {
    if (el.classList.contains('me-arc-card--center') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      doCopy();
    }
  });

  function render(entry) {
    el.style.backgroundImage = `url("${entry.card.bg}")`;
    // Display text truncates at EDITOR_QUOTE_CHAR_LIMIT (same limit as the
    // main widget's own quote — see renderQuote in buildWidget), applied
    // uniformly regardless of this card's current role (prev/centre/next
    // share one render path). role="option"'s accessible name defaults to
    // this same text content, so an explicit aria-label carries the full
    // quote whenever it's actually shortened — never just the truncated
    // text — matching the same full-text-preserved rule as everywhere else.
    currentQuote = entry.quote;
    currentAuthor = entry.author || '';
    const truncated = truncateQuote(entry.quote, EDITOR_QUOTE_CHAR_LIMIT);
    quoteP.textContent = truncated;
    if (truncated === entry.quote) el.removeAttribute('aria-label');
    else el.setAttribute('aria-label', entry.author ? `${entry.quote} — ${entry.author}` : entry.quote);
    // entry.font is the carousel-wide selected font (see buildArcCarousel's
    // selectedFont/withFont) when one has been picked — applies to every
    // role (prev/centre/next), not just centre. Falls back to the fixed
    // default (CSS) font, same as the decorative cards, until then.
    quoteP.style.fontFamily = entry.font?.font || '';
    quoteP.style.fontStyle = entry.font?.italic ? 'italic' : '';
    quoteP.style.fontWeight = entry.font?.weight || '';
    authorP.textContent = entry.author || '';
    authorP.style.display = entry.author ? '' : 'none';
  }

  // Every role is now interactive (centre copies its quote on click/Enter,
  // same as .me-quote-wrap; prev/next still navigate via onActivate above),
  // unlike before centre was inert (cursor: default, pointer-events: none).
  function setInteractivity(role) {
    el.setAttribute('aria-selected', String(role === 'center'));
  }

  // Recycling a card (see goNext/goPrev) is a two-step move so it animates
  // rotating in from beyond the edge instead of popping straight into its
  // final prev/next slot: first jump instantly (no transition) to a
  // further-out "stage" position with the new content, then — once that
  // jump has committed — hand off to a normal, transitioned setRole() to
  // the real prev/next class, which now has somewhere real to animate from.
  function stageAt(stageRole) {
    el.style.transition = 'none';
    el.classList.remove(...ROLE_CLASSES);
    el.classList.add(`me-arc-card--${stageRole}`);
    el.getBoundingClientRect(); // force reflow so the instant jump commits
    el.style.transition = '';
  }

  function setRole(role) {
    el.classList.remove(...ROLE_CLASSES);
    el.classList.add(`me-arc-card--${role}`);
    setInteractivity(role);
  }

  return {
    el, render, setRole, stageAt,
  };
}

/**
 * The non-interactive 4th card used purely to show the outgoing card's
 * exit: when a card is recycled from prev to next (or vice versa), its OLD
 * content would otherwise just vanish (the same DOM element is instantly
 * staged off-screen with new content — see stageAt). This ghost briefly
 * takes over that old content and role position, then transitions further
 * outward while fading out, so the exit reads as one continuous circular
 * motion alongside the other two cards' moves instead of a hard cut.
 * aria-hidden + pointer-events: none — it's decorative only, never one of
 * the 3 clickable/tabbable cards.
 */
function buildArcGhost() {
  const el = createTag('div', { class: 'me-arc-card me-arc-ghost', 'aria-hidden': 'true' });
  const quoteP = createTag('p', { class: 'me-arc-quote' });
  const authorP = createTag('p', { class: 'me-arc-author' });
  el.append(quoteP, authorP);

  function playExit(entry, fromRole) {
    el.style.backgroundImage = `url("${entry.card.bg}")`;
    // Same display truncation as the 3 real cards (see buildArcCard's
    // render) — purely cosmetic here since this ghost is aria-hidden and
    // never one of the tabbable/clickable cards, but its fixed-size card
    // shouldn't overflow with a long quote mid-exit either.
    quoteP.textContent = truncateQuote(entry.quote, EDITOR_QUOTE_CHAR_LIMIT);
    // entry.font carries the carousel-wide selected font here too (see
    // buildArcCarousel's withFont), so the outgoing ghost matches whatever
    // font the other 3 cards are currently showing.
    quoteP.style.fontFamily = entry.font?.font || '';
    quoteP.style.fontStyle = entry.font?.italic ? 'italic' : '';
    quoteP.style.fontWeight = entry.font?.weight || '';
    authorP.textContent = entry.author || '';
    authorP.style.display = entry.author ? '' : 'none';

    el.style.transition = 'none';
    el.classList.remove('me-arc-card--exit-prev', 'me-arc-card--exit-next', 'me-arc-ghost--visible');
    el.classList.add(`me-arc-card--${fromRole}`, 'me-arc-ghost--visible');
    el.getBoundingClientRect(); // force reflow so the starting position commits
    el.style.transition = '';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.remove(`me-arc-card--${fromRole}`);
      el.classList.add(`me-arc-card--exit-${fromRole}`);
    }));
  }

  return { el, playExit };
}

/**
 * Tablet/mobile carousel: exactly 3 cards (prev/centre/next) — never more,
 * so nothing off-screen is ever clickable. Clicking an arrow rotates which
 * *role* (and therefore which fixed CSS position/rotation) each of the 3
 * existing card elements occupies, so every navigation is a real transform
 * change on real elements — driven entirely by the 1s CSS transition on
 * .me-arc-card, not a JS-animated or instantly-popped content swap. Only
 * the card moving furthest (the one leaving `next` on a "next" click, or
 * leaving `prev` on a "prev" click) needs its content replaced, since it's
 * re-entering the deck one step further round; the other two just carry
 * their existing content into their new role.
 */
function buildArcCarousel(cardSet, useQuote, defaultFont, a11y) {
  const root = createTag('div', { class: 'me-arc' });
  // Each .me-arc-card has role="option" (see buildArcCard), which axe
  // requires to sit inside a role="listbox" parent (see
  // aria-required-parent) — but that parent may only contain option/group
  // children (aria-required-children), and .me-arc itself also holds the
  // prev/next nav buttons as direct children. listboxRole wraps just the
  // ghost + 3 cards so both rules are satisfied; display: contents keeps it
  // out of layout so .me-arc-card's `position: absolute` (in CSS) still
  // resolves against .me-arc, not this wrapper.
  const listboxRole = createTag('div', { class: 'me-arc-listbox', role: 'listbox', 'aria-label': 'Template' });
  const total = cardSet.length;
  let activeIndex = 0;
  // The centre card can be patched independently of cardSet (e.g. the
  // widget's own colour control, which applies on top of whichever entry is
  // currently active) — centreOverride holds that patch and is reset
  // whenever navigation moves a *different* entry into the centre. Font is
  // deliberately NOT part of this: once picked, it's a carousel-wide choice
  // (see selectedFont below), not tied to any one entry/role.
  let centreOverride = null;
  // Persists across navigation (unlike centreOverride) and applies to every
  // card — prev/next/ghost included, not just centre — so picking a font
  // once keeps showing on whichever entries rotate into view afterwards.
  // Seeded with the first font option so the carousel renders that font on
  // load, matching the desktop widget card (which the --me-quote-font CSS
  // variable already applies to via buildFontControl's initial selectFont).
  let selectedFont = defaultFont || null;

  const withFont = (entry) => (selectedFont ? { ...entry, font: selectedFont } : entry);

  const onActivate = (el) => {
    if (el.classList.contains('me-arc-card--prev')) goPrev(); // eslint-disable-line no-use-before-define
    else if (el.classList.contains('me-arc-card--next')) goNext(); // eslint-disable-line no-use-before-define
  };
  const cardA = buildArcCard(onActivate, a11y, -1);
  const cardB = buildArcCard(onActivate, a11y, 2);
  const cardC = buildArcCard(onActivate, a11y, -1);
  const ghost = buildArcGhost();
  // roles[i] tracks which role each of cardA/B/C currently occupies, so
  // navigation can rotate them without re-deriving role from DOM classes.
  const cards = [cardA, cardB, cardC];
  let roles = ['prev', 'center', 'next'];

  function applyRoles() {
    cards.forEach((card, i) => card.setRole(roles[i]));
  }

  function centerEntry() {
    return withFont({ ...cardSet[activeIndex], ...centreOverride });
  }

  function renderAll() {
    const prevIndex = ((activeIndex - 1) % total + total) % total;
    const nextIndex = (activeIndex + 1) % total;
    cards[roles.indexOf('prev')].render(withFont(cardSet[prevIndex]));
    cards[roles.indexOf('center')].render(centerEntry());
    cards[roles.indexOf('next')].render(withFont(cardSet[nextIndex]));
  }

  function goNext() {
    const prevIndexBefore = ((activeIndex - 1) % total + total) % total;
    activeIndex = (activeIndex + 1) % total;
    centreOverride = null;
    // The card that was centre slides to prev; the card that was next
    // slides into centre (both keep their existing content — that's what
    // the 1s CSS transition actually animates). The card that was prev is
    // recycled to become the new next — but its OLD content doesn't just
    // vanish: the ghost plays a visible exit (continuing further left,
    // fading out) with that old content, while the real card is silently
    // restaged with new content to enter from the right. Both read as one
    // continuous circular motion since they run concurrently.
    ghost.playExit(withFont(cardSet[prevIndexBefore]), 'prev');
    const recycled = cards[roles.indexOf('prev')];
    cards[roles.indexOf('center')].setRole('prev');
    cards[roles.indexOf('next')].setRole('center');
    roles = roles.map((role) => ({ center: 'prev', next: 'center', prev: 'next' }[role]));
    const newNextIndex = (activeIndex + 1) % total;
    recycled.render(withFont(cardSet[newNextIndex]));
    recycled.stageAt('stage-next');
    // Double rAF: the stage jump needs an actual painted frame before the
    // transitioned move starts, or the browser can coalesce both class
    // changes into one paint and skip the animation entirely.
    requestAnimationFrame(() => requestAnimationFrame(() => recycled.setRole('next')));
    cards[roles.indexOf('center')].render(centerEntry());
    useQuote(cardSet[activeIndex]);
  }

  function goPrev() {
    const nextIndexBefore = (activeIndex + 1) % total;
    activeIndex = ((activeIndex - 1) % total + total) % total;
    centreOverride = null;
    // Mirror of goNext: centre slides to next, prev slides into centre,
    // and the card that was next is recycled — staged further out, then
    // transitioned in — to become the new prev, while the ghost plays its
    // old content exiting further right.
    ghost.playExit(withFont(cardSet[nextIndexBefore]), 'next');
    const recycled = cards[roles.indexOf('next')];
    cards[roles.indexOf('center')].setRole('next');
    cards[roles.indexOf('prev')].setRole('center');
    roles = roles.map((role) => ({ center: 'next', prev: 'center', next: 'prev' }[role]));
    const newPrevIndex = ((activeIndex - 1) % total + total) % total;
    recycled.render(withFont(cardSet[newPrevIndex]));
    recycled.stageAt('stage-prev');
    requestAnimationFrame(() => requestAnimationFrame(() => recycled.setRole('prev')));
    cards[roles.indexOf('center')].render(centerEntry());
    useQuote(cardSet[activeIndex]);
  }

  // Applied from the widget's font/colour pickers (see buildWidget) so
  // selecting a font or background there updates the arc carousel exactly
  // as it already updates the desktop widget's own .me-card. A font patch
  // is carousel-wide (re-renders all 3 visible cards, see renderFont
  // below); a colour/quote/author patch stays centre-only via
  // centreOverride, same as before.
  function renderFont() {
    cards[roles.indexOf('prev')].render(withFont(cardSet[((activeIndex - 1) % total + total) % total]));
    cards[roles.indexOf('center')].render(centerEntry());
    cards[roles.indexOf('next')].render(withFont(cardSet[(activeIndex + 1) % total]));
  }

  function updateCentre(patch) {
    if (patch.font) {
      selectedFont = patch.font;
      renderFont();
      return;
    }
    centreOverride = { ...centreOverride, ...patch };
    cards[roles.indexOf('center')].render(centerEntry());
  }

  applyRoles();
  renderAll();
  listboxRole.append(ghost.el, cardA.el, cardB.el, cardC.el);
  root.append(listboxRole);

  const prevBtn = createTag('button', {
    type: 'button',
    class: 'me-arc-nav me-arc-nav--prev',
    tabindex: 3,
    'aria-label': 'Previous template',
  }, [getIconElementDeprecated('arc-nav-left')]);
  const nextBtn = createTag('button', {
    type: 'button',
    class: 'me-arc-nav me-arc-nav--next',
    'aria-label': 'Next template',
    tabindex: 4,
  }, [getIconElementDeprecated('arc-nav-right')]);
  root.append(prevBtn, nextBtn);

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);

  return { root, updateCentre };
}

/**
 * @param {Object} config
 * @param {HTMLElement} config.root — element the widget sets state attributes,
 *   CSS custom properties, and the `me-carousel-mode` class on (the block).
 * @param {Array} [config.topActions=[]] — top-right hover action bar (Figma
 *   node 1099-5050): `[{ type: 'edit'|'share'|'download', onClick }, ...]`.
 *   Only the types supplied are rendered, in the given order.
 * @param {Array} config.fontOptions — `{ label, font, italic, weight }` list.
 * @param {Object} config.backgrounds — `{ cardSet, decoCount }` where cardSet
 *   is `[{ card: { id, bg }, quote, author }, ...]`.
 * @param {Object} config.a11y — shared helpers the widget needs but does not
 *   own: `{ trapFocus, handleEscapeClose, disableBackgroundScroll,
 *   restoreBackgroundScroll, copyQuoteToClipboard }`.
 * @param {Object} [config.deps] — `{ createTag, getIconElementDeprecated }`.
 * @param {boolean} [config.decorations=true] — when `false`, the desktop
 *   zig-zag decorative cards and the tablet/mobile arc carousel are never
 *   built at all (not built-then-hidden) — only the centre editor card
 *   renders, at every breakpoint. For a host that only ever shows the
 *   widget in isolation (e.g. a modal), so it never pays for DOM/listeners
 *   it will never display.
 * @param {'always-open-inline'} [config.panelMode] — when set, the font/
 *   colour controls behave differently from the default (collapsible,
 *   bottom-sheet-on-mobile) inline row: one of the two starts open (font)
 *   and stays open at every breakpoint/width — clicking its own trigger
 *   again is a no-op instead of collapsing to neither. The CSS-driven
 *   mobile bottom sheet must be suppressed by the host's own stylesheet
 *   (see mini-editor-modal.css) since it's still built either way. Used by
 *   the "Create a design" modal, where the empty space below the card
 *   exists only to host this panel.
 * @returns {Promise<{ stage, decorations, useQuote, updateCentre, getContentModel,
 *   syncViewportMode, destroy }>}
 */
export default async function createMiniEditorWidget(config = {}) {
  const {
    root,
    topActions = [],
    fontOptions,
    backgrounds,
    a11y,
    deps,
    decorations: decorationsEnabled = true,
    panelMode,
  } = config;

  ({ createTag, getIconElementDeprecated } = deps);

  // topActions' icons and the decorative cards' "Copy quote" icon
  // (sp-icon-copy, see buildDecoCard) are real Spectrum Web Components
  // custom elements — only loaded when actually used, so a caller with no
  // topActions and decorations: false doesn't pay for the Spectrum bundle.
  if (topActions.length || decorationsEnabled) {
    await import('../spectrum/dist/icons-workflow.js');
  }

  const { cardSet } = backgrounds;
  const decoCount = backgrounds.decoCount ?? DECO_CARD_COUNT;

  // always-open-inline (the modal) starts with the font panel open and
  // keeps one of font/colour open at all times — see buildFontControl /
  // buildColorControl's matching click-guard. Not on mobile widths, where
  // this host falls back to the normal bottom sheet (nothing open until
  // tapped), same as everywhere else this flag doesn't apply.
  const startsOpen = panelMode === 'always-open-inline' && !isMobileSheetWidth();
  root.setAttribute('data-me-panel', startsOpen ? 'fonts' : 'none');

  const stage = createTag('div', { class: 'mini-editor-stage' });
  const {
    widget, useQuote, getContentModel, onFontOrColourChange, setDecoChainTarget,
    destroy: destroyWidget,
  } = await buildWidget(root, a11y, cardSet, fontOptions, topActions, panelMode, decorationsEnabled);
  stage.append(widget);

  let decorations;
  let updateCentre = () => {};
  let syncViewportMode = () => {};
  let removeResizeListener = () => {};

  if (decorationsEnabled) {
    // Same entries (the widget's own + the desktop decorations) power the
    // tablet/mobile arc carousel, so it cycles through the identical set of
    // quote/background/font combinations as the desktop zig-zag.
    const arcCardSet = [cardSet[0], ...cardSet.slice(1, 1 + decoCount)];
    decorations = buildDecoCards(a11y, cardSet, useQuote);
    // Only meaningful on desktop (see buildSkipQuoteSuggestionsCta) — a
    // no-op call when the CTA wasn't built (small viewport).
    setDecoChainTarget(wireDecoTabChain(decorations));
    const { root: arcCarousel, updateCentre: updateArcCentre } = buildArcCarousel(
      arcCardSet,
      useQuote,
      fontOptions[0],
      a11y,
    );
    updateCentre = updateArcCentre;
    onFontOrColourChange(updateCentre);

    // The arc carousel is inserted inside the widget, in the same flow slot
    // as .me-card (which .me-carousel-mode hides), rather than as a sibling
    // of the widget in the stage — the stage's flex row would otherwise
    // squeeze both side by side instead of the arc taking .me-card's place.
    widget.querySelector('.me-card').after(arcCarousel);

    // The zig-zag columns (.me-deco-col--far-left etc., see
    // mini-editor-widget.css) sit at fixed pixel offsets from centre, so
    // between the >=1200px breakpoint and whatever width those offsets
    // actually need (~1622px+ for the far columns), the outer cards run past
    // the viewport edge — clipped by `main`'s overflow-x: clip, invisible but
    // still in the tab order. Hide (not just visually clip) any card whose
    // box no longer fits so it also drops out of the tab order, re-checked
    // on first load and on every resize since it depends on viewport width,
    // not just the >=1200px/<=1199px carousel-mode switch below.
    const decoCard1 = decorations.querySelector('.me-deco--1');
    const decoCard3 = decorations.querySelector('.me-deco--3');
    const decoCard5 = decorations.querySelector('.me-deco--5');
    const decoCard7 = decorations.querySelector('.me-deco--7');
    const syncDecoClipping = () => {
      if (window.innerWidth < 1625) {
        decoCard1.classList.add('hidden');
        decoCard3.classList.add('hidden');
        decoCard5.classList.add('hidden');
        decoCard7.classList.add('hidden');
      } else {
        decoCard1.classList.remove('hidden');
        decoCard3.classList.remove('hidden');
        decoCard5.classList.remove('hidden');
        decoCard7.classList.remove('hidden');

      }
    };

    syncViewportMode = () => {
      syncDecoClipping();
      root.classList.toggle('me-carousel-mode', isSmallViewport());
    };
    syncViewportMode();
    window.addEventListener('resize', syncViewportMode);
    removeResizeListener = () => window.removeEventListener('resize', syncViewportMode);
  }

  return {
    stage,
    decorations,
    useQuote,
    updateCentre,
    getContentModel,
    syncViewportMode,
    destroy: () => {
      destroyWidget();
      removeResizeListener();
    },
  };
}
