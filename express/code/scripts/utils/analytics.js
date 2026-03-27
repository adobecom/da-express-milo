const DEFAULT_HEADER_SELECTOR = '[data-analytics-header], h1, h2, h3';
const DEFAULT_LINK_SELECTOR = 'a[href], button';

function sanitizeHeaderText(s, fallback) {
  const raw = String(s ?? '').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 20);
  return raw || fallback || 'Section';
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
