/**
 * Modal Explore Content – unified modal content for Color Explore.
 * Handles gradient and strips variants. Shared: Floating Bar (mock), likes, author, tags.
 * Prod-like structure; Floating Bar will be replaced by shared component when ready.
 */

import { createTag, getLibs } from '../../utils.js';
import { createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';

const VARIANT = {
  GRADIENT: 'gradient',
  STRIPS: 'strips',
};

const HEART_SVG = '<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 18c-.3 0-.6-.1-.8-.3C3.2 12.7 0 9.5 0 6.5 0 3.9 2.1 2 4.5 2c1.5 0 3 .7 4 1.8C9.5 2.7 11 2 12.5 2 14.9 2 17 3.9 17 6.5c0 3-3.2 6.2-9.2 11.2-.2.2-.5.3-.8.3z"></path></svg>';

const TOOLBAR_ACTIONS = [
  { label: 'Share', icon: 'S2_Icon_ShareAndroid_20_N.svg', fallback: 'share-arrow.svg' },
  { label: 'Download', icon: 'S2_Icon_Download_20_N.svg', fallback: 'download-app-icon-22.svg' },
  { label: 'Sign in to save', icon: 'S2_Icon_CCLibrary_20_N.svg', fallback: 'cloud-storage.svg' },
];

const CREATOR_PLACEHOLDER_PATH = 'scripts/color-shared/modal/images/creator-placeholder.png';
const CREATOR_IMAGE_FALLBACK_URL = 'https://www.figma.com/api/mcp/asset/202118cd-85aa-424b-90eb-f331eb551a04';

const DEFAULT_MOCK = {
  likesCount: '1.2K',
  creatorName: 'nicolagilroy',
  tags: ['Orange', 'Cinematic', 'Summer', 'Water'],
};

/* ---- Gradient parsing ---- */

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

function getColorStops(item) {
  let angle = item?.angle ?? 90;
  let colorStops = item?.colorStops || [];
  const gradientCss = item?.gradient;
  if (gradientCss && typeof gradientCss === 'string') {
    const parsed = parseLinearGradient(gradientCss);
    if (parsed.colorStops.length) {
      angle = parsed.angle;
      colorStops = parsed.colorStops;
    }
  }
  if (!colorStops.length && item?.colors && Array.isArray(item.colors)) {
    const n = item.colors.length;
    colorStops = item.colors.map((color, i) => ({
      color: String(color).startsWith('#') ? String(color) : `#${color}`,
      position: n <= 1 ? 0.5 : i / (n - 1),
    }));
    angle = 90;
  }
  if (!colorStops.length) {
    colorStops = [{ color: '#ccc', position: 0 }, { color: '#999', position: 1 }];
  }
  return { angle, colorStops };
}

function getColorsForRail(item) {
  const colors = item?.colors;
  if (Array.isArray(colors) && colors.length) {
    return colors.map((c) => (String(c).startsWith('#') ? String(c) : `#${c}`));
  }
  const gradientCss = item?.gradient;
  if (typeof gradientCss === 'string') {
    const parts = /linear-gradient\s*\([^,]+\s*,\s*([^)]+)\s*\)/i.exec(gradientCss)?.[1]?.split(',') || [];
    return parts.map((p) => {
      const hex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/.exec(p.trim());
      return hex ? `#${hex[1].length === 3 ? hex[1].split('').map((x) => x + x).join('') : hex[1]}` : '#999';
    }).filter(Boolean);
  }
  return ['#ccc', '#999'];
}

/* ---- Preview section (gradient or strips) ---- */

