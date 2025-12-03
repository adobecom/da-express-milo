/**
 * DaaS Template Schema - Pre-decoration
 *
 * This runs BEFORE the main page decoration pipeline.
 * It parses the template-schema, processes placeholders, and handles repeater delimiters.
 *
 * NOTE: We intentionally preserve [[placeholder]] text in the DOM.
 * Only @repeat/@repeatend delimiters are removed.
 */

const STORAGE_KEY = 'daas';
const PLACEHOLDER_REGEX = /\[\[([^\]]+)\]\]/g;
const REPEAT_START_REGEX = /\[\[@repeat\(([^)]+)\)\]\]/;
const REPEAT_END_REGEX = /\[\[@repeatend\(([^)]+)\)\]\]/;

/**
 * Parse the template-schema table into a structured schema object
 * @param {HTMLElement} schemaBlock - The .template-schema div
 * @returns {Object} Parsed schema with fields array and lookup map
 */
function parseTemplateSchema(schemaBlock) {
  const rows = schemaBlock.querySelectorAll(':scope > div');
  if (rows.length < 2) return null;

  // First row is headers
  const headerCells = rows[0].querySelectorAll(':scope > div');
  const headers = Array.from(headerCells).map((cell) => cell.textContent.trim().toLowerCase());

  // Remaining rows are field definitions
  const fields = [];
  const fieldMap = {};

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll(':scope > div');
    const field = {};

    headers.forEach((header, idx) => {
      const value = cells[idx]?.textContent.trim() || '';
      if (value) {
        field[header] = value;
      }
    });

    if (field.key) {
      fields.push(field);
      fieldMap[field.key] = field;
    }
  }

  return { fields, fieldMap };
}

/**
 * Find all placeholders in the document and create a mapping
 * @param {Document} doc - The document to scan
 * @returns {Array} Array of placeholder info objects
 */
function findPlaceholders(doc) {
  const placeholders = [];

  // Find placeholders in text nodes
  const walker = document.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_TEXT,
    null,
    false,
  );

  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent;
    let match;

    PLACEHOLDER_REGEX.lastIndex = 0;
    while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
      const fullMatch = match[0];
      const key = match[1].trim();

      // Skip repeater delimiters - they're handled separately
      if (key.startsWith('@repeat') || key.startsWith('@repeatend')) {
        continue;
      }

      placeholders.push({
        key,
        node,
        element: node.parentElement,
        fullMatch,
        type: 'text',
      });
    }
  }

  // Find placeholders in image alt attributes
  doc.querySelectorAll('img[alt]').forEach((img) => {
    const alt = img.alt;
    let match;

    PLACEHOLDER_REGEX.lastIndex = 0;
    while ((match = PLACEHOLDER_REGEX.exec(alt)) !== null) {
      const fullMatch = match[0];
      const key = match[1].trim();

      if (key.startsWith('@repeat') || key.startsWith('@repeatend')) {
        continue;
      }

      placeholders.push({
        key,
        element: img,
        fullMatch,
        type: 'image-alt',
      });
    }
  });

  // Find placeholders in href attributes
  doc.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    // Check both raw and URL-encoded placeholders
    const decodedHref = decodeURIComponent(href);
    let match;

    PLACEHOLDER_REGEX.lastIndex = 0;
    while ((match = PLACEHOLDER_REGEX.exec(decodedHref)) !== null) {
      const fullMatch = match[0];
      const key = match[1].trim();

      if (key.startsWith('@repeat') || key.startsWith('@repeatend')) {
        continue;
      }

      placeholders.push({
        key,
        element: link,
        fullMatch,
        type: 'href',
      });
    }
  });

  return placeholders;
}

/**
 * Process repeater delimiters in block-style tables
 * Block tables have structure: div.block > div (row) > div (cell)
 * We need to remove entire rows containing @repeat/@repeatend
 *
 * @param {HTMLElement} block - A block element to process
 * @returns {Object|null} Repeater info if found
 */
