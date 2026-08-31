import { getLibs, getIconElementDeprecated, createTag } from '../../scripts/utils.js';
import { buildPaletteEditUrl } from '../../scripts/color-shared/utils/utilities.js';
import { createSpectrumIcon } from '../../scripts/color-shared/utils/icons.js';
import { loadIconsRail } from '../../scripts/color-shared/spectrum/load-spectrum.js';
import { createExpressTooltip } from '../../scripts/color-shared/spectrum/components/express-tooltip.js';
import { showExpressToast } from '../../scripts/color-shared/spectrum/components/express-toast.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';
import createExpressActionButton from '../../scripts/color-shared/spectrum/components/express-action-button.js';
import { createExpressPicker } from '../../scripts/color-shared/spectrum/components/express-picker.js';
import ColorThemeExpressController from '../../scripts/color-shared/controllers/ColorThemeExpressController.js';
import { createColorSwatchRailPlaceholders } from '../../scripts/color-shared/i18n/loadColorSwatchRailPlaceholders.js';
import { createSwatchRailAdapter } from '../../scripts/color-shared/adapters/litComponentAdapters.js';

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;
const COLOR_WHEEL_PATH = '/create/color-wheel';

const HARMONY_RULES = ['SHADES', 'COMPLEMENTARY', 'ANALOGOUS', 'TRIAD', 'DOUBLE_SPLIT_COMPLEMENTARY'];

const DISPLAY_COUNTS = {
  SHADES: 3,
  COMPLEMENTARY: 2,
  ANALOGOUS: 3,
  TRIAD: 3,
  DOUBLE_SPLIT_COMPLEMENTARY: 4,
};

function getText(cell) {
  return cell?.textContent.trim() || '';
}

async function loadStrings() {
  const [{ getConfig }, { replaceKeyArray }] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]);

  const KEYS = [
    'shades', 'complementary', 'analogous', 'triad', 'tetradic',
    'edit-color', 'copy-color-code', 'share-this-color', 'download-this-palette',
    'build-a-palette', 'color-code-copied', 'link-copied-to-clipboard',
    'unable-to-copy-color', 'unable-to-share-color', 'pick-a-color-palette', 'copy-hex',
    'create-a-color-palette', 'color-copied-to-clipboard',
  ];
  const config = getConfig();
  const values = await replaceKeyArray(KEYS, config);
  const v = (i, fallbackText) => {
    const value = values[i];
    return value && value !== KEYS[i].replaceAll('-', ' ') ? value : fallbackText;
  };

  return {
    localePrefix: config.locale?.prefix || '',
    ruleLabels: {
      SHADES: v(0, 'Shades'),
      COMPLEMENTARY: v(1, 'Complementary'),
      ANALOGOUS: v(2, 'Analogous'),
      TRIAD: v(3, 'Triad'),
      DOUBLE_SPLIT_COMPLEMENTARY: v(4, 'Tetradic'),
    },
    editColor: v(5, 'Edit color'),
    copyColorCode: v(6, 'Copy as code'),
    shareThisColor: v(7, 'Share this color'),
    downloadThisPalette: v(8, 'Download this palette'),
    buildAPalette: v(9, 'Build a palette'),
    colorCodeCopied: v(10, '{hex} copied to clipboard'),
    linkCopied: v(11, 'Link copied to clipboard'),
    copyFailed: v(12, 'Unable to copy color code.'),
    shareFailed: v(13, 'Unable to share this color.'),
    pickAColorPalette: v(14, 'Pick a color palette'),
    copyHex: v(15, 'Copy hex'),
    createAPalette: v(16, 'Create a color palette'),
    colorCopiedToClipboard: v(17, 'Color copied to clipboard'),
  };
}

async function copyHex(context) {
  const { strings, hex } = context;
  try {
    await navigator.clipboard.writeText(hex);
    const message = strings.colorCodeCopied.replace('{hex}', hex);
    showExpressToast({ message, variant: 'positive', timeout: 2000 });
    announceToScreenReader(message);
  } catch {
    showExpressToast({ message: strings.copyFailed, variant: 'negative', timeout: 2000 });
  }
}

