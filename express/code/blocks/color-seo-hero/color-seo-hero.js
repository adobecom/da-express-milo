import { getLibs, getIconElementDeprecated, createTag } from '../../scripts/utils.js';
import { createColorPaletteParamApi } from '../../scripts/color-shared/utils/utilities.js';
import { loadIconsRail } from '../../scripts/color-shared/spectrum/load-spectrum.js';
import { createExpressTooltip } from '../../scripts/color-shared/spectrum/components/express-tooltip.js';
import { showExpressToast } from '../../scripts/color-shared/spectrum/components/express-toast.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';
import createExpressActionButton from '../../scripts/color-shared/spectrum/components/express-action-button.js';
import { createExpressPicker } from '../../scripts/color-shared/spectrum/components/express-picker.js';
import ColorThemeExpressController from '../../scripts/color-shared/controllers/ColorThemeExpressController.js';
import loadColorSwatchRailPlaceholders from '../../scripts/color-shared/i18n/loadColorSwatchRailPlaceholders.js';
import { createSwatchRailAdapter } from '../../scripts/color-shared/adapters/litComponentAdapters.js';
import { createSpectrumIcon } from '../../scripts/color-shared/utils/icons.js';
import { createCopyCodeAction, createDownloadAction } from '../../scripts/color-shared/toolbar/colorActionMenus.js';

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;
const COLOR_WHEEL_ORIGIN = 'https://color.adobe.com';
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
  const [{ getConfig }, { replaceKeyArray }, railStrings] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
    loadColorSwatchRailPlaceholders(),
  ]);

  const KEYS = [
    'shades', 'complementary', 'analogous', 'triad', 'tetradic',
    'edit-color', 'copy-color-code', 'share-this-color', 'download-this-palette',
    'build-a-palette', 'color-code-copied', 'link-copied-to-clipboard',
    'unable-to-copy-color', 'unable-to-share-color', 'pick-a-color-palette', 'copy-hex',
    'create-a-color-palette', 'color-copied-to-clipboard',
    'copy-as-css', 'copy-as-sass', 'copy-as-less', 'copy-as-xml',
    'download-as-jpeg', 'download-as-ase', 'code-copied-to-clipboard',
    'unable-to-download-color', 'palette-download-started',
  ];
  const config = getConfig();
  const values = await replaceKeyArray(KEYS, config);
  const v = (i, fallbackText) => {
    const value = values[i];
    return value && value !== KEYS[i].replaceAll('-', ' ') ? value : fallbackText;
  };

  return {
    localePrefix: config.locale?.prefix || '',
    railStrings,
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
    codeFormatLabels: {
      CSS: v(18, 'Copy as CSS'),
      SASS: v(19, 'Copy as SASS'),
      LESS: v(20, 'Copy as LESS'),
      XML: v(21, 'Copy as XML'),
    },
    downloadFormatLabels: {
      JPEG: v(22, 'Download as JPEG'),
      ASE: v(23, 'Download as ASE'),
    },
    codeCopied: v(24, 'Code copied to clipboard'),
    downloadFailed: v(25, 'Unable to download. Please try again.'),
    downloadStarted: v(26, 'Download started'),
  };
}

function allContainerColors(context) {
  return [context.hex, ...context.swatches];
}

function colorWheelUrl(context, colors) {
  const url = new URL(`${context.strings.localePrefix}${COLOR_WHEEL_PATH}`, COLOR_WHEEL_ORIGIN);
  url.searchParams.set('tab', 'primary-color');
  createColorPaletteParamApi().setOnUrl(url, colors);
  return url.toString();
}

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
  } catch (err) {
    window.lana?.log(`Share/clipboard failed: ${err.message}`, {
      tags: 'color-seo-hero,share',
      severity: 'error',
    });
    showExpressToast({ message: strings.shareFailed, variant: 'negative', timeout: 2000 });
  }
}

function buildCopyCodeMenu(context) {
  const { strings } = context;
  return createCopyCodeAction({
    triggerLabel: strings.copyColorCode,
    getColors: () => allContainerColors(context),
    getName: () => context.colorName,
    formatLabels: strings.codeFormatLabels,
    onCopied: () => {
      showExpressToast({ message: strings.codeCopied, variant: 'positive', timeout: 2000 });
      announceToScreenReader(strings.codeCopied);
    },
    onError: () => {
      showExpressToast({ message: strings.copyFailed, variant: 'negative', timeout: 2000 });
    },
  });
}

function buildDownloadMenu(context) {
  const { strings } = context;
  return createDownloadAction({
    triggerLabel: strings.downloadThisPalette,
    getColors: () => allContainerColors(context),
    getName: () => context.colorName,
    formatLabels: strings.downloadFormatLabels,
    onDownloaded: () => {
      announceToScreenReader(strings.downloadStarted);
    },
    onError: (err) => {
      window.lana?.log(`Download failed: ${err.message}`, {
        tags: 'color-seo-hero,download',
        severity: 'error',
      });
      showExpressToast({ message: strings.downloadFailed, variant: 'negative', timeout: 2000 });
    },
  });
}

