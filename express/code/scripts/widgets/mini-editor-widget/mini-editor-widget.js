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
 *     fontOptions: [...],   // { label, font, italic, weight, stretch }
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

// cubic-bezier equivalents of the GSAP eases named in the design spec —
// power1.in ≈ cubic-bezier(0.55, 0.055, 0.675, 0.19),
// power2.out ≈ cubic-bezier(0.215, 0.61, 0.355, 1) — there's no GSAP
// dependency in this codebase, so the Web Animations API stands in for it.
const QUOTE_CHANGE_EASE_IN = 'cubic-bezier(0.55, 0.055, 0.675, 0.19)';
const QUOTE_CHANGE_EASE_OUT = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

/**
 * Applies a font or quote-text change to `el` — via `applyChange`, run
 * synchronously and immediately, same as any other state update — wrapped in
 * a purely cosmetic fade-out/fade-in "soft swap": a quick fade+slide down
 * (0.12s, ease-in) covers the swap, then a fade+slide back in from 10px below
 * (0.28s, ease-out) reveals the result. Any in-flight run on the same element
 * is cancelled first so rapid clicks restart cleanly instead of stacking.
 * Skipped entirely under prefers-reduced-motion: reduce, where only
 * `applyChange` runs, with no animation.
 */
function animateQuoteChange(el, applyChange) {
  el.getAnimations().forEach((anim) => anim.cancel());

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
    applyChange();
    return;
  }

  // A single 0.4s timeline standing in for the two-step spec (fade-out then
  // fade-in): each keyframe's own `easing` governs the segment starting at
  // it, so the first 0.12s (0 → 0.3 offset) eases in and the remaining 0.28s
  // (0.3 → 1) eases out, matching the spec's two durations exactly.
  el.animate(
    [
      { opacity: 1, transform: 'translateY(0)', easing: QUOTE_CHANGE_EASE_IN },
      { opacity: 0, transform: 'translateY(6px)', offset: 0.3, easing: QUOTE_CHANGE_EASE_OUT },
      { opacity: 0, transform: 'translateY(10px)', offset: 0.3 },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration: 400, fill: 'forwards' },
  );
  applyChange();
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

// Carousel mode now follows a strict width breakpoint for every device type:
// <=1200 shows arc carousel, >1200 shows the desktop card/decorations view.
// Checked live (not cached), same rationale as isMobileSheetWidth above —
// this also gates whether the keyboard-only "Skip quote suggestions" CTA
// (only meaningful for reaching the desktop zig-zag deco cards, which don't
// exist in arc/carousel mode) is built at all.
const TABLET_BREAKPOINT = 1200;
function isSmallViewport() {
  return window.innerWidth <= TABLET_BREAKPOINT;
}

const MOBILE_ARC_BREAKPOINT = 767;
const MOBILE_ARC_MAX_W = 600;
const MOBILE_ARC_BASE_W = 327;
const MOBILE_ARC_BASE_H = 270;
const MOBILE_ARC_BASE_GAP = 17;
const MOBILE_ARC_MIN_GAP = 24;
const MOBILE_ARC_MAX_GAP = 54;
const MOBILE_ARC_BASE_ORIGIN_Y = 2544;
const MOBILE_ARC_BASE_EXTRA_H = 50;
const MOBILE_ARC_BORDER_BUFFER = 2;
const MOBILE_ARC_MIN_SIDE_INSET = 20;
const MOBILE_ARC_SIDE_INSET_BUFFER = 4;
const MOBILE_ARC_SIDE_INSET_SCALE = 0.5;
const MOBILE_ARC_ROTATION_GAP_FACTOR = 0.06;

function readTokenPx(el, name, fallback) {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Resolve mobile arc tokens to concrete pixel values at runtime so the
 * carousel geometry reader can consume numbers instead of calc()/min()/clamp().
 */
function applyRuntimeArcTokens(root) {
  if (!root) return;

  if (window.innerWidth <= MOBILE_ARC_BREAKPOINT) {
    const spacing300 = readTokenPx(root, '--spacing-300', 16);
    const viewportW = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const sideInset = Math.max(
      MOBILE_ARC_MIN_SIDE_INSET,
      spacing300 + MOBILE_ARC_SIDE_INSET_BUFFER,
      Math.round(spacing300 * MOBILE_ARC_SIDE_INSET_SCALE),
    );
    const cardW = Math.min(
      MOBILE_ARC_MAX_W,
      Math.max(0, viewportW - (2 * sideInset) - MOBILE_ARC_BORDER_BUFFER),
    );
    const cardH = (cardW * MOBILE_ARC_BASE_H) / MOBILE_ARC_BASE_W;
    const rotationGapBoost = cardH * MOBILE_ARC_ROTATION_GAP_FACTOR;
    const cardGap = Math.min(
      MOBILE_ARC_MAX_GAP,
      Math.max(
        MOBILE_ARC_MIN_GAP,
        ((cardW * MOBILE_ARC_BASE_GAP) / MOBILE_ARC_BASE_W) + rotationGapBoost,
      ),
    );
    const originY = (cardW * MOBILE_ARC_BASE_ORIGIN_Y) / MOBILE_ARC_BASE_W;
    const extraH = (cardW * MOBILE_ARC_BASE_EXTRA_H) / MOBILE_ARC_BASE_W;

    root.style.setProperty('--me-arc-card-w', `${cardW}px`);
    root.style.setProperty('--me-arc-card-h', `${cardH}px`);
    root.style.setProperty('--me-arc-track-gap', `${cardGap}px`);
    root.style.setProperty('--me-arc-origin-y', `${originY}px`);
    root.style.setProperty('--me-arc-extra-h', `${extraH}px`);
    return;
  }

  root.style.removeProperty('--me-arc-card-w');
  root.style.removeProperty('--me-arc-card-h');
  root.style.removeProperty('--me-arc-track-gap');
  root.style.removeProperty('--me-arc-origin-y');
  root.style.removeProperty('--me-arc-extra-h');
}

function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Adds mouse drag-to-scroll to an already-horizontally-scrollable row (the
 * font/colour inline rows — see .me-row--fonts/.me-row--colour's own
 * overflow-x: auto, which already gives touch/trackpad scroll for free,
 * just not a mouse-drag gesture on desktop). A plain `mousedown` + `scrollLeft`
 * approach would also fire as a "click" on whichever option the pointer
 * lands on, since a drag and a click both start with the same pointerdown —
 * so a real drag (movement past DRAG_THRESHOLD) marks the row and swallows
 * the *next* click via a one-shot capturing listener, letting an
 * option's own click handler run normally for an actual (non-dragged) tap.
 *
 * setPointerCapture is deliberately NOT called on pointerdown, only once a
 * real drag has started (past DRAG_THRESHOLD): capturing the pointer
 * immediately retargets that pointer's *own* pointerup/click to the
 * capturing element (the panel) per the Pointer Events spec, even for a
 * plain stationary press — which was silently breaking every option's own
 * click handler (the click still fired, just on the panel, never reaching
 * the button under the cursor).
 */
const DRAG_THRESHOLD = 5;

function wireDragToScroll(panel) {
  let startX = 0;
  let startScrollLeft = 0;
  let dragging = false;
  let moved = false;
  let activePointerId = null;

  const suppressNextClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    panel.removeEventListener('click', suppressNextClick, true);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > DRAG_THRESHOLD) {
      moved = true;
      // Only swallow a click once a real drag has actually happened —
      // a press-and-release with no movement (a normal click) never adds
      // this listener, so it reaches the option's own handler untouched.
      panel.addEventListener('click', suppressNextClick, true);
      // Captured only now (see function-level comment) — pointerup/click
      // being retargeted to the panel from here on is fine, since a real
      // drag has already committed to not being a click.
      try {
        panel.setPointerCapture?.(activePointerId);
      } catch {
        // Drag still works without capture; it just won't keep tracking
        // the pointer once it leaves the panel's own bounds.
      }
    }
    if (moved) panel.scrollLeft = startScrollLeft - dx;
  };

  const onPointerUp = (e) => {
    dragging = false;
    moved = false;
    try {
      panel.releasePointerCapture?.(e.pointerId);
    } catch {
      // Nothing to release if setPointerCapture above never ran/succeeded.
    }
    panel.removeEventListener('pointermove', onPointerMove);
    panel.removeEventListener('pointerup', onPointerUp);
    panel.removeEventListener('pointercancel', onPointerUp);
  };

  panel.addEventListener('pointerdown', (e) => {
    // Only the primary mouse button / a single touch/pen point — modifier-
    // clicks, right-clicks, and multi-touch gestures are left alone.
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScrollLeft = panel.scrollLeft;
    activePointerId = e.pointerId;
    panel.addEventListener('pointermove', onPointerMove);
    panel.addEventListener('pointerup', onPointerUp);
    panel.addEventListener('pointercancel', onPointerUp);
  });
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
    return root.compareDocumentPosition(el) === Node.DOCUMENT_POSITION_FOLLOWING;
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
    opt.stretch ? `font-stretch:${opt.stretch};` : '',
  ].join('');
  const btn = createTag('button', {
    type: 'button',
    class: `me-font${index === 0 ? ' is-selected' : ''}`,
    style,
    'data-font': opt.font,
    role: 'option',
    'aria-selected': index === 0 ? 'true' : 'false',
    // Explicit (not left to default from textContent) so buildFontControl's
    // own accessible name can read it back the same way buildColorControl
    // reads a swatch's aria-label — see selectFont below.
    'aria-label': opt.label,
  });
  btn.textContent = opt.label;
  btn.setAttribute('daa-ll', `Select font style`);
  btn.addEventListener('click', () => onPick(opt));
  return btn;
}

