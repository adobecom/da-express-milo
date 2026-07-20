const DEFAULT_HEADER_SELECTOR = '[data-analytics-header], h1, h2, h3';
const DEFAULT_LINK_SELECTOR = 'a[href], button';

function sanitizeHeaderText(s, fallback) {
  const raw = String(s ?? '').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 20);
  return raw || fallback || 'Section';
}

const DAA_LL_MAX = 30;

function sanitizeLinkLabel(s) {
  return String(s ?? '').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function getAnalyticsHeaderFromDom(container, options = {}) {
  if (!container || typeof container.querySelector !== 'function') {
    return options.fallback ?? 'Section';
  }
  const selector = options.selector ?? DEFAULT_HEADER_SELECTOR;
  const el = container.querySelector(selector);
  const text = el?.textContent?.trim() ?? '';
  return sanitizeHeaderText(text, options.fallback);
}

export function getNextLinkIndexInContainer(container, options = {}) {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return 1;
  }
  const selector = options.selector ?? DEFAULT_LINK_SELECTOR;
  const count = container.querySelectorAll(selector).length;
  return count + 1;
}

/**
 * Sets a sanitized `daa-ll` link label for Milo analytics on a clickable element.
 * Strips non-alphanumeric characters and caps length so authored/localized text
 * cannot corrupt the delimited analytics payload. Pair with `setDaaLH` for scope.
 *
 * @param {Element} element clickable element (a[href] or button)
 * @param {string} label human-readable link label
 * @returns {string} the value written ('' if element is invalid)
 */
export function setDaaLL(element, label) {
  if (!element || typeof element.setAttribute !== 'function') return '';
  const value = sanitizeLinkLabel(label).substring(0, DAA_LL_MAX) || 'link';
  element.setAttribute('daa-ll', value);
  return value;
}

/**
 * Sets a sanitized `daa-lh` link-header (grouping scope) for Milo analytics.
 * Use on a block root or a repeated item (e.g. a card) so identical `daa-ll`
 * labels stay distinct per scope.
 *
 * @param {Element} element scope container
 * @param {string} header scope name
 * @param {{ fallback?: string }} [options]
 * @returns {string} the value written ('' if element is invalid)
 */
export function setDaaLH(element, header, options = {}) {
  if (!element || typeof element.setAttribute !== 'function') return '';
  const value = sanitizeHeaderText(header, options.fallback);
  element.setAttribute('daa-lh', value);
  return value;
}
