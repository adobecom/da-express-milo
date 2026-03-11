/**
 * Modal content mock using color-swatch-rail variant.
 * Same layout as createGradientPickerRebuildContent (name, likes, creator, tags, toolbar)
 * but replaces the gradient preview bar with <color-swatch-rail>.
 */

import { createTag, getLibs } from '../../utils.js';
import { createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';
import { initTooltipsForColorSwatchRail } from './initTooltipsForRail.js';

const HEART_SVG = '<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 18c-.3 0-.6-.1-.8-.3C3.2 12.7 0 9.5 0 6.5 0 3.9 2.1 2 4.5 2c1.5 0 3 .7 4 1.8C9.5 2.7 11 2 12.5 2 14.9 2 17 3.9 17 6.5c0 3-3.2 6.2-9.2 11.2-.2.2-.5.3-.8.3z"></path></svg>';

const TOOLBAR_ACTIONS = [
  { label: 'Share', icon: 'S2_Icon_ShareAndroid_20_N.svg', fallback: 'open-in-20-n.svg' },
  { label: 'Download', icon: 'S2_Icon_Download_20_N.svg', fallback: 'download-app-icon-22.svg' },
  { label: 'Sign in to save', icon: 'S2_Icon_CCLibrary_20_N.svg', fallback: 'cloud-storage.svg' },
];

const CREATOR_PLACEHOLDER_PATH = 'scripts/color-shared/modal/images/creator-placeholder.png';
const CREATOR_IMAGE_FALLBACK_URL = 'https://www.figma.com/api/mcp/asset/202118cd-85aa-424b-90eb-f331eb551a04';

/**
 * Extract colors array from palette or gradient for the rail.
 * @param {Object} item - Palette or gradient with colors or colorStops
 * @returns {string[]} Hex color strings
 */
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

/**
 * Create modal content with color-swatch-rail instead of gradient preview.
 * Same structure as createGradientPickerRebuildContent.
 * @param {Object} paletteOrGradient - Palette or gradient with name, colors, etc.
 * @param {Object} opts - likesCount, creatorName, creatorImageUrl, tags, codeRoot
 * @returns {{ element: HTMLElement, destroy: () => void }}
 */
export function createModalContentWithColorRail(paletteOrGradient, opts = {}) {
  const codeRoot = opts.codeRoot || '/express/code';
  const iconBase = `${codeRoot}/icons`;

  const colors = getColorsForRail(paletteOrGradient);
  const title = paletteOrGradient?.name || 'Palette';
  const likesCount = opts.likesCount ?? '1.2K';
  const creatorName = opts.creatorName ?? paletteOrGradient?.creator?.name ?? 'creator';
  const thumbnailAlt = opts.thumbnailAlt ?? creatorName;
  const defaultCreatorImageUrl = `${codeRoot}/${CREATOR_PLACEHOLDER_PATH}`;
  const creatorImageUrl = opts.creatorImageUrl ?? paletteOrGradient?.creator?.imageUrl
    ?? paletteOrGradient?.creatorImageUrl ?? defaultCreatorImageUrl;
  const tags = opts.tags || ['Color', 'Palette'];

  const railAdapter = createSwatchRailAdapter(
    { colors },
    { orientation: 'vertical', swatchFeatures: ['copy', 'colorPicker'] },
  );

  const main = createTag('main', { class: 'modal-content' });

  const containerSection = createTag('section', {
    class: 'modal-palette-container modal-palette-container--color-rail',
    'aria-label': `Selected color palette, ${colors.length} colors`,
  });
  const railWrap = createTag('div', { class: 'modal-color-rail-wrap strip-container' });
  railWrap.appendChild(railAdapter.element);
  containerSection.appendChild(railWrap);
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
  const floatingToolbar = createTag('div', { class: 'floating-toolbar floating-toolbar--in-modal', role: 'toolbar', 'aria-label': 'palette toolbar' });

  const mainToolbar = createTag('div', { class: 'floating-toolbar-main' });
  const actionContainer = createTag('div', { class: 'floating-toolbar-action-container' });
  const paletteSection = createTag('div', { class: 'floating-toolbar-palette-section' });
  const paletteSummary = createTag('div', { class: 'floating-toolbar-palette-summary', 'aria-label': `${colors.length} colors` });
  colors.forEach((color, i) => {
    const swatch = createTag('div', { class: 'floating-toolbar-swatch', 'aria-label': `Color ${i + 1}: ${color}`, style: `background-color: ${color};` });
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
  const cta = createTag('button', { type: 'button', class: 'floating-toolbar-cta-button' });
  cta.textContent = 'Open in Adobe Express';

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

  const tooltipDestroys = [];
  return {
    element: main,
    destroy() {
      tooltipDestroys.forEach((d) => d());
      railAdapter.destroy();
    },
    async initTooltips() {
      const buttons = main.querySelectorAll('.floating-toolbar-action-button');
      for (const btn of buttons) {
        const content = btn.getAttribute('data-tooltip-content') || btn.getAttribute('aria-label') || '';
        if (!content) continue;
        const tip = await createExpressTooltip({ targetEl: btn, content, placement: 'top' });
        tooltipDestroys.push(() => tip.destroy());
      }
      await initTooltipsForColorSwatchRail(main, tooltipDestroys);
    },
  };
}

let colorRailStylesLoaded = false;

/** Loads modal-picker-rebuild.css once (shared with gradient variant). Idempotent. */
export async function loadModalContentWithColorRailStyles() {
  if (colorRailStylesLoaded) return;
  try {
    const { loadStyle, getConfig } = (await import(`${getLibs()}/utils/utils.js`));
    const codeRoot = getConfig?.()?.codeRoot || '/express/code';
    await loadStyle(`${codeRoot}/scripts/color-shared/modal/modal-explore-content.css`);
    colorRailStylesLoaded = true;
  } catch {
    colorRailStylesLoaded = true;
  }
}