function buildFontControl(root, fontOptions, onSelect, panelMode, onTabOutOfOptions, wrapPick) {
  const control = createTag('button', {
    type: 'button',
    tabIndex: 9,
    class: 'me-control me-control--font',
    'aria-expanded': 'false',
    'daa-ll': 'Font Control',
  });
  const pill = createTag('span', { class: 'me-pill', 'aria-label': fontOptions[0].label });
  pill.textContent = fontOptions[0].label;
  // "style" drops on mobile (label reads "Font" only there, per Figma node
  // 54:7888) — same pattern as buildColorControl's " colour" suffix below:
  // a separate span hidden via CSS rather than swapping textContent, so
  // there's no JS branching on viewport width for what's purely a label fit.
  const label = createTag('span', { class: 'me-control-label' }, [
    'Font',
    createTag('span', { class: 'me-control-label-suffix' }, [' style']),
  ]);
  control.append(pill, label);

  // Accessible name is "Font style" + whichever option is currently
  // selected — same pattern as buildColorControl's updateAccessibleName.
  function updateAccessibleName(fontName) {
    const name = `Font style ${fontName}`;
    control.setAttribute('aria-label', name);
    control.title = name;
  }
  updateAccessibleName(fontOptions[0].label);

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
    root.style.setProperty('--me-quote-font-stretch', opt.stretch || 'normal');
    pill.textContent = opt.label;
    pill.setAttribute('aria-label', opt.label);
    pill.style.fontFamily = opt.font;
    pill.style.fontStyle = opt.italic ? 'italic' : 'normal';
    pill.style.fontWeight = opt.weight || 'normal';
    pill.style.fontStretch = opt.stretch || 'normal';
    [panel, sheetGrid].forEach((container) => {
      container.querySelectorAll('.me-font').forEach((f) => {
        const isMatch = f.dataset.font === opt.font;
        f.classList.toggle('is-selected', isMatch);
        f.setAttribute('aria-selected', String(isMatch));
      });
    });
    updateAccessibleName(opt.label);
    roving?.syncTabindexes();
  }

  const onPick = (opt) => {
    // wrapPick lets buildWidget run the fade-out/apply/fade-in "soft swap"
    // around the actual selectFont + onSelect notification — defaults to
    // calling straight through for any caller that doesn't need it.
    (wrapPick || ((apply) => apply()))(() => {
      selectFont(opt);
      onSelect?.(opt);
    });
    // Mobile bottom sheet dismisses on selection — per Figma node 137:4778's
    // "Bottom sheet expectation" note — unlike the tablet/desktop inline row,
    // which stays open after a pick (isMobileSheetWidth is the same check
    // this file already uses everywhere else to distinguish the two).
    if (isMobileSheetWidth()) root.setAttribute('data-me-panel', 'none');
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
  // Mouse drag-to-scroll — same inline row only, same rationale as the
  // roving-tabindex wiring above (the mobile sheet's grid doesn't scroll
  // horizontally at all).
  wireDragToScroll(panel);

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

  // Esc closes the open row and returns focus to the trigger — same
  // always-open-inline guard as the click handler above (that mode keeps
  // one of font/colour open at all times, so there's no "closed" state for
  // Esc to fall back to there either).
  function closeAndReturnFocus() {
    if (panelMode === 'always-open-inline' && !isMobileSheetWidth()) return;
    root.setAttribute('data-me-panel', 'none');
    control.setAttribute('aria-expanded', 'false');
    control.focus();
  }
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAndReturnFocus();
  });

  // Enter/Space on the trigger itself opens the row via the click handler
  // above (native <button> behaviour). Tab, once the row is open, moves
  // straight to the first option instead of wherever native tab order would
  // otherwise land — the options themselves default to tabindex=-1 (see
  // wireOptionRowRoving), so without this the row would look open but be
  // unreachable by keyboard.
  control.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAndReturnFocus();
      return;
    }
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
  // card.title comes from the template service (see getTemplateTitle in
  // mini-editor-background-loader.js) and is the name shown for this
  // background everywhere else it's referenced — the colour control's own
  // accessible name (see buildColorControl) reads it back off this same
  // button so both always agree. Falls back to the old positional label
  // only for the rare template with no title/topic to derive one from.
  const name = card.title || `Background ${index + 1}`;
  const btn = createTag('button', {
    type: 'button',
    class: `me-swatch-btn${index === 0 ? ' is-selected' : ''}`,
    'data-bg': card.bg,
    role: 'option',
    'aria-selected': index === 0 ? 'true' : 'false',
    'aria-label': name,
  });
  const fill = createTag('span', {
    class: 'me-swatch-fill',
    style: `background-image:url("${card.bg}")`,
  });
  btn.append(fill);
  btn.setAttribute('daa-ll', `Select background color`);
  btn.addEventListener('click', () => onPick(card));
  return btn;
}

