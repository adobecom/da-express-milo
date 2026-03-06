import { createTag, getLibs } from '../../utils.js';
import { createGradientEditor } from '../components/gradients/gradient-editor.js';

const HEART_SVG = '<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 18c-.3 0-.6-.1-.8-.3C3.2 12.7 0 9.5 0 6.5 0 3.9 2.1 2 4.5 2c1.5 0 3 .7 4 1.8C9.5 2.7 11 2 12.5 2 14.9 2 17 3.9 17 6.5c0 3-3.2 6.2-9.2 11.2-.2.2-.5.3-.8.3z"></path></svg>';

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

const TOOLBAR_ACTIONS = [
  { label: 'Share', icon: 'S2_Icon_ShareAndroid_20_N.svg', fallback: 'share-arrow.svg' },
  { label: 'Download', icon: 'S2_Icon_Download_20_N.svg', fallback: 'download-app-icon-22.svg' },
  { label: 'Sign in to save', icon: 'S2_Icon_CCLibrary_20_N.svg', fallback: 'cloud-storage.svg' },
];

const CREATOR_PLACEHOLDER_PATH = 'scripts/color-shared/modal/images/creator-placeholder.png';
const CREATOR_IMAGE_FALLBACK_URL = 'https://www.figma.com/api/mcp/asset/202118cd-85aa-424b-90eb-f331eb551a04';

/**
 * Attach Spectrum tooltips (Figma M, bottom) to each gradient handle in container.
 * Replaces native title; sp-tooltip matches Figma 9530-159590. Export for modal and demo.
 */
