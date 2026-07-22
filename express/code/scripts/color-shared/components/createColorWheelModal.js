import { createTag } from '../../../scripts/utils.js';
import { createColorWheelAdapter } from '../adapters/litComponentAdapters.js';

export function createColorWheelModal(options = {}) {
  const {
    modalType = 'full-screen',
    initialColor = '#FF0000',
    onColorChange,
    onSave,
    onCancel,
  } = options;


  let wheelAdapter = null;
  let currentColor = initialColor;
  let isOpen = false;

  function createOverlay() {
    const overlay = createTag('div', { 
      class: `color-wheel-modal-overlay ${modalType}`,
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close();
      }
    });

    return overlay;
  }

  function createContent() {
    const content = createTag('div', { class: 'color-wheel-modal-content' });

    const header = createTag('div', { class: 'modal-header' });
    const title = createTag('h2', {});
    title.textContent = 'Edit Color';
    const closeBtn = createTag('button', { 
      class: 'modal-close-btn',
      type: 'button',
      'aria-label': 'Close',
    });
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', close);

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = createTag('div', { class: 'modal-body' });
    
    wheelAdapter = createColorWheelAdapter(currentColor, {
      onChange: (colorDetail) => {
        currentColor = colorDetail.color || currentColor;
        onColorChange?.(currentColor);
      },
      onChangeEnd: (colorDetail) => {
      },
    });

    body.appendChild(wheelAdapter.element);


    const footer = createTag('div', { class: 'modal-footer' });
    
    const cancelBtn = createTag('button', { 
      class: 'modal-button cancel',
      type: 'button',
    });
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', close);

    const saveBtn = createTag('button', { 
      class: 'modal-button primary',
      type: 'button',
    });
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      onSave?.(currentColor);
      close();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);

    return content;
  }

  const overlay = createOverlay();
  const content = createContent();
  overlay.appendChild(content);

  function open() {
    if (isOpen) return;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    isOpen = true;

    setTimeout(() => {
      overlay.querySelector('.modal-close-btn')?.focus();
    }, 100);
  }

  function close() {
    if (!isOpen) return;

    overlay.remove();
    document.body.style.overflow = '';
    isOpen = false;

    onCancel?.();
  }

  function setColor(color) {
    currentColor = color;
    wheelAdapter?.setColor(color);
  }

  return {
    open,
    close,
    setColor,
    isOpen: () => isOpen,
    
    destroy: () => {
      close();
      wheelAdapter?.destroy();
    },
  };
}

