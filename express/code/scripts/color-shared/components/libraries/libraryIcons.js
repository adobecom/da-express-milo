import { createTag } from '../../../utils.js';

export const PLUS_ICON = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1.5v9M1.5 6h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

export const MINUS_ICON = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1.5 6h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

export const DOWNLOAD_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.75v9.5m0 0 3.5-3.5M10 12.25l-3.5-3.5M3.75 14.5v1.25c0 .69.56 1.25 1.25 1.25h10c.69 0 1.25-.56 1.25-1.25V14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export const EMPTY_SEARCH_ICON = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="21" cy="21" r="13" stroke="currentColor" stroke-width="2.5"/><path d="m31 31 10 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="m17.5 17.5 7 7m0-7-7 7" stroke="var(--S2-Buttons-Accent-Color-Default, #3B63FB)" stroke-width="2.5" stroke-linecap="round"/></svg>';

export function createToggleIcon(expanded) {
  return createTag('span', {
    class: 'ax-lib-toggle-icon',
    'aria-hidden': 'true',
  }, expanded ? MINUS_ICON : PLUS_ICON);
}

export function createEmptySearchIcon() {
  return createTag('span', { class: 'ax-lib-empty-icon', 'aria-hidden': 'true' }, EMPTY_SEARCH_ICON);
}
