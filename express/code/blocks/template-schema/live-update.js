/**
 * Live update functionality - placeholder updates on the page
 */

/**
 * Update placeholder on the page with new value (live preview)
 * Handles text content, href attributes (including URL-encoded), and alt attributes
 * For richtext fields, uses innerHTML to render HTML content
 */
export function updatePlaceholder(key, value, fieldType = 'text') {
  const placeholderText = `[[${key}]]`;
  const encodedPlaceholder = encodeURIComponent(placeholderText);
  const isRichText = fieldType === 'richtext';

  // For URL type fields, update href attributes
  if (fieldType === 'url') {
    const markedLinks = document.querySelectorAll(`a[data-daas-href-key="${key}"]`);
    if (markedLinks.length > 0) {
      markedLinks.forEach((link) => {
        link.setAttribute('href', value || '');
      });
      return;
    }

    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href.includes(placeholderText) || href.includes(encodedPlaceholder)) {
        link.dataset.daasHrefKey = key;
        link.setAttribute('href', value || '');
      }
    });
    return;
  }

  // Try data attribute approach (from decorate.js preprocessing)
  const elements = document.querySelectorAll(`[data-daas-placeholder="${key}"]`);
  if (elements.length > 0) {
    elements.forEach((el) => {
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
  const partialElements = document.querySelectorAll(`[data-daas-placeholder-partial="${key}"]`);
  if (partialElements.length > 0) {
    partialElements.forEach((el) => {
      if (!el.dataset.daasOriginalText) {
        const textNode = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
        el.dataset.daasOriginalText = textNode?.textContent || el.textContent;
      }
      const original = el.dataset.daasOriginalText;
      const newText = original.replace(placeholderText, value || placeholderText);

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
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

  let node;
  const nodesToUpdate = [];
  while ((node = walker.nextNode())) {
    if (node.textContent.includes(placeholderText)) {
      nodesToUpdate.push(node);
    }
  }

  nodesToUpdate.forEach((textNode) => {
    const parent = textNode.parentElement;
    if (!parent) return;

    const isPartial = textNode.textContent.trim() !== placeholderText;

    if (isPartial) {
      parent.dataset.daasPlaceholderPartial = key;
      parent.dataset.daasOriginalText = textNode.textContent;
    } else {
      parent.dataset.daasPlaceholder = key;
    }

    textNode.textContent = textNode.textContent.replace(placeholderText, value || placeholderText);
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

