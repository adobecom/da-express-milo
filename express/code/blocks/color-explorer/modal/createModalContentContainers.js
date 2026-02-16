import { createTag } from '../../../scripts/utils.js';

/**
 * Creates placeholder containers for modal content sections
 * Based on Figma design: node 5525-257472
 *
 * Structure:
 * 1. Palette Container - Vertical color strips/gradient preview
 * 2. Palette Name and Tags - Title, creator, likes, tags
 * 3. Palette Toolbar - Summary strip, edit button, action buttons
 *
 * @returns {Object} Container elements { paletteContainer, nameTagsContainer, toolbarContainer }
 */
export function createModalContentContainers() {
  // 1. Palette Container - For color strips or gradient preview
  const paletteContainer = createTag('section', {
    class: 'modal-palette-container',
  });

  // Inner container for colors/strips
  const colorsContainer = createTag('div', {
    class: 'modal-palette-colors',
    'data-placeholder': 'palette-strips',
  });
  paletteContainer.appendChild(colorsContainer);

  // 2. Palette Name and Tags Container
  const nameTagsContainer = createTag('section', {
    class: 'modal-palette-name-tags',
  });

  // Name and likes row
  const nameLikesRow = createTag('div', {
    class: 'modal-palette-name-likes',
    'data-placeholder': 'name-likes',
  });
  nameTagsContainer.appendChild(nameLikesRow);

  // Thumbnail and tags row
  const thumbTagsRow = createTag('div', {
    class: 'modal-palette-thumb-tags',
    'data-placeholder': 'thumb-tags',
  });
  nameTagsContainer.appendChild(thumbTagsRow);

  // 3. Palette Toolbar Container
  const toolbarContainer = createTag('nav', {
    class: 'modal-palette-toolbar',
    'aria-label': 'Palette actions',
  });

  // Left side: Summary and edit
  const toolbarLeft = createTag('div', {
    class: 'modal-palette-toolbar-left',
    'data-placeholder': 'toolbar-left',
  });

  // Add placeholder content for toolbar left (palette summary + edit button)
  const paletteSummary = createTag('div', {
    style: 'width: 180px; height: 36px; border: 1px solid rgba(31,31,31,0.2); border-radius: 8px; display: flex; background: #f0f0f0;',
  });
  toolbarLeft.appendChild(paletteSummary);

  const editButton = createTag('div', {
    style: 'width: 32px; height: 32px; border: 1px dashed #ccc; border-radius: 8px; background: #f9f9f9;',
    title: 'Edit button placeholder',
  });
  toolbarLeft.appendChild(editButton);

  toolbarContainer.appendChild(toolbarLeft);

  // Right side: Action buttons
  const toolbarRight = createTag('div', {
    class: 'modal-palette-toolbar-right',
    'data-placeholder': 'toolbar-right',
  });

  // Add placeholder content for toolbar right (action buttons + CTA)
  const actionButtons = createTag('div', {
    style: 'display: flex; gap: 6px;',
  });

  // Share button placeholder
  const shareBtn = createTag('div', {
    style: 'width: 32px; height: 32px; border: 1px dashed #ccc; border-radius: 8px; background: #f9f9f9;',
    title: 'Share button placeholder',
  });
  actionButtons.appendChild(shareBtn);

  // Download button placeholder
  const downloadBtn = createTag('div', {
    style: 'width: 32px; height: 32px; border: 1px dashed #ccc; border-radius: 8px; background: #f9f9f9;',
    title: 'Download button placeholder',
  });
  actionButtons.appendChild(downloadBtn);

  // Bookmark button placeholder
  const bookmarkBtn = createTag('div', {
    style: 'width: 32px; height: 32px; border: 1px dashed #ccc; border-radius: 8px; background: #f9f9f9;',
    title: 'Bookmark button placeholder',
  });
  actionButtons.appendChild(bookmarkBtn);

  toolbarRight.appendChild(actionButtons);

  // CTA button placeholder
  const ctaButton = createTag('div', {
    style: 'min-width: 108px; height: 48px; border-radius: 24px; background: #3b63fb; color: white; display: flex; align-items: center; justify-content: center; padding: 13px 24px; font-size: 18px; font-weight: bold;',
    textContent: 'Open palette in Adobe Express',
  });
  toolbarRight.appendChild(ctaButton);

  toolbarContainer.appendChild(toolbarRight);

  return {
    paletteContainer,
    colorsContainer,
    nameTagsContainer,
    nameLikesRow,
    thumbTagsRow,
    toolbarContainer,
    toolbarLeft,
    toolbarRight,
  };
}
