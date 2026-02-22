import { createTag } from '../../../scripts/utils.js';
import { createModalManager as createSharedModalManager } from '../../../scripts/color-shared/modal/createModalManager.js';
import { createGradientModalContent } from './createGradientModalContent.mock.js';

export function createColorModalManager(config) {
  let isOpen = false;
  let currentItem = null;
  let modalElement = null;
  const sharedModal = createSharedModalManager();

  function createPaletteContent(palette) {
    const content = createTag('div', { class: 'modal-palette-content' });
    const placeholder = createTag('p', {}, `Palette: ${palette.id}`);
    content.append(placeholder);
    return content;
  }

  function createModal(item, variant) {
    const modal = createTag('div', {
      class: `color-modal color-modal-${variant}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': item.name || 'Color details',
    });

    const header = createTag('div', { class: 'modal-header' });
    const title = createTag('h2', {}, item.name || 'Untitled');
    const closeBtn = createTag('button', {
      class: 'modal-close',
      'aria-label': 'Close',
    }, '×');

    closeBtn.addEventListener('click', () => close());

    header.append(title, closeBtn);

    let content;
    if (variant === 'gradients') {
      content = createGradientModalContent(item);
    } else if (variant === 'strips') {
      content = createPaletteContent(item);
    } else {
      content = createTag('div', { class: 'modal-content' });
      const placeholder = createTag('p', {}, `Modal for ${variant}: ${item.id}`);
      content.append(placeholder);
    }

    content.classList.add('modal-content');

    const footer = createTag('div', { class: 'modal-footer' });
    const saveBtn = createTag('button', { class: 'btn-primary' }, 'Save to Libraries');
    const shareBtn = createTag('button', { class: 'btn-secondary' }, 'Share');
    const downloadBtn = createTag('button', { class: 'btn-secondary' }, 'Download');

    footer.append(saveBtn, shareBtn, downloadBtn);

    modal.append(header, content, footer);

    return modal;
  }

  function open(item, variant) {
    if (variant === 'gradients') {
      currentItem = item;
      isOpen = true;
      const contentEl = createGradientModalContent(item);
      sharedModal.open({
        content: contentEl,
        title: item.name || 'Gradient',
        showTitle: true,
        onClose: () => {
          isOpen = false;
          currentItem = null;
        },
      });
      return;
    }

    if (isOpen) close();

    currentItem = item;
    modalElement = createModal(item, variant);
    document.body.append(modalElement);
    document.body.style.overflow = 'hidden';
    isOpen = true;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  function close() {
    if (sharedModal.isOpen()) {
      sharedModal.close();
      isOpen = false;
      currentItem = null;
      return;
    }
    if (!isOpen || !modalElement) return;

    modalElement.remove();
    document.body.style.overflow = '';
    isOpen = false;
    currentItem = null;
    modalElement = null;
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

