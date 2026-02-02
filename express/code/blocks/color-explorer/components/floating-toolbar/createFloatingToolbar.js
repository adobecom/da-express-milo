/**
 * FLOATING TOOLBAR COMPONENT
 * MWPW-187074 - Standalone reusable toolbar for Color Explorer
 * 
 * Usage:
 *   createFloatingToolbar({
 *     palette: { id, name, colors, tags, author, likes },
 *     type: 'palette' | 'gradient',
 *     onCopy: (hex) => {},
 *     onShare: () => {},
 *     onDownload: () => {},
 *     onSave: () => {},
 *     onExpress: () => {},
 *     onEdit: () => {},
 *     onCTA: () => {}
 *   })
 */

import createCCLibrariesDrawer from './createCCLibrariesDrawer.js';

// Dynamic CSS loading
let toolbarStylesLoaded = false;
let ccLibrariesDrawerInstance = null;

async function loadToolbarStyles() {
  if (toolbarStylesLoaded) return;
  
  try {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/express/code/blocks/color-explorer/components/floating-toolbar/floating-toolbar.css';
    document.head.appendChild(link);
    
    await new Promise((resolve, reject) => {
      link.onload = resolve;
      link.onerror = reject;
    });
    
    toolbarStylesLoaded = true;
  } catch (error) {
    window.lana?.log('Failed to load floating toolbar styles:', error);
    throw error;
  }
}

/**
 * Create the Floating Toolbar Component
 * @param {Object} options - Configuration options
 * @param {Object} options.palette - Palette/gradient data
 * @param {string} options.palette.id - Unique ID
 * @param {string} options.palette.name - Palette/gradient name
 * @param {Array<string>} options.palette.colors - Array of hex colors
 * @param {Array<string>} [options.palette.tags] - Array of tag strings
 * @param {Object} [options.palette.author] - Author info { name, thumbnail }
 * @param {number} [options.palette.likes] - Number of likes
 * @param {string} options.type - 'palette' or 'gradient'
 * @param {Function} [options.onCopy] - Callback when copy hex is clicked
 * @param {Function} [options.onShare] - Callback when share is clicked
 * @param {Function} [options.onDownload] - Callback when download is clicked
 * @param {Function} [options.onSave] - Callback when save to CC libraries is clicked
 * @param {Function} [options.onExpress] - Callback when open in Express is clicked
 * @param {Function} [options.onEdit] - Callback when edit is clicked
 * @param {Function} [options.onCTA] - Callback when CTA button is clicked
 * @param {string} [options.ctaText] - Custom CTA button text
 * @param {boolean} [options.showEdit] - Show edit button (default: true for palette)
 * @param {string} [options.variant] - Toolbar variant: 'standalone' (default) or 'in-modal'
 * @returns {HTMLElement} The toolbar container element
 */
