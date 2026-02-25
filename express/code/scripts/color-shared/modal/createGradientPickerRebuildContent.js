import { createTag, getLibs } from '../../utils.js';
import { createIconButton } from '../utils/icons.js';
import loadSpectrum from '../toolbar/spectrum-loader.js';

const TOOLBAR_ICON_ACTIONS = [
  { icon: 'ShareAndroid', label: 'Share' },
  { icon: 'Download', label: 'Download' },
  { icon: 'CCLibrary', label: 'Sign in to save' },
];

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

const CREATOR_PLACEHOLDER_PATH = 'scripts/color-shared/modal/images/creator-placeholder.png';
const CREATOR_IMAGE_FALLBACK_URL = 'https://www.figma.com/api/mcp/asset/202118cd-85aa-424b-90eb-f331eb551a04';

export function createGradientPickerRebuildContent(gradient, opts = {}) {
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
  const likesCount = opts.likesCount ?? '1.2K';
  const creatorName = opts.creatorName ?? gradient?.creator?.name ?? 'creator';
  const thumbnailAlt = opts.thumbnailAlt ?? creatorName;
  const defaultCreatorImageUrl = `${codeRoot}/${CREATOR_PLACEHOLDER_PATH}`;
  const creatorImageUrl = opts.creatorImageUrl ?? gradient?.creator?.imageUrl
    ?? gradient?.creatorImageUrl ?? defaultCreatorImageUrl;
  const tags = opts.tags || ['Color', 'Gradient'];

  const css = `linear-gradient(${angle}deg, ${colorStops.map((s) => `${s.color} ${(s.position * 100)}%`).join(', ')})`;

  const main = createTag('main', { class: 'modal-content' });

  const containerSection = createTag('section', { class: 'modal-palette-container' });
  const preview = createTag('div', {
    class: 'modal-palette-colors modal-gradient-preview',
    role: 'region',
    'aria-label': `Selected color palette, ${colorStops.length} colors`,
    style: `background: ${css};`,
  });
  const handles = createTag('div', { class: 'gradient-color-handles' });
  colorStops.forEach((stop) => {
    const handleEl = createTag('div', {
      class: 'gradient-color-handle',
      role: 'presentation',
      'aria-hidden': 'true',
      style: `left: ${stop.position * 100}%;`,
    });
    const ring = createTag('div', { class: 'color-handle-ring' });
    const fill = createTag('div', { class: 'color-handle-fill', style: `background-color: ${stop.color};` });
    ring.appendChild(fill);
    handleEl.appendChild(ring);
    handles.appendChild(handleEl);
  });
  containerSection.appendChild(preview);
  preview.appendChild(handles);
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
  paletteSection.appendChild(createIconButton({
    icon: 'Edit',
    label: 'Edit this color palette',
  }));
  actionContainer.appendChild(paletteSection);

  const actionButtons = createTag('div', { class: 'floating-toolbar-action-buttons' });
  TOOLBAR_ICON_ACTIONS.forEach(({ icon, label }) => {
    actionButtons.appendChild(createIconButton({ icon, label }));
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

  const theme = document.createElement('sp-theme');
  theme.setAttribute('system', 'spectrum-two');
  theme.setAttribute('color', 'light');
  theme.setAttribute('scale', 'medium');
  theme.appendChild(floatingToolbar);
  toolbar.appendChild(theme);
  main.appendChild(toolbar);

  loadSpectrum().catch((err) => {
    window.lana?.log(`Spectrum load failed: ${err.message}`, {
      tags: 'color-modal,spectrum',
    });
  });

  return main;
}

let pickerRebuildStylesLoaded = false;

/** Loads modal-picker-rebuild.css once. Idempotent—safe to call multiple times. */
export async function loadGradientPickerRebuildStyles() {
  if (pickerRebuildStylesLoaded) return;
  try {
    const { loadStyle, getConfig } = (await import(`${getLibs()}/utils/utils.js`));
    const codeRoot = getConfig?.()?.codeRoot || '/express/code';
    await loadStyle(`${codeRoot}/scripts/color-shared/modal/modal-picker-rebuild.css`);
    pickerRebuildStylesLoaded = true;
  } catch {
    pickerRebuildStylesLoaded = true;
  }
}
