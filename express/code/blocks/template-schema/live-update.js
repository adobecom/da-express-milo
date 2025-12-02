/**
 * Live update functionality - placeholder updates on the page
 */

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

    const handler = () => {
      // Use the ACTUAL key from input (e.g., faq[0].question) for DOM update
      const actualKey = input.name;
      // Use base key only for schema lookup
      const baseKey = input.name.replace(/\[\d+\]/, '[]');
      const field = schemaFields.find((f) => f.key === baseKey);
      updatePlaceholder(actualKey, input.value, field?.type);
    };

    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
  });

  // Rich text editors (Quill)
  container.querySelectorAll('.daas-rte-container').forEach((rteContainer) => {
    const hiddenInput = rteContainer.querySelector('.daas-rte-value');
    if (!hiddenInput?.name) return;

    const attachQuillListener = () => {
      if (rteContainer.quillInstance) {
        rteContainer.quillInstance.on('text-change', () => {
          // Use the ACTUAL key from input for DOM update
          const actualKey = hiddenInput.name;
          const html = rteContainer.quillInstance.root.innerHTML;
          hiddenInput.value = html;
          updatePlaceholder(actualKey, html, 'richtext');
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
  container.querySelectorAll('.daas-multiselect-options').forEach((optionsPanel) => {
    optionsPanel.addEventListener('change', () => {
      const hiddenInput = optionsPanel.closest('.daas-field').querySelector('.daas-multiselect-value');
      if (hiddenInput?.name) {
        // Use the ACTUAL key from input for DOM update
        const actualKey = hiddenInput.name;
        updatePlaceholder(actualKey, hiddenInput.value);
      }
    });
  });
}

