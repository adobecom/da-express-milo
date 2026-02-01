import { createTag } from '../../../scripts/utils.js';
import { createModalContentContainers } from './createModalContentContainers.js';

/**
 * Creates gradient modal content matching Figma design
 * Node ID: 5711-61506
 *
 * @param {Object} gradient - Gradient data object
 * @param {string} gradient.name - Palette name
 * @param {Array} gradient.colorStops - Array of { color, position } objects
 * @param {number} gradient.angle - Gradient angle in degrees (default: 90)
 * @param {Array} gradient.coreColors - Array of color strings for palette summary
 * @param {string} gradient.likes - Number of likes (e.g., "1.2K")
 * @param {string} gradient.creator - Creator username
 * @param {Array} gradient.tags - Array of tag strings
 * @returns {Object} Container elements with populated content
 */
export function createGradientModalContent(gradient = {}) {
  const {
    name = 'Eternal Sunshine of the Spotless Mind',
    colorStops = [
      { color: 'rgb(123, 158, 166)', position: 0 },
      { color: 'rgb(208, 236, 242)', position: 0.25 },
      { color: 'rgb(89, 57, 29)', position: 0.5 },
      { color: 'rgb(217, 144, 102)', position: 0.75 },
      { color: 'rgb(243, 72, 34)', position: 1 },
    ],
    angle = 90,
    coreColors = ['#1900ab', '#6bb1ff', '#ff7500', '#fffdeb', '#0076ff'],
    likes = '1.2K',
    creator = 'nicolagilroy',
    tags = ['Orange', 'Cinematic', 'Summer', 'Water'],
  } = gradient;

  // Get base containers
  const containers = createModalContentContainers();

  // 1. Render Gradient with Color Handles
  const gradientContainer = containers.colorsContainer;
  gradientContainer.className = 'modal-palette-colors modal-gradient-preview';
  gradientContainer.removeAttribute('data-placeholder');
  // Accessibility: Per Figma - "selected color palette" with number of colors
  gradientContainer.setAttribute('role', 'region');
  gradientContainer.setAttribute('aria-label', `Selected color palette, ${colorStops.length} colors`);

  // Generate gradient CSS
  const gradientStops = colorStops
    .map((stop) => `${stop.color} ${Math.round(stop.position * 100)}%`)
    .join(', ');
  const gradientCSS = `linear-gradient(${angle}deg, ${gradientStops})`;

  // Set gradient background (only dynamic value as inline style)
  gradientContainer.style.background = gradientCSS;

  // Create color handles overlay
  const handlesContainer = createTag('div', {
    class: 'gradient-color-handles',
  });

  // Create handles for each color stop
  colorStops.forEach((stop, index) => {
    const handle = createTag('button', {
      class: 'gradient-color-handle',
      type: 'button',
      'aria-label': `Copy color ${index + 1}, hex code ${stop.color}`,
    });
    // Only dynamic positioning as inline style
    handle.style.left = `${Math.round(stop.position * 100)}%`;

    const handleRing = createTag('div', {
      class: 'color-handle-ring',
    });

    const handleFill = createTag('div', {
      class: 'color-handle-fill',
    });
    // Only dynamic color as inline style
    handleFill.style.backgroundColor = stop.color;

    handleRing.appendChild(handleFill);
    handle.appendChild(handleRing);
    handlesContainer.appendChild(handle);
  });

  gradientContainer.appendChild(handlesContainer);

  // 2. Populate Tags Section
  const { nameLikesRow } = containers;
  nameLikesRow.removeAttribute('data-placeholder');
  nameLikesRow.innerHTML = '';

  // Palette name
  const paletteName = createTag('h1', {
    class: 'modal-palette-name',
  });
  paletteName.textContent = name || 'Untitled Gradient';
  nameLikesRow.appendChild(paletteName);

  // Likes container
  const likesContainer = createTag('div', {
    class: 'modal-palette-likes',
  });

  // Heart icon button - Per Figma: Accessible name "Like"
  const heartButton = createTag('button', {
    class: 'like-icon',
    type: 'button',
    'aria-label': 'Like',
  });
  // SVG inline for heart icon
  heartButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 20 20"><path fill="#292929" d="M10 18c-.3 0-.6-.1-.8-.3C3.2 12.7 0 9.5 0 6.5 0 3.9 2.1 2 4.5 2c1.5 0 3 .7 4 1.8C9.5 2.7 11 2 12.5 2 14.9 2 17 3.9 17 6.5c0 3-3.2 6.2-9.2 11.2-.2.2-.5.3-.8.3z"/></svg>';
  likesContainer.appendChild(heartButton);

  const likesText = createTag('p', {
    class: 'modal-likes-count',
  });
  likesText.textContent = likes || '1.2K'; // Set text content explicitly
  likesContainer.appendChild(likesText);

  nameLikesRow.appendChild(likesContainer);

  // Thumbnail and tags row
  const { thumbTagsRow } = containers;
  thumbTagsRow.removeAttribute('data-placeholder');
  thumbTagsRow.innerHTML = '';

  // Thumbnail container
  const thumbContainer = createTag('div', {
    class: 'modal-thumbnail-container',
  });

  // Thumbnail with Figma images (36x36px)
  // Figma structure: checkerboard background + image + border overlay
  const thumbnail = createTag('div', {
    class: 'modal-thumbnail',
  });

  // Checkerboard background
  const checkerboard = createTag('img', {
    class: 'thumbnail-checkerboard',
    src: 'https://www.figma.com/api/mcp/asset/ccc42d8c-d561-46f8-9431-23156bf45af9',
    alt: '',
  });
  thumbnail.appendChild(checkerboard);

  // Profile image
  const profileImage = createTag('img', {
    class: 'thumbnail-image',
    src: 'https://www.figma.com/api/mcp/asset/202118cd-85aa-424b-90eb-f331eb551a04',
    alt: creator || 'Creator',
  });
  thumbnail.appendChild(profileImage);

  // Border overlay
  const border = createTag('img', {
    class: 'thumbnail-border',
    src: 'https://www.figma.com/api/mcp/asset/58808983-6674-478c-8b39-912c0f5a7c9f',
    alt: '',
  });
  thumbnail.appendChild(border);

  thumbContainer.appendChild(thumbnail);

  // Creator name
  const creatorName = createTag('p', {
    class: 'modal-creator-name',
  });
  creatorName.textContent = creator || 'nicolagilroy'; // Set text content explicitly
  thumbContainer.appendChild(creatorName);

  thumbTagsRow.appendChild(thumbContainer);

  // Tags container
  const tagsContainer = createTag('ul', {
    class: 'modal-tags-container',
    'aria-label': 'Palette tags',
  });

  tags.forEach((tag) => {
    const tagElement = createTag('li', {
      class: 'modal-tag',
    });
    tagElement.textContent = tag;
    tagsContainer.appendChild(tagElement);
  });

  thumbTagsRow.appendChild(tagsContainer);

  // 3. Populate Toolbar Section
  const { toolbarLeft } = containers;
  toolbarLeft.removeAttribute('data-placeholder');
  toolbarLeft.innerHTML = '';

  // Palette summary (color swatches)
  const paletteSummary = createTag('div', {
    class: 'modal-palette-summary',
  });

  coreColors.forEach((color) => {
    const swatch = createTag('div', {
      class: 'palette-swatch',
    });
    // Only dynamic color as inline style
    swatch.style.backgroundColor = color;
    paletteSummary.appendChild(swatch);
  });

  toolbarLeft.appendChild(paletteSummary);

  // Edit button placeholder
  const editButton = createTag('button', {
    class: 'modal-edit-button',
    type: 'button',
    'aria-label': 'Edit palette',
  });
  editButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.5 2.5L17.5 5.5L6 17H3V14L14.5 2.5Z" fill="#292929"/></svg>';
  toolbarLeft.appendChild(editButton);

  // Toolbar right
  const { toolbarRight } = containers;
  toolbarRight.removeAttribute('data-placeholder');
  toolbarRight.innerHTML = '';

  // Action buttons container
  const actionButtonsContainer = createTag('div', {
    class: 'modal-action-buttons',
  });

  // Share button
  const shareButton = createTag('button', {
    class: 'modal-action-button',
    type: 'button',
    'aria-label': 'Share',
  });
  shareButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 8C16.1 8 17 7.1 17 6C17 4.9 16.1 4 15 4C13.9 4 13 4.9 13 6C13 6.2 13 6.4 13.1 6.6L7.4 9.5C6.9 9.2 6.3 9 5.7 9C3.7 9 2 10.7 2 12.7C2 14.7 3.7 16.4 5.7 16.4C6.3 16.4 6.9 16.2 7.4 15.9L13.1 18.8C13 19 13 19.2 13 19.4C13 20.5 13.9 21.4 15 21.4C16.1 21.4 17 20.5 17 19.4C17 18.3 16.1 17.4 15 17.4C14.4 17.4 13.8 17.6 13.3 17.9L7.6 15C7.7 14.8 7.7 14.6 7.7 14.4C7.7 14.2 7.7 14 7.6 13.8L13.3 10.9C13.8 11.2 14.4 11.4 15 11.4C17 11.4 18.7 9.7 18.7 7.7C18.7 5.7 17 4 15 4Z" fill="#292929"/></svg>';
  actionButtonsContainer.appendChild(shareButton);

  // Download button
  const downloadButton = createTag('button', {
    class: 'modal-action-button',
    type: 'button',
    'aria-label': 'Download',
  });
  downloadButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L10 12M10 12L6 8M10 12L14 8M3 14L3 16C3 17.1 3.9 18 5 18L15 18C16.1 18 17 17.1 17 16L17 14" stroke="#292929" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  actionButtonsContainer.appendChild(downloadButton);

  // Save to CC Library button
  const saveButton = createTag('button', {
    class: 'modal-action-button',
    type: 'button',
    'aria-label': 'Save to Creative Cloud Library',
  });
  saveButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 6L4 16C4 17.1 4.9 18 6 18L14 18C15.1 18 16 17.1 16 16L16 6M4 6L10 2L16 6M4 6L10 10L16 6" stroke="#292929" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  actionButtonsContainer.appendChild(saveButton);

  toolbarRight.appendChild(actionButtonsContainer);

  // CTA Button
  const ctaButton = createTag('button', {
    class: 'modal-cta-button',
    type: 'button',
    'aria-label': 'Open palette in Adobe Express',
  });
  ctaButton.textContent = 'Open palette in Adobe Express';
  toolbarRight.appendChild(ctaButton);

  return containers;
}
