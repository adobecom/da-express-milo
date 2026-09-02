import { createTag } from '../../utils.js';
import loadMiloStyle from '../utils/loadMiloStyle.js';
import { createGradientEditor } from '../components/gradients/gradient-editor.js';
import { initFloatingToolbar } from '../toolbar/createFloatingToolbar.js';
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';
import { createColorModalPlaceholders } from '../i18n/loadColorModalPlaceholders.js';
import { interpolate } from '../utils/utilities.js';
import { createColorModesHeader } from './createColorModesHeader.js';
import { createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';
import { getPreferredColorMode } from '../utils/colorModePreference.js';

function parseLinearGradient(css) {
  const linear = /linear-gradient\s*\(\s*(\d+)deg\s*,\s*([^)]+)\s*\)/i.exec(css);
  if (!linear) return { angle: 90, colorStops: [] };
  const angle = parseInt(linear[1], 10);
  const parts = linear[2].split(',').map((s) => s.trim());
  const colorStops = parts.map((part) => {
    const hexMatch = /^(#[A-Fa-f0-9]{6})\s+(\d+(?:\.\d+)?)%?$/.exec(part);
    if (hexMatch) return { color: hexMatch[1], position: parseFloat(hexMatch[2], 10) / 100 };
    const rgbMatch = /^(rgb\([^)]+\))\s+(\d+(?:\.\d+)?)%?$/.exec(part);
    if (rgbMatch) return { color: rgbMatch[1], position: parseFloat(rgbMatch[2], 10) / 100 };
    const shortHex = /^#([A-Fa-f0-9]{3})\s+(\d+(?:\.\d+)?)%?$/.exec(part);
    if (shortHex) {
      const c = shortHex[1];
      return { color: `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`, position: parseFloat(shortHex[2], 10) / 100 };
    }
    return null;
  }).filter(Boolean);
  return { angle, colorStops };
}

const DEFAULT_CREATOR_NAME = 'nicolagilroy';
// The swatch rail (color-swatch-rail/index.js) is built around a hard 10-swatch
// ceiling (its own MAX_SWATCHES) — this modal doesn't support more than that,
// so a gradient with extra stops should just have them dropped, not overflow.
const MAX_GRADIENT_STOPS = 10;

function normalizeCreatorName(rawValue) {
  if (typeof rawValue === 'string' && rawValue.trim()) return rawValue.trim();
  return DEFAULT_CREATOR_NAME;
}

/**
 * Attach Spectrum tooltips (Figma M, bottom) to each gradient handle in container.
 * Replaces native title; sp-tooltip matches Figma 9530-159590. Export for modal and demo.
 */
