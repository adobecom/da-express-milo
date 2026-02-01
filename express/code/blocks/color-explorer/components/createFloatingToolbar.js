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

// Dynamic CSS loading
let toolbarStylesLoaded = false;

async function loadToolbarStyles() {
  if (toolbarStylesLoaded) return;
  
  try {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/express/code/blocks/color-explorer/components/floating-toolbar.css';
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
  toolbar.className = 'floating-toolbar';
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

  // Palette Section (Text Field + Edit Button)
  const paletteSection = document.createElement('div');
  paletteSection.className = 'floating-toolbar-palette-section';

  // Text Field
  const textField = createTextField(name);
  paletteSection.appendChild(textField);

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
    onClick: onSave || handleSave.bind(null, { id, name, colors, type }),
  });
  actionButtons.appendChild(saveButton);

  actionContainer.appendChild(actionButtons);
  mainContainer.appendChild(actionContainer);

  // CTA Button
  const ctaButton = createCTAButton(ctaText, onCTA);
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

  if (onClick) {
    button.addEventListener('click', onClick);
  }

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

  if (onClick) {
    button.addEventListener('click', onClick);
  }

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
 * Create SVG Icon
 * @param {string} iconName - Icon name (edit, share, download, save)
 * @returns {SVGElement}
 */
function createSVGIcon(iconName) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('fill', 'currentColor');
  svg.classList.add('floating-toolbar-action-button-icon');

  let path = '';

  switch (iconName) {
    case 'edit':
      // Edit/Pencil icon path (S2_Icon_Edit_20_N)
      path = 'M16.7,3.3c-0.4-0.4-1-0.4-1.4,0l-1.1,1.1l2.8,2.8l1.1-1.1c0.4-0.4,0.4-1,0-1.4L16.7,3.3z M13.5,5.1L3.3,15.3 C3.1,15.5,3,15.7,3,16v2c0,0.6,0.4,1,1,1h2c0.3,0,0.5-0.1,0.7-0.3l10.2-10.2L13.5,5.1z';
      break;
    case 'share':
      // Share icon path (S2_Icon_ShareAndroid_20_N)
      path = 'M15.5,13c-0.9,0-1.7,0.4-2.2,1l-5.5-3.2c0.1-0.3,0.2-0.5,0.2-0.8s-0.1-0.5-0.2-0.8l5.5-3.2c0.5,0.6,1.3,1,2.2,1 c1.7,0,3-1.3,3-3s-1.3-3-3-3s-3,1.3-3,3c0,0.3,0.1,0.5,0.2,0.8L7.2,7c-0.5-0.6-1.3-1-2.2-1c-1.7,0-3,1.3-3,3s1.3,3,3,3 c0.9,0,1.7-0.4,2.2-1l5.5,3.2c-0.1,0.3-0.2,0.5-0.2,0.8c0,1.7,1.3,3,3,3s3-1.3,3-3S17.2,13,15.5,13z';
      break;
    case 'download':
      // Download icon path (S2_Icon_Download_20_N)
      path = 'M17,11v5c0,0.6-0.4,1-1,1H4c-0.6,0-1-0.4-1-1v-5c0-0.6-0.4-1-1-1s-1,0.4-1,1v5c0,1.7,1.3,3,3,3h12c1.7,0,3-1.3,3-3v-5 c0-0.6-0.4-1-1-1S17,10.4,17,11z M10.7,11.7l3-3c0.4-0.4,0.4-1,0-1.4s-1-0.4-1.4,0L11,8.6V2c0-0.6-0.4-1-1-1S9,1.4,9,2v6.6 L7.7,7.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l3,3C9.5,11.9,9.7,12,10,12S10.5,11.9,10.7,11.7z';
      break;
    case 'save':
      // CC Library/Bookmark icon path (S2_Icon_CCLibrary_20_N)
      path = 'M15,2H5C3.9,2,3,2.9,3,4v14c0,0.4,0.2,0.7,0.6,0.9C3.7,18.9,3.9,19,4,19c0.2,0,0.4-0.1,0.6-0.2l5.4-3.6l5.4,3.6 C15.6,18.9,15.8,19,16,19s0.3-0.1,0.4-0.1C16.8,18.7,17,18.4,17,18V4C17,2.9,16.1,2,15,2z M15,16.2l-4.4-2.9C10.4,13.1,10.2,13,10,13 s-0.4,0.1-0.6,0.2L5,16.2V4h10V16.2z';
      break;
    default:
      // Default circle icon
      path = 'M10,2c4.4,0,8,3.6,8,8s-3.6,8-8,8s-8-3.6-8-8S5.6,2,10,2z';
  }

  const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathElement.setAttribute('d', path);
  pathElement.setAttribute('fill', '#292929');
  svg.appendChild(pathElement);

  return svg;
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
 * Opens download options drawer/dropdown
 */
function handleDownload({ id, name, colors, type }) {
  // TODO: Open download options drawer
  // - PNG
  // - SVG
  // - PDF
  // - JSON
  window.lana?.log('Download clicked:', { id, name, colors, type });
  announceToScreenReader('Download options opened');
}

/**
 * UI ONLY: Handle Save to CC Libraries
 * Opens libraries panel
 */
function handleSave({ id, name, colors, type }) {
  // TODO: Open CC Libraries panel
  window.lana?.log('Save to CC Libraries clicked:', { id, name, colors, type });
  announceToScreenReader('CC Libraries panel opened');
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

export default createFloatingToolbar;
