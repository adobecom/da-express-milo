/**
 * Create CC Libraries Drawer Component
 * Part of MWPW-187085: Libraries Panel - UI only
 * 
 * @param {Object} options - Drawer configuration
 * @param {Object} options.paletteData - Palette or gradient data
 * @param {string} options.type - 'palette' or 'gradient'
 * @param {Function} options.onSave - Callback when save button is clicked
 * @param {Function} options.onClose - Callback when drawer is closed
 * @returns {Object} Drawer controller with open/close methods
 */

let ccLibrariesStyles = null;
let liveRegion = null;

async function loadCCLibrariesStyles() {
  if (ccLibrariesStyles) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/express/code/blocks/color-explorer/components/floating-toolbar/cc-libraries-drawer.css';
  document.head.appendChild(link);
  ccLibrariesStyles = link;
  
  // Wait for styles to load
  return new Promise((resolve) => {
    link.onload = resolve;
    link.onerror = resolve; // Resolve anyway to not block rendering
  });
}

/**
 * Initialize ARIA live region for screen reader announcements
 */
function initLiveRegion() {
  if (liveRegion) return liveRegion;
  
  liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'visually-hidden';
  liveRegion.style.position = 'absolute';
  liveRegion.style.left = '-10000px';
  liveRegion.style.width = '1px';
  liveRegion.style.height = '1px';
  liveRegion.style.overflow = 'hidden';
  document.body.appendChild(liveRegion);
  
  return liveRegion;
}

/**
 * Announce message to screen readers
 */
function announceToScreenReader(message) {
  const region = initLiveRegion();
  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 100);
}