export function createFloatingToolbar(options = {}) {
  const {
    palette = {},
    type = 'palette',
    onCopy = null,
    onShare = null,
    onDownload = null,
    onSave = null,
    onExpress = null,
    onEdit = null,
    onCTA = null,
    ctaText = 'Create with my color palette',
    showEdit = type === 'palette',
    variant = 'standalone',
  } = options;

  const {
    id = '',
    name = 'My Color Theme',
    colors = ['#1900ab', '#6bb1ff', '#ff7500', '#fffdeb', '#0076ff'],
    tags = [],
    author = null,
    likes = 0,
  } = palette;

  // Load styles asynchronously
  loadToolbarStyles().catch((error) => {
    window.lana?.log('Toolbar styles failed to load:', error);
  });

  // Main Toolbar Container
  const toolbar = document.createElement('div');
  let toolbarClass = 'floating-toolbar';
  if (variant === 'in-modal') {
    toolbarClass += ' floating-toolbar--in-modal';
  } else if (variant === 'sticky') {
    toolbarClass += ' floating-toolbar--sticky';
  }
  toolbar.className = toolbarClass;
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', `${type} toolbar`);

  // Palette Summary (Color Swatches)
  const paletteSummary = document.createElement('div');
  paletteSummary.className = 'floating-toolbar-palette-summary';
  paletteSummary.setAttribute('aria-label', `${colors.length} colors in ${type}`);

  colors.forEach((color, index) => {
    const swatch = document.createElement('div');
    swatch.className = 'floating-toolbar-swatch';
    swatch.style.backgroundColor = color;
    swatch.setAttribute('aria-label', `Color ${index + 1}: ${color}`);
    paletteSummary.appendChild(swatch);
  });

  toolbar.appendChild(paletteSummary);

  // Main Container
  const mainContainer = document.createElement('div');
  mainContainer.className = 'floating-toolbar-main';

  // Action Container
  const actionContainer = document.createElement('div');
  actionContainer.className = 'floating-toolbar-action-container';

  // Palette Section (Text Field + Edit Button OR Palette Summary + Edit Button)
  const paletteSection = document.createElement('div');
  paletteSection.className = 'floating-toolbar-palette-section';

  // For modal variant: show palette summary inline instead of text field
  if (variant === 'in-modal') {
    // Create inline palette summary for modal
    const inlinePaletteSummary = document.createElement('div');
    inlinePaletteSummary.className = 'floating-toolbar-palette-summary';
    inlinePaletteSummary.setAttribute('aria-label', `${colors.length} colors in ${type}`);

    colors.forEach((color, index) => {
      const swatch = document.createElement('div');
      swatch.className = 'floating-toolbar-swatch';
      swatch.style.backgroundColor = color;
      swatch.setAttribute('aria-label', `Color ${index + 1}: ${color}`);
      inlinePaletteSummary.appendChild(swatch);
    });

    paletteSection.appendChild(inlinePaletteSummary);
  } else {
    // For standalone variant: show text field
    const textField = createTextField(name);
    paletteSection.appendChild(textField);
  }

  // Edit Button (only for palette type or if explicitly shown)
  if (showEdit) {
    const editButton = createEditButton(onEdit);
    paletteSection.appendChild(editButton);
  }

  actionContainer.appendChild(paletteSection);

  // Action Buttons Container
  const actionButtons = document.createElement('div');
  actionButtons.className = 'floating-toolbar-action-buttons';

  // Share Button
  const shareButton = createActionButton({
    icon: 'share',
    label: 'Share',
    onClick: onShare || handleShare.bind(null, { name, colors, type }),
  });
  actionButtons.appendChild(shareButton);

  // Download Button
  const downloadButton = createActionButton({
    icon: 'download',
    label: 'Download',
    onClick: onDownload || handleDownload.bind(null, { id, name, colors, type }),
  });
  actionButtons.appendChild(downloadButton);

  // Save to CC Libraries Button
  const saveButton = createActionButton({
    icon: 'save',
    label: 'Save to CC Libraries',
    onClick: onSave || handleSave.bind(null, { id, name, colors, type, tags, author, likes }),
  });
  actionButtons.appendChild(saveButton);

  actionContainer.appendChild(actionButtons);
  mainContainer.appendChild(actionContainer);

  // CTA Button
  const ctaButton = createCTAButton(
    ctaText,
    onCTA || handleOpenInExpress.bind(null, { id, name, colors, type })
  );
  mainContainer.appendChild(ctaButton);

  toolbar.appendChild(mainContainer);

  return toolbar;
}

/**
 * Create Text Field Component
 * @param {string} value - Initial value
 * @returns {HTMLElement}
 */