export async function attachGradientHandleTooltips(
  container,
  strings = createColorModalPlaceholders(),
) {
  const handles = container.querySelectorAll('.gradient-editor-handle[data-color]');
  if (!handles.length) return;
  for (const handle of handles) {
    const hex = handle.getAttribute('data-color') || '';
    const copyLabel = interpolate(strings.gradientCopyHex, { hex: hex.replace(/^#/, '').toUpperCase() });
    handle.removeAttribute('title');
    await createExpressTooltip({
      targetEl: handle,
      content: copyLabel,
      placement: 'bottom',
    });
  }
}

export function createGradientModalContent(gradient, opts = {}) {
  const strings = opts.strings ?? createColorModalPlaceholders();
  let angle = gradient?.angle ?? 90;
  let colorStops = gradient?.colorStops || [];
  const gradientCss = gradient?.gradient;
  if (gradientCss && typeof gradientCss === 'string') {
    const parsed = parseLinearGradient(gradientCss);
    if (parsed.colorStops.length) {
      angle = parsed.angle;
      colorStops = parsed.colorStops;
    }
  }
  if (!colorStops.length && gradient?.colors && Array.isArray(gradient.colors)) {
    const n = gradient.colors.length;
    colorStops = gradient.colors.map((color, i) => ({
      color: String(color).startsWith('#') ? String(color) : `#${color}`,
      position: n <= 1 ? 0.5 : i / (n - 1),
    }));
    angle = 90;
  }
  if (!colorStops.length) {
    colorStops = [{ color: '#ccc', position: 0 }, { color: '#999', position: 1 }];
  }
  const title = gradient?.name || 'Gradient';
  const creatorName = normalizeCreatorName(
    opts.creatorName ?? gradient?.creator?.name ?? gradient?.creatorName,
  );
  const thumbnailAlt = opts.thumbnailAlt ?? creatorName;
  // No image-file placeholder here — matches createPaletteModalContent.js's
  // creator thumbnail, which falls back to a letter-initial avatar (below)
  // instead of a static placeholder image when there's no real creator image.
  const creatorImageUrl = opts.creatorImageUrl ?? gradient?.creator?.imageUrl
    ?? gradient?.creatorImageUrl ?? null;
  const description = opts.description ?? gradient?.description ?? '';

  const main = createTag('main', { class: 'modal-content', 'daa-lh': 'color-gradient-modal' });
  const contentScroll = createTag('div', { class: 'modal-content-scroll' });

  const containerSection = createTag('section', {
    class: 'modal-palette-container',
  });
  const previewWrap = createTag('div', {
    class: 'modal-palette-colors modal-gradient-preview',
    role: 'region',
    'aria-label': interpolate(strings.gradientPaletteAria, { count: colorStops.length }),
    tabindex: '-1',
  });
  const gradientData = {
    type: 'linear',
    angle,
    colorStops: colorStops.map((s, i) => ({ id: i, color: s.color, position: s.position })),
  };
  const gradientEditor = createGradientEditor(gradientData, {
    layout: 'responsive',
    size: 'strip-responsive',
    draggable: false,
    copyable: true,
    ariaLabel: interpolate(strings.gradientPreviewAria, { count: colorStops.length }),
    colorMode: getPreferredColorMode(),
  });
  previewWrap.appendChild(gradientEditor.element);
  containerSection.appendChild(previewWrap);
  contentScroll.appendChild(containerSection);

  // Palette-container: a read-only swatch strip of the gradient's stop colors,
  // below the draggable preview bar (Figma: "Palette-container" under the
  // gradient preview). Reuses the same rail the palette modal uses, so it
  // gets the Color Modes multi-channel breakdown for free. Capped at
  // MAX_GRADIENT_STOPS — unlike the gradient editor above (and the toolbar's
  // download/copy-as-code data below), which show/export every real stop,
  // the swatch rail (color-swatch-rail/index.js) is built around a hard
  // 10-swatch ceiling (its own MAX_SWATCHES) and doesn't support more.
  const swatchStops = colorStops.slice(0, MAX_GRADIENT_STOPS);
  const stopColors = swatchStops.map((s) => s.color);
  const railSection = createTag('section', {
    class: 'modal-palette-container modal-palette-container--color-rail',
    'aria-label': interpolate(strings.gradientPaletteAria, { count: stopColors.length }),
  });
  const railWrap = createTag('div', { class: 'modal-color-rail-wrap strip-container', 'data-color-count-range': stopColors.length <= 5 ? 'small' : 'large' });
  const railAdapter = createSwatchRailAdapter({ colors: stopColors }, {
    orientation: 'vertical-responsive',
    swatchFeatures: {
      copy: true, copyFromHex: false, colorPicker: false, hexCode: true, baseColor: false,
    },
    ...(Number.isFinite(opts.verticalMaxPerRow) ? { verticalMaxPerRow: opts.verticalMaxPerRow } : {}),
  });
  railAdapter.rail.colorMode = getPreferredColorMode();
  railWrap.appendChild(railAdapter.element);
  railSection.appendChild(railWrap);
  contentScroll.appendChild(railSection);

  const colorModesHeader = createColorModesHeader(
    { name: gradient?.name ?? 'Gradient', colors: stopColors, colorStops },
    {
      type: 'gradient',
      strings: opts.modalStrings,
      onModeChange: (mode) => {
        railAdapter.rail.colorMode = mode;
        gradientEditor.setColorMode(mode);
      },
      onDestroy: () => railAdapter.destroy?.(),
    },
  );
  contentScroll.insertBefore(colorModesHeader.element, containerSection);

  const nameTagsSection = createTag('section', { class: 'modal-palette-name-tags' });
  const h1 = createTag('h1', { class: 'modal-palette-name' });
  h1.textContent = title;
  nameTagsSection.appendChild(h1);

  // Unlike the palette modal's thumb-tags row (thumbnail + an always-present
  // tags container), this row's second child (.modal-gradient-description)
  // is usually absent — real gradient descriptions are essentially always
  // empty — leaving the thumbnail as the sole flex child. The CSS pushes it
  // right via margin-left: auto rather than order, since order needs a
  // second child to reorder against.
  const thumbTags = createTag('div', { class: 'modal-palette-thumb-tags' });
  const thumbContainer = createTag('div', { class: 'modal-thumbnail-container' });
  const thumbnail = createTag('div', { class: 'modal-thumbnail' });
  if (creatorImageUrl) {
    const thumbImg = createTag('img', {
      class: 'thumbnail-image',
      alt: thumbnailAlt,
      src: creatorImageUrl,
    });
    thumbnail.appendChild(thumbImg);
  } else {
    const initial = createTag('span', { class: 'thumbnail-initial', 'aria-hidden': 'true' });
    initial.textContent = creatorName.charAt(0).toUpperCase();
    thumbnail.appendChild(initial);
  }
  const creatorNameEl = createTag('p', { class: 'modal-creator-name' });
  creatorNameEl.textContent = creatorName;
  thumbContainer.appendChild(thumbnail);
  thumbContainer.appendChild(creatorNameEl);
  thumbTags.appendChild(thumbContainer);

  if (description) {
    const descriptionEl = createTag('p', { class: 'modal-gradient-description' });
    descriptionEl.textContent = description;
    thumbTags.appendChild(descriptionEl);
  }
  nameTagsSection.appendChild(thumbTags);
  contentScroll.appendChild(nameTagsSection);
  main.appendChild(contentScroll);

  const toolbarMount = createTag('nav', { class: 'modal-palette-toolbar', 'aria-label': strings.gradientActionsAria });
  main.appendChild(toolbarMount);

  const paletteForToolbar = {
    id: gradient?.id ?? '',
    name: gradient?.name ?? 'Gradient',
    angle: angle || 90,
    colors: colorStops.map((s) => s.color),
    colorStops,
  };

  initFloatingToolbar(toolbarMount, {
    type: 'gradient',
    palette: paletteForToolbar,
    ctaText: strings.gradientCta,
    showPaletteName: false,
    inModal: true,
  }).catch((err) => {
    window.lana?.log(`Floating toolbar init failed: ${err.message}`, {
      tags: 'color-modal,toolbar',
      severity: 'error',
    });
  });

  // Handle tooltips are already managed inside `createGradientEditor`.
  // Attaching a second tooltip layer here causes overlapping hover/copy states.

  // This builder returns a bare element (no lifecycle object) — piggyback a
  // readiness hook for the async color-mode sp-picker mount the same way, so
  // callers/tests can await it without a wrapper object.
  main.waitForColorModesReady = () => colorModesHeader.waitForReady();

  return main;
}

let gradientModalContentStylesLoaded = false;

/** True if a stylesheet with this filename is already in document (e.g. via @import from block). */
function isStylesheetInDocument(filename) {
  try {
    for (const sheet of document.styleSheets) {
      if (sheet.href && sheet.href.includes(filename)) return true;
    }
  } catch (_) { /* cross-origin sheet can throw */ }
  return false;
}

/**
 * Loads modal-gradient-content.css and gradient-editor.css via Milo loadStyle. Idempotent.
 * Skips gradient-editor.css if already in document (e.g. block @import).
 */
export async function ensureGradientModalContentStyles() {
  if (gradientModalContentStylesLoaded) return;
  try {
    await loadMiloStyle('scripts/color-shared/modal/modal-gradient-content.css');
    await loadMiloStyle('scripts/color-shared/modal/modal-color-modes-header.css');
    // The color-modes header's "Copy as code" menu and the stop-swatch rail
    // reuse ax-lib-card__action-menu* (libraries.css) and ax-swatch*
    // (toolbar.css) — normally only loaded by the Library modal / toolbar
    // footer respectively. Load them directly here instead of depending on
    // initFloatingToolbar's async init to have already applied them.
    await loadMiloStyle('scripts/color-shared/components/libraries/libraries.css');
    await loadMiloStyle('scripts/color-shared/toolbar/toolbar.css');
    if (!isStylesheetInDocument('gradient-editor.css')) {
      await loadMiloStyle('scripts/color-shared/components/gradients/gradient-editor.css');
    }
    gradientModalContentStylesLoaded = true;
    document.documentElement.dataset.gradientModalContentStylesLoaded = 'true';
  } catch {
    gradientModalContentStylesLoaded = true;
  }
}