function buildColorControl(root, cards, onSelect, panelMode, onTabOut) {
  const control = createTag('button', {
    type: 'button',
    class: 'me-control me-control--colour',
    'aria-expanded': 'false',
    tabIndex: 10,
    'daa-ll': 'Background control',
  });
  const swatch = createTag('span', { class: 'me-swatch' });
  // "colour" drops on mobile (label reads "Background" only there) — kept
  // as a separate span hidden via CSS rather than swapping textContent, so
  // there's no JS branching on viewport width for what's purely a label fit.
  const label = createTag('span', { class: 'me-control-label' }, [
    'Background',
    createTag('span', { class: 'me-control-label-suffix' }, [' color']),
  ]);
  control.append(swatch, label);

  // Accessible name is "Background color" + whichever swatch is currently
  // selected (see updateAccessibleName below, called from selectSwatch) —
  // read back off that swatch's own aria-label (see buildSwatchButton) so
  // the two always agree, rather than duplicating card.title's fallback
  // logic here. aria-label (not the visible `label` above) carries this,
  // since it overrides visible text content for the accessible name;
  // title mirrors it so the native tooltip matches exactly.
  function updateAccessibleName(swatchName) {
    const name = `Background color${swatchName ? ` ${swatchName}` : ''}`;
    control.setAttribute('aria-label', name);
    control.title = name;
  }

  const panel = createTag('div', {
    class: 'me-row me-row--colour',
    role: 'listbox',
    'aria-label': 'Background color',
  });
  // All fetched backgrounds (not just the desktop decoration subset), same
  // as the desktop inline row — the sheet's grid scrolls to fit them all.
  const sheetGrid = createTag('div', {
    class: 'me-sheet-grid me-sheet-grid--colour',
    role: 'listbox',
    'aria-label': 'Background color',
  });

  let roving;
  function selectSwatch(bg) {
    root.style.setProperty('--me-card-bg', `url("${bg}")`);
    swatch.style.backgroundImage = `url("${bg}")`;
    let selectedName = '';
    [panel, sheetGrid].forEach((container) => {
      container.querySelectorAll('.me-swatch-btn').forEach((s) => {
        const isMatch = s.dataset.bg === bg;
        s.classList.toggle('is-selected', isMatch);
        s.setAttribute('aria-selected', String(isMatch));
        // Both containers hold an equivalent match for the same bg (see
        // cards.forEach below) — either's aria-label is the same name.
        if (isMatch) selectedName = s.getAttribute('aria-label') || '';
      });
    });
    updateAccessibleName(selectedName);
    roving?.syncTabindexes();
  }

  const onPick = (card) => {
    selectSwatch(card.bg);
    onSelect?.(card);
    // Mobile bottom sheet dismisses on selection — per Figma node 137:4778's
    // "Bottom sheet expectation" note — unlike the tablet/desktop inline row,
    // which stays open after a pick (isMobileSheetWidth is the same check
    // this file already uses everywhere else to distinguish the two).
    if (isMobileSheetWidth()) root.setAttribute('data-me-panel', 'none');
  };
  cards.forEach((card, index) => {
    panel.append(buildSwatchButton(card, index, onPick));
    sheetGrid.append(buildSwatchButton(card, index, onPick));
  });

  if (cards[0]) {
    swatch.style.backgroundImage = `url("${cards[0].bg}")`;
    updateAccessibleName(cards[0].title || 'Background 1');
  }

  // Same rationale as buildFontControl's roving — Tab from any swatch (not
  // just the current one) always exits via onTabOut (the Skip-quote-
  // suggestions CTA on desktop, or straight past .mini-editor on small
  // viewports where that CTA doesn't exist — see buildWidget's wiring),
  // never advances between swatches (that's Left/Right's job). This inline
  // row is shown down to the small-app-frame/arc breakpoint, not just
  // desktop widths — only the narrower <=767px bottom sheet replaces it
  // (see isMobileSheetWidth), so this wiring applies at both.
  roving = wireOptionRowRoving(panel, '.me-swatch-btn', () => onTabOut?.());
  // Mouse drag-to-scroll — same rationale as buildFontControl's own wiring.
  wireDragToScroll(panel);

  control.addEventListener('click', () => {
    const isOpen = root.getAttribute('data-me-panel') === 'colour';
    // See buildFontControl's identical guard for always-open-inline mode.
    if (panelMode === 'always-open-inline' && isOpen && !isMobileSheetWidth()) return;
    root.setAttribute('data-me-panel', isOpen ? 'none' : 'colour');
    control.setAttribute('aria-expanded', String(!isOpen));
  });

  // Esc closes the open row and returns focus to the trigger — same
  // always-open-inline guard as the click handler above (that mode keeps
  // one of font/colour open at all times, so there's no "closed" state for
  // Esc to fall back to there either).
  function closeAndReturnFocus() {
    if (panelMode === 'always-open-inline' && !isMobileSheetWidth()) return;
    root.setAttribute('data-me-panel', 'none');
    control.setAttribute('aria-expanded', 'false');
    control.focus();
  }
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAndReturnFocus();
  });

  // Tab off the trigger itself — whether or not its row is open — always
  // goes via onTabOut (same destination as tabbing out of the open row's own
  // swatches, see above): the colour control is the last of the two
  // pickers, so nothing else in this control->options chain follows it.
  // isMobileSheetWidth (<=767px, narrower than the small-app-frame/arc
  // breakpoint) is the one range this is skipped for — the bottom sheet's
  // own focus handling takes over there instead.
  control.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAndReturnFocus();
      return;
    }
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
  const { disableBackgroundScroll, restoreBackgroundScroll } = a11y;
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
  const tooltips = [];
  const supportedActions = topActions.filter(({ type }) => TOP_ACTION_DEFS[type]);
  const baseTabIndex = 5;
  // Same S2 sp-tooltip component (with its caret) already used for action
  // buttons on the Colour experience, per Figma node 1099-5050's feedback
  // that these tooltips should come from that shared component. Guarded
  // (see registry.js) because this loader's own icons-workflow.js import
  // above and the tooltip's overlay/icon bundle both register overlapping
  // custom elements — without the guard, whichever finishes second throws
  // "already been used with this registry" and mini-editor.js's catch
  // removes the whole block.
  const [{ createExpressTooltip }, { installRegistryGuard }] = await Promise.all([
    import('../../color-shared/spectrum/components/express-tooltip.js'),
    import('../../color-shared/spectrum/registry.js'),
  ]);
  const tooltipGuard = installRegistryGuard();
  try {
    for (const [index, { type, onClick, shareMenu }] of supportedActions.entries()) {
      const def = TOP_ACTION_DEFS[type];
      const icon = createTag(def.icon, { class: 'me-action-icon', 'aria-hidden': 'true' });
      const btn = createTag('button', {
        tabIndex: baseTabIndex + index,
        type: 'button',
        class: `me-action me-action--${type}`,
        'aria-label': def.label,
      }, [icon]);
      tooltips.push(await createExpressTooltip({
        targetEl: btn,
        content: def.label,
        placement: 'top',
        dismissOnActivate: true,
      }));
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
  } finally {
    tooltipGuard.restore();
  }
  bar.destroy = () => {
    menuApis.forEach((api) => api.destroy());
    tooltips.forEach((tip) => tip.destroy());
  };
  return bar;
}