function colorWheelUrl(context, colors) {
  return new URL(
    buildPaletteEditUrl(`${context.strings.localePrefix}${COLOR_WHEEL_PATH}`, colors, context.colorName),
    window.location.origin,
  ).toString();
}

// Richer copy toast for the swatch/strip copy buttons (color-swatch-rail's
// own default toast is a plain message with no action) — includes a button
// that opens the color-wheel editor with the copied swatch as the primary
// color, same destination the hero's other "create a palette" CTAs use.
function showColorCopiedToast(context, hex) {
  const { strings } = context;
  showExpressToast({
    message: strings.colorCopiedToClipboard,
    variant: 'positive',
    timeout: 4000,
    action: {
      label: strings.createAPalette,
      href: colorWheelUrl(context, [hex]),
      sameTab: true,
    },
  });
  announceToScreenReader(strings.colorCopiedToClipboard);
}

async function shareColor(context) {
  const { strings, hex, colorName } = context;
  const shareUrl = colorWheelUrl(context, [hex]);

  if (navigator.share) {
    try {
      await navigator.share({ title: colorName, url: shareUrl });
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    showExpressToast({ message: strings.linkCopied, variant: 'positive', timeout: 2000 });
    announceToScreenReader(strings.linkCopied);
  } catch {
    showExpressToast({ message: strings.shareFailed, variant: 'negative', timeout: 2000 });
  }
}

function downloadSwatches(context) {
  const swatchSize = 120;
  const canvas = createTag('canvas');
  canvas.width = swatchSize * context.swatches.length;
  canvas.height = swatchSize;
  const ctx = canvas.getContext('2d');
  context.swatches.forEach((hex, index) => {
    ctx.fillStyle = hex;
    ctx.fillRect(index * swatchSize, 0, swatchSize, swatchSize);
  });

  const fileName = `${context.colorName.toLowerCase().replace(/\s+/g, '-')}-palette.png`;
  const link = createTag('a', { href: canvas.toDataURL('image/png'), download: fileName });
  link.click();
}

function applyHarmony(context) {
  const { controller, hex, rule } = context;
  const seed = Array.from({ length: DISPLAY_COUNTS[rule] + 1 }, () => hex);
  controller.replaceSwatchesFromHexes(seed, { baseIndex: 0, harmonyRule: 'CUSTOM' });
  controller.setHarmonyRule(rule);
  // setHarmonyRule() alone is a no-op past the very first call: HarmonyEngineExpress
  // only re-derives its internal base point (hue/angle) from the theme when its
  // private rule tracker transitions out of null, which only happens once. On every
  // later edit the base point silently goes stale, so the mini swatches/CTA link
  // stop tracking new colors entirely. setBaseColor() re-triggers that recompute
  // from the *current* base swatch unconditionally, keeping this hex locked in as
  // the harmony base without touching the shared controller/engine files themselves.
  controller.setBaseColor(hex);
}

function updateColor(context, hex) {
  context.hex = hex;
  context.block.style.setProperty('--color-seo-hero-primary', hex);
  context.canvasAdapter.update({ colors: [hex], baseColorIndex: 0 });
  context.floatingToolbarHandle?.toolbar.updateSwatches([hex]);
  applyHarmony(context);
}

function selectRule(context, rule) {
  context.rule = rule;
  updateColor(context, context.hex);
}

// The inline edit-tint button lives inside color-swatch-rail's shadow root
// (rendered by the 'editTintInline' feature), so it has to be looked up at
// use time rather than cached — Lit may re-render the swatch on every
// controller update.
function getCanvasEditButtonEl(context) {
  return context.canvasAdapter.rail.shadowRoot?.querySelector('.hex-code-group .icon-button--edit-tint') || null;
}

const MOBILE_EDITOR_QUERY = '(max-width: 599px)';

function isMobileEditorViewport() {
  return window.matchMedia?.(MOBILE_EDITOR_QUERY)?.matches === true;
}

// Two independent triggers (canvas swatch, floating toolbar) can each open
// the single-hex editor. Keep their aria-expanded state in sync with
// whichever one (if any) is actually open.
function setEditorTriggerState(context, activeTriggerEl) {
  [getCanvasEditButtonEl(context), context.floatingEditButtonEl].filter(Boolean).forEach((el) => {
    el.setAttribute('aria-haspopup', 'dialog');
    el.setAttribute('aria-expanded', el === activeTriggerEl ? 'true' : 'false');
  });
}

function closeColorEditor(context) {
  if (context.mobileColorEdit) {
    context.mobileColorEdit.hide();
    return;
  }
  context.canvasEditor?.close();
  context.floatingEditor?.close();
  setEditorTriggerState(context, null);
  document.removeEventListener('click', context.onEditorOutsideClick);
}

async function openMobileColorEditor(context, triggerEl) {
  await import('../../scripts/color-shared/components/color-edit/index.js');
  const colorEdit = createTag('color-edit');
  colorEdit.showPalette = false;
  colorEdit.mobile = true;
  colorEdit.palette = [context.hex];
  colorEdit.addEventListener('color-change', (e) => updateColor(context, e.detail.hex));
  colorEdit.addEventListener('panel-close', () => {
    context.mobileColorEdit = null;
    setEditorTriggerState(context, null);
    colorEdit.remove();
  });
  context.mobileColorEdit = colorEdit;
  document.body.append(colorEdit);
  setEditorTriggerState(context, triggerEl);

  requestAnimationFrame(async () => {
    await customElements.whenDefined('color-edit');
    await colorEdit.updateComplete;
    if (context.mobileColorEdit !== colorEdit) return;
    colorEdit.show();
  });
}

// The floating toolbar's popover isn't nested inside a positioned ancestor
// (the toolbar itself flips between inline and position:fixed as it goes
// sticky), so it's appended to <body> and positioned from the trigger
// button's live rect each time it opens, rather than anchored via CSS.
function positionPopoverAboveAnchor(popoverEl, anchorEl) {
  const anchorRect = anchorEl.getBoundingClientRect();
  const popoverWidth = popoverEl.getBoundingClientRect().width || 280;
  popoverEl.style.position = 'fixed';
  popoverEl.style.bottom = `${window.innerHeight - anchorRect.top + 8}px`;
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - popoverWidth - 8));
  popoverEl.style.left = `${left}px`;
}

