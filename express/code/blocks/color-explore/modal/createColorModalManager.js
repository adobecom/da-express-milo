import { createTag } from '../../../scripts/utils.js';
import { createModalManager as createSharedModalManager } from '../../../scripts/color-shared/modal/createModalManager.js';
import { createGradientModalContentMock } from '../demo/gradientDemo.js';

/**
 * Color-explore modal manager. Uses shared MWPW-185800 modal shell (close X, layout, a11y).
 * All opens go through sharedModal.open() so the same close button and styles apply.
 */
export function createColorModalManager(config) {
  let isOpen = false;
  let currentItem = null;
  const sharedModal = createSharedModalManager();

  function createPaletteContent(palette) {
    const content = createTag('div', { class: 'modal-palette-content' });
    const placeholder = createTag('p', {}, `Palette: ${palette.id}`);
    content.append(placeholder);
    return content;
  }

  function getContentForVariant(item, variant) {
    if (variant === 'gradients') {
      return createGradientModalContentMock(item);
    }
    if (variant === 'strips') {
      return createPaletteContent(item);
    }
    const content = createTag('div', { class: 'modal-content' });
    const placeholder = createTag('p', {}, `Modal for ${variant}: ${item.id}`);
    content.append(placeholder);
    return content;
  }

  function open(item, variant) {
    if (item && typeof item === 'object' && 'content' in item) {
      currentItem = item;
      isOpen = true;
      sharedModal.open({
        title: item.title || 'Modal',
        content: item.content,
        showTitle: item.showTitle ?? false,
        onClose: () => {
          item.onClose?.();
          isOpen = false;
          currentItem = null;
        },
      });
      return;
    }

    currentItem = item;
    isOpen = true;
    const contentEl = getContentForVariant(item, variant);
    sharedModal.open({
      title: item.name || (variant === 'gradients' ? 'Gradient' : 'Color details'),
      content: contentEl,
      showTitle: true,
      onClose: () => {
        isOpen = false;
        currentItem = null;
      },
    });
  }

  function close() {
    if (sharedModal.isOpen()) {
      sharedModal.close();
      isOpen = false;
      currentItem = null;
    }
  }

  function getCurrentItem() {
    return currentItem;
  }

  function getIsOpen() {
    return isOpen || sharedModal.isOpen();
  }

  return {
    open,
    close,
    getCurrentItem,
    getIsOpen,
  };
}