export default function createCCLibrariesDrawer(options = {}) {
  const {
    paletteData = {},
    type = 'palette',
    onSave = () => {},
    onClose = () => {},
  } = options;

  let curtain = null;
  let drawer = null;
  let isOpen = false;

  // Create drawer structure
  function createDrawer() {
    // Create curtain/backdrop
    curtain = document.createElement('div');
    curtain.className = 'cc-libraries-curtain';
    curtain.setAttribute('role', 'presentation');
    curtain.setAttribute('aria-hidden', 'true');
    
    // Close on curtain click (stop propagation to prevent closing modal beneath)
    curtain.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });

    // Create drawer container
    drawer = document.createElement('div');
    drawer.className = 'cc-libraries-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-labelledby', 'cc-libraries-title');
    drawer.setAttribute('aria-modal', 'true');

    // Drawer handle
    const handle = document.createElement('div');
    handle.className = 'cc-libraries-drawer-handle';
    handle.setAttribute('aria-hidden', 'true');
    drawer.appendChild(handle);

    // Content container
    const content = document.createElement('div');
    content.className = 'cc-libraries-content';

    // Title
    const title = document.createElement('h2');
    title.id = 'cc-libraries-title';
    title.className = 'cc-libraries-title';
    title.textContent = 'Save to Creative Cloud Libraries';
    content.appendChild(title);

    // Inputs container
    const inputs = document.createElement('div');
    inputs.className = 'cc-libraries-inputs';

    // 1. Palette name field
    const paletteNameField = createTextField({
      label: `${type === 'palette' ? 'Palette' : 'Gradient'} name`,
      value: paletteData.name || 'My Color Theme',
      id: 'cc-libraries-palette-name',
      ariaLabel: `${type === 'palette' ? 'Palette' : 'Gradient'} name`,
    });
    inputs.appendChild(paletteNameField);

    // 2. Save to library picker (placeholder)
    const libraryPicker = createPickerField({
      label: 'Save to',
      value: 'My library',
      id: 'cc-libraries-save-to',
      ariaLabel: 'Select library',
    });
    inputs.appendChild(libraryPicker);

    // 3. Tags field with tag pills
    const tagsField = createTagsField({
      label: 'Tags',
      placeholder: 'Enter or select from below',
      tags: paletteData.tags || ['Blue', 'Green', 'Bold', 'Bright', 'Beige'],
      id: 'cc-libraries-tags',
    });
    inputs.appendChild(tagsField);

    content.appendChild(inputs);

    // Save button
    const saveButton = document.createElement('button');
    saveButton.className = 'cc-libraries-save-button';
    saveButton.type = 'button';
    saveButton.textContent = 'Save to library';
    saveButton.setAttribute('aria-label', 'Save to library');
    
    saveButton.addEventListener('click', () => {
      const formData = {
        name: document.getElementById('cc-libraries-palette-name').value,
        library: document.getElementById('cc-libraries-save-to').dataset.value || 'My library',
        tags: Array.from(document.querySelectorAll('.cc-libraries-tag-text'))
          .map(tag => tag.textContent),
      };
      onSave(formData);
      close();
    });
    
    content.appendChild(saveButton);

    drawer.appendChild(content);

    // Prevent clicks inside drawer from closing it
    drawer.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Keyboard handling
    drawer.addEventListener('keydown', handleKeyDown);

    return { curtain, drawer };
  }

  // Create text field
  function createTextField({ label, value, id, ariaLabel }) {
    const field = document.createElement('div');
    field.className = 'cc-libraries-field';

    const labelEl = document.createElement('label');
    labelEl.className = 'cc-libraries-field-label';
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    field.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.className = 'cc-libraries-text-input';
    input.value = value;
    input.setAttribute('aria-label', ariaLabel);
    field.appendChild(input);

    return field;
  }

  // Create picker/dropdown field (placeholder)
  function createPickerField({ label, value, id, ariaLabel }) {
    const field = document.createElement('div');
    field.className = 'cc-libraries-field';

    const labelEl = document.createElement('label');
    labelEl.className = 'cc-libraries-field-label';
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    field.appendChild(labelEl);

    const picker = document.createElement('div');
    picker.id = id;
    picker.className = 'cc-libraries-picker';
    picker.setAttribute('role', 'button');
    picker.setAttribute('aria-label', ariaLabel);
    picker.setAttribute('aria-haspopup', 'listbox');
    picker.setAttribute('tabindex', '0');
    picker.dataset.value = value;

    const pickerValue = document.createElement('span');
    pickerValue.className = 'cc-libraries-picker-value';
    pickerValue.textContent = value;
    picker.appendChild(pickerValue);

    // Chevron icon (placeholder)
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.classList.add('cc-libraries-picker-icon');
    chevron.setAttribute('viewBox', '0 0 12 12');
    chevron.setAttribute('fill', 'currentColor');
    chevron.setAttribute('aria-hidden', 'true');
    const chevronPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    chevronPath.setAttribute('d', 'M6 8L2 4h8L6 8z');
    chevron.appendChild(chevronPath);
    picker.appendChild(chevron);

    // Placeholder: Log on click (no actual dropdown functionality)
    picker.addEventListener('click', () => {
      console.log('[CC Libraries] Library picker clicked (UI placeholder)');
    });

    picker.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        console.log('[CC Libraries] Library picker activated (UI placeholder)');
      }
    });

    field.appendChild(picker);

    return field;
  }

  // Create tags field with removable tag pills
  function createTagsField({ label, placeholder, tags, id }) {
    const container = document.createElement('div');
    container.className = 'cc-libraries-tag-container';

    // Label + Input
    const field = document.createElement('div');
    field.className = 'cc-libraries-field';

    const labelEl = document.createElement('label');
    labelEl.className = 'cc-libraries-field-label';
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    field.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.className = 'cc-libraries-text-input';
    input.placeholder = placeholder;
    input.setAttribute('aria-label', label);
    field.appendChild(input);

    container.appendChild(field);

    // Tags list
    const tagsList = document.createElement('div');
    tagsList.className = 'cc-libraries-tags-list';
    tagsList.setAttribute('role', 'list');
    tagsList.setAttribute('aria-label', 'Selected tags');

    tags.forEach(tagText => {
      const tag = createTag(tagText, tagsList);
      tagsList.appendChild(tag);
    });

    container.appendChild(tagsList);

    // Add tag on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        e.preventDefault();
        const tagText = input.value.trim();
        const newTag = createTag(tagText, tagsList);
        tagsList.appendChild(newTag);
        announceToScreenReader(`Tag ${tagText} added`);
        input.value = '';
      }
    });

    return container;
  }

  // Create individual tag pill
  function createTag(text, tagsList) {
    const tag = document.createElement('div');
    tag.className = 'cc-libraries-tag';
    tag.setAttribute('role', 'listitem');

    const tagText = document.createElement('span');
    tagText.className = 'cc-libraries-tag-text';
    tagText.textContent = text;
    tag.appendChild(tagText);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'cc-libraries-tag-remove';
    removeButton.setAttribute('aria-label', `Remove tag ${text}`);
    // Expand hit area for better touch target (44px minimum)
    removeButton.style.minWidth = '24px';
    removeButton.style.minHeight = '24px';
    removeButton.style.display = 'flex';
    removeButton.style.alignItems = 'center';
    removeButton.style.justifyContent = 'center';

    // X icon (simplified)
    const xIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    xIcon.classList.add('cc-libraries-tag-remove-icon');
    xIcon.setAttribute('viewBox', '0 0 8 8');
    xIcon.setAttribute('fill', 'currentColor');
    xIcon.setAttribute('aria-hidden', 'true');
    const xPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    xPath.setAttribute('d', 'M1 1l6 6M7 1L1 7');
    xPath.setAttribute('stroke', 'currentColor');
    xPath.setAttribute('stroke-width', '1.5');
    xPath.setAttribute('stroke-linecap', 'round');
    xIcon.appendChild(xPath);
    removeButton.appendChild(xIcon);

    removeButton.addEventListener('click', () => {
      tag.remove();
      announceToScreenReader(`Tag ${text} removed`);
    });

    tag.appendChild(removeButton);

    return tag;
  }

  // Handle keyboard navigation
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      close();
      return;
    }

    // Trap focus within drawer - ensure all interactive elements are included
    if (e.key === 'Tab') {
      const focusableElements = drawer.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"]:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      );
      const focusableArray = Array.from(focusableElements);
      const firstElement = focusableArray[0];
      const lastElement = focusableArray[focusableArray.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: Moving backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Moving forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  // Open drawer
  async function open() {
    if (isOpen) return;

    try {
      // Load styles if not already loaded
      await loadCCLibrariesStyles();

      // Create drawer if not exists
      if (!drawer) {
        const elements = createDrawer();
        curtain = elements.curtain;
        drawer = elements.drawer;
        
        // Determine where to append based on viewport
        const isTabletOrDesktop = window.innerWidth >= 768;
        
        // For tablet/desktop, append to modal container; for mobile, append to body
        let modalContainer = null;
        if (isTabletOrDesktop) {
          // Find the modal container (tablet uses drawer-modal-container, desktop uses modal-container)
          modalContainer = document.querySelector('.drawer-modal-container, .modal-container');
        }
        
        // Append to modal container for tablet/desktop, body for mobile
        const appendTarget = modalContainer || document.body;
        appendTarget.appendChild(curtain);
        appendTarget.appendChild(drawer);
        
        // For tablet/desktop, ensure modal container has proper positioning context
        if (modalContainer && isTabletOrDesktop) {
          const computedStyle = window.getComputedStyle(modalContainer);
          if (computedStyle.position === 'static') {
            modalContainer.style.position = 'relative';
          }
        }
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Show curtain and drawer
      requestAnimationFrame(() => {
        curtain.classList.add('cc-libraries-curtain-open');
        drawer.classList.add('cc-libraries-drawer-open');
      });

      // Focus first input
      setTimeout(() => {
        const firstInput = drawer.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 300);

      // Announce to screen readers
      announceToScreenReader('Save to Creative Cloud Libraries dialog opened');

      isOpen = true;
    } catch (error) {
      console.error('[CC Libraries Drawer] Error opening drawer:', error);
      if (window.lana) {
        window.lana.log('[CC Libraries Drawer] Error opening drawer', { error: error.message });
      }
    }
  }

  // Close drawer
  function close() {
    if (!isOpen) return;

    try {
      // Hide curtain and drawer
      curtain.classList.remove('cc-libraries-curtain-open');
      drawer.classList.remove('cc-libraries-drawer-open');

      // Restore body scroll after animation
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 300);

      // Announce to screen readers
      announceToScreenReader('Dialog closed');

      isOpen = false;
      onClose();
    } catch (error) {
      console.error('[CC Libraries Drawer] Error closing drawer:', error);
      if (window.lana) {
        window.lana.log('[CC Libraries Drawer] Error closing drawer', { error: error.message });
      }
    }
  }

  // Cleanup (remove from DOM)
  function destroy() {
    if (curtain && curtain.parentNode) {
      curtain.parentNode.removeChild(curtain);
    }
    if (drawer && drawer.parentNode) {
      drawer.parentNode.removeChild(drawer);
    }
    curtain = null;
    drawer = null;
    isOpen = false;
  }

  // Public API
  return {
    open,
    close,
    destroy,
    get isOpen() {
      return isOpen;
    },
  };
}
