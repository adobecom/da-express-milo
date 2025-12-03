/**
 * Plain HTML fetching and repeater expansion
 */

import { state } from './state.js';
import { getLibs } from '../../scripts/utils.js';
import { updatePlaceholder, clearAllHighlights } from './live-update.js';
import { isAuthenticated } from './auth.js';
import { getDoc } from './da-sdk.js';

/**
 * Parse AEM URL and extract DA path components
 * URL format: https://{ref}--{repo}--{owner}.aem.{page|live}/path/to/doc
 * Returns: /{owner}/{repo}/path/to/doc
 * 
 * Example: https://hackathon-q-1--da-express-milo--adobecom.aem.live/drafts/qiyundai/page
 *   -> /adobecom/da-express-milo/drafts/qiyundai/page
 */
export function getDAPath() {
  const { hostname, pathname } = window.location;

  // Check if this is an AEM URL
  if (!hostname.includes('.aem.')) {
    console.warn('Not an AEM URL, falling back to direct fetch');
    return null;
  }

  // Split hostname by '.aem.' and then by '--' to extract parts
  // Format: {ref}--{repo}--{owner}.aem.{page|live}
  const hostParts = hostname.split('.aem.')[0].split('--');
  
  if (hostParts.length < 3) {
    console.warn('Could not parse AEM URL format, falling back to direct fetch');
    return null;
  }

  // hostParts[0] = ref (e.g., "hackathon-q-1")
  // hostParts[1] = repo (e.g., "da-express-milo")
  // hostParts[2] = owner (e.g., "adobecom")
  const repo = hostParts[1];
  const owner = hostParts[2];

  // Remove trailing slash and .html extension from pathname
  const cleanPath = pathname.replace(/\/?(?:\.html)?$/, '');

  return `/${owner}/${repo}${cleanPath}`;
}

/**
 * Show loading overlay with frosted glass effect
 */
function showLoadingOverlay() {
  let overlay = document.querySelector('.daas-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'daas-loading-overlay';
    overlay.innerHTML = `
      <div class="daas-loading-spinner"></div>
      <div class="daas-loading-text">Updating content...</div>
    `;
    document.body.appendChild(overlay);
  }
  // Force reflow before adding class for transition
  overlay.offsetHeight;
  overlay.classList.add('daas-loading-active');
}

/**
 * Hide loading overlay
 */
function hideLoadingOverlay() {
  const overlay = document.querySelector('.daas-loading-overlay');
  if (overlay) {
    overlay.classList.remove('daas-loading-active');
    // Remove from DOM after transition
    setTimeout(() => overlay.remove(), 200);
  }
}

/**
 * Fetch the .plain.html version of the current page
 * Used for live preview/re-rendering during authoring
 */
export async function fetchPlainHtmlForPreview() {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/\/?(?:\.html)?$/, '.plain.html');

  try {
    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`Failed to fetch ${url}`);
    console.log('DaaS: Fetched .plain.html for preview');
    return resp.text();
  } catch (e) {
    console.error('Failed to fetch .plain.html:', e);
    return null;
  }
}

/**
 * Fetch the DA source document via DA SDK
 * Used for page creation - this is the raw source that gets saved back to DA
 */
export async function fetchSourceDoc() {
  const daPath = getDAPath();
  if (!daPath) {
    console.error('DaaS: Cannot determine DA path for source doc fetch');
    return null;
  }

  try {
    const html = await getDoc(daPath);
    if (html) {
      console.log('DaaS: Fetched DA source doc');
      return html;
    }
    console.error('DaaS: getDoc returned empty result');
    return null;
  } catch (e) {
    console.error('DaaS: Failed to fetch DA source doc:', e);
    return null;
  }
}

/**
 * @deprecated Use fetchPlainHtmlForPreview() or fetchSourceDoc() instead
 * Kept for backward compatibility
 */
export async function fetchPlainHtml() {
  // Default to preview behavior for backward compatibility
  return fetchPlainHtmlForPreview();
}

/**
 * Expand repeaters in plain HTML based on current counts
 * Clones rows between [[@repeat(name)]] and [[@repeatend(name)]] delimiters
 */
