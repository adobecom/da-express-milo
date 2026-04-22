import { createTag } from '../../utils.js';
import loadMiloStyle from '../utils/loadMiloStyle.js';
import { createGradientEditor } from '../components/gradients/gradient-editor.js';
import { initFloatingToolbar } from '../toolbar/createFloatingToolbar.js';
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';

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

const CREATOR_PLACEHOLDER_PATH = 'scripts/color-shared/modal/images/creator-placeholder.png';
const DEFAULT_CREATOR_NAME = 'nicolagilroy';

function normalizeCreatorName(rawValue) {
  if (typeof rawValue === 'string' && rawValue.trim()) return rawValue.trim();
  return DEFAULT_CREATOR_NAME;
}

/**
 * Attach Spectrum tooltips (Figma M, bottom) to each gradient handle in container.
 * Replaces native title; sp-tooltip matches Figma 9530-159590. Export for modal and demo.
 */
export async function attachGradientHandleTooltips(container) {
  const handles = container.querySelectorAll('.gradient-editor-handle[data-color]');
  if (!handles.length) return;
  for (const handle of handles) {
    const hex = handle.getAttribute('data-color') || '';
    const copyLabel = `Copy #${hex.replace(/^#/, '').toUpperCase()}`;
    handle.removeAttribute('title');
    await createExpressTooltip({
      targetEl: handle,
      content: copyLabel,
      placement: 'bottom',
    });
  }
}

export function createGradientModalContent(gradient, opts = {}) {
  const codeRoot = opts.codeRoot || '/express/code';
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
  const defaultCreatorImageUrl = `${codeRoot}/${CREATOR_PLACEHOLDER_PATH}`;
  const creatorImageUrl = opts.creatorImageUrl ?? gradient?.creator?.imageUrl
    ?? gradient?.creatorImageUrl ?? defaultCreatorImageUrl;
  const tags = opts.tags || ['Color', 'Gradient'];

  const main = createTag('main', { class: 'modal-content', 'daa-lh': 'color-gradient-modal' });

  const containerSection = createTag('section', {
    class: 'modal-palette-container',
  });
  const previewWrap = createTag('div', {
    class: 'modal-palette-colors modal-gradient-preview',
    role: 'region',
    'aria-label': `Selected color palette, ${colorStops.length} colors`,
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
    ariaLabel: `Gradient preview, ${colorStops.length} colors`,
  });
  previewWrap.appendChild(gradientEditor.element);
  containerSection.appendChild(previewWrap);
  main.appendChild(containerSection);

  const nameTagsSection = createTag('section', { class: 'modal-palette-name-tags' });
  const h1 = createTag('h1', { class: 'modal-palette-name' });
  h1.textContent = title;
  nameTagsSection.appendChild(h1);

  const thumbTags = createTag('div', { class: 'modal-palette-thumb-tags' });
  const thumbContainer = createTag('div', { class: 'modal-thumbnail-container' });
  const thumbnail = createTag('div', { class: 'modal-thumbnail' });
  const thumbImg = createTag('img', {
    class: 'thumbnail-image',
    alt: thumbnailAlt,
    src: creatorImageUrl,
  });
  if (creatorImageUrl === defaultCreatorImageUrl) {
    thumbImg.addEventListener('error', function onErr() {
      this.onerror = null;
    });
  }
  thumbnail.appendChild(thumbImg);
  const creatorNameEl = createTag('p', { class: 'modal-creator-name' });
  creatorNameEl.textContent = creatorName;
  thumbContainer.appendChild(thumbnail);
  thumbContainer.appendChild(creatorNameEl);
  thumbTags.appendChild(thumbContainer);

  const tagsContainer = createTag('div', {
    class: 'modal-tags-container',
    'aria-label': 'Palette tags',
    role: 'list',
  });
  tags.forEach((tag) => {
    const tagEl = createTag('span', { class: 'modal-tag', role: 'listitem' });
    tagEl.textContent = tag;
    tagsContainer.appendChild(tagEl);
  });
  thumbTags.appendChild(tagsContainer);
  nameTagsSection.appendChild(thumbTags);
  main.appendChild(nameTagsSection);

  const toolbarMount = createTag('nav', { class: 'modal-palette-toolbar', 'aria-label': 'Palette actions' });
  main.appendChild(toolbarMount);

  const paletteForToolbar = {
    id: gradient?.id ?? '',
    name: gradient?.name ?? 'Gradient',
    colors: colorStops.map((s) => s.color),
  };

  initFloatingToolbar(toolbarMount, {
    palette: paletteForToolbar,
    ctaText: 'Create with color palette',
    showPaletteName: false,
  }).catch((err) => {
    window.lana?.log(`Floating toolbar init failed: ${err.message}`, {
      tags: 'color-modal,toolbar',
      severity: 'error',
    });
  });

  // Handle tooltips are already managed inside `createGradientEditor`.
  // Attaching a second tooltip layer here causes overlapping hover/copy states.

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
    if (!isStylesheetInDocument('gradient-editor.css')) {
      await loadMiloStyle('scripts/color-shared/components/gradients/gradient-editor.css');
    }
    gradientModalContentStylesLoaded = true;
    document.documentElement.dataset.gradientModalContentStylesLoaded = 'true';
  } catch {
    gradientModalContentStylesLoaded = true;
  }
}
