import { createTag } from '../../../scripts/utils.js';
import { createModalContentContainers } from './createModalContentContainers.js';
import { announceColorCopy, announceLike } from './screenReaderAnnouncer.js';
import createFloatingToolbar from '../components/floating-toolbar/createFloatingToolbar.js';

// PROTOTYPE: Spectrum Web Components - loaded dynamically
// Lit is loaded at block initialization (see color-explorer.js)
let spectrumLoaded = false;

/**
 * Creates gradient modal content matching Figma design
 * Node ID: 5711-61506
 * PROTOTYPE: Testing Spectrum Web Components Tags Integration
 *
 * @param {Object} gradient - Gradient data object
 * @param {string} gradient.name - Palette name
 * @param {Array} gradient.colorStops - Array of { color, position } objects
 * @param {number} gradient.angle - Gradient angle in degrees (default: 90)
 * @param {Array} gradient.coreColors - Array of color strings for palette summary
 * @param {string} gradient.likes - Number of likes (e.g., "1.2K")
 * @param {string} gradient.creator - Creator username
 * @param {Array} gradient.tags - Array of tag strings
 * @returns {Promise<Object>} Container elements with populated content
 */
export async function createGradientModalContent(gradient = {}) {
  // Dynamically import Spectrum bundle (self-contained with Lit included)
  if (!spectrumLoaded) {
    await import('../components/s2/spectrum-tags.bundle.js');
    spectrumLoaded = true;
  }
  const {
    name = 'Eternal Sunshine of the Spotless Mind',
    colorStops = [
      { color: '#7B9EA6', position: 0 },
      { color: '#D0ECF2', position: 0.25 },
      { color: '#59391D', position: 0.4999 },
      { color: '#D99066', position: 0.75 },
      { color: '#F34822', position: 1 },
    ],
    angle = 90,
    coreColors = ['#7B9EA6', '#D0ECF2', '#59391D', '#D99066', '#F34822'],
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

  // Tags container - PROTOTYPE: Using Spectrum Web Components <sp-tags>
  const tagsContainer = document.createElement('sp-tags');
  tagsContainer.className = 'modal-tags-container';
  tagsContainer.setAttribute('aria-label', 'Palette tags');

  tags.forEach((tag) => {
    const tagElement = document.createElement('sp-tag');
    tagElement.className = 'modal-tag';
    tagElement.textContent = tag;
    tagsContainer.appendChild(tagElement);
  });

  thumbTagsRow.appendChild(tagsContainer);

  // 3. Toolbar Section - Using new Floating Toolbar Component (auth-aware)
  const { toolbarContainer } = containers;

  const toolbar = await createFloatingToolbar({
    palette: {
      id: gradient.id || `gradient-${Date.now()}`,
      name,
      colors: coreColors, // Use gradient colors for summary
      tags,
      author: { name: creator },
      likes: likes || '0',
    },
    type: 'gradient',
    ctaText: 'Open gradient in Adobe Express',
    showEdit: false, // Gradients don't have edit button per Figma
    variant: 'in-modal', // Use modal variant
    onCTA: () => {
      window.lana?.log('Open gradient in Express clicked');
      // TODO: Navigate to Express with gradient data
    },
  });

  // Clear toolbar container and append new toolbar
  toolbarContainer.innerHTML = '';
  toolbarContainer.appendChild(toolbar);

  return containers;
}