export function expandRepeatersInHtml(html, counts) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find all blocks that might contain repeaters
  const blocks = doc.querySelectorAll('[class]');

  blocks.forEach((block) => {
    const rows = Array.from(block.children);
    const repeatersInBlock = [];

    // Find repeater delimiters
    rows.forEach((row, idx) => {
      const text = row.textContent.trim();
      const startMatch = text.match(/\[\[@repeat\(([^)]+)\)\]\]/);
      const endMatch = text.match(/\[\[@repeatend\(([^)]+)\)\]\]/);

      if (startMatch) {
        repeatersInBlock.push({ type: 'start', name: startMatch[1], idx, row });
      }
      if (endMatch) {
        const repeater = repeatersInBlock.find((r) => r.name === endMatch[1] && r.type === 'start');
        if (repeater) {
          repeater.endIdx = idx;
          repeater.endRow = row;
        }
      }
    });

    // Process each repeater found in this block
    repeatersInBlock.forEach((repeater) => {
      if (!repeater.endIdx) return;

      const count = counts[repeater.name] || 1;
      const startIdx = repeater.idx;
      const endIdx = repeater.endIdx;

      // Get the template rows (between start and end, exclusive)
      const templateRows = [];
      for (let i = startIdx + 1; i < endIdx; i++) {
        templateRows.push(rows[i]);
      }

      if (templateRows.length === 0) return;

      // Create expanded rows for each item
      const expandedRows = [];
      for (let itemIdx = 0; itemIdx < count; itemIdx++) {
        templateRows.forEach((templateRow) => {
          const clonedRow = templateRow.cloneNode(true);

          // Replace [[name[].field]] with [[name[itemIdx].field]]
          const walker = document.createTreeWalker(clonedRow, NodeFilter.SHOW_TEXT, null, false);
          let node;
          while ((node = walker.nextNode())) {
            node.textContent = node.textContent.replace(
              new RegExp(`\\[\\[${repeater.name}\\[\\]\\.`, 'g'),
              `[[${repeater.name}[${itemIdx}].`,
            );
          }

          // Also check attributes (like alt)
          clonedRow.querySelectorAll('*').forEach((el) => {
            Array.from(el.attributes).forEach((attr) => {
              if (attr.value.includes(`[[${repeater.name}[].`)) {
                el.setAttribute(
                  attr.name,
                  attr.value.replace(
                    new RegExp(`\\[\\[${repeater.name}\\[\\]\\.`, 'g'),
                    `[[${repeater.name}[${itemIdx}].`,
                  ),
                );
              }
            });
          });

          expandedRows.push(clonedRow);
        });
      }

      // Replace original template rows with expanded rows
      expandedRows.forEach((expandedRow) => {
        repeater.endRow.parentNode.insertBefore(expandedRow, repeater.endRow);
      });

      // Remove original template rows
      templateRows.forEach((row) => row.remove());
    });
  });

  return doc.body.innerHTML;
}

/**
 * Apply saved form data to DOM placeholders after re-render
 * This pushes the values back to the live preview elements
 * 
 * Note: After expandRepeatersInHtml, placeholders are indexed (e.g., [[faq[0].question]])
 * so we need to use the indexed key, not the base key
 * 
 * Uses the full updatePlaceholder function from live-update.js to handle all edge cases
 * including partial placeholders, URLs, and both block and free text instances.
 */
function applyFormDataToPlaceholders(formData, schema) {
  if (!formData || !schema?.fields) return;

  // Build a map of base keys to their types
  const fieldTypeMap = {};
  schema.fields.forEach((field) => {
    fieldTypeMap[field.key] = field.type || 'text';
  });

  console.log('DaaS: Applying form data to placeholders:', Object.keys(formData));

  // Apply each saved value to its placeholder
  Object.entries(formData).forEach(([key, value]) => {
    // Skip image data objects (they have dataUrl property)
    if (typeof value === 'object' && value?.dataUrl) return;

    // Get the base key for looking up field type
    const baseKey = key.replace(/\[\d+\]/, '[]');
    const fieldType = fieldTypeMap[baseKey] || 'text';

    // For arrays (multi-select), join to string
    const displayValue = Array.isArray(value) ? value.join(', ') : value;

    // Update the placeholder in the DOM using the INDEXED key (e.g., faq[0].question)
    // Use the full updatePlaceholder function to handle all cases (block, free text, partial)
    if (displayValue) {
      console.log(`DaaS: Updating placeholder [[${key}]] with value:`, displayValue.substring(0, 50) + (displayValue.length > 50 ? '...' : ''));
      updatePlaceholder(key, displayValue, fieldType);
    }
  });
}

/**
 * Re-render the page with updated repeater counts
 */