function applyHarmony(context) {
  const { controller, hex, rule } = context;
  const seed = Array.from({ length: DISPLAY_COUNTS[rule] + 1 }, () => hex);
  controller.replaceSwatchesFromHexes(seed, { baseIndex: 0, harmonyRule: 'CUSTOM' });
  controller.setHarmonyRule(rule);
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

function getCanvasEditButtonEl(context) {
  return context.canvasAdapter.rail.shadowRoot?.querySelector('.hex-code-group .icon-button--edit-tint') || null;
}

function getCanvasHexButtonEl(context) {
  return context.canvasAdapter.rail.shadowRoot?.querySelector('.hex-code-group .hex-code') || null;
}

const MOBILE_EDITOR_QUERY = '(max-width: 599px)';

function isMobileEditorViewport() {
  return window.matchMedia?.(MOBILE_EDITOR_QUERY)?.matches === true;
}

function setEditorTriggerState(context, isOpen) {
  [getCanvasEditButtonEl(context), context.floatingEditButtonEl].filter(Boolean).forEach((el) => {
    el.setAttribute('aria-haspopup', 'dialog');
    el.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

function closeColorEditor(context) {
  if (context.mobileColorEdit) {
    context.mobileColorEdit.hide();
    return;
  }
  context.canvasEditor?.close();
  setEditorTriggerState(context, false);
  document.removeEventListener('click', context.onEditorOutsideClick);
}

async function openMobileColorEditor(context) {
  await import('../../scripts/color-shared/components/color-edit/index.js');
  const colorEdit = createTag('color-edit');
  colorEdit.showPalette = false;
  colorEdit.mobile = true;
  colorEdit.palette = [context.hex];
  colorEdit.addEventListener('color-change', (e) => updateColor(context, e.detail.hex));
  colorEdit.addEventListener('panel-close', () => {
    context.mobileColorEdit = null;
    setEditorTriggerState(context, false);
    colorEdit.remove();
  });
  context.mobileColorEdit = colorEdit;
  document.body.append(colorEdit);
  setEditorTriggerState(context, true);

  requestAnimationFrame(async () => {
    await customElements.whenDefined('color-edit');
    await colorEdit.updateComplete;
    if (context.mobileColorEdit !== colorEdit) return;
    colorEdit.show();
  });
}

function createDesktopColorEditorController(context, popoverEl) {
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
    },
    close() {
      popoverEl.hidden = true;
    },
  };
}

async function openColorEditor(context) {
  if (isMobileEditorViewport()) {
    await openMobileColorEditor(context);
    return;
  }
  await context.canvasEditor.open();
  setEditorTriggerState(context, true);
  document.addEventListener('click', context.onEditorOutsideClick);
}

function toggleColorEditor(context) {
  if (context.mobileColorEdit?.open === true) {
    closeColorEditor(context);
    return;
  }
  const wasOpen = context.canvasEditor?.isOpen();
  closeColorEditor(context);
  if (!wasOpen) openColorEditor(context);
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
    strings: {
      ...context.strings.railStrings,
      copyHex: context.strings.copyHex,
      editColor: context.strings.editColor,
    },
  });
  adapter.element.classList.add('color-seo-hero-canvas-host');
  adapter.rail.classList.add('color-seo-hero-canvas-rail');
  adapter.rail.onCopyHex = (hex) => showColorCopiedToast(context, hex);
  context.canvasAdapter = adapter;

  adapter.rail.addEventListener('color-swatch-rail-edit', (e) => {
    e.preventDefault();
    toggleColorEditor(context);
  });

  const canvasClip = createTag('div', { class: 'color-seo-hero-canvas-clip' });
  canvasClip.append(adapter.element);

  const editorPopover = createTag('div', { class: 'color-seo-hero-editor-popover' });
  editorPopover.hidden = true;
  context.canvasEditor = createDesktopColorEditorController(context, editorPopover);
  context.onEditorOutsideClick = (e) => {
    const path = e.composedPath();
    const canvasTriggers = [getCanvasEditButtonEl(context), getCanvasHexButtonEl(context)];
    const clickedInside = path.includes(editorPopover)
      || canvasTriggers.some((el) => el && path.includes(el))
      || (context.floatingToolbar && path.includes(context.floatingToolbar));
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
    strings: { ...context.strings.railStrings, copyHex: context.strings.copyHex },
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
    forcePopover: true,
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
  icons.append(
    buildCopyCodeMenu(context).element,
    await buildActionButton({ spectrumIcon: 'ShareAndroid', label: strings.shareThisColor, onClick: () => shareColor(context) }),
    buildDownloadMenu(context).element,
  );

  const buildLink = createTag('a', { class: 'color-seo-hero-build-link primary button' }, strings.buildAPalette);
  context.buildLink = buildLink;

  actionsGroup.append(icons, buildLink);

  const actionsRow = createTag('div', { class: 'color-seo-hero-actions-row' });
  actionsRow.append(dropdownGroup, actionsGroup);

  preview.append(canvas, stripHost, actionsRow);
  return preview;
}

async function buildFloatingToolbar(context) {
  const { strings } = context;
  const { initFloatingToolbar } = await import('../../scripts/color-shared/toolbar/createFloatingToolbar.js');

  const mount = createTag('div', { class: 'color-seo-hero-toolbar-mount' });

  const toolbarHandle = await initFloatingToolbar(mount, {
    type: 'palette',
    variant: 'sticky-on-scroll',
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
      window.location.href = colorWheelUrl(context, allContainerColors(context));
    },
    onEditClick: () => {
      context.block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toggleColorEditor(context);
    },
    deps: { initServices: () => Promise.resolve() },
    actionButtons: [
      { element: buildCopyCodeMenu(context).element },
      {
        icon: 'ShareAndroid',
        label: strings.shareThisColor,
        tooltip: strings.shareThisColor,
        analyticsLabel: 'Share',
        onClick: () => shareColor(context),
      },
      { element: buildDownloadMenu(context).element },
    ],
  });
  if (!toolbarHandle) return mount;

  context.floatingToolbarHandle = toolbarHandle;
  context.floatingToolbar = toolbarHandle.wrapper;
  context.floatingEditButtonEl = toolbarHandle.wrapper.querySelector('.ax-edit-btn');

  return mount;
}

