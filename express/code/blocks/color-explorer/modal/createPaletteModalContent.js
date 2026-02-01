import { createTag } from '../../../scripts/utils.js';
import { createModalContentContainers } from './createModalContentContainers.js';

/**
 * Creates palette modal content with color strips matching Figma design
 * Node ID: 5525-289743 (Mobile) / 5525-252389 (Tablet)
 *
 * This is for PALETTES (color strips), not gradients
 *
 * @param {Object} palette - Palette data object
 * @param {string} palette.name - Palette name
 * @param {Array} palette.colors - Array of color hex strings
 * @param {Array} palette.coreColors - Array of color strings for palette summary
 * @param {string} palette.likes - Number of likes (e.g., "1.2K")
 * @param {string} palette.creator - Creator username
 * @param {Array} palette.tags - Array of tag strings
 * @returns {Object} Container elements with populated content
 */
export function createPaletteModalContent(palette = {}) {
  const {
    name = 'Eternal Sunshine of the Spotless Mind',
    colors = ['#ff7500', '#ff7500', '#1900ab', '#ff7500', '#ff7500'],
    coreColors = colors || ['#1900ab', '#6bb1ff', '#ff7500', '#fffdeb', '#0076ff'],
    likes = '1.2K',
    creator = 'nicolagilroy',
    tags = ['Orange', 'Cinematic', 'Summer', 'Water'],
  } = palette;

  // Get base containers
  const containers = createModalContentContainers();

  // 1. Render Color Strips (Palette Container)
  const paletteContainer = containers.colorsContainer;
  paletteContainer.className = 'modal-palette-colors modal-color-strips';
  paletteContainer.removeAttribute('data-placeholder');
  
  // Accessibility: Per Figma
  paletteContainer.setAttribute('role', 'region');
  paletteContainer.setAttribute('aria-label', `Selected color palette, ${colors.length} colors`);

  // Create color strips (each color as a row)
  colors.forEach((color, index) => {
    const isFirstStrip = index === 0;
    const isLastStrip = index === colors.length - 1;

    const strip = createTag('div', {
      class: 'color-strip',
      style: `
        background-color: ${color};
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        gap: 0px;
        ${isFirstStrip ? 'border-radius: 8px 8px 0 0;' : ''}
        ${isLastStrip ? 'border-radius: 0 0 8px 8px;' : ''}
        ${!isFirstStrip ? 'margin-top: 2px;' : ''}
      `,
    });

    // Left: Hex code button
    const hexButton = createTag('button', {
      class: 'color-strip-hex-button',
      type: 'button',
      'aria-label': `Color ${index + 1}, hex code ${color}`,
      style: `
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        height: 32px;
      `,
    });

    // Hex code text (shown on light colors, hidden on dark)
    const isDark = isColorDark(color);
    if (!isDark) {
      const hexText = createTag('span', {
        style: `
          font-size: 14px;
          color: #292929;
          font-family: var(--family-font-family-label, 'Adobe Clean');
          font-weight: 500;
        `,
      });
      hexText.textContent = color;
      hexButton.appendChild(hexText);
    }

    // Right: Copy button
    const copyButton = createTag('button', {
      class: 'color-strip-copy-button',
      type: 'button',
      'aria-label': `Copy hex code ${color}`,
      style: `
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        height: 32px;
        width: 32px;
        justify-content: center;
      `,
    });

    // Copy icon (20x20)
    const copyIcon = createTag('div', {
      class: 'copy-icon',
      style: `
        width: 20px;
        height: 20px;
        background-color: ${isDark ? 'rgba(255,255,255,0.85)' : '#292929'};
        mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13.5 2h-9A1.5 1.5 0 003 3.5v9A1.5 1.5 0 004.5 14h9a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0013.5 2zm0 10.5h-9v-9h9v9zM17 5.5v11a1.5 1.5 0 01-1.5 1.5h-11v-1h11a.5.5 0 00.5-.5v-11h1z"/></svg>') center/contain no-repeat;
        -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13.5 2h-9A1.5 1.5 0 003 3.5v9A1.5 1.5 0 004.5 14h9a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0013.5 2zm0 10.5h-9v-9h9v9zM17 5.5v11a1.5 1.5 0 01-1.5 1.5h-11v-1h11a.5.5 0 00.5-.5v-11h1z"/></svg>') center/contain no-repeat;
      `,
    });

    copyButton.appendChild(copyIcon);

    // Add click handlers
    hexButton.addEventListener('click', () => {
      navigator.clipboard.writeText(color);
    });

    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(color);
    });

    strip.appendChild(hexButton);
    strip.appendChild(copyButton);
    paletteContainer.appendChild(strip);
  });

  // 2. Palette Name and Tags Section
  const nameTagsContainer = containers.nameTagsContainer;

  // Name and Likes row
  const nameLikesRow = containers.nameLikesRow;
  nameLikesRow.style.display = 'flex';
  nameLikesRow.style.gap = '10px';
  nameLikesRow.style.alignItems = 'flex-start';
  nameLikesRow.style.width = '100%';

  // Palette name
  const paletteName = createTag('h1', { class: 'modal-palette-name' });
  paletteName.textContent = name;
  paletteName.style.flex = '1 0 0';
  paletteName.style.minWidth = '0';

  // Likes container
  const likesContainer = createTag('div', { class: 'modal-palette-likes' });
  likesContainer.style.display = 'flex';
  likesContainer.style.gap = '4px';
  likesContainer.style.alignItems = 'center';
  likesContainer.style.flexShrink = '0';

  // Heart icon (button)
  const heartIcon = createTag('button', {
    class: 'like-button',
    type: 'button',
    'aria-label': 'Like',
  });
  heartIcon.style.width = '20px';
  heartIcon.style.height = '20px';
  heartIcon.style.border = 'none';
  heartIcon.style.background = 'transparent';
  heartIcon.style.cursor = 'pointer';
  heartIcon.style.padding = '0';

  // Heart SVG icon
  const heartSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 17.5L9.1 16.7C5.4 13.36 3 11.28 3 8.5C3 6.5 4.5 5 6.5 5C7.76 5 9.09 5.81 9.71 6.98H10.29C10.91 5.81 12.24 5 13.5 5C15.5 5 17 6.5 17 8.5C17 11.28 14.6 13.36 10.9 16.7L10 17.5Z" fill="#292929"/></svg>`;
  heartIcon.innerHTML = heartSvg;

  // Likes count
  const likesText = createTag('p', { class: 'modal-likes-count' });
  likesText.textContent = likes;

  likesContainer.appendChild(heartIcon);
  likesContainer.appendChild(likesText);

  nameLikesRow.appendChild(paletteName);
  nameLikesRow.appendChild(likesContainer);

  // Thumbnail and Tags row
  const thumbTagsRow = containers.thumbTagsRow;
  thumbTagsRow.style.display = 'flex';
  thumbTagsRow.style.flexDirection = 'column';
  thumbTagsRow.style.gap = '10px';
  thumbTagsRow.style.width = '100%';

  // Thumbnail container
  const thumbContainer = createTag('div', {
    class: 'modal-thumbnail-creator-container',
    style: 'display: flex; align-items: center; justify-content: flex-start; width: 101px; gap: 10px;',
  });

  // Thumbnail (36x36)
  const thumbnailWrapper = createTag('div', { class: 'modal-thumbnail-container' });
  const checkerboard = createTag('div', { class: 'thumbnail-checkerboard' });
  const thumbnailImage = createTag('img', {
    class: 'thumbnail-image',
    src: 'https://www.figma.com/api/mcp/asset/c1df6aac-323b-4739-94a2-4a06641a64ba',
    alt: `${creator}'s profile`,
  });
  const thumbnailBorder = createTag('div', { class: 'thumbnail-border' });

  thumbnailWrapper.appendChild(checkerboard);
  thumbnailWrapper.appendChild(thumbnailImage);
  thumbnailWrapper.appendChild(thumbnailBorder);

  // Creator name
  const creatorName = createTag('p', { class: 'modal-creator-name' });
  creatorName.textContent = creator;

  thumbContainer.appendChild(thumbnailWrapper);
  thumbContainer.appendChild(creatorName);

  // Tags container
  const tagsContainer = createTag('ul', { class: 'modal-tags-container' });
  tagsContainer.style.display = 'flex';
  tagsContainer.style.flexWrap = 'wrap';
  tagsContainer.style.gap = 'var(--spacing-75)';
  tagsContainer.style.alignItems = 'center';
  tagsContainer.style.justifyContent = 'flex-start';

  tags.forEach((tag) => {
    const tagElement = createTag('li', { class: 'modal-tag' });
    tagElement.textContent = tag;
    tagsContainer.appendChild(tagElement);
  });

  thumbTagsRow.appendChild(thumbContainer);
  thumbTagsRow.appendChild(tagsContainer);

  // 3. Toolbar Section
  const toolbarContainer = containers.toolbarContainer;
  const toolbarLeft = containers.toolbarLeft;
  const toolbarRight = containers.toolbarRight;

  // Left: Palette summary (5 color swatches) + Edit button
  toolbarLeft.style.display = 'flex';
  toolbarLeft.style.gap = 'var(--spacing-80)';
  toolbarLeft.style.alignItems = 'center';
  toolbarLeft.style.flex = '1 0 0';

  const paletteSummary = createTag('div', {
    class: 'modal-palette-summary',
    style: `
      display: flex;
      width: 180px;
      max-width: 180px;
      height: 36px;
      border: 1px solid rgba(31, 31, 31, 0.2);
      border-radius: 8px;
      overflow: hidden;
    `,
  });

  coreColors.slice(0, 5).forEach((color) => {
    const swatch = createTag('div', {
      class: 'palette-swatch',
      style: `
        background-color: ${color};
        flex: 1 0 0;
        height: 100%;
      `,
    });
    paletteSummary.appendChild(swatch);
  });

  // Edit button
  const editButton = createTag('button', {
    class: 'toolbar-action-button',
    type: 'button',
    'aria-label': 'Edit palette',
    style: `
      width: 32px;
      height: 32px;
      padding: 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
  });

  const editIcon = createTag('div', {
    style: `
      width: 20px;
      height: 20px;
      background-color: #292929;
      mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M14.5 2.5l3 3-9 9H5v-3.5l9-8.5zm1.4-1.4c.4-.4 1.1-.4 1.5 0l1.5 1.5c.4.4.4 1.1 0 1.5l-1 1-3-3 1-1z"/></svg>') center/contain no-repeat;
      -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M14.5 2.5l3 3-9 9H5v-3.5l9-8.5zm1.4-1.4c.4-.4 1.1-.4 1.5 0l1.5 1.5c.4.4.4 1.1 0 1.5l-1 1-3-3 1-1z"/></svg>') center/contain no-repeat;
    `,
  });
  editButton.appendChild(editIcon);

  toolbarLeft.appendChild(paletteSummary);
  toolbarLeft.appendChild(editButton);

  // Right: Action buttons
  toolbarRight.style.display = 'flex';
  toolbarRight.style.gap = 'var(--spacing-80)';
  toolbarRight.style.alignItems = 'center';

  // Share button
  const shareButton = createTag('button', {
    class: 'toolbar-action-button',
    type: 'button',
    'aria-label': 'Share',
  });
  // Download button
  const downloadButton = createTag('button', {
    class: 'toolbar-action-button',
    type: 'button',
    'aria-label': 'Download',
  });
  // Save to CC Library button
  const saveButton = createTag('button', {
    class: 'toolbar-action-button',
    type: 'button',
    'aria-label': 'Save to Creative Cloud Library',
  });

  // Apply common button styles
  [shareButton, downloadButton, saveButton].forEach((btn) => {
    btn.style.width = '32px';
    btn.style.height = '32px';
    btn.style.padding = '6px';
    btn.style.border = 'none';
    btn.style.background = 'transparent';
    btn.style.cursor = 'pointer';
    btn.style.borderRadius = '8px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
  });

  toolbarRight.appendChild(shareButton);
  toolbarRight.appendChild(downloadButton);
  toolbarRight.appendChild(saveButton);

  // CTA Button (full width below)
  const ctaButton = createTag('button', {
    class: 'modal-cta-button',
    type: 'button',
    'aria-label': 'Open palette in Adobe Express',
  });
  ctaButton.textContent = 'Open palette in Adobe Express';
  ctaButton.style.width = '100%';
  ctaButton.style.minWidth = '108px';
  ctaButton.style.background = 'var(--buttons-default)';
  ctaButton.style.borderRadius = '24px';
  ctaButton.style.border = 'none';
  ctaButton.style.cursor = 'pointer';
  ctaButton.style.display = 'flex';
  ctaButton.style.alignItems = 'center';
  ctaButton.style.justifyContent = 'center';
  ctaButton.style.padding = '13px 24px';
  ctaButton.style.color = 'var(--palette-white)';

  toolbarContainer.style.flexDirection = 'column';
  toolbarContainer.style.gap = 'var(--spacing-100)';

  const actionsRow = createTag('div', {
    style: 'display: flex; align-items: center; justify-content: space-between; width: 100%;',
  });
  actionsRow.appendChild(toolbarLeft);
  actionsRow.appendChild(toolbarRight);

  toolbarContainer.appendChild(actionsRow);
  toolbarContainer.appendChild(ctaButton);

  return containers;
}

/**
 * Utility: Determine if a color is dark (for text contrast)
 * @param {string} color - Hex color string
 * @returns {boolean} True if color is dark
 */
function isColorDark(color) {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.5;
}
