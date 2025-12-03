/**
 * Live update functionality - placeholder updates on the page
 *
 * Two update mechanisms:
 * 1. Free text (outside blocks): onInput → instant DOM update
 * 2. Block placeholders (inside blocks): onChange → full page re-render
 *
 * A "block" is an element with a class (like hero-marquee, accordion) at the
 * standard nesting level inside main.
 */

import { state } from './state.js';

const HIGHLIGHT_CLASS = 'daas-placeholder-highlight';

// Callback for block field changes that require re-render
let onBlockFieldChange = null;

/**
 * Set the callback for block field changes
 * This should be called by template-schema.js to provide the re-render function
 */
export function setBlockFieldChangeCallback(callback) {
  onBlockFieldChange = callback;
}

/**
 * Check if a placeholder key corresponds to a field inside a block
 * by examining the cached plain HTML structure
 *
 * @param {string} key - The placeholder key (e.g., "hero.title", "faq[].question")
 * @returns {boolean} - True if the placeholder is inside a block
 */
export function isFieldInBlock(key) {
  if (!state.cachedPlainHtml) return false;

  const placeholderText = `[[${key}]]`;
  const baseKey = key.replace(/\[\d+\]/, '[]');
  const basePlaceholderText = `[[${baseKey}]]`;

  // Parse the cached plain HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(state.cachedPlainHtml, 'text/html');

  // Search for the placeholder in text nodes
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
  let node;

  while ((node = walker.nextNode())) {
    if (node.textContent.includes(placeholderText) || node.textContent.includes(basePlaceholderText)) {
      // Found the placeholder, check if it's inside a block
      const parent = node.parentElement;
      if (!parent) continue;

      // Find the nearest ancestor with a class (that's a block)
      // Blocks are direct children of wrapper divs, which are direct children of body
      // Structure: body > div (wrapper) > div.block-name (block)
      let current = parent;
      while (current && current !== doc.body) {
        if (current.classList && current.classList.length > 0) {
          // Found a block - exclude template-schema itself
          const className = current.classList[0];
          if (className !== 'template-schema') {
            return true; // It's inside a block
          }
        }
        current = current.parentElement;
      }
    }
  }

  // Also check href and alt attributes
  const links = doc.querySelectorAll('a[href]');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (href.includes(placeholderText) || href.includes(basePlaceholderText)
        || href.includes(encodeURIComponent(placeholderText))
        || href.includes(encodeURIComponent(basePlaceholderText))) {
      // Check if this link is inside a block
      let current = link;
      while (current && current !== doc.body) {
        if (current.classList && current.classList.length > 0) {
          const className = current.classList[0];
          if (className !== 'template-schema') {
            return true;
          }
        }
        current = current.parentElement;
      }
    }
  }

  const images = doc.querySelectorAll('img[alt]');
  for (const img of images) {
    if (img.alt.includes(placeholderText) || img.alt.includes(basePlaceholderText)) {
      let current = img;
      while (current && current !== doc.body) {
        if (current.classList && current.classList.length > 0) {
          const className = current.classList[0];
          if (className !== 'template-schema') {
            return true;
          }
        }
        current = current.parentElement;
      }
    }
  }

  return false; // Not inside a block = free text
}

/**
 * Find placeholder elements for a given key (handles both indexed and base keys)
 */
function findPlaceholderElements(key) {
  const elements = [];
  const isIndexZero = /\[0\]/.test(key);
  const baseKey = isIndexZero ? key.replace(/\[0\]/, '[]') : null;

  // Check data attributes
  const byDataAttr = document.querySelectorAll(`[data-daas-placeholder="${key}"]`);
  elements.push(...byDataAttr);

  if (baseKey) {
    const byBaseDataAttr = document.querySelectorAll(`[data-daas-placeholder="${baseKey}"]`);
    elements.push(...byBaseDataAttr);
  }

  // Check partial data attributes
  const byPartialAttr = document.querySelectorAll(`[data-daas-placeholder-partial="${key}"]`);
  elements.push(...byPartialAttr);

  if (baseKey) {
    const byBasePartialAttr = document.querySelectorAll(`[data-daas-placeholder-partial="${baseKey}"]`);
    elements.push(...byBasePartialAttr);
  }

  // Check href keys for URL fields
  const byHrefKey = document.querySelectorAll(`a[data-daas-href-key="${key}"]`);
  elements.push(...byHrefKey);

  if (baseKey) {
    const byBaseHrefKey = document.querySelectorAll(`a[data-daas-href-key="${baseKey}"]`);
    elements.push(...byBaseHrefKey);
  }

  // Check image alt attributes
  const byAlt = document.querySelectorAll(`img[alt="${key}"], img[alt="[[${key}]]"]`);
  elements.push(...byAlt);

  if (baseKey) {
    const byBaseAlt = document.querySelectorAll(`img[alt="${baseKey}"], img[alt="[[${baseKey}]]"]`);
    elements.push(...byBaseAlt);
  }

  return [...new Set(elements)]; // Remove duplicates
}