function createTextField(value) {
  const textField = document.createElement('div');
  textField.className = 'floating-toolbar-text-field';

  const input = document.createElement('div');
  input.className = 'floating-toolbar-text-field-input';

  const textStack = document.createElement('div');
  textStack.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; flex: 1 0 0; min-width: 1px; min-height: 1px; height: 40px; padding: 3px 0;';

  // Label
  const label = document.createElement('p');
  label.className = 'floating-toolbar-text-field-label';
  label.textContent = 'Palette name';
  textStack.appendChild(label);

  // Value (editable input)
  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'floating-toolbar-text-field-value';
  valueInput.value = value;
  valueInput.setAttribute('aria-label', 'Palette name');
  valueInput.style.cssText = 'background: transparent; border: none; outline: none; width: 100%; padding: 0;';
  textStack.appendChild(valueInput);

  input.appendChild(textStack);
  textField.appendChild(input);

  return textField;
}

/**
 * Create Edit Button
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement}
 */
function createEditButton(onClick) {
  const button = document.createElement('button');
  button.className = 'floating-toolbar-edit-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Edit palette');
  
  // Create SVG icon for edit
  const svg = createSVGIcon('edit');
  button.appendChild(svg);

  // Add tooltip
  const tooltip = createTooltip('Edit palette');
  button.appendChild(tooltip);

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  // Show/hide tooltip on hover/focus
  button.addEventListener('mouseenter', () => showTooltip(tooltip));
  button.addEventListener('mouseleave', () => hideTooltip(tooltip));
  button.addEventListener('focus', () => showTooltip(tooltip));
  button.addEventListener('blur', () => hideTooltip(tooltip));

  return button;
}

/**
 * Create Action Button
 * @param {Object} options
 * @param {string} options.icon - Icon name (share, download, save)
 * @param {string} options.label - Aria label
 * @param {Function} options.onClick - Click handler
 * @returns {HTMLElement}
 */
function createActionButton({ icon, label, onClick }) {
  const button = document.createElement('button');
  button.className = 'floating-toolbar-action-button';
  button.type = 'button';
  button.setAttribute('aria-label', label);

  // Create SVG icon
  const svg = createSVGIcon(icon);
  button.appendChild(svg);

  // Add tooltip
  const tooltip = createTooltip(label);
  button.appendChild(tooltip);

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  // Show/hide tooltip on hover/focus
  button.addEventListener('mouseenter', () => showTooltip(tooltip));
  button.addEventListener('mouseleave', () => hideTooltip(tooltip));
  button.addEventListener('focus', () => showTooltip(tooltip));
  button.addEventListener('blur', () => hideTooltip(tooltip));

  return button;
}

/**
 * Create CTA Button
 * @param {string} text - Button text
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement}
 */
function createCTAButton(text, onClick) {
  const button = document.createElement('button');
  button.className = 'floating-toolbar-cta-button';
  button.type = 'button';
  button.textContent = text;

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return button;
}

/**
 * Create SVG Icon - Using Figma Spectrum 2 Icon Assets
 * @param {string} iconName - Icon name (edit, share, download, save)
 * @returns {HTMLElement}
 */
function createSVGIcon(iconName) {
  // Map icon names to Figma Spectrum 2 icon file names
  const iconMap = {
    edit: 'S2_Icon_Edit_20_N.svg',
    share: 'S2_Icon_ShareAndroid_20_N.svg',
    download: 'S2_Icon_Download_20_N.svg',
    save: 'S2_Icon_CCLibrary_20_N.svg',
  };

  const iconFile = iconMap[iconName] || 'S2_Icon_Edit_20_N.svg';
  const iconPath = `/express/code/icons/${iconFile}`;

  // Create wrapper span for the SVG
  const iconWrapper = document.createElement('span');
  iconWrapper.className = 'floating-toolbar-action-button-icon';
  iconWrapper.style.display = 'inline-flex';
  iconWrapper.style.width = '20px';
  iconWrapper.style.height = '20px';
  iconWrapper.setAttribute('aria-hidden', 'true');

  // Create img element to load the SVG
  const img = document.createElement('img');
  img.src = iconPath;
  img.alt = '';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.display = 'block';

  iconWrapper.appendChild(img);

  return iconWrapper;
}

/**
 * REAL API: Handle Share Action
 * Uses Web Share API with fallback
 */
