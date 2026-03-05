/**
 * Milo analytics DOM helpers — generic for any block or component.
 * Use these when setting daa-ll / data-ll on links and buttons per
 * https://milo.adobe.com/docs/authoring/analytics-review
 */

const DEFAULT_HEADER_SELECTOR = '[data-analytics-header], h1, h2, h3';
const DEFAULT_LINK_SELECTOR = 'a[href], button';

function sanitizeHeaderText(s, fallback) {
  const raw = String(s ?? '').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 20);
  return raw || fallback || 'Section';
}

/**
 * Get "last header before link" text from the DOM for daa-ll (Milo analytics).
 * Use when the block has a heading that should be the header for all links in that scope.
 *
 * @param {Element} container - Scope to look in (e.g. block root or section)
 * @param {{ selector?: string, fallback?: string }} [options]
 * @param {string} [options.selector] - CSS selector for the header element (default: [data-analytics-header], h1, h2, h3)
 * @param {string} [options.fallback] - Used when no element found or empty text (default: 'Section')
 * @returns {string} Sanitized header text, max 20 chars
 *
 * @example
 * getAnalyticsHeaderFromDom(block, { selector: '.my-block-title', fallback: 'Gallery' })
 * getAnalyticsHeaderFromDom(section)  // uses first [data-analytics-header], h1, h2, or h3
 */
export function getAnalyticsHeaderFromDom(container, options = {}) {
  if (!container || typeof container.querySelector !== 'function') {
    return options.fallback ?? 'Section';
  }
  const selector = options.selector ?? DEFAULT_HEADER_SELECTOR;
  const el = container.querySelector(selector);
  const text = el?.textContent?.trim() ?? '';
  return sanitizeHeaderText(text, options.fallback);
}

/**
 * Count interactive elements in a container to get the next 1-based link index.
 * Use for "Load more", "Show all", or any control that comes after a list of links/buttons.
 *
 * @param {Element} container - Scope to count in (e.g. grid, card list, or block root)
 * @param {{ selector?: string }} [options]
 * @param {string} [options.selector] - What counts as a link (default: a[href], button)
 * @returns {number} Next link index (count + 1), or 1 if none found
 *
 * @example
 * const nextIndex = getNextLinkIndexInContainer(gridEl);  // for Load more after N cards
 */
export function getNextLinkIndexInContainer(container, options = {}) {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return 1;
  }
  const selector = options.selector ?? DEFAULT_LINK_SELECTOR;
  const count = container.querySelectorAll(selector).length;
  return count + 1;
}