/**
 * Highlight placeholder element and scroll it into view
 */
function highlightPlaceholder(key) {
  const elements = findPlaceholderElements(key);

  elements.forEach((el) => {
    el.classList.add(HIGHLIGHT_CLASS);
  });

  // Scroll the first element into view
  if (elements.length > 0) {
    const firstEl = elements[0];
    const rect = firstEl.getBoundingClientRect();
    const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;

    if (!isInView) {
      firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

/**
 * Remove highlight from all placeholder elements
 */
function unhighlightPlaceholder(key) {
  const elements = findPlaceholderElements(key);
  elements.forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS);
  });
}

/**
 * Remove all placeholder highlights (cleanup)
 */
export function clearAllHighlights() {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS);
  });
}

/**
 * Update placeholder on the page with new value (live preview)
 * Handles text content, href attributes (including URL-encoded), and alt attributes
 * For richtext fields, uses innerHTML to render HTML content
 * 
 * Supports both indexed keys (faq[0].question) and base keys (faq[].question):
 * - First tries the exact key
 * - For index 0, also tries the base key as fallback (before repeater expansion)
 */
export function updatePlaceholder(key, value, fieldType = 'text') {
  const placeholderText = `[[${key}]]`;
  const encodedPlaceholder = encodeURIComponent(placeholderText);
  const isRichText = fieldType === 'richtext';

  // For index 0 keys, also prepare the base key fallback
  // e.g., faq[0].question → faq[].question (initial DOM state before expansion)
  const isIndexZero = /\[0\]/.test(key);
  const baseKey = isIndexZero ? key.replace(/\[0\]/, '[]') : null;
  const basePlaceholderText = baseKey ? `[[${baseKey}]]` : null;
  const baseEncodedPlaceholder = baseKey ? encodeURIComponent(basePlaceholderText) : null;

  // For URL type fields, update href attributes
  if (fieldType === 'url') {
    // Check for already-marked links
    let markedLinks = document.querySelectorAll(`a[data-daas-href-key="${key}"]`);
    if (markedLinks.length === 0 && baseKey) {
      markedLinks = document.querySelectorAll(`a[data-daas-href-key="${baseKey}"]`);
    }
    if (markedLinks.length > 0) {
      markedLinks.forEach((link) => {
        link.dataset.daasHrefKey = key; // Update to indexed key for future lookups
        link.setAttribute('href', value || '');
      });
      return;
    }

    // Search for placeholder in href
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      const matchesIndexed = href.includes(placeholderText) || href.includes(encodedPlaceholder);
      const matchesBase = baseKey && (href.includes(basePlaceholderText) || href.includes(baseEncodedPlaceholder));

      if (matchesIndexed || matchesBase) {
        link.dataset.daasHrefKey = key; // Mark with indexed key
        link.setAttribute('href', value || '');
      }
    });
    return;
  }

  // Try data attribute approach (from decorate.js preprocessing)
  // Check indexed key first, then base key as fallback
  let elements = document.querySelectorAll(`[data-daas-placeholder="${key}"]`);
  if (elements.length === 0 && baseKey) {
    elements = document.querySelectorAll(`[data-daas-placeholder="${baseKey}"]`);
  }
  if (elements.length > 0) {
    elements.forEach((el) => {
      el.dataset.daasPlaceholder = key; // Update to indexed key for future lookups
      const newValue = value || placeholderText;
      if (isRichText) {
        el.innerHTML = newValue;
      } else {
        const textNode = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
        if (textNode) {
          textNode.textContent = newValue;
        } else {
          el.insertBefore(document.createTextNode(newValue), el.firstChild);
        }
      }
    });
    return;
  }

  // Partial placeholders (placeholder is part of larger text)
  let partialElements = document.querySelectorAll(`[data-daas-placeholder-partial="${key}"]`);
  if (partialElements.length === 0 && baseKey) {
    partialElements = document.querySelectorAll(`[data-daas-placeholder-partial="${baseKey}"]`);
  }
  if (partialElements.length > 0) {
    partialElements.forEach((el) => {
      el.dataset.daasPlaceholderPartial = key; // Update to indexed key
      if (!el.dataset.daasOriginalText) {
        const textNode = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
        el.dataset.daasOriginalText = textNode?.textContent || el.textContent;
      }
      const original = el.dataset.daasOriginalText;
      // Try replacing indexed placeholder first, then base placeholder
      let newText = original.replace(placeholderText, value || placeholderText);
      if (basePlaceholderText && newText === original) {
        newText = original.replace(basePlaceholderText, value || placeholderText);
      }

      if (isRichText) {
        el.innerHTML = newText;
      } else {
        const textNode = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = newText;
      }
    });
    return;
  }

  // Fallback: search for [[key]] in text nodes and mark parent for future
  // Check both indexed placeholder and base placeholder (for index 0)
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

  let node;
  const nodesToUpdate = [];
  while ((node = walker.nextNode())) {
    const hasIndexed = node.textContent.includes(placeholderText);
    const hasBase = basePlaceholderText && node.textContent.includes(basePlaceholderText);
    if (hasIndexed || hasBase) {
      nodesToUpdate.push({ node, hasIndexed, hasBase });
    }
  }

  nodesToUpdate.forEach(({ node: textNode, hasIndexed, hasBase }) => {
    const parent = textNode.parentElement;
    if (!parent) return;

    // Determine which placeholder to replace
    const targetPlaceholder = hasIndexed ? placeholderText : basePlaceholderText;
    const isPartial = textNode.textContent.trim() !== targetPlaceholder;

    if (isPartial) {
      parent.dataset.daasPlaceholderPartial = key; // Use indexed key
      parent.dataset.daasOriginalText = textNode.textContent;
    } else {
      parent.dataset.daasPlaceholder = key; // Use indexed key
    }

    textNode.textContent = textNode.textContent.replace(targetPlaceholder, value || placeholderText);
  });
}

