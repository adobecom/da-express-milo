/**
 * Plain HTML fetching and repeater expansion
 */

import { state } from './state.js';
import { getLibs } from '../../scripts/utils.js';

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
 */
export async function fetchPlainHtml() {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/\/?(?:\.html)?$/, '.plain.html');

  try {
    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`Failed to fetch ${url}`);
    return resp.text();
  } catch (e) {
    console.error('Failed to fetch plain HTML:', e);
    return null;
  }
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

  // Show loading overlay to mask the rebuild flickering
  showLoadingOverlay();

  try {
    // Save current form data
    const formData = getFormData(formContainer);

    // Get the panel element before we modify anything
    const panel = document.getElementById('daas-authoring-panel');

    // Expand repeaters in the cached HTML
    const expandedHtml = expandRepeatersInHtml(state.cachedPlainHtml, state.repeaterCounts);

    // Remove the panel temporarily
    panel?.remove();

    // Parse the expanded HTML
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(expandedHtml, 'text/html');

    // Replace the main content
    const main = document.querySelector('main');
    const newMain = newDoc.querySelector('main') || newDoc.body;

    if (main && newMain) {
      main.innerHTML = newMain.innerHTML;
    } else {
      document.body.innerHTML = expandedHtml;
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

    // Recreate the panel
    document.body.classList.add('daas-panel-active');
    const newPanel = createPanel();
    document.body.appendChild(newPanel);

    const newFormContainer = newPanel.querySelector('.daas-form-container');
    buildForm(schema, newFormContainer);
    initPanelEvents(newPanel, newFormContainer, schema);

    // Restore form data
    restoreFormData(newFormContainer, formData);

    // Show panel
    requestAnimationFrame(() => newPanel.classList.add('daas-panel-open'));

    showToast('Repeater updated!');
  } finally {
    // Always hide loading overlay
    hideLoadingOverlay();
  }
}

