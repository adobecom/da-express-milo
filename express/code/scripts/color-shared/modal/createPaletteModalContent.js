/**
 * MWPW-185800 — Build palette/gradient modal content
 * Structure: gradient bar with handles, name/tags, floating toolbar.
 */

/* eslint-disable import/prefer-default-export */
import { createTag } from '../../utils.js';

function colorsToGradientCSS(colors) {
  if (!colors || colors.length === 0) return 'linear-gradient(90deg, #ccc, #999)';
  if (colors.length === 1) return `linear-gradient(90deg, ${colors[0]}, ${colors[0]})`;
  const stops = colors
    .map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`)
    .join(', ');
  return `linear-gradient(90deg, ${stops})`;
}

function resolveColors(palette) {
  let fromPalette = [];
  if (palette?.colors?.length) {
    fromPalette = palette.colors;
  } else if (palette?.colorStops?.length) {
    fromPalette = palette.colorStops.map((s) => s.color);
  }
  if (fromPalette.length >= 2) return fromPalette;
  if (fromPalette.length === 1) return [fromPalette[0], fromPalette[0]];
  return ['#000000', '#ffffff'];
}

/* eslint-disable-next-line import/prefer-default-export */
export function createPaletteModalContent(palette) {
  const resolvedColors = resolveColors(palette);
  const name = palette?.name || 'Palette';
  const creator = palette?.creator || 'nicolagilroy';
  const tags = palette?.tags || ['Orange', 'Cinematic', 'Summer', 'Water'];
  const likes = palette?.likes ?? '1.2K';

  const main = createTag('main', { class: 'modal-content' });

  /* Gradient bar with color handles */
  const containerSection = createTag('section', { class: 'modal-palette-container' });
  const gradientBar = createTag('div', {
    class: 'modal-palette-colors modal-gradient-preview',
    role: 'region',
    'aria-label': `Selected color palette, ${resolvedColors.length} colors`,
    style: `background: ${colorsToGradientCSS(resolvedColors)}`,
  });

  const handlesWrap = createTag('div', { class: 'gradient-color-handles' });
  resolvedColors.forEach((color, i) => {
    const pos = resolvedColors.length > 1 ? (i / (resolvedColors.length - 1)) * 100 : 50;
    const btn = createTag('button', {
      type: 'button',
      class: 'gradient-color-handle',
      'aria-label': `Copy color ${i + 1}, hex code ${color}`,
      style: `left: ${pos}%`,
    });
    btn.innerHTML = `
      <div class="color-handle-ring">
        <div class="color-handle-fill" style="background-color: ${color};"></div>
      </div>
    `;
    btn.addEventListener('click', () => {
      navigator.clipboard?.writeText(color);
    });
    handlesWrap.appendChild(btn);
  });
  gradientBar.appendChild(handlesWrap);
  containerSection.appendChild(gradientBar);
  main.appendChild(containerSection);

  /* Name, likes, creator, tags */
  const nameTagsSection = createTag('section', { class: 'modal-palette-name-tags' });
  const nameLikes = createTag('div', { class: 'modal-palette-name-likes' });
  const nameEl = createTag('h1', { class: 'modal-palette-name' });
  nameEl.textContent = name;

  const likesEl = createTag('div', { class: 'modal-palette-likes' });
  const likeBtn = createTag('button', { type: 'button', class: 'like-icon', 'aria-label': 'Like' });
  likeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 18c-.3 0-.6-.1-.8-.3C3.2 12.7 0 9.5 0 6.5 0 3.9 2.1 2 4.5 2c1.5 0 3 .7 4 1.8C9.5 2.7 11 2 12.5 2 14.9 2 17 3.9 17 6.5c0 3-3.2 6.2-9.2 11.2-.2.2-.5.3-.8.3z"></path></svg>';
  const likesCount = createTag('p', { class: 'modal-likes-count' });
  likesCount.textContent = likes;
  likesEl.append(likeBtn, likesCount);

  nameLikes.append(nameEl, likesEl);

  const thumbTags = createTag('div', { class: 'modal-palette-thumb-tags' });
  const thumbContainer = createTag('div', { class: 'modal-thumbnail-container' });
  const thumb = createTag('div', { class: 'modal-thumbnail' });
  const img = createTag('img', {
    class: 'thumbnail-image',
    alt: creator,
    src: '/express/code/scripts/color-shared/modal/images/creator-placeholder.png',
  });
  img.onerror = () => {
    img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iI0U5RTlFOSIvPjwvc3ZnPg==';
  };
  thumb.appendChild(img);
  const creatorName = createTag('p', { class: 'modal-creator-name' });
  creatorName.textContent = creator;
  thumbContainer.append(thumb, creatorName);

  const tagsContainer = createTag('div', {
    class: 'modal-tags-container',
    'aria-label': 'Palette tags',
    role: 'list',
  });
  tags.forEach((tag) => {
    const span = createTag('span', { class: 'modal-tag', role: 'listitem' });
    span.textContent = tag;
    tagsContainer.appendChild(span);
  });

  thumbTags.append(thumbContainer, tagsContainer);
  nameTagsSection.append(nameLikes, thumbTags);
  main.appendChild(nameTagsSection);

  /* Floating toolbar */
  const toolbarNav = createTag('nav', {
    class: 'modal-palette-toolbar',
    'aria-label': 'Palette actions',
  });
  const toolbar = createTag('div', {
    class: 'floating-toolbar floating-toolbar--in-modal',
    role: 'toolbar',
    'aria-label': 'gradient toolbar',
  });
  toolbar.innerHTML = `
    <div class="floating-toolbar-main">
      <div class="floating-toolbar-first-row">
        <div class="floating-toolbar-action-container">
          <div class="floating-toolbar-palette-section">
            <div class="floating-toolbar-palette-summary" aria-label="${resolvedColors.length} colors in gradient">
              ${resolvedColors.map((c, i) => `<div class="floating-toolbar-swatch" aria-label="Color ${i + 1}: ${c}" style="background-color: ${c};"></div>`).join('')}
            </div>
          </div>
        </div>
        <div class="floating-toolbar-right-group">
          <div class="floating-toolbar-action-buttons">
            <button type="button" class="floating-toolbar-action-button" aria-label="Share">
              <span class="floating-toolbar-action-button-icon" aria-hidden="true"><img src="/express/code/icons/S2_Icon_ShareAndroid_20_N.svg" alt=""></span>
              <span class="floating-toolbar-tooltip" role="tooltip" aria-hidden="true">Share</span>
            </button>
            <button type="button" class="floating-toolbar-action-button" aria-label="Download">
              <span class="floating-toolbar-action-button-icon" aria-hidden="true"><img src="/express/code/icons/S2_Icon_Download_20_N.svg" alt=""></span>
              <span class="floating-toolbar-tooltip" role="tooltip" aria-hidden="true">Download</span>
            </button>
            <button type="button" class="floating-toolbar-action-button" aria-label="Sign in to save">
              <span class="floating-toolbar-action-button-icon" aria-hidden="true"><img src="/express/code/icons/S2_Icon_CCLibrary_20_N.svg" alt=""></span>
              <span class="floating-toolbar-tooltip" role="tooltip" aria-hidden="true">Sign in to save</span>
            </button>
          </div>
          <button type="button" class="floating-toolbar-cta-button">Open gradient in Adobe Express</button>
        </div>
      </div>
    </div>
  `;
  toolbarNav.appendChild(toolbar);
  main.appendChild(toolbarNav);

  return main;
}