/**
 * Get current placeholder value from page
 */
export function getPlaceholderValue(key) {
  const el = document.querySelector(`[data-daas-placeholder="${key}"]`);
  if (el) {
    const content = el.textContent || '';
    if (content.includes('[[') && content.includes(']]')) return '';
    return content;
  }
  return '';
}

/**
 * Attach live update listeners to form inputs
 *
 * Two update strategies:
 * 1. Free text fields: onInput → instant DOM update (updatePlaceholder)
 * 2. Block fields: onChange → full page re-render (via onBlockFieldChange callback)
 *
 * IMPORTANT: After repeater expansion, DOM placeholders use indexed keys (e.g., [[faq[0].question]])
 * So we must use the actual indexed key from input.name, not convert to base key.
 * The base key is only used for looking up field type from schema.
 */
export function attachLiveUpdateListeners(container, formContainer) {
  const schemaFields = JSON.parse(formContainer?.dataset?.schemaFields || '[]');

  // Cache block field detection results to avoid repeated parsing
  const blockFieldCache = new Map();
  const isInBlock = (key) => {
    const baseKey = key.replace(/\[\d+\]/, '[]');
    if (!blockFieldCache.has(baseKey)) {
      blockFieldCache.set(baseKey, isFieldInBlock(baseKey));
    }
    return blockFieldCache.get(baseKey);
  };

  // Regular inputs
  container.querySelectorAll('.daas-input').forEach((input) => {
    if (!input.name) return;

    const actualKey = input.name;
    const baseKey = input.name.replace(/\[\d+\]/, '[]');
    const field = schemaFields.find((f) => f.key === baseKey);
    const inBlock = isInBlock(actualKey);

    if (inBlock) {
      // Block field: onChange triggers re-render
      input.addEventListener('change', () => {
        console.log(`DaaS: Block field "${actualKey}" changed, triggering re-render`);
        if (onBlockFieldChange) {
          onBlockFieldChange();
        }
      });
    } else {
      // Free text field: onInput for instant update
      const handler = () => {
        updatePlaceholder(actualKey, input.value, field?.type);
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    }

    // Highlight on focus (both types)
    input.addEventListener('focus', () => highlightPlaceholder(actualKey));
    input.addEventListener('blur', () => unhighlightPlaceholder(actualKey));
  });

  // Rich text editors (Quill)
  container.querySelectorAll('.daas-rte-container').forEach((rteContainer) => {
    const hiddenInput = rteContainer.querySelector('.daas-rte-value');
    if (!hiddenInput?.name) return;

    const actualKey = hiddenInput.name;
    const inBlock = isInBlock(actualKey);

    const attachQuillListener = () => {
      if (rteContainer.quillInstance) {
        if (inBlock) {
          // Block field: debounced re-render on text change
          let debounceTimer = null;
          rteContainer.quillInstance.on('text-change', () => {
            const html = rteContainer.quillInstance.root.innerHTML;
            hiddenInput.value = html;

            // Debounce re-render (wait for user to stop typing)
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              console.log(`DaaS: Block RTE field "${actualKey}" changed, triggering re-render`);
              if (onBlockFieldChange) {
                onBlockFieldChange();
              }
            }, 500);
          });
        } else {
          // Free text field: instant update
          rteContainer.quillInstance.on('text-change', () => {
            const html = rteContainer.quillInstance.root.innerHTML;
            hiddenInput.value = html;
            updatePlaceholder(actualKey, html, 'richtext');
          });
        }

        // Highlight on focus/blur (both types)
        rteContainer.quillInstance.on('selection-change', (range) => {
          if (range) {
            highlightPlaceholder(actualKey);
          } else {
            unhighlightPlaceholder(actualKey);
          }
        });
      }
    };

    if (rteContainer.quillInstance) {
      attachQuillListener();
    } else {
      const checkQuill = setInterval(() => {
        if (rteContainer.quillInstance) {
          attachQuillListener();
          clearInterval(checkQuill);
        }
      }, 100);
      setTimeout(() => clearInterval(checkQuill), 5000);
    }
  });

  // Multi-select
  container.querySelectorAll('.daas-multiselect').forEach((multiselect) => {
    const hiddenInput = multiselect.querySelector('.daas-multiselect-value');
    const optionsPanel = multiselect.querySelector('.daas-multiselect-options');
    const display = multiselect.querySelector('.daas-multiselect-display');

    if (!hiddenInput?.name) return;

    const actualKey = hiddenInput.name;
    const inBlock = isInBlock(actualKey);

    optionsPanel?.addEventListener('change', () => {
      if (inBlock) {
        console.log(`DaaS: Block multi-select "${actualKey}" changed, triggering re-render`);
        if (onBlockFieldChange) {
          onBlockFieldChange();
        }
      } else {
        updatePlaceholder(actualKey, hiddenInput.value);
      }
    });

    // Highlight when dropdown is opened (display clicked)
    display?.addEventListener('click', () => {
      highlightPlaceholder(actualKey);
    });

    // Unhighlight when clicking outside
    document.addEventListener('click', (e) => {
      if (!multiselect.contains(e.target)) {
        unhighlightPlaceholder(actualKey);
      }
    });
  });

  // Image dropzones - always use re-render (images are typically in blocks)
  container.querySelectorAll('.daas-dropzone').forEach((dropzone) => {
    const key = dropzone.closest('.daas-field-image')?.dataset?.key;
    if (!key) return;

    // Images always trigger re-render on change (handled by form-fields.js handleImageFile)
    // Just handle highlighting here
    dropzone.addEventListener('mouseenter', () => highlightPlaceholder(key));
    dropzone.addEventListener('mouseleave', () => unhighlightPlaceholder(key));
    dropzone.addEventListener('dragenter', () => highlightPlaceholder(key));
    dropzone.addEventListener('dragleave', () => unhighlightPlaceholder(key));
  });
}