async function buildWidget(
  root,
  a11y,
  cardSet,
  fontOptions,
  topActions,
  panelMode,
  decorationsEnabled,
) {
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
      stretch: fontOptions[0]?.stretch || 'normal',
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
  });
  const quoteEl = createTag('div', { class: 'me-quote' });
  // The full, untruncated quote — kept separate from quoteEl's own display
  // text (which truncates at EDITOR_QUOTE_CHAR_LIMIT) so copy-to-clipboard
  // and the accessible name below always use the complete text, never the
  // "…"-shortened version sighted users see on a long quote.
  let currentQuote = first.quote;
  const renderQuote = (quote) => {
    currentQuote = quote;
    quoteEl.textContent = truncateQuote(quote, EDITOR_QUOTE_CHAR_LIMIT);
    // Accessible name is always "Click to copy quote: {full quote}" — the
    // untruncated quote appended, regardless of whether the visible text
    // itself is truncated.
    quoteWrap.setAttribute('aria-label', `Click to copy quote: ${quote}`);
  };

  quoteWrap.append(quoteEl);
  renderQuote(first.quote);

  // Same S2 sp-tooltip as the top-right action bar (see
  // buildMiniEditorActions), replacing the old hand-rolled .me-tip/.me-tip-box.
  const [{ createExpressTooltip }, { installRegistryGuard }] = await Promise.all([
    import('../../color-shared/spectrum/components/express-tooltip.js'),
    import('../../color-shared/spectrum/registry.js'),
  ]);
  const quoteTooltipGuard = installRegistryGuard();
  try {
    await createExpressTooltip({
      targetEl: quoteWrap,
      content: 'Click to copy quote',
      placement: 'top',
    });
  } finally {
    quoteTooltipGuard.restore();
  }

  // Mirrors the light-mode/dark-mode class the deco/arc cards apply per their
  // own card.mode (see buildDecoCards/buildArcCard's render) so the desktop
  // .me-card's text/control contrast follows the same per-background mode.
  const setCardMode = (mode) => {
    card.classList.remove('light-mode', 'dark-mode');
    if (mode) card.classList.add(`${mode}-mode`);

    // Keep top-right action contrast in sync with background mode.
    const isDarkMode = mode === 'dark';
    root.style.setProperty('--me-action-icon-color', isDarkMode ? 'var(--color-gray-150)' : '#292929');
    root.style.setProperty('--me-action-hover-bg', isDarkMode ? '#292929' : 'var(--color-gray-150)');
  };
  setCardMode(first.card?.mode);

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
    const ok = await a11y.copyQuoteToClipboard(
      currentQuote,
      authorEl.textContent,
      'seo-discover-page-center-quote',
    );
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
  const skipCta = (!decorationsEnabled || isSmallViewport())
    ? null
    : buildSkipQuoteSuggestionsCta(root);

  const controls = createTag('div', { class: 'me-controls' });
  let focusColourControl = () => {};
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
    () => focusColourControl(),
    (apply) => animateQuoteChange(quoteEl, apply),
  );
  const colourControlConfig = buildColorControl(
    root,
    cardSet.map((c) => c.card),
    (bgCard) => {
      // Unconditional (not just via onFontOrColourPick, which only reaches a
      // listener when decorationsEnabled — see its declaration above): the
      // desktop .me-card's own light-mode/dark-mode text contrast must
      // follow every background pick even when there's no arc carousel to
      // notify, e.g. the "Create a design" modal (decorations: false).
      setCardMode(bgCard.mode);
      onFontOrColourPick({ card: bgCard });
    },
    panelMode,
    // No Skip-quote-suggestions CTA to hand off to on small viewports (see
    // skipCta above — the deco cards it bridges to don't exist there, the
    // arc carousel replaces them) — Tab out of the colour control/swatches
    // goes straight past the whole .mini-editor block instead, same
    // destination the CTA's own Enter/Space would otherwise land on.
    () => (skipCta ? skipCta.show() : findNextFocusableAfter(root)?.focus()),
  );
  const {
    control: colourControl,
    panel: colourPanel,
    sheetGrid: colourSheetGrid,
    selectSwatch,
  } = colourControlConfig;
  focusColourControl = () => colourControl.focus();
  controls.append(fontControl, colourControl);

  const panelWrap = createTag('div', { class: 'me-panel' });
  panelWrap.append(fontPanel, colourPanel);

  const fontSheet = buildBottomSheet(root, a11y, 'fonts', 'Choose a font style', fontSheetGrid);
  const colourSheet = buildBottomSheet(root, a11y, 'colour', 'Choose a background color', colourSheetGrid);

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
            stretch: font.stretch || 'normal',
          },
        } : {}),
      });
      animateQuoteChange(quoteEl, () => {
        renderQuote(quote);
        if (font) selectFont(font);
      });
      authorEl.textContent = author || '';
      authorEl.style.display = author ? '' : 'none';
      if (bgCard) {
        selectSwatch(bgCard.bg);
        setCardMode(bgCard.mode);
      }
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
              stretch: patch.font.stretch || 'normal',
            },
          });
        }
        if (patch.card) {
          updateContentModel({ backgroundUrl: patch.card.bg });
          setCardMode(patch.card.mode);
        }
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
  const quoteP = createTag('div', { class: 'me-deco-quote' });
  quoteP.textContent = truncateQuote(quote, DECO_QUOTE_CHAR_LIMIT);
  clipped.append(quoteP);
  if (author) {
    const authorP = createTag('div', { class: 'me-deco-author' });
    authorP.textContent = author;
    clipped.append(authorP);
  }

  const actions = createTag('div', { class: 'me-deco-actions' });
  const attribution = author ? `"${quote}" — ${author}` : `"${quote}"`;
  // variant="secondary" so hover/focus/active come entirely from the S2
  // component's own styling instead of hand-rolled CSS overrides — see
  // .me-deco-use/.me-deco-copy in the stylesheet, which now only sets
  // layout (size, gap), not colour/state.
  const useBtn = createTag('sp-button', {
    variant: 'secondary',
    size: 's',
    class: 'me-deco-use',
    'aria-label': `Use this quote: ${attribution}`,
  });
  useBtn.setAttribute('daa-ll', 'Use this quote');
  useBtn.textContent = 'Use this quote';
  useBtn.addEventListener('click', (e) => {
    useQuote(entry);
    // Announced here (not inside useQuote itself, shared with the arc
    // carousel's own prev/next navigation) — the arc's centre card gets its
    // own position-based announcement instead (see buildArcCarousel), so
    // this only fires for this specific "Use this quote" action.
    a11y.announceToScreenReader(`Quote changed to: ${attribution}`);
    // A mouse/touch click (detail > 0) leaves this button focused, which
    // keeps .me-deco's :focus-within true — and so .me-deco-actions visible
    // — even after the pointer has moved away, looking like a stuck hover.
    // Keyboard activation (Enter/Space, detail === 0) leaves focus alone so
    // this row stays reachable for continued keyboard navigation.
    if (e.detail > 0) useBtn.blur();
  });

  const copyIcon = createTag('sp-icon-copy', { slot: 'icon', class: 'me-deco-copy-icon', 'aria-hidden': 'true' });
  const copyBtn = createTag('sp-button', {
    variant: 'secondary',
    size: 's',
    class: 'me-deco-copy',
    label: `Copy quote: ${attribution}`,
    'aria-label': `Copy quote: ${attribution}`,
  }, [copyIcon]);
  copyBtn.addEventListener('click', async (e) => {
    const ok = await a11y.copyQuoteToClipboard(
      quote,
      author,
      'seo-discover-page-decoration-card',
    );
    if (ok) {
      copyBtn.classList.add('is-copied');
      setTimeout(() => copyBtn.classList.remove('is-copied'), 1200);
    }
    // Same stuck-hover fix as useBtn above.
    if (e.detail > 0) copyBtn.blur();
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
    deco.classList.add(`${entry.card.mode}-mode`);
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
// Skip-quote-suggestions CTA — left-to-right visual order: far-left (1,3),
// near-left (2,4), near-right (6,8), far-right (5,7). See DECO_COLUMNS for
// the column/card-number mapping.
const DECO_TAB_CHAIN_ORDER = [1, 3, 2, 4, 6, 8, 5, 7];

/**
 * Chains Tab across every .me-deco-use/.me-deco-copy pair, in
 * DECO_TAB_CHAIN_ORDER (left-to-right visual order), and returns a function
 * that focuses the first visible button in that chain — the entry point wired
 * to the Skip-quote-suggestions CTA's Tab handler (see createMiniEditorWidget).
 * Every button in the chain gets an explicit tabindex=-1: like the font/colour
 * rows' roving options (see wireOptionRowRoving), these buttons default to
 * tabindex=0, which the browser visits only after every explicit
 * positive-tabindex element on the page (see this widget's 1-10+ sequence) —
 * left at the default, a plain Tab off the last button in the chain would
 * cycle back into the widget's own controls instead of exiting to the rest of
 * the page. Far-column cards (.me-deco--1/3/5/7) can be hidden below 1625px
 * (see syncDecoClipping) — those are skipped when finding the next button and
 * the first entry point so focus never lands on an invisible element.
 *
 * @param {HTMLElement} decorations — the .mini-editor-decorations wrapper
 * @param {HTMLElement} root — the .mini-editor block root, used to find the
 *   next focusable element outside the widget after the last card in the chain
 */
function wireDecoTabChain(decorations, root) {
  // A card can be absent — e.g. fewer templates fetched than DECO_CARD_COUNT
  // leaves the last slot(s) unbuilt (see buildDecoCards) — so each lookup is
  // skipped rather than assumed to exist.
  const buttons = DECO_TAB_CHAIN_ORDER.flatMap((cardNum) => {
    const card = decorations.querySelector(`.me-deco--${cardNum}`);
    if (!card) return [];
    return [card.querySelector('.me-deco-use'), card.querySelector('.me-deco-copy')];
  });
  // Far-column cards get the .hidden class at 1200–1625px viewport widths
  // (see syncDecoClipping). Buttons from hidden cards are excluded from
  // keyboard focus so focus never lands on an invisible element.
  const isHidden = (btn) => !!btn.closest('.hidden');
  buttons.forEach((btn, i) => {
    btn.tabIndex = -1;
    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || e.shiftKey) return;
      e.preventDefault();
      // Find the next button that isn't inside a hidden card.
      let next = null;
      for (let j = i + 1; j < buttons.length; j++) {
        if (!isHidden(buttons[j])) { next = buttons[j]; break; }
      }
      if (next) {
        next.focus();
      } else {
        // Last visible card in the chain: move on to the rest of the page
        // rather than letting the browser cycle back to the widget's own
        // positive-tabindex controls (which live in mini-editor-stage, after
        // mini-editor-decorations in the DOM but before everything else in
        // the positive-tabindex sequence).
        findNextFocusableAfter(root)?.focus();
      }
    });
  });
  // Entry point: first visible button in chain (used by Skip CTA's Tab handler).
  return () => {
    const first = buttons.find((btn) => !isHidden(btn));
    first?.focus();
  };
}

