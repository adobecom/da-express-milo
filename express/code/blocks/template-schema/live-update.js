/**
 * Live update functionality - placeholder updates on the page
 */

const HIGHLIGHT_CLASS = 'daas-placeholder-highlight';

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
 * IMPORTANT: After repeater expansion, DOM placeholders use indexed keys (e.g., [[faq[0].question]])
 * So we must use the actual indexed key from input.name, not convert to base key.
 * The base key is only used for looking up field type from schema.
 */
export function attachLiveUpdateListeners(container, formContainer) {
  const schemaFields = JSON.parse(formContainer?.dataset?.schemaFields || '[]');

  // Regular inputs
  container.querySelectorAll('.daas-input').forEach((input) => {
    if (!input.name) return;

    const actualKey = input.name;

    const handler = () => {
      // Use the ACTUAL key from input (e.g., faq[0].question) for DOM update
      // Use base key only for schema lookup
      const baseKey = input.name.replace(/\[\d+\]/, '[]');
      const field = schemaFields.find((f) => f.key === baseKey);
      updatePlaceholder(actualKey, input.value, field?.type);
    };

    input.addEventListener('input', handler);
    input.addEventListener('change', handler);

    // Highlight on focus
    input.addEventListener('focus', () => highlightPlaceholder(actualKey));
    input.addEventListener('blur', () => unhighlightPlaceholder(actualKey));
  });

  // Rich text editors (Quill)
  container.querySelectorAll('.daas-rte-container').forEach((rteContainer) => {
    const hiddenInput = rteContainer.querySelector('.daas-rte-value');
    if (!hiddenInput?.name) return;

    const actualKey = hiddenInput.name;

    const attachQuillListener = () => {
      if (rteContainer.quillInstance) {
        rteContainer.quillInstance.on('text-change', () => {
          const html = rteContainer.quillInstance.root.innerHTML;
          hiddenInput.value = html;
          updatePlaceholder(actualKey, html, 'richtext');
        });

        // Highlight on focus/blur
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

    optionsPanel?.addEventListener('change', () => {
      updatePlaceholder(actualKey, hiddenInput.value);
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

  // Image dropzones
  container.querySelectorAll('.daas-dropzone').forEach((dropzone) => {
    const key = dropzone.closest('.daas-field-image')?.dataset?.key;
    if (!key) return;

    dropzone.addEventListener('mouseenter', () => highlightPlaceholder(key));
    dropzone.addEventListener('mouseleave', () => unhighlightPlaceholder(key));
    dropzone.addEventListener('dragenter', () => highlightPlaceholder(key));
    dropzone.addEventListener('dragleave', () => unhighlightPlaceholder(key));
  });
}

