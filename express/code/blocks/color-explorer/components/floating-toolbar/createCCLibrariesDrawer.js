/**
 * Create CC Libraries Drawer Component
 * Part of MWPW-187085: Libraries Panel - UI only
 * PROTOTYPE: Testing Spectrum Web Components Tags Integration
 * 
 * @param {Object} options - Drawer configuration
 * @param {Object} options.paletteData - Palette or gradient data
 * @param {string} options.type - 'palette' or 'gradient'
 * @param {Function} options.onSave - Callback when save button is clicked
 * @param {Function} options.onClose - Callback when drawer is closed
 * @returns {Promise<Object>} Drawer controller with open/close methods
 */

// PROTOTYPE: Spectrum Web Components - loaded dynamically
// Lit is loaded at block initialization (see color-explorer.js)
let spectrumLoaded = false;
let ccLibrariesStyles = null;
let liveRegion = null;

async function loadCCLibrariesStyles() {
  if (ccLibrariesStyles) return;
  
  // Load main CC Libraries drawer styles
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/express/code/blocks/color-explorer/components/floating-toolbar/cc-libraries-drawer.css';
  document.head.appendChild(link);
  ccLibrariesStyles = link;
  
  // PROTOTYPE: Load Spectrum tags override styles
  const spectrumOverride = document.createElement('link');
  spectrumOverride.rel = 'stylesheet';
  spectrumOverride.href = '/express/code/blocks/color-explorer/spectrum-tags-override.css';
  document.head.appendChild(spectrumOverride);
  
  // Wait for both styles to load
  return Promise.all([
    new Promise((resolve) => {
      link.onload = resolve;
      link.onerror = resolve;
    }),
    new Promise((resolve) => {
      spectrumOverride.onload = resolve;
      spectrumOverride.onerror = resolve;
    })
  ]);
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

export default async function createCCLibrariesDrawer(options = {}) {
  // Dynamically import Spectrum bundle (Lit already loaded at block initialization)
  if (!spectrumLoaded) {
    await import('../s2/spectrum-tags.bundle.js');
    spectrumLoaded = true;
  }

  const {
    paletteData = {},
    type = 'palette',
    onSave = () => {},
    onClose = () => {},
  } = options;

  let drawer = null;
  let isOpen = false;

  // Create drawer structure
  function createDrawer() {
    // Create drawer container (no curtain per Figma)
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

    // Title row with close button
    const titleRow = document.createElement('div');
    titleRow.className = 'cc-libraries-title-row';
    titleRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: var(--spacing-200);';
    
    // Title
    const title = document.createElement('h2');
    title.id = 'cc-libraries-title';
    title.className = 'cc-libraries-title';
    title.textContent = 'Save to Creative Cloud Libraries';
    titleRow.appendChild(title);
    
    // Close button (for mobile - hidden on tablet/desktop)
    const closeButton = document.createElement('button');
    closeButton.className = 'cc-libraries-close-button';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 5L5 15M5 5L15 15" stroke="#292929" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
    titleRow.appendChild(closeButton);
    
    content.appendChild(titleRow);

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

    return { drawer };
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

    // Tags list - Using regular div (not Spectrum) since we're using custom tags
    const tagsList = document.createElement('div');
    tagsList.className = 'cc-libraries-tags-list';
    tagsList.setAttribute('role', 'list'); // Add ARIA role for accessibility

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

  // CUSTOM TAG COMPONENT: Build our own tag (not using Spectrum Web Components)
  // Reason: Spectrum <sp-tag> doesn't allow custom SVG in default slot
  function createTag(text, tagsList) {
    // Create CUSTOM tag button (not <sp-tag>) to avoid Shadow DOM issues
    const tag = document.createElement('button');
    tag.type = 'button';
    tag.className = 'cc-libraries-tag-custom';
    tag.setAttribute('role', 'listitem'); // Part of list for accessibility
    tag.setAttribute('aria-label', `Add tag ${text}`);
    
    // Text content
    const textSpan = document.createElement('span');
    textSpan.className = 'cc-libraries-tag-text';
    textSpan.textContent = text;
    tag.appendChild(textSpan);

    // + icon (SVG) - this will render correctly without Shadow DOM blocking
    const plusIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    plusIcon.classList.add('cc-libraries-tag-add-icon');
    plusIcon.setAttribute('viewBox', '0 0 12 12');
    plusIcon.setAttribute('fill', 'none');
    plusIcon.setAttribute('aria-hidden', 'true');
    plusIcon.style.width = '12px';
    plusIcon.style.height = '12px';
    plusIcon.style.flexShrink = '0';
    
    // Horizontal line of plus
    const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hLine.setAttribute('d', 'M2 6h8');
    hLine.setAttribute('stroke', '#292929');
    hLine.setAttribute('stroke-width', '1.5');
    hLine.setAttribute('stroke-linecap', 'round');
    hLine.setAttribute('fill', 'none');
    plusIcon.appendChild(hLine);
    
    // Vertical line of plus
    const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    vLine.setAttribute('d', 'M6 2v8');
    vLine.setAttribute('stroke', '#292929');
    vLine.setAttribute('stroke-width', '1.5');
    vLine.setAttribute('stroke-linecap', 'round');
    vLine.setAttribute('fill', 'none');
    plusIcon.appendChild(vLine);
    
    tag.appendChild(plusIcon);

    // Make entire tag clickable
    tag.addEventListener('click', () => {
      // Placeholder: In real implementation, this would add the tag to the input field
      announceToScreenReader(`Tag ${text} added`);
      // TODO: Implement adding tag to the input field above
    });

    // Keyboard support
    tag.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tag.click();
      }
    });

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
        drawer = elements.drawer;
        
        // Determine where to append based on viewport
        const isTabletOrDesktop = window.innerWidth >= 768;
        
        // For tablet/desktop, append to modal container; for mobile, append to body
        let modalContainer = null;
        if (isTabletOrDesktop) {
          // Find the OPEN modal container - try multiple selectors
          modalContainer = document.querySelector('.modal-container.modal-open, .drawer-modal-container.drawer-open, .modal-container[style*="display: flex"], .drawer-modal-container[style*="display"]');
          
          // Fallback: find any modal container that's currently visible
          if (!modalContainer) {
            const allModals = document.querySelectorAll('.modal-container, .drawer-modal-container');
            for (const modal of allModals) {
              const computedStyle = window.getComputedStyle(modal);
              if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
                modalContainer = modal;
                break;
              }
            }
          }
          
          console.log('[CC Libraries] Found modal container:', modalContainer?.className);
        }
        
        // Append to modal container for tablet/desktop, body for mobile
        const appendTarget = modalContainer || document.body;
        appendTarget.appendChild(drawer);
        
        // For tablet/desktop, ensure modal container has proper positioning context
        if (modalContainer && isTabletOrDesktop) {
          const computedStyle = window.getComputedStyle(modalContainer);
          if (computedStyle.position === 'static') {
            modalContainer.style.position = 'relative';
          }
          
          // Add click-outside-to-close for tablet/desktop
          setTimeout(() => {
            const clickOutsideHandler = (e) => {
              // If click is outside drawer and inside modal, close drawer but not modal
              if (!drawer.contains(e.target) && modalContainer.contains(e.target)) {
                close();
                modalContainer.removeEventListener('click', clickOutsideHandler);
              }
            };
            modalContainer.addEventListener('click', clickOutsideHandler);
            
            // Store handler for cleanup
            drawer.dataset.clickHandler = 'attached';
          }, 100);
        }
      }

      // Show drawer (no curtain per Figma)
      requestAnimationFrame(() => {
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
      // Hide drawer (no curtain per Figma)
      drawer.classList.remove('cc-libraries-drawer-open');

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
    if (drawer && drawer.parentNode) {
      drawer.parentNode.removeChild(drawer);
    }
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