export async function attachGradientHandleTooltips(container) {
  const handles = container.querySelectorAll('.gradient-editor-handle[data-color]');
  if (!handles.length) return;
  const { createExpressTooltip } = await import('../spectrum/components/express-tooltip.js');
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

export function createGradientPickerRebuildContent(gradient, opts = {}) {
  const codeRoot = opts.codeRoot || '/express/code';
  const iconBase = `${codeRoot}/icons`;
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
  const likesCount = opts.likesCount ?? '1.2K';
  const creatorName = opts.creatorName ?? gradient?.creator?.name ?? 'creator';
  const thumbnailAlt = opts.thumbnailAlt ?? creatorName;
  const defaultCreatorImageUrl = `${codeRoot}/${CREATOR_PLACEHOLDER_PATH}`;
  const creatorImageUrl = opts.creatorImageUrl ?? gradient?.creator?.imageUrl
    ?? gradient?.creatorImageUrl ?? defaultCreatorImageUrl;
  const tags = opts.tags || ['Color', 'Gradient'];

  const main = createTag('main', { class: 'modal-content' });

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
  const nameLikes = createTag('div', { class: 'modal-palette-name-likes' });
  const h1 = createTag('h1', { class: 'modal-palette-name' });
  h1.textContent = title;
  const likesDiv = createTag('div', { class: 'modal-palette-likes' });
  const likeBtn = createTag('button', { type: 'button', class: 'like-icon', 'aria-label': 'Like' });
  likeBtn.innerHTML = HEART_SVG;
  const likesCountEl = createTag('p', { class: 'modal-likes-count' });
  likesCountEl.textContent = likesCount;
  likesDiv.appendChild(likeBtn);
  likesDiv.appendChild(likesCountEl);
  nameLikes.appendChild(h1);
  nameLikes.appendChild(likesDiv);
  nameTagsSection.appendChild(nameLikes);

  const thumbTags = createTag('div', { class: 'modal-palette-thumb-tags' });
  const thumbContainer = createTag('div', { class: 'modal-thumbnail-container' });
  const thumbnail = createTag('div', { class: 'modal-thumbnail' });
  const thumbImg = createTag('img', { class: 'thumbnail-image', alt: thumbnailAlt, src: creatorImageUrl });
  if (creatorImageUrl === defaultCreatorImageUrl) {
    thumbImg.addEventListener('error', function onErr() {
      this.onerror = null;
      this.src = CREATOR_IMAGE_FALLBACK_URL;
    });
  }
  thumbnail.appendChild(thumbImg);
  const creatorNameEl = createTag('p', { class: 'modal-creator-name' });
  creatorNameEl.textContent = creatorName;
  thumbContainer.appendChild(thumbnail);
  thumbContainer.appendChild(creatorNameEl);
  thumbTags.appendChild(thumbContainer);

  const tagsContainer = createTag('div', { class: 'modal-tags-container', 'aria-label': 'Palette tags', role: 'list' });
  tags.forEach((tag) => {
    const tagEl = createTag('span', { class: 'modal-tag', role: 'listitem' });
    tagEl.textContent = tag;
    tagsContainer.appendChild(tagEl);
  });
  thumbTags.appendChild(tagsContainer);
  nameTagsSection.appendChild(thumbTags);
  main.appendChild(nameTagsSection);

  const toolbar = createTag('nav', { class: 'modal-palette-toolbar', 'aria-label': 'Palette actions' });
  const floatingToolbar = createTag('div', { class: 'floating-toolbar floating-toolbar--in-modal', role: 'toolbar', 'aria-label': 'gradient toolbar' });

  const mainToolbar = createTag('div', { class: 'floating-toolbar-main' });
  const actionContainer = createTag('div', { class: 'floating-toolbar-action-container' });
  const paletteSection = createTag('div', { class: 'floating-toolbar-palette-section' });
  const paletteSummary = createTag('div', { class: 'floating-toolbar-palette-summary', 'aria-label': `${colorStops.length} colors in gradient` });
  colorStops.forEach((stop, i) => {
    const swatch = createTag('div', { class: 'floating-toolbar-swatch', 'aria-label': `Color ${i + 1}: ${stop.color}`, style: `background-color: ${stop.color};` });
    paletteSummary.appendChild(swatch);
  });
  paletteSection.appendChild(paletteSummary);
  actionContainer.appendChild(paletteSection);

  const actionButtons = createTag('div', { class: 'floating-toolbar-action-buttons' });
  TOOLBAR_ACTIONS.forEach(({ label, icon, fallback }) => {
    const btn = createTag('button', { type: 'button', class: 'floating-toolbar-action-button', 'aria-label': label });
    const iconSpan = createTag('span', { class: 'floating-toolbar-action-button-icon', 'aria-hidden': 'true' });
    const img = createTag('img', { src: `${iconBase}/${icon}`, alt: '' });
    if (fallback) {
      img.addEventListener('error', function onErr() {
        this.onerror = null;
        this.src = `${iconBase}/${fallback}`;
      });
    }
    iconSpan.appendChild(img);
    const tooltip = createTag('span', { class: 'floating-toolbar-tooltip', role: 'tooltip', 'aria-hidden': 'true' });
    tooltip.textContent = label;
    btn.appendChild(iconSpan);
    btn.appendChild(tooltip);
    actionButtons.appendChild(btn);
  });
  const cta = createTag('button', { type: 'button', class: 'floating-toolbar-cta-button' });
  cta.textContent = 'Open gradient in Adobe Express';

  const firstRowGroup = createTag('div', { class: 'floating-toolbar-first-row' });
  firstRowGroup.appendChild(actionContainer);

  const rightGroup = createTag('div', { class: 'floating-toolbar-right-group' });
  rightGroup.appendChild(actionButtons);
  rightGroup.appendChild(cta);

  mainToolbar.appendChild(firstRowGroup);
  mainToolbar.appendChild(rightGroup);
  floatingToolbar.appendChild(mainToolbar);
  toolbar.appendChild(floatingToolbar);
  main.appendChild(toolbar);

  attachGradientHandleTooltips(main).catch(() => {});

  return main;
}

let pickerRebuildStylesLoaded = false;

/** True if a stylesheet with this filename is already in document (e.g. via @import from block). */
function isStylesheetInDocument(filename) {
  try {
    for (const sheet of document.styleSheets) {
      if (sheet.href && sheet.href.includes(filename)) return true;
    }
  } catch (_) { /* cross-origin sheet can throw */ }
  return false;
}

/** Injects a stylesheet link; resolves when loaded or on error so we don't block. */
function loadStylesheet(href) {
  return new Promise((resolve) => {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

/**
 * Loads modal-picker-rebuild.css and gradient-editor.css via <link>. Idempotent.
 * Skips gradient-editor.css if already in document (e.g. block @import).
 */
export async function loadGradientPickerRebuildStyles() {
  if (pickerRebuildStylesLoaded) return;
  try {
    const utils = await import(`${getLibs()}/utils/utils.js`);
    const codeRoot = utils.getConfig?.()?.codeRoot || '/express/code';
    const base = codeRoot.replace(/\/$/, '');
    const pickerCss = `${base}/scripts/color-shared/modal/modal-picker-rebuild.css`;
    const editorCss = `${base}/scripts/color-shared/components/gradients/gradient-editor.css`;
    await loadStylesheet(pickerCss);
    if (!isStylesheetInDocument('gradient-editor.css')) {
      await loadStylesheet(editorCss);
    }
    pickerRebuildStylesLoaded = true;
    document.documentElement.dataset.gradientPickerStylesLoaded = 'true';
  } catch {
    pickerRebuildStylesLoaded = true;
  }
}
