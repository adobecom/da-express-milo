import { loadPlaceholders } from './utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  label: 'Load more',
  ariaLabel: 'Load {remaining} more items',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  label: 'color-load-more-label',
  ariaLabel: 'color-load-more-aria',
});

export function createColorLoadMorePlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default function loadColorLoadMorePlaceholders() {
  return loadPlaceholders(PLACEHOLDER_KEY_MAP, createColorLoadMorePlaceholders);
}