export async function rerenderWithRepeaters(formContainer, schema, callbacks) {
  const {
    getFormData, createPanel, buildForm, initPanelEvents, restoreFormData, showToast,
  } = callbacks;

  if (!state.cachedPlainHtml) {
    console.error('No cached plain HTML available');
    return;
  }

  // Prevent re-renders while one is already in progress
  if (state.isRerendering) {
    console.log('DaaS: Skipping re-render (already in progress)');
    return;
  }

  state.isRerendering = true;

  // Clear any existing highlights before re-render
  clearAllHighlights();

  // Show loading overlay to mask the rebuild flickering
  showLoadingOverlay();

  try {
    // Save current form data
    const formData = getFormData(formContainer);

    // Get the panel element - we'll preserve it and only rebuild the form inside
    const panel = document.getElementById('daas-authoring-panel');
    const wasCollapsed = panel?.classList.contains('daas-panel-collapsed');

    // Expand repeaters in the cached HTML
    const expandedHtml = expandRepeatersInHtml(state.cachedPlainHtml, state.repeaterCounts);

    // Parse the expanded HTML
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(expandedHtml, 'text/html');

    // Replace only the main content (panel is outside main, so it's preserved)
    const main = document.querySelector('main');
    const newMain = newDoc.querySelector('main') || newDoc.body;

    if (main && newMain) {
      main.innerHTML = newMain.innerHTML;
    } else {
      // Fallback: need to preserve panel before replacing body
      panel?.remove();
      document.body.innerHTML = expandedHtml;
      if (panel) document.body.appendChild(panel);
    }

    // Re-run DaaS pre-decoration
    const { default: decorateDaas } = await import('../../library/template-schema/assets/decorate.js');
    await decorateDaas(document);

    // Re-run page decoration
    const miloLibs = getLibs();
    try {
      const { loadArea } = await import(`${miloLibs}/utils/utils.js`);
      await loadArea(document.querySelector('main'));
    } catch (e) {
      console.warn('Could not load milo utils, attempting manual block decoration:', e);
      const blocks = document.querySelectorAll('[class]:not(.template-schema)');
      for (const block of blocks) {
        const blockName = block.classList[0];
        if (blockName && block.dataset.blockStatus !== 'loaded') {
          try {
            const { default: decorateBlock } = await import(`/express/code/blocks/${blockName}/${blockName}.js`);
            await decorateBlock(block);
            block.dataset.blockStatus = 'loaded';
          } catch (err) {
            // Block might not have a decorator
          }
        }
      }
    }

    // Reuse existing panel - just rebuild the form content inside it
    const existingPanel = document.getElementById('daas-authoring-panel');
    const existingFormContainer = existingPanel?.querySelector('.daas-form-container');

    if (existingPanel && existingFormContainer) {
      // Rebuild form inside existing panel (preserves panel state/position)
      buildForm(schema, existingFormContainer);
      initPanelEvents(existingPanel, existingFormContainer, schema);

      // Restore form data
      state.isRestoringData = true;
      try {
        restoreFormData(existingFormContainer, formData);
        applyFormDataToPlaceholders(formData, schema);
      } finally {
        setTimeout(() => {
          state.isRestoringData = false;
          console.log('DaaS: Data restoration complete, re-render unlocked');
        }, 700);
      }

      // Restore collapsed state if it was collapsed
      if (wasCollapsed) {
        existingPanel.classList.add('daas-panel-collapsed');
        document.body.classList.add('daas-panel-minimized');
      }
    } else {
      // Fallback: create new panel if it doesn't exist
      document.body.classList.add('daas-panel-active');
      const newPanel = createPanel(isAuthenticated());
      document.body.appendChild(newPanel);

      const newFormContainer = newPanel.querySelector('.daas-form-container');
      buildForm(schema, newFormContainer);
      initPanelEvents(newPanel, newFormContainer, schema);

      state.isRestoringData = true;
      try {
        restoreFormData(newFormContainer, formData);
        applyFormDataToPlaceholders(formData, schema);
      } finally {
        setTimeout(() => {
          state.isRestoringData = false;
          console.log('DaaS: Data restoration complete, re-render unlocked');
        }, 700);
      }

      requestAnimationFrame(() => newPanel.classList.add('daas-panel-open'));
    }

    showToast('Content updated!');
  } finally {
    // Always hide loading overlay and clear re-rendering flag
    hideLoadingOverlay();
    state.isRerendering = false;
  }
}