/**
 * Builds one of the three carousel cards. Unlike a fixed prev/centre/next
 * slot (which would only ever swap content, never actually move — nothing
 * to transition), each of these 3 elements keeps its own content across a
 * navigation and is reassigned to a *different role's position* — that's
 * what makes the 1s transform transition on .me-arc-card actually animate
 * a visible slide/rotate between roles instead of an instant content pop.
 */
const ROLE_CLASSES = ['me-arc-card--prev', 'me-arc-card--center', 'me-arc-card--next', 'me-arc-card--off'];

async function buildArcCard(onActivate, a11y, tabIndex) {
  const el = createTag('div', {
    class: 'me-arc-card',
    role: 'option',
    'aria-selected': 'false',
    tabindex: tabIndex,
    'aria-describedby': 'me-arc-card-hint',
  });
  // quoteP/authorP live inside quoteWrap (not directly in el) purely so the
  // centre role can reuse .me-quote-wrap's existing CSS (frosted
  // hover/focus background, is-copied state) via a descendant selector off
  // el's own :hover/:focus-visible — see .me-arc-card--center:hover
  // .me-quote-wrap in the CSS. quoteWrap itself has no role/tabindex/
  // listeners of its own: el (role="option", already the roving-tabindex
  // focus target for prev/centre/next) stays the one real interactive
  // element, so this never nests two focusable elements.
  const quoteP = createTag('div', { class: 'me-arc-quote' });
  const authorP = createTag('div', { class: 'me-arc-author' });
  const quoteWrap = createTag('div', { class: 'me-quote-wrap', tabIndex: -1 });
  const hint = createTag('span', { id: 'me-arc-card-hint', class: 'sr-only' }, ['Copy quote to clipboard']);
  quoteWrap.append(quoteP, hint);
  el.append(quoteWrap, authorP);

  // Same S2 sp-tooltip as the top-right action bar (see
  // buildMiniEditorActions) — quoteWrap keeps receiving hover/focus at every
  // role (it's not pointer-events: none on prev/next), but only the centre
  // role actually copies on click/Enter (see doCopy below), so the tooltip
  // must never announce "Click to copy quote" there. createExpressTooltip
  // has no built-in way to conditionally suppress a show, so a capture-phase
  // listener intercepts pointerenter/focusin here and stops them before its
  // own bubble-phase listeners (see express-tooltip.js) ever run, whenever
  // this card isn't currently centre.
  const [{ createExpressTooltip }, { installRegistryGuard }] = await Promise.all([
    import('../../color-shared/spectrum/components/express-tooltip.js'),
    import('../../color-shared/spectrum/registry.js'),
  ]);
  const tooltipGuard = installRegistryGuard();
  try {
    await createExpressTooltip({
      targetEl: quoteWrap,
      content: 'Click to copy quote',
      placement: 'top',
    });
  } finally {
    tooltipGuard.restore();
  }
  const suppressTipWhenNotCentre = (e) => {
    if (!el.classList.contains('me-arc-card--center')) e.stopImmediatePropagation();
  };
  quoteWrap.addEventListener('pointerenter', suppressTipWhenNotCentre, { capture: true });
  quoteWrap.addEventListener('focusin', suppressTipWhenNotCentre, { capture: true });

  // currentQuote/currentAuthor (not quoteP.textContent) — the full quote,
  // even when the visible text is truncated (see render below), same
  // reasoning as buildWidget's own currentQuote.
  let currentQuote = '';
  let currentAuthor = '';
  const doCopy = async () => {
    const ok = await a11y.copyQuoteToClipboard(
      currentQuote,
      currentAuthor,
      'seo-discover-page-center-quote',
    );
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

  // Keep the entire card clickable for prev/next navigation while avoiding
  // duplicate handling when the click originated from quoteWrap itself.
  el.addEventListener('click', (e) => {
    if (e.target.closest('.me-quote-wrap')) return;
    if (el.classList.contains('me-arc-card--center')) doCopy();
    else onActivate(el);
  });

  function render(entry) {
    el.style.backgroundImage = `url("${entry.card.bg}")`;
    // Display text truncates at EDITOR_QUOTE_CHAR_LIMIT (same limit as the
    // main widget's own quote — see renderQuote in buildWidget), applied
    // uniformly regardless of this card's current role (prev/centre/next
    // share one render path).
    currentQuote = entry.quote;
    currentAuthor = entry.author || '';
    const truncated = truncateQuote(entry.quote, EDITOR_QUOTE_CHAR_LIMIT);
    quoteP.textContent = truncated;
    // el's own accessible name (role="option") is always quote + author,
    // regardless of role — the untruncated quote appended, never just the
    // shortened display text.
    el.setAttribute('aria-label', entry.author ? `${entry.quote} — ${entry.author}` : entry.quote);
    // quoteWrap's own name is the click-to-copy action, same pattern as
    // buildWidget's desktop .me-quote-wrap (see renderQuote there) — only
    // meaningful while this card is centre (only centre copies on
    // click/Enter, see doCopy above), but harmless to set on every role
    // since prev/next's quoteWrap isn't a separate Tab stop anyway.
    quoteWrap.setAttribute('aria-label', `Click to copy quote: ${entry.quote}`);
    // entry.font is the carousel-wide selected font (see buildArcCarousel's
    // selectedFont/withFont) when one has been picked — applies to every
    // role (prev/centre/next), not just centre. Falls back to the fixed
    // default (CSS) font, same as the decorative cards, until then.
    quoteP.style.fontFamily = entry.font?.font || '';
    quoteP.style.fontStyle = entry.font?.italic ? 'italic' : '';
    quoteP.style.fontWeight = entry.font?.weight || '';
    quoteP.style.fontStretch = entry.font?.stretch || '';
    authorP.textContent = entry.author || '';
    authorP.style.display = entry.author ? '' : 'none';
    // Replacing (not stacking) mode classes keeps text contrast in sync
    // when the same card node is re-rendered across background picks.
    el.classList.remove('light-mode', 'dark-mode');
    if (entry.card.mode === 'light' || entry.card.mode === 'dark') {
      el.classList.add(`${entry.card.mode}-mode`);
    }
  }

  // Every role is now interactive (centre copies its quote on click/Enter,
  // same as .me-quote-wrap; prev/next still navigate via onActivate above),
  // unlike before centre was inert (cursor: default, pointer-events: none).
  function setInteractivity(role) {
    el.setAttribute('aria-selected', String(role === 'center'));
  }

  function setRole(role) {
    el.classList.remove(...ROLE_CLASSES);
    if (role !== 'off') {
      el.classList.add(`me-arc-card--${role}`);
    } else {
      el.classList.add('me-arc-card--off');
    }
    setInteractivity(role);
  }

  return {
    el, render, setRole,
  };
}

/**
 * Tablet/mobile carousel with continuous drag + snapping over an infinite
 * loop of cards. Arc geometry is recomputed every frame from live position,
 * so cards fan along the same 14deg-per-step curve while dragging, flicking,
 * and snapping.
 */
async function buildArcCarousel(cardSet, useQuote, defaultFont, a11y, widget) {
  const ARC_STEP_DEG = 14;
  const ARC_STEP_RAD = ARC_STEP_DEG * (Math.PI / 180);
  const DRAG_THRESHOLD_PX = 10;
  const FLICK_DIRECTION_GUARD_CARDS = 0.18;
  const SNAP_BASE_MS = 1000;
  const SNAP_MAX_MS = 1400;
  const SNAP_SETTLE_RECHECK_MS = 90;
  const FLICK_MULTIPLIER = 0.22;
  const MIN_FLICK_CARDS_PER_SEC = 0.35;

  const root = createTag('div', { class: 'me-arc' });
  const listboxRole = createTag('div', { class: 'me-arc-listbox', role: 'listbox', 'aria-label': 'Template' });

  const total = cardSet.length;
  if (!total) {
    root.append(listboxRole);
    return { root, updateCentre: () => {} };
  }

  let activeIndex = 0;
  let position = 0;
  let velocityCardsPerMs = 0;
  let rafHandle = null;
  let moveSettleTimer = null;
  let moving = false;
  let pendingIndex = null;
  let commandedPosition = 0;

  let pointerDown = false;
  let dragLocked = false;
  let dragging = false;
  let suppressClick = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startPosition = 0;
  let lastMoveTs = 0;
  let lastMovePosition = 0;

  let centreOverride = null;
  let selectedFont = defaultFont || null;

  let cardWidth = 542;
  let cardGap = 48;
  let slideWidth = cardWidth + cardGap;
  let arcRadius = slideWidth / Math.sin(ARC_STEP_RAD);

  const normalizeIndex = (index) => ((index % total) + total) % total;
  const shortestDistance = (index, pos) => {
    const offset = (index - pos) % total;
    const wrapped = (offset + total) % total;
    let delta = wrapped;
    if (delta > total / 2) delta -= total;
    return delta;
  };

  function rebasePositionAroundActive() {
    const cycles = Math.round((position - activeIndex) / total);
    if (!Number.isFinite(cycles) || cycles === 0) return;
    const shift = cycles * total;
    position -= shift;
    commandedPosition -= shift;
  }

  const readCssPx = (name, fallback) => {
    const raw = getComputedStyle(root).getPropertyValue(name).trim();
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function syncGeometry() {
    cardWidth = readCssPx('--me-arc-card-w', cardWidth);
    cardGap = readCssPx('--me-arc-track-gap', cardGap);
    slideWidth = cardWidth + cardGap;
    arcRadius = slideWidth / Math.sin(ARC_STEP_RAD);
  }

  const withFont = (entry) => (selectedFont ? { ...entry, font: selectedFont } : entry);

  if (isReducedMotion()) {
    widget.classList.add('me-arc-reduce-motion');
  }

  function announcePosition() {
    if (typeof a11y.announceToScreenReader === 'function') {
      a11y.announceToScreenReader(`${activeIndex + 1} of ${total}`);
    }
  }

  function centerEntryFor(index) {
    const merged = index === activeIndex && centreOverride
      ? { ...cardSet[index], ...centreOverride }
      : cardSet[index];
    return withFont(merged);
  }

  let cards = [];

  function renderCardContent() {
    cards.forEach((card, index) => {
      card.render(centerEntryFor(index));
    });
  }

  function setMoving(nextMoving) {
    if (moving === nextMoving) return;
    moving = nextMoving;
    if (moving) {
      widget.classList.add('me-arc-moving');
      return;
    }
    widget.classList.remove('me-arc-moving');
  }

  function scheduleRevealAfterSettle() {
    clearTimeout(moveSettleTimer);
    if (isReducedMotion()) {
      setMoving(false);
      return;
    }
    moveSettleTimer = setTimeout(() => {
      const atSnap = Math.abs(position - Math.round(position)) < 0.001;
      const stopped = Math.abs(velocityCardsPerMs) < 0.0001;
      if (atSnap && stopped) {
        setMoving(false);
      }
    }, SNAP_SETTLE_RECHECK_MS);
  }

  function applyRoleClasses() {
    const visualCenter = normalizeIndex(Math.round(position));
    const roleCenter = pendingIndex ?? visualCenter;
    const prevIndex = normalizeIndex(roleCenter - 1);
    const nextIndex = normalizeIndex(roleCenter + 1);
    cards.forEach((card, index) => {
      let role = 'off';
      if (index === roleCenter) role = 'center';
      else if (index === prevIndex) role = 'prev';
      else if (index === nextIndex) role = 'next';
      card.setRole(role);
      card.el.tabIndex = role === 'center' && !moving ? 2 : -1;
    });
  }

  function renderArcFrame() {
    cards.forEach((card, index) => {
      const n = shortestDistance(index, position);
      const theta = n * ARC_STEP_RAD;
      const arcX = arcRadius * Math.sin(theta);
      const arcY = arcRadius * (1 - Math.cos(theta));
      // Cards already conceptually live on a linear track n * slideWidth;
      // transform is the arc delta from that linear position.
      const offsetX = arcX - (n * slideWidth);
      const finalX = (n * slideWidth) + offsetX;
      const opacity = Math.max(0, 1 - (Math.max(0, Math.abs(n) - 0.2) * 0.55));
      const zIndex = Math.max(1, 100 - Math.round(Math.abs(n) * 10));
      const interactive = Math.abs(n) <= 1.15;

      card.el.style.transform = `translate(${finalX.toFixed(3)}px, ${arcY.toFixed(3)}px) rotate(${(n * ARC_STEP_DEG).toFixed(3)}deg)`;
      card.el.style.opacity = opacity.toFixed(3);
      card.el.style.zIndex = String(zIndex);
      card.el.style.pointerEvents = interactive ? 'auto' : 'none';
    });
    applyRoleClasses();
  }

  function commitActive(index, announce = true) {
    activeIndex = normalizeIndex(index);
    centreOverride = null;
    renderCardContent();
    useQuote(cardSet[activeIndex]);
    if (announce) {
      announcePosition();
    }
    applyRoleClasses();
  }

  const requestAsyncAnimationFrame = (callback) => {
    const handle = { cancelled: false, id: 0 };
    handle.id = requestAnimationFrame((ts) => {
      Promise.resolve().then(() => {
        if (!handle.cancelled) callback(ts);
      });
    });
    return handle;
  };

  function cancelSnapAnimation() {
    if (rafHandle) {
      rafHandle.cancelled = true;
      cancelAnimationFrame(rafHandle.id);
      rafHandle = null;
    }
  }

  function animateToPosition(targetPosition, duration, onDone = () => {}) {
    cancelSnapAnimation();

    if (isReducedMotion()) {
      position = targetPosition;
      velocityCardsPerMs = 0;
      renderArcFrame();
      onDone();
      return;
    }

    const start = position;
    const distance = targetPosition - start;
    if (Math.abs(distance) < 0.0001) {
      velocityCardsPerMs = 0;
      renderArcFrame();
      onDone();
      return;
    }

    const startTime = performance.now();
    const easeOut = (t) => 1 - ((1 - t) ** 4);
    setMoving(true);

    const step = (ts) => {
      const elapsed = ts - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOut(t);
      const prevPosition = position;
      position = start + (distance * eased);
      velocityCardsPerMs = (position - prevPosition) / Math.max(1, ts - (lastMoveTs || ts));
      lastMoveTs = ts;
      renderArcFrame();
      if (t < 1) {
        rafHandle = requestAsyncAnimationFrame(step);
      } else {
        rafHandle = null;
        position = targetPosition;
        velocityCardsPerMs = 0;
        renderArcFrame();
        onDone();
      }
    };

    rafHandle = requestAsyncAnimationFrame(step);
  }

  function snapTo(index, sourceVelocityCardsPerSec = 0) {
    const snappedIndex = normalizeIndex(index);
    commitActive(snappedIndex);

    const deltaCards = shortestDistance(snappedIndex, position);
    const targetPosition = position + deltaCards;
    commandedPosition = targetPosition;

    if (isReducedMotion()) {
      setMoving(true);
      pendingIndex = snappedIndex;
      applyRoleClasses();
      position = targetPosition;
      renderArcFrame();
      pendingIndex = null;
      setMoving(false);
      return;
    }

    const cardsToTravel = Math.max(1, Math.abs(deltaCards));
    const velocityExtra = Math.min(220, Math.abs(sourceVelocityCardsPerSec) * 35);
    const duration = Math.min(
      SNAP_MAX_MS,
      SNAP_BASE_MS + ((cardsToTravel - 1) * 180) + velocityExtra,
    );
    pendingIndex = snappedIndex;
    setMoving(true);
    applyRoleClasses();
    animateToPosition(targetPosition, duration, () => {
      pendingIndex = null;
      rebasePositionAroundActive();
      renderArcFrame();
      scheduleRevealAfterSettle();
    });
  }

  function snapBy(step, sourceVelocityCardsPerSec = 0) {
    const normalizedStep = step >= 0
      ? Math.max(1, Math.round(step))
      : Math.min(-1, Math.round(step));
    const snappedIndex = normalizeIndex(activeIndex + normalizedStep);
    commitActive(snappedIndex);

    commandedPosition = moving ? (commandedPosition + normalizedStep) : (position + normalizedStep);
    const targetPosition = commandedPosition;

    if (isReducedMotion()) {
      setMoving(true);
      pendingIndex = snappedIndex;
      applyRoleClasses();
      position = targetPosition;
      renderArcFrame();
      pendingIndex = null;
      setMoving(false);
      return;
    }

    const cardsToTravel = Math.max(1, Math.abs(normalizedStep));
    const velocityExtra = Math.min(220, Math.abs(sourceVelocityCardsPerSec) * 35);
    const duration = Math.min(
      SNAP_MAX_MS,
      SNAP_BASE_MS + ((cardsToTravel - 1) * 180) + velocityExtra,
    );
    pendingIndex = snappedIndex;
    setMoving(true);
    applyRoleClasses();
    animateToPosition(targetPosition, duration, () => {
      pendingIndex = null;
      rebasePositionAroundActive();
      renderArcFrame();
      scheduleRevealAfterSettle();
    });
  }

  const onActivate = (el) => {
    if (el.classList.contains('me-arc-card--prev')) {
      snapBy(-1);
    } else if (el.classList.contains('me-arc-card--next')) {
      snapBy(1);
    }
  };

  cards = await Promise.all(cardSet.map(() => buildArcCard(onActivate, a11y, -1)));

  function onPointerDown(e) {
    if (e.button !== 0) return;
    if (e.target.closest('.me-arc-nav')) return;
    // If a snap animation is still running, stop it before taking drag input;
    // otherwise RAF and drag both write `position`, causing jumpy/reverse motion.
    cancelSnapAnimation();
    clearTimeout(moveSettleTimer);
    pendingIndex = null;

    pointerDown = true;
    dragLocked = false;
    dragging = false;
    suppressClick = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startPosition = position;
    lastMoveTs = performance.now();
    lastMovePosition = position;
    velocityCardsPerMs = 0;
  }

  function onPointerMove(e) {
    if (!pointerDown || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragLocked) {
      const movedEnough = Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX;
      if (!movedEnough) {
        return;
      }
      dragLocked = true;
      if (Math.abs(dy) >= Math.abs(dx)) {
        pointerDown = false;
        return;
      }
      dragging = true;
      suppressClick = true;
      setMoving(true);
      try {
        root.setPointerCapture(pointerId);
      } catch (err) {
        // Continue without pointer capture if unavailable.
      }
    }

    if (!dragging) return;
    e.preventDefault();

    const now = performance.now();
    const nextPosition = startPosition - (dx / Math.max(1, slideWidth));
    const deltaPosition = nextPosition - lastMovePosition;
    const deltaTime = Math.max(1, now - lastMoveTs);
    velocityCardsPerMs = deltaPosition / deltaTime;
    lastMovePosition = nextPosition;
    lastMoveTs = now;
    position = nextPosition;
    renderArcFrame();
  }

  function releaseDrag() {
    if (!dragging) {
      setMoving(false);
      return;
    }

    const dragDeltaCards = position - startPosition;
    const velocityCardsPerSec = velocityCardsPerMs * 1000;
    const nearest = Math.round(position);
    let step = 0;
    if (Math.abs(velocityCardsPerSec) >= MIN_FLICK_CARDS_PER_SEC) {
      step = Math.round(velocityCardsPerSec * FLICK_MULTIPLIER);
      if (step === 0) {
        step = velocityCardsPerSec > 0 ? 1 : -1;
      }
      step = Math.max(-4, Math.min(4, step));

      // Guard against release jitter: if the final velocity sample points
      // opposite to the net drag direction, honor displacement direction.
      if (Math.abs(dragDeltaCards) >= FLICK_DIRECTION_GUARD_CARDS) {
        const dragDir = Math.sign(dragDeltaCards);
        const flickDir = Math.sign(step);
        if (dragDir && flickDir && dragDir !== flickDir) {
          step = dragDir;
        }
      }
    }

    const target = nearest + step;
    snapTo(target, velocityCardsPerSec);
  }

  function onPointerUpOrCancel(e) {
    if (e.pointerId !== pointerId) return;
    pointerDown = false;
    pointerId = null;
    if (dragging) {
      releaseDrag();
    }
    dragging = false;
    dragLocked = false;
  }

  function updateCentre(patch) {
    if (patch.font) {
      selectedFont = patch.font;
      renderCardContent();
      renderArcFrame();
      return;
    }
    centreOverride = { ...centreOverride, ...patch };
    cards[activeIndex].render(centerEntryFor(activeIndex));
    renderArcFrame();
  }

  syncGeometry();
  renderCardContent();
  renderArcFrame();

  listboxRole.append(...cards.map((card) => card.el));
  root.append(listboxRole);

  const prevBtn = createTag('button', {
    type: 'button',
    class: 'me-arc-nav me-arc-nav--prev',
    tabindex: 3,
    'aria-label': 'previous quote',
  }, [getIconElementDeprecated('arc-nav-left')]);
  const nextBtn = createTag('button', {
    type: 'button',
    class: 'me-arc-nav me-arc-nav--next',
    'aria-label': 'next quote',
    tabindex: 4,
  }, [getIconElementDeprecated('arc-nav-right')]);
  root.append(prevBtn, nextBtn);

  prevBtn.addEventListener('click', () => {
    snapBy(-1);
  });
  nextBtn.addEventListener('click', () => {
    snapBy(1);
  });

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerUpOrCancel);
  root.addEventListener('pointercancel', onPointerUpOrCancel);
  root.addEventListener('click', (e) => {
    if (!suppressClick) return;
    suppressClick = false;
    if (e.target.closest('.me-arc-nav')) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // buildArcCarousel computes geometry once before this root is inserted into
  // the live DOM. Re-sync on the next frame (after insertion) so CSS custom
  // properties inherited from the host (.mini-editor) are actually resolved —
  // especially the mobile --me-arc-card-w/--me-arc-track-gap tokens.
  requestAnimationFrame(() => {
    syncGeometry();
    renderArcFrame();
  });

  const onResize = () => {
    // Avoid geometry/slideWidth changes mid-drag, which can produce sudden
    // direction/velocity spikes if browser chrome changes viewport height.
    if (pointerDown || dragging) return;
    syncGeometry();
    renderArcFrame();
  };
  window.addEventListener('resize', onResize);

  return {
    root,
    updateCentre,
    destroy: () => {
      cancelSnapAnimation();
      clearTimeout(moveSettleTimer);
      window.removeEventListener('resize', onResize);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerUpOrCancel);
      root.removeEventListener('pointercancel', onPointerUpOrCancel);
    },
  };
}

/**
 * @param {Object} config
 * @param {HTMLElement} config.root — element the widget sets state attributes,
 *   CSS custom properties, and the `me-carousel-mode` class on (the block).
 * @param {Array} [config.topActions=[]] — top-right hover action bar (Figma
 *   node 1099-5050): `[{ type: 'edit'|'share'|'download', onClick }, ...]`.
 *   Only the types supplied are rendered, in the given order.
 * @param {Array} config.fontOptions — `{ label, font, italic, weight, stretch }` list.
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
  // "Use this quote"/"Copy" (see buildDecoCard) are sp-button, per the same
  // reasoning — only loaded when the deco cards that use them exist at all.
  if (decorationsEnabled) {
    await import('../spectrum/dist/button.js');
  }

  const { cardSet } = backgrounds;

  // always-open-inline (the modal) starts with the font panel open and
  // keeps one of font/colour open at all times — see buildFontControl /
  // buildColorControl's matching click-guard. Not on mobile widths, where
  // this host falls back to the normal bottom sheet (nothing open until
  // tapped), same as everywhere else this flag doesn't apply.
  const startsOpen = panelMode === 'always-open-inline' && !isMobileSheetWidth();
  root.setAttribute('data-me-panel', startsOpen ? 'fonts' : 'none');
  applyRuntimeArcTokens(root);

  const stage = createTag('div', { class: 'mini-editor-stage' });
  const {
    widget, useQuote, getContentModel, onFontOrColourChange, setDecoChainTarget,
    destroy: destroyWidget,
  } = await buildWidget(
    root,
    a11y,
    cardSet,
    fontOptions,
    topActions,
    panelMode,
    decorationsEnabled,
  );
  stage.append(widget);

  let decorations;
  let updateCentre = () => {};
  let syncViewportMode = () => {};
  let removeResizeListener = () => {};
  let destroyArcCarousel = () => {};

  if (decorationsEnabled) {
    // Use the full fetched card set for the tablet/mobile arc carousel,
    // independent of how many desktop deco cards are rendered.
    const arcCardSet = [...cardSet];
    decorations = buildDecoCards(a11y, cardSet, useQuote);
    // Only meaningful on desktop (see buildSkipQuoteSuggestionsCta) — a
    // no-op call when the CTA wasn't built (small viewport).
    setDecoChainTarget(wireDecoTabChain(decorations, root));
    const {
      root: arcCarousel,
      updateCentre: updateArcCentre,
      destroy: destroyArc,
    } = await buildArcCarousel(
      arcCardSet,
      useQuote,
      fontOptions[0],
      a11y,
      widget,
    );
    destroyArcCarousel = destroyArc || (() => {});
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
    // not just the >1200px/<=1200px carousel-mode switch below.
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
      applyRuntimeArcTokens(root);
      syncDecoClipping();
      root.classList.toggle('me-carousel-mode', isSmallViewport());
    };
    syncViewportMode();
    window.addEventListener('resize', syncViewportMode);
    removeResizeListener = () => window.removeEventListener('resize', syncViewportMode);
  }

  // Decouples this widget from the block(s) that offer their own "use this
  // quote" entry points (e.g. collapsible-rows' "Create a design" button) —
  // they dispatch this CustomEvent on document rather than needing a direct
  // reference to this editor instance. See mini-editor-widget.md.
  const onUseQuoteEvent = (e) => {
    const { quote, author, card, font } = e.detail;
    const patch = {
      quote,
      author,
      ...(card ? { card } : {}),
      ...(font ? { font } : {}),
    };
    useQuote(patch);
    updateCentre(patch);
  };
  document.addEventListener('mini-editor:use-quote', onUseQuoteEvent);

  return {
    stage,
    decorations,
    useQuote,
    updateCentre,
    getContentModel,
    syncViewportMode,
    destroy: () => {
      destroyWidget();
      destroyArcCarousel();
      removeResizeListener();
      document.removeEventListener('mini-editor:use-quote', onUseQuoteEvent);
    },
  };
}