function processBlockRepeater(block) {
  const rows = block.querySelectorAll(':scope > div');
  let repeatKey = null;
  let startRowIdx = -1;
  let endRowIdx = -1;
  const rowsToRemove = [];

  rows.forEach((row, idx) => {
    const text = row.textContent;

    // Check for @repeat start
    const startMatch = text.match(REPEAT_START_REGEX);
    if (startMatch) {
      repeatKey = startMatch[1];
      startRowIdx = idx;
      rowsToRemove.push(row);
    }

    // Check for @repeatend
    const endMatch = text.match(REPEAT_END_REGEX);
    if (endMatch && endMatch[1] === repeatKey) {
      endRowIdx = idx;
      rowsToRemove.push(row);
    }
  });

  // If we found a complete repeater section
  if (repeatKey && startRowIdx !== -1 && endRowIdx !== -1) {
    // Mark the block as having a repeater
    block.dataset.daasRepeater = repeatKey;
    block.dataset.daasRepeatStart = startRowIdx;
    block.dataset.daasRepeatEnd = endRowIdx;

    // Collect the repeatable row indexes (between start and end, exclusive)
    const repeatableRows = [];
    for (let i = startRowIdx + 1; i < endRowIdx; i++) {
      repeatableRows.push(i);
      rows[i].dataset.daasRepeatableRow = 'true';
    }
    block.dataset.daasRepeatableRows = repeatableRows.join(',');

    // Remove only the delimiter rows (not the content)
    rowsToRemove.forEach((row) => row.remove());

    return { key: repeatKey, startRowIdx, endRowIdx, repeatableRows };
  }

  return null;
}

/**
 * Process repeater delimiters in freeform content
 * Freeform has structure: any element containing @repeat/@repeatend text
 * We remove just the delimiter elements and tag the content between
 *
 * @param {HTMLElement} container - Container to search within
 */
function processFreeformRepeaters(container) {
  // Find all elements containing @repeat
  const allElements = container.querySelectorAll('*');
  const repeaterStarts = [];
  const repeaterEnds = [];

  allElements.forEach((el) => {
    // Only check direct text content, not nested
    const directText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent)
      .join('');

    const startMatch = directText.match(REPEAT_START_REGEX);
    if (startMatch && el.textContent.trim() === `[[@repeat(${startMatch[1]})]]`) {
      repeaterStarts.push({ element: el, key: startMatch[1] });
    }

    const endMatch = directText.match(REPEAT_END_REGEX);
    if (endMatch && el.textContent.trim() === `[[@repeatend(${endMatch[1]})]]`) {
      repeaterEnds.push({ element: el, key: endMatch[1] });
    }
  });

  // Match starts with ends and process
  repeaterStarts.forEach((start) => {
    const matchingEnd = repeaterEnds.find((end) => end.key === start.key);
    if (matchingEnd) {
      const parent = start.element.parentElement;

      // Tag the parent as containing a repeater
      if (parent) {
        parent.dataset.daasRepeater = start.key;

        // Tag elements between start and end as repeatable
        let tagging = false;
        Array.from(parent.children).forEach((child) => {
          if (child === start.element) {
            tagging = true;
            return;
          }
          if (child === matchingEnd.element) {
            tagging = false;
            return;
          }
          if (tagging) {
            child.dataset.daasRepeatableContent = 'true';
          }
        });
      }

      // Remove only the delimiter elements (not the content between them)
      start.element.remove();
      matchingEnd.element.remove();
    }
  });
}

/**
 * Apply all schema metadata as data attributes on an element
 * @param {HTMLElement} element - Target element
 * @param {string} key - The placeholder key
 * @param {Object} field - The schema field definition
 */
function applySchemaAttributes(element, key, field) {
  if (!element || !field) return;

  // Always set the key
  element.dataset.daasKey = key;

  // Set all schema attributes if present
  if (field.type) element.dataset.daasType = field.type;
  if (field.label) element.dataset.daasLabel = field.label;
  if (field.required) element.dataset.daasRequired = field.required;
  if (field.default) element.dataset.daasDefault = field.default;
  if (field.options) element.dataset.daasOptions = field.options;
  if (field.min) element.dataset.daasMin = field.min;
  if (field.max) element.dataset.daasMax = field.max;
  if (field.pattern) element.dataset.daasPattern = field.pattern;
}