async function handleShare({ name, colors, type }) {
  try {
    if (navigator.share) {
      await navigator.share({
        title: name,
        text: `Check out this ${type}: ${name}`,
        url: window.location.href,
      });
      
      // Screen reader announcement
      announceToScreenReader(`${type} shared successfully`);
    } else {
      // Fallback: Copy URL to clipboard
      await navigator.clipboard.writeText(window.location.href);
      announceToScreenReader('Link copied to clipboard');
      
      // TODO: Show toast notification
      window.lana?.log('Share fallback: URL copied to clipboard');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      window.lana?.log('Share failed:', error);
      announceToScreenReader('Share failed');
    }
  }
}

/**
 * UI ONLY: Handle Download Action
 * Opens download options dropdown
 */
function handleDownload({ id, name, colors, type }) {
  // Check if dropdown already exists
  let dropdown = document.querySelector('.floating-toolbar-download-dropdown');
  
  if (dropdown) {
    // Close existing dropdown
    dropdown.remove();
    announceToScreenReader('Download options closed');
    return;
  }

  // Create dropdown
  dropdown = createDownloadDropdown({ id, name, colors, type });
  
  // Position dropdown (will be positioned via CSS)
  document.body.appendChild(dropdown);
  
  // Close dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeDropdown(e) {
      if (!dropdown.contains(e.target)) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
      }
    });
  }, 0);
  
  window.lana?.log('Download dropdown opened:', { id, name, colors, type });
  announceToScreenReader('Download options opened. Use arrow keys to navigate.');
}

/**
 * Create Download Dropdown Component
 */
function createDownloadDropdown({ id, name, colors, type }) {
  const dropdown = document.createElement('div');
  dropdown.className = 'floating-toolbar-download-dropdown';
  dropdown.setAttribute('role', 'menu');
  dropdown.setAttribute('aria-label', 'Download format options');

  const formats = [
    { id: 'png', label: 'PNG Image', icon: '🖼️' },
    { id: 'svg', label: 'SVG Vector', icon: '📐' },
    { id: 'pdf', label: 'PDF Document', icon: '📄' },
    { id: 'json', label: 'JSON Data', icon: '{ }' },
  ];

  formats.forEach((format, index) => {
    const option = document.createElement('button');
    option.className = 'floating-toolbar-dropdown-option';
    option.type = 'button';
    option.setAttribute('role', 'menuitem');
    option.setAttribute('tabindex', index === 0 ? '0' : '-1');
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'floating-toolbar-dropdown-icon';
    iconSpan.textContent = format.icon;
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'floating-toolbar-dropdown-label';
    labelSpan.textContent = format.label;
    
    option.appendChild(iconSpan);
    option.appendChild(labelSpan);
    
    option.addEventListener('click', () => {
      handleDownloadFormat(format.id, { id, name, colors, type });
      dropdown.remove();
    });
    
    dropdown.appendChild(option);
  });

  // Keyboard navigation
  dropdown.addEventListener('keydown', (e) => {
    const options = Array.from(dropdown.querySelectorAll('.floating-toolbar-dropdown-option'));
    const currentIndex = options.findIndex((opt) => opt === document.activeElement);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % options.length;
      options[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      options[prevIndex].focus();
    } else if (e.key === 'Escape') {
      dropdown.remove();
      announceToScreenReader('Download options closed');
    }
  });

  // Focus first option
  setTimeout(() => {
    const firstOption = dropdown.querySelector('.floating-toolbar-dropdown-option');
    if (firstOption) firstOption.focus();
  }, 100);

  return dropdown;
}

/**
 * Handle Download Format Selection
 */
function handleDownloadFormat(format, data) {
  window.lana?.log(`Download ${format} format:`, data);
  announceToScreenReader(`Downloading as ${format.toUpperCase()}`);
  
  // TODO: Implement actual download logic per format
  // For now, just log and announce
}

/**
 * UI ONLY: Handle Save to CC Libraries (MWPW-187085)
 * Opens libraries drawer
 */