// Builds a small open/close controller around a single anchored popover, so
// the canvas swatch and the floating toolbar can each own their own
// <color-edit> instance/popover without duplicating this open/close logic.
function createDesktopColorEditorController(context, popoverEl, { anchorEl } = {}) {
  let colorEdit = null;
  return {
    isOpen: () => !popoverEl.hidden,
    async open() {
      if (!colorEdit) {
        await import('../../scripts/color-shared/components/color-edit/index.js');
        colorEdit = createTag('color-edit');
        colorEdit.showPalette = false;
        colorEdit.addEventListener('color-change', (e) => updateColor(context, e.detail.hex));
        popoverEl.append(colorEdit);
      }
      colorEdit.palette = [context.hex];
      popoverEl.hidden = false;
      if (anchorEl) positionPopoverAboveAnchor(popoverEl, anchorEl);
    },
    close() {
      popoverEl.hidden = true;
    },
  };
}

async function openColorEditor(context, triggerEl, source) {
  if (isMobileEditorViewport()) {
    await openMobileColorEditor(context, triggerEl);
    return;
  }
  const editor = source === 'floating' ? context.floatingEditor : context.canvasEditor;
  await editor.open();
  setEditorTriggerState(context, triggerEl);
  document.addEventListener('click', context.onEditorOutsideClick);
}