function createGradientPreview(item, codeRoot) {
  const { angle, colorStops } = getColorStops(item);
  const css = `linear-gradient(${angle}deg, ${colorStops.map((s) => `${s.color} ${(s.position * 100)}%`).join(', ')})`;

  const container = createTag('section', { class: 'modal-palette-container' });
  const preview = createTag('div', {
    class: 'modal-palette-colors modal-gradient-preview',
    role: 'region',
    'aria-label': `Selected gradient, ${colorStops.length} colors`,
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
  preview.appendChild(handles);
  container.appendChild(preview);

  return { container, colors: colorStops.map((s) => s.color) };
}

function createStripsPreview(item, opts = {}) {
  const colors = getColorsForRail(item);
  const mq = typeof window !== 'undefined' && window.matchMedia('(min-width: 1200px)');
  const getOrientation = () => (mq?.matches ? 'vertical' : 'stacked');
  const railAdapter = createSwatchRailAdapter(
    { colors },
    {
      orientation: getOrientation(),
      swatchFeatures: { copy: true, hexCode: true, colorBlindness: false },
    },
  );

  const updateOrientation = () => {
    if (railAdapter.setOrientation) railAdapter.setOrientation(getOrientation());
  };
  mq?.addEventListener?.('change', updateOrientation);

  const container = createTag('section', {
    class: 'modal-palette-container modal-palette-container--color-rail',
    'aria-label': `Selected color palette, ${colors.length} colors`,
  });
  const railWrap = createTag('div', { class: 'modal-color-rail-wrap strip-container' });
  railWrap.appendChild(railAdapter.element);
  container.appendChild(railWrap);

  return {
    container,
    colors,
    destroy: () => {
      mq?.removeEventListener?.('change', updateOrientation);
      railAdapter.destroy();
    },
  };
}

/* ---- Shared: name, likes, author, tags (mock) ---- */

function createNameTagsSection(opts) {
  const {
    title,
    likesCount = DEFAULT_MOCK.likesCount,
    creatorName = DEFAULT_MOCK.creatorName,
    creatorImageUrl,
    tags = DEFAULT_MOCK.tags,
    codeRoot,
  } = opts;

  const defaultCreatorImageUrl = `${codeRoot}/${CREATOR_PLACEHOLDER_PATH}`;
  const thumbImgUrl = creatorImageUrl ?? defaultCreatorImageUrl;

  const section = createTag('section', { class: 'modal-palette-name-tags' });
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
  section.appendChild(nameLikes);

  const thumbTags = createTag('div', { class: 'modal-palette-thumb-tags' });
  const thumbContainer = createTag('div', { class: 'modal-thumbnail-container' });
  const thumbnail = createTag('div', { class: 'modal-thumbnail' });
  const thumbImg = createTag('img', { class: 'thumbnail-image', alt: creatorName, src: thumbImgUrl });
  if (thumbImgUrl === defaultCreatorImageUrl) {
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

  const tagsContainer = createTag('div', { class: 'modal-tags-container', 'aria-label': 'Tags', role: 'list' });
  tags.forEach((tag) => {
    const tagEl = createTag('span', { class: 'modal-tag', role: 'listitem' });
    tagEl.textContent = tag;
    tagsContainer.appendChild(tagEl);
  });
  thumbTags.appendChild(tagsContainer);
  section.appendChild(thumbTags);

  return section;
}

/* ---- Floating Bar (mock – will be shared component) ---- */

function createFloatingBar(colors, opts) {
  const { codeRoot, variant = VARIANT.STRIPS } = opts;
  const iconBase = `${codeRoot}/icons`;
  const ctaLabel = variant === VARIANT.GRADIENT ? 'Open gradient in Adobe Express' : 'Open in Adobe Express';
  const ariaLabel = variant === VARIANT.GRADIENT ? `${colors.length} colors in gradient` : `${colors.length} colors`;

  const toolbar = createTag('nav', { class: 'modal-palette-toolbar', 'aria-label': 'Palette actions' });
  const floatingToolbar = createTag('div', {
    class: 'floating-toolbar floating-toolbar--in-modal',
    role: 'toolbar',
    'aria-label': `${variant} toolbar`,
  });

  const mainToolbar = createTag('div', { class: 'floating-toolbar-main' });
  const actionContainer = createTag('div', { class: 'floating-toolbar-action-container' });
  const paletteSection = createTag('div', { class: 'floating-toolbar-palette-section' });
  const paletteSummary = createTag('div', { class: 'floating-toolbar-palette-summary', 'aria-label': ariaLabel });
  colors.forEach((color, i) => {
    const swatch = createTag('div', {
      class: 'floating-toolbar-swatch',
      'aria-label': `Color ${i + 1}: ${color}`,
      style: `background-color: ${color};`,
    });
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
    btn.appendChild(iconSpan);
    actionButtons.appendChild(btn);
  });
  actionContainer.appendChild(actionButtons);

  const cta = createTag('button', { type: 'button', class: 'floating-toolbar-cta-button' });
  cta.textContent = ctaLabel;

  const firstRowGroup = createTag('div', { class: 'floating-toolbar-first-row' });
  firstRowGroup.appendChild(actionContainer);
  const rightGroup = createTag('div', { class: 'floating-toolbar-right-group' });
  rightGroup.appendChild(cta);
  mainToolbar.appendChild(firstRowGroup);
  mainToolbar.appendChild(rightGroup);
  floatingToolbar.appendChild(mainToolbar);
  toolbar.appendChild(floatingToolbar);

  return toolbar;
}

/* ---- Main API ---- */

/**
 * Create modal explore content for gradient or strips.
 * @param {Object} item - Gradient or palette with name, colors, gradient, creator, etc.
 * @param {Object} opts - variant ('gradient'|'strips'), likesCount, creatorName, creatorImageUrl, tags, codeRoot
 * @returns {{ element: HTMLElement, destroy?: () => void }}
 */
export function createModalExploreContent(item, opts = {}) {
  const codeRoot = opts.codeRoot || '/express/code';
  const variant = opts.variant || (item?.gradient ? VARIANT.GRADIENT : VARIANT.STRIPS);

  const title = item?.name || (variant === VARIANT.GRADIENT ? 'Gradient' : 'Palette');
  const meta = {
    likesCount: opts.likesCount ?? DEFAULT_MOCK.likesCount,
    creatorName: opts.creatorName ?? item?.creator?.name ?? DEFAULT_MOCK.creatorName,
    creatorImageUrl: opts.creatorImageUrl ?? item?.creator?.imageUrl ?? item?.creatorImageUrl,
    tags: opts.tags ?? DEFAULT_MOCK.tags,
    codeRoot,
  };

  let previewResult;
  if (variant === VARIANT.GRADIENT) {
    previewResult = createGradientPreview(item, codeRoot);
  } else {
    previewResult = createStripsPreview(item, opts);
  }

  const main = createTag('main', { class: 'modal-content' });
  main.appendChild(previewResult.container);
  main.appendChild(createNameTagsSection({ title, ...meta }));
  main.appendChild(createFloatingBar(previewResult.colors, { codeRoot, variant }));

  const tooltipDestroys = [];
  const result = {
    element: main,
    destroy() {
      tooltipDestroys.forEach((d) => d());
      if (typeof previewResult.destroy === 'function') previewResult.destroy();
    },
    async initTooltips() {
      const bar = main.querySelector('.floating-toolbar');
      const buttons = bar?.querySelectorAll('.floating-toolbar-action-button') || [];
      for (const btn of buttons) {
        const label = btn.getAttribute('aria-label') || '';
        if (!label) continue;
        const tip = await createExpressTooltip({ targetEl: btn, content: label, placement: 'top' });
        tooltipDestroys.push(() => tip.destroy());
      }
    },
  };
  return result;
}

export { VARIANT };

let stylesLoaded = false;

/** Load modal-explore-content.css once. Idempotent. */
export async function loadModalExploreContentStyles() {
  if (stylesLoaded) return;
  try {
    const { loadStyle, getConfig } = (await import(`${getLibs()}/utils/utils.js`));
    const codeRoot = getConfig?.()?.codeRoot || '/express/code';
    await loadStyle(`${codeRoot}/scripts/color-shared/modal/modal-explore-content.css`);
    stylesLoaded = true;
  } catch {
    stylesLoaded = true;
  }
}