async function handleSave({ id, name, colors, type, tags, author, likes }) {
  // Close existing drawer if open
  if (ccLibrariesDrawerInstance && ccLibrariesDrawerInstance.isOpen) {
    ccLibrariesDrawerInstance.close();
    return;
  }

  // Create new drawer instance (async - loads Spectrum bundle)
  ccLibrariesDrawerInstance = await createCCLibrariesDrawer({
    paletteData: { id, name, colors, type, tags, author, likes },
    type,
    onSave: (formData) => {
      console.log('[Floating Toolbar] Save to CC Libraries (UI only):', formData);
      // TODO: Backend integration in future ticket
      // Announce for screen readers
      if (window.announceScreenReaderMessage) {
        window.announceScreenReaderMessage(`Saved ${name} to ${formData.library}`);
      }
    },
    onClose: () => {
      console.log('[Floating Toolbar] CC Libraries drawer closed');
    },
  });

  // Open the drawer
  ccLibrariesDrawerInstance.open();
  
  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'floating-toolbar-panel-backdrop';
  backdrop.addEventListener('click', closeCCLibrariesPanel);
  document.body.appendChild(backdrop);
  
  // Trigger animation
  setTimeout(() => {
    panel.classList.add('panel-open');
    backdrop.classList.add('backdrop-open');
  }, 10);
  
  window.lana?.log('CC Libraries panel opened:', { id, name, colors, type });
  announceToScreenReader('CC Libraries panel opened. Use Escape to close.');
}

/**
 * Handle Open in Express (CTA Button)
 * Constructs URL with palette/gradient data and navigates to color wheel page
 */
function handleOpenInExpress({ id, name, colors, type }) {
  // Construct Express Color Wheel URL with color data
  const baseUrl = '/express/colors/color-wheel';
  
  // Encode colors as comma-separated hex values (without #)
  const colorParam = colors.map((c) => c.replace('#', '')).join(',');
  
  // Construct query parameters
  const params = new URLSearchParams({
    colors: colorParam,
    name: name || 'My Color Theme',
    type: type || 'palette',
  });
  
  if (id) {
    params.append('id', id);
  }
  
  // Construct full URL
  const expressUrl = `${baseUrl}?${params.toString()}`;
  
  // Log for debugging
  window.lana?.log('Opening in Express:', {
    url: expressUrl,
    data: { id, name, colors, type },
  });
  
  // Announce to screen reader
  announceToScreenReader(`Opening ${name} in Adobe Express`);
  
  // Navigate to Express
  // TODO: Replace with actual navigation when integrated
  window.lana?.log(`Would navigate to: ${expressUrl}`);
  
  // For demo purposes, show alert
  alert(`Would open in Adobe Express:\n\n${expressUrl}\n\nColors: ${colors.join(', ')}`);
  
  // Uncomment when ready for production:
  // window.location.href = expressUrl;
}

/**
 * Screen Reader Announcer
 */
function announceToScreenReader(message) {
  let announcer = document.querySelector('.floating-toolbar-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.className = 'floating-toolbar-announcer visually-hidden';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    document.body.appendChild(announcer);
  }
  
  announcer.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}

/**
 * Create Tooltip
 * @param {string} text - Tooltip text
 * @returns {HTMLElement}
 */
function createTooltip(text) {
  const tooltip = document.createElement('span');
  tooltip.className = 'floating-toolbar-tooltip';
  tooltip.textContent = text;
  tooltip.setAttribute('role', 'tooltip');
  tooltip.setAttribute('aria-hidden', 'true');
  return tooltip;
}

/**
 * Show Tooltip
 * @param {HTMLElement} tooltip
 */
function showTooltip(tooltip) {
  tooltip.classList.add('tooltip-visible');
}

/**
 * Hide Tooltip
 * @param {HTMLElement} tooltip
 */
function hideTooltip(tooltip) {
  tooltip.classList.remove('tooltip-visible');
}

export default createFloatingToolbar;