function toggleColorEditor(context, triggerEl, source = 'canvas') {
  if (context.mobileColorEdit?.open === true) {
    closeColorEditor(context);
    return;
  }
  let openSource = null;
  if (context.canvasEditor?.isOpen()) openSource = 'canvas';
  else if (context.floatingEditor?.isOpen()) openSource = 'floating';
  closeColorEditor(context);
  if (openSource !== source) openColorEditor(context, triggerEl, source);
}

function attachTooltip(targetEl, content) {
  createExpressTooltip({ targetEl, content, placement: 'top', mountToBody: true }).catch(() => {});
}

function buildSpectrumIcon(name) {
  const icon = createSpectrumIcon(name);
  icon.setAttribute('size', 'm');
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

async function buildActionButton({
  spectrumIcon, label, onClick, staticColor = false, size = 'm', className,
}) {
  const icon = buildSpectrumIcon(spectrumIcon);
  const { element } = await createExpressActionButton({
    icon, label, size, quiet: true, iconOnly: true, staticColor, onClick,
  });
  if (className) element.classList.add(className);
  attachTooltip(element, label);
  return element;
}

async function buildCanvas(context) {
  const canvas = createTag('div', { class: 'color-seo-hero-canvas' });

  const adapter = createSwatchRailAdapter({ colors: [context.hex], baseColorIndex: 0 }, {
    orientation: 'horizontal',
    swatchFeatures: ['hexCode', 'copy', 'editTintInline'],
    strings: createColorSwatchRailPlaceholders({
      copyHex: context.strings.copyHex,
      editColor: context.strings.editColor,
    }),
  });
  adapter.element.classList.add('color-seo-hero-canvas-host');
  adapter.rail.classList.add('color-seo-hero-canvas-rail');
  adapter.rail.onCopyHex = (hex) => showColorCopiedToast(context, hex);
  context.canvasAdapter = adapter;

  adapter.rail.addEventListener('color-swatch-rail-edit', (e) => {
    e.preventDefault();
    toggleColorEditor(context, getCanvasEditButtonEl(context), 'canvas');
  });

  const canvasClip = createTag('div', { class: 'color-seo-hero-canvas-clip' });
  canvasClip.append(adapter.element);

  const editorPopover = createTag('div', { class: 'color-seo-hero-editor-popover' });
  editorPopover.hidden = true;
  context.canvasEditor = createDesktopColorEditorController(context, editorPopover);
  context.onEditorOutsideClick = (e) => {
    const clickedInside = canvas.contains(e.target)
      || editorPopover.contains(e.target)
      || context.floatingToolbar?.contains(e.target)
      || context.floatingEditorPopoverEl?.contains(e.target);
    if (!clickedInside) closeColorEditor(context);
  };

  canvas.append(canvasClip, editorPopover);
  return canvas;
}

function createDerivedSwatchController() {
  let state = { swatches: [], baseColorIndex: null };
  const listeners = new Set();
  return {
    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
    getState: () => state,
    setState(next) {
      state = { ...state, ...next };
      listeners.forEach((fn) => fn(state));
    },
  };
}

async function buildStrip(context) {
  const stripController = createDerivedSwatchController();
  context.stripController = stripController;

  const adapter = createSwatchRailAdapter(stripController, {
    orientation: 'horizontal',
    swatchFeatures: ['copy', 'hexCode', 'hexCopyHoverOnly'],
    strings: createColorSwatchRailPlaceholders({ copyHex: context.strings.copyHex }),
  });
  adapter.element.classList.add('color-seo-hero-strip-host');
  adapter.rail.classList.add('color-seo-hero-swatch-strip');
  adapter.rail.onCopyHex = (hex) => showColorCopiedToast(context, hex);
  return adapter.element;
}

async function buildRuleDropdown(context) {
  const { strings } = context;

  const picker = await createExpressPicker({
    label: strings.pickAColorPalette,
    value: context.rule,
    options: HARMONY_RULES.map((rule) => ({ value: rule, label: strings.ruleLabels[rule] })),
    onChange: ({ value }) => selectRule(context, value),
  });
  await picker.waitForReady();
  context.rulePicker = picker;
  return picker.element;
}

async function buildPreview(context) {
  const { strings } = context;

  const preview = createTag('div', { class: 'color-seo-hero-preview' });

  const dropdownGroup = createTag('div', { class: 'color-seo-hero-dropdown-group' });
  const pickLabel = createTag('span', { class: 'color-seo-hero-pick-label' }, strings.pickAColorPalette);

  const [canvas, stripHost, ruleDropdown] = await Promise.all([
    buildCanvas(context),
    buildStrip(context),
    buildRuleDropdown(context),
  ]);
  dropdownGroup.append(pickLabel, ruleDropdown);

  const actionsGroup = createTag('div', { class: 'color-seo-hero-actions-group' });

  const icons = createTag('div', { class: 'color-seo-hero-icons' });
  icons.append(...await Promise.all([
    buildActionButton({ spectrumIcon: 'Code', label: strings.copyColorCode, onClick: () => copyHex(context) }),
    buildActionButton({ spectrumIcon: 'ShareAndroid', label: strings.shareThisColor, onClick: () => shareColor(context) }),
    buildActionButton({ spectrumIcon: 'Download', label: strings.downloadThisPalette, onClick: () => downloadSwatches(context) }),
  ]));

  const buildLink = createTag('a', { class: 'color-seo-hero-build-link primary button' }, strings.buildAPalette);
  context.buildLink = buildLink;

  actionsGroup.append(icons, buildLink);

  const actionsRow = createTag('div', { class: 'color-seo-hero-actions-row' });
  actionsRow.append(dropdownGroup, actionsGroup);

  preview.append(canvas, stripHost, actionsRow);
  return preview;
}

// Reuses the same shared floating-toolbar component color-wheel/color-extract
// use (sticky-on-scroll positioning, slide-in/out, footer-hide behavior) —
// see createFloatingToolbar.js/createToolbarComponent.js. Everything specific
// to this single-color use case (Code/Share/Download icons instead of
// Share/Download/Save-to-library, a persistent "Edit color" label, and the
// edit/CTA click targets) is passed in via the optional params those files
// added for this; no existing consumer of that shared component is affected.
async function buildFloatingToolbar(context) {
  const { strings } = context;
  const { initFloatingToolbar } = await import('../../scripts/color-shared/toolbar/createFloatingToolbar.js');

  const mount = createTag('div', { class: 'color-seo-hero-toolbar-mount' });

  const editorPopover = createTag('div', { class: 'color-seo-hero-floating-editor-popover' });
  editorPopover.hidden = true;
  document.body.append(editorPopover);
  context.floatingEditorPopoverEl = editorPopover;

  const toolbarHandle = await initFloatingToolbar(mount, {
    type: 'palette',
    variant: isMobileEditorViewport() ? 'sticky' : 'sticky-on-scroll',
    standaloneAppearance: 'raised',
    palette: { colors: [context.hex], name: '' },
    showEdit: true,
    showEditLabel: true,
    showPalette: true,
    showPaletteName: false,
    ctaText: strings.createAPalette,
    mobileCTAText: strings.createAPalette,
    i18nOverrides: { edit: strings.editColor },
    onCTA: () => {
      window.location.href = colorWheelUrl(context, context.swatches);
    },
    onEditClick: () => toggleColorEditor(context, context.floatingEditButtonEl, 'floating'),
    actionButtons: [
      {
        icon: 'Code',
        label: strings.copyColorCode,
        tooltip: strings.copyColorCode,
        analyticsLabel: 'Copy code',
        onClick: () => copyHex(context),
      },
      {
        icon: 'ShareAndroid',
        label: strings.shareThisColor,
        tooltip: strings.shareThisColor,
        analyticsLabel: 'Share',
        onClick: () => shareColor(context),
      },
      {
        icon: 'Download',
        label: strings.downloadThisPalette,
        tooltip: strings.downloadThisPalette,
        analyticsLabel: 'Download',
        onClick: () => downloadSwatches(context),
      },
    ],
  });
  if (!toolbarHandle) return mount;

  context.floatingToolbarHandle = toolbarHandle;
  context.floatingToolbar = toolbarHandle.wrapper;
  context.floatingEditButtonEl = toolbarHandle.wrapper.querySelector('.ax-edit-btn');
  context.floatingEditor = createDesktopColorEditorController(context, editorPopover, {
    anchorEl: context.floatingEditButtonEl,
  });

  // Below the desktop/tablet breakpoint, drop the "appears once you scroll
  // past the hero" behavior in favor of always-sticky — matching how
  // color-extract's own floating toolbar behaves on small viewports.
  const alwaysStickyQuery = window.matchMedia('(max-width: 1199px)');
  alwaysStickyQuery.addEventListener('change', (e) => {
    closeColorEditor(context);
    toolbarHandle.setVariant(e.matches ? 'sticky' : 'sticky-on-scroll', {
      reserveContainer: mount,
      reserveSpace: false,
    });
  });

  return mount;
}

// Makes the background glow (.color-seo-hero.is-ready's radial-gradient)
// follow the cursor, but only across the blank background — not while over
// the palette panel itself (--gradient-x/--gradient-y just stay frozen at
// wherever they last were while the pointer is inside it). CSS-side defaults
// cover the pointer-hasn't-moved-yet case (or touch, where mousemove never fires).
function attachGradientPointerTracking(block) {
  block.addEventListener('mousemove', (e) => {
    if (e.target.closest('.color-seo-hero-preview')) return;
    const rect = block.getBoundingClientRect();
    block.style.setProperty('--gradient-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    block.style.setProperty('--gradient-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  });
  block.addEventListener('mouseleave', () => {
    block.style.removeProperty('--gradient-x');
    block.style.removeProperty('--gradient-y');
  });
}

export default async function decorate(block) {
  const [contentRow, colorRow] = [...block.children];
  const colorCells = colorRow ? [...colorRow.children] : [];
  const colorName = getText(colorCells[0]);
  const hex = getText(colorCells[1]);

  if (!contentRow || !colorName || !HEX_PATTERN.test(hex)) return;

  colorRow.remove();
  contentRow.classList.add('color-seo-hero-content');
  contentRow.prepend(getIconElementDeprecated('adobe-express-logo', 24, '', 'color-seo-hero-logo'));

  const [{ decorateButtons }] = await Promise.all([
    import(`${getLibs()}/utils/decorate.js`),
    loadIconsRail(),
  ]);
  decorateButtons(block);

  contentRow.querySelectorAll('p').forEach((p) => {
    p.classList.add('color-seo-hero-text');
  });
  const ctaLink = contentRow.querySelector('p a');
  if (ctaLink) {
    ctaLink.classList.add('color-seo-hero-cta', 'button', 'xlarge', 'primary');
    ctaLink.closest('p').classList.add('color-seo-hero-cta-row');
  }

  const strings = await loadStrings();
  const controller = new ColorThemeExpressController({
    swatches: [hex, hex, hex, hex, hex],
    harmonyRule: 'CUSTOM',
    baseColorIndex: 0,
  });
  const context = {
    block, colorName, hex, rule: 'SHADES', swatches: [], strings, controller,
  };

  controller.subscribe((state) => {
    const derived = state.swatches.slice(1).map((s) => ({ hex: s.hex }));
    context.swatches = derived.map((s) => s.hex);
    context.stripController?.setState({ swatches: derived, baseColorIndex: null });
    if (context.buildLink) {
      context.buildLink.href = colorWheelUrl(context, context.swatches);
    }
  });

  const layout = createTag('div', { class: 'color-seo-hero-layout' });
  const [preview, toolbarMount] = await Promise.all([
    buildPreview(context),
    buildFloatingToolbar(context),
  ]);
  layout.append(contentRow, preview);
  block.append(layout, toolbarMount);

  block.classList.add('is-ready');
  attachGradientPointerTracking(block);
  updateColor(context, hex);
}