/**
 * Tag placeholder element with data attribute for easier lookup
 * NOTE: We preserve the [[placeholder]] text - it will be replaced by the block
 *
 * @param {HTMLElement} element - Element containing placeholder
 * @param {string} key - The placeholder key (without brackets)
 * @param {boolean} isPartial - Whether the placeholder is part of a larger text
 * @param {string} type - Type of placeholder: 'text', 'image-alt', or 'href'
 * @param {Object} field - The schema field definition (optional)
 */
function tagPlaceholder(element, key, isPartial, type = 'text', field = null) {
  if (!element) return;

  let targetEl = element;

  if (type === 'image-alt') {
    // Tag the image (or its picture parent if exists) with the placeholder key
    const picture = element.closest('picture');
    targetEl = picture || element;
    targetEl.dataset.daasPlaceholder = key;
    targetEl.dataset.daasPlaceholderType = 'image';
  } else if (type === 'href') {
    // Tag the link with a special href key attribute
    element.dataset.daasHrefKey = key;
  } else if (isPartial) {
    // Placeholder is part of a larger text (e.g., "Hello [[name]]!")
    element.dataset.daasPlaceholderPartial = key;
  } else {
    // Placeholder is the only content in the element
    element.dataset.daasPlaceholder = key;
  }

  // Apply all schema metadata attributes
  applySchemaAttributes(targetEl, key, field);
}

/**
 * Main decoration function
 * @param {HTMLElement} el - The element to decorate (usually document or a container)
 */
export default async function decorate(el = document) {
  const doc = el === document ? document : el.ownerDocument || document;

  // 1. Find and parse the template-schema block
  const schemaBlock = doc.querySelector('.template-schema');
  if (!schemaBlock) {
    console.warn('DaaS: No template-schema block found');
    return;
  }

  const schema = parseTemplateSchema(schemaBlock);
  if (!schema) {
    console.warn('DaaS: Could not parse template-schema');
    return;
  }

  // Store schema in sessionStorage for the template-schema block to use
  // IMPORTANT: Preserve any existing saved form data from previous sessions
  const existingData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  const mergedData = {
    ...existingData,
    fields: schema.fields,
    fieldMap: schema.fieldMap,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));

  // 2. Process repeater delimiters FIRST (remove @repeat/@repeatend only)
  // These delimiters would break other decorators, so we must remove them

  // Process block-style repeaters (like accordion)
  const blocks = doc.querySelectorAll('[class]:not(.template-schema)');
  blocks.forEach((block) => {
    // Check if this block contains repeater delimiters
    if (block.textContent.includes('[[@repeat(')) {
      processBlockRepeater(block);
    }
  });

  // Process freeform repeaters (not in block tables)
  const mainContent = doc.body;
  processFreeformRepeaters(mainContent);

  // 3. Find all placeholders and tag them (but don't remove the [[text]])
  const placeholders = findPlaceholders(doc);

  // Create placeholder mapping for the template-schema block
  const placeholderMap = {};
  placeholders.forEach((p) => {
    if (!placeholderMap[p.key]) {
      placeholderMap[p.key] = [];
    }
    placeholderMap[p.key].push({
      tagName: p.element?.tagName,
      className: p.element?.className,
      type: p.type,
    });

    // Look up the field in the schema (handle both exact and base keys for repeaters)
    // e.g., "faq[0].question" -> look up "faq[].question"
    const baseKey = p.key.replace(/\[\d+\]/, '[]');
    const field = schema.fieldMap[p.key] || schema.fieldMap[baseKey] || null;

    // Tag the element but KEEP the placeholder text
    // For text nodes, check if placeholder is partial (part of larger text)
    // For image-alt and href, isPartial is determined differently
    let isPartial = false;
    if (p.type === 'text') {
      isPartial = p.element?.textContent.trim() !== p.fullMatch;
    }
    tagPlaceholder(p.element, p.key, isPartial, p.type, field);
  });

  // Add placeholder map to storage
  const storedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  storedData.placeholderMap = placeholderMap;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));

  // 4. Mark the schema block for the template-schema block decorator
  schemaBlock.dataset.daasParsed = 'true';

  console.log('DaaS: Template schema parsed and placeholders tagged (text preserved)', {
    fields: schema.fields.length,
    placeholders: placeholders.length,
  });
}
