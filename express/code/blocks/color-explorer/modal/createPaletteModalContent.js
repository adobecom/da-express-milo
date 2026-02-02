import { createTag } from '../../../scripts/utils.js';
import { createModalContentContainers } from './createModalContentContainers.js';
import { announceColorCopy, announceLike } from './screenReaderAnnouncer.js';
import createFloatingToolbar from '../components/floating-toolbar/createFloatingToolbar.js';

// PROTOTYPE: Import Spectrum Web Components Tags from local bundle
// Single file contains both <sp-tags> and <sp-tag> components
// Lit is loaded from CDN (see import map required in HTML)
import '../components/s2/spectrum-tags.bundle.js';

/**
 * Creates palette modal content with color strips matching Figma design
 * Node ID: 5525-289743 (Mobile) / 5525-252389 (Tablet)
 * PROTOTYPE: Testing Spectrum Web Components Tags Integration
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
    const strip = createTag('div', {
      class: 'color-strip',
    });
    // Only dynamic color as inline style
    strip.style.backgroundColor = color;

    // Left: Hex code button
    const hexButton = createTag('button', {
      class: 'color-strip-hex-button',
      type: 'button',
      'aria-label': `Color ${index + 1}, hex code ${color}`,
    });

    // Hex code text (shown on light colors, hidden on dark)
    const isDark = isColorDark(color);
    if (!isDark) {
      const hexText = createTag('span', {
        class: 'color-strip-hex-text',
      });
      hexText.textContent = color;
      hexButton.appendChild(hexText);
    }

    // Right: Copy button
    const copyButton = createTag('button', {
      class: 'color-strip-copy-button',
      type: 'button',
      'aria-label': `Copy hex code ${color}`,
    });

    // Copy icon (20x20)
    const copyIcon = createTag('div', {
      class: isDark ? 'copy-icon copy-icon-light' : 'copy-icon copy-icon-dark',
    });

    copyButton.appendChild(copyIcon);

    // Add click handlers
    hexButton.addEventListener('click', () => {
      navigator.clipboard.writeText(color);
      announceColorCopy(color, index);
    });

    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(color);
      announceColorCopy(color, index);
    });

    strip.appendChild(hexButton);
    strip.appendChild(copyButton);
    paletteContainer.appendChild(strip);
  });

  // 2. Palette Name and Tags Section
  const nameTagsContainer = containers.nameTagsContainer;

  // Name and Likes row
  const nameLikesRow = containers.nameLikesRow;

  // Palette name
  const paletteName = createTag('h1', { class: 'modal-palette-name' });
  paletteName.textContent = name;

  // Likes container
  const likesContainer = createTag('div', { class: 'modal-palette-likes' });

  // Heart icon (button)
  const heartIcon = createTag('button', {
    class: 'like-button',
    type: 'button',
    'aria-label': 'Like',
  });

  // Heart SVG icon
  heartIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 17.5L9.1 16.7C5.4 13.36 3 11.28 3 8.5C3 6.5 4.5 5 6.5 5C7.76 5 9.09 5.81 9.71 6.98H10.29C10.91 5.81 12.24 5 13.5 5C15.5 5 17 6.5 17 8.5C17 11.28 14.6 13.36 10.9 16.7L10 17.5Z" fill="#292929"/></svg>';

  // Likes count
  const likesText = createTag('p', { class: 'modal-likes-count' });
  likesText.textContent = likes;

  likesContainer.appendChild(heartIcon);
  likesContainer.appendChild(likesText);

  nameLikesRow.appendChild(paletteName);
  nameLikesRow.appendChild(likesContainer);

  // Thumbnail and Tags row
  const thumbTagsRow = containers.thumbTagsRow;

  // Thumbnail container
  const thumbContainer = createTag('div', {
    class: 'modal-thumbnail-creator-container',
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
  // PROTOTYPE: Using Spectrum Web Components <sp-tags>
  const tagsContainer = document.createElement('sp-tags');
  tagsContainer.className = 'modal-tags-container';

  tags.forEach((tag) => {
    const tagElement = document.createElement('sp-tag');
    tagElement.className = 'modal-tag';
    tagElement.textContent = tag;
    tagsContainer.appendChild(tagElement);
  });

  thumbTagsRow.appendChild(thumbContainer);
  thumbTagsRow.appendChild(tagsContainer);

  // 3. Toolbar Section - Using new Floating Toolbar Component
  const toolbarContainer = containers.toolbarContainer;
  
  // Create toolbar with palette data
  const toolbar = createFloatingToolbar({
    palette: {
      id: palette.id || `palette-${Date.now()}`,
      name,
      colors: coreColors.slice(0, 5), // Use first 5 colors for summary
      tags,
      author: { name: creator },
      likes: likes || '0',
    },
    type: 'palette',
    ctaText: 'Open palette in Adobe Express',
    showEdit: true,
    variant: 'in-modal', // Use modal variant
    onEdit: () => {
      window.lana?.log('Edit palette clicked');
      // TODO: Navigate to color wheel page with palette
    },
    onCTA: () => {
      window.lana?.log('Open in Express clicked');
      // TODO: Navigate to Express with palette data
    },
  });

  // Clear toolbar container and append new toolbar
  toolbarContainer.innerHTML = '';
  toolbarContainer.appendChild(toolbar);

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