const GRADIENT_SIZE_RATIO = 1.2;
const GRADIENT_ANCHOR_OFFSET_X_PERCENT = 5;
const GRADIENT_EASE = 0.15;
const GRADIENT_SETTLE_THRESHOLD = 0.1;
const GRADIENT_CENTER_ANCHOR = { x: 50, y: 50 };

function createEasedFollow(initial, { ease, settleThreshold }) {
  const current = { ...initial };
  const target = { ...initial };
  const listeners = new Set();
  let rafId = null;

  function tick() {
    current.x += (target.x - current.x) * ease;
    current.y += (target.y - current.y) * ease;
    listeners.forEach((fn) => fn(current));

    const settled = Math.abs(target.x - current.x) < settleThreshold
      && Math.abs(target.y - current.y) < settleThreshold;
    rafId = settled ? null : requestAnimationFrame(tick);
  }

  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    setTarget(next) {
      target.x = next.x;
      target.y = next.y;
      if (!rafId) rafId = requestAnimationFrame(tick);
    },
  };
}

function computeGradientDefaultAnchor(block) {
  const blockRect = block.getBoundingClientRect();
  const preview = block.querySelector('.color-seo-hero-preview');
  if (!preview || !blockRect.width || !blockRect.height) return null;

  const previewRect = preview.getBoundingClientRect();
  const centerX = previewRect.left + (previewRect.width / 2) - blockRect.left;
  const centerY = previewRect.top + (previewRect.height / 2) - blockRect.top;
  return {
    x: ((centerX / blockRect.width) * 100) + GRADIENT_ANCHOR_OFFSET_X_PERCENT,
    y: (centerY / blockRect.height) * 100,
  };
}

function attachGradientPointerTracking(block) {
  const follow = createEasedFollow(GRADIENT_CENTER_ANCHOR, {
    ease: GRADIENT_EASE,
    settleThreshold: GRADIENT_SETTLE_THRESHOLD,
  });
  follow.subscribe(({ x, y }) => {
    block.style.setProperty('--gradient-x', `${x}%`);
    block.style.setProperty('--gradient-y', `${y}%`);
  });

  let defaultAnchor = GRADIENT_CENTER_ANCHOR;
  let isHovering = false;

  const resizeObserver = new ResizeObserver((entries) => {
    const { height } = entries[0].contentRect;
    block.style.setProperty('--gradient-size', `${Math.round(height * GRADIENT_SIZE_RATIO)}px`);

    const anchor = computeGradientDefaultAnchor(block);
    if (!anchor) return;
    defaultAnchor = anchor;
    if (!isHovering) follow.setTarget(anchor);
  });
  resizeObserver.observe(block);

  block.addEventListener('mousemove', (e) => {
    if (e.target.closest('.color-seo-hero-preview')) return;
    isHovering = true;
    const rect = block.getBoundingClientRect();
    follow.setTarget({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  });
  block.addEventListener('mouseleave', () => {
    isHovering = false;
    follow.setTarget(defaultAnchor);
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
      context.buildLink.href = colorWheelUrl(context, allContainerColors(context));
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
