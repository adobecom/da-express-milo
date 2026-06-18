import { createTag } from '../../../utils.js';
import { createLibraryItemCard } from './createLibraryItemCard.js';
import { createToggleIcon, PLUS_ICON, MINUS_ICON } from './libraryIcons.js';
import { formatLibraryCounts, getSizeClass } from './libraryUtils.js';
import { decorateAnalyticsAttributes } from '../../utils/utilities.js';

function createHeader(library, expanded, onToggle, strings) {
  const name = library.name || strings.librariesDefaultName || '';
  const header = createTag('button', {
    type: 'button',
    class: 'ax-lib-accordion-header',
    'aria-expanded': String(expanded),
    'aria-controls': `ax-lib-panel-${library.id}`,
  });

  const content = createTag('div', { class: 'ax-lib-accordion-header-content' });
  const copyControl = createTag('div', { class: 'ax-lib-accordion-copy-control' });

  const headingRow = createTag('div', { class: 'ax-lib-accordion-heading-row' });
  const nameEl = createTag('span', { class: 'ax-lib-accordion-name' }, name);
  const countEl = createTag('span', { class: 'ax-lib-accordion-count' }, formatLibraryCounts(library, strings));
  headingRow.append(nameEl, countEl);

  copyControl.append(headingRow, createToggleIcon(expanded));
  content.appendChild(copyControl);
  header.appendChild(content);

  const toggleLabel = expanded ? strings.librariesCollapseAll : strings.librariesExpandAll;
  decorateAnalyticsAttributes(header, { linkLabel: `${toggleLabel}: ${name}` });
  header.addEventListener('click', () => onToggle(library.id));

  return header;
}

function createPanel(library, emit, expanded, strings, toolHrefs) {
  // `hidden` must only be added when collapsed. createTag calls setAttribute for
  // every key, and setAttribute('hidden', undefined) yields hidden="undefined",
  // which is a *present* attribute, hiding the panel even when expanded.
  const panelAttrs = {
    class: 'ax-lib-accordion-panel',
    id: `ax-lib-panel-${library.id}`,
  };
  if (!expanded) panelAttrs.hidden = '';
  const panel = createTag('div', panelAttrs);

  const grid = createTag('div', { class: 'palettes-grid ax-lib-items-grid' });
  (library.items || []).forEach((item) => {
    grid.appendChild(createLibraryItemCard(item, { library, strings, emit, toolHrefs }));
  });

  panel.appendChild(grid);
  return panel;
}

/**
 * @param {Object} library
 * @param {Object} [options]
 * @param {'l'|'m'|'s'} [options.size='l']
 * @param {boolean} [options.expanded=false]
 * @param {boolean} [options.searchResult=false]
 * @param {Object} [options.strings] - resolved placeholders
 * @param {Function} [options.onToggle]
 * @param {Function} [options.emit]
 * @param {Object} [options.toolHrefs] - { contrast, colorBlindness, colorWheel }
 */
export function createLibraryAccordion(library, options = {}) {
  const {
    size = 'l',
    expanded = false,
    searchResult = false,
    strings = {},
    onToggle = () => {},
    emit = () => {},
    toolHrefs = {},
  } = options;

  const sizeClass = getSizeClass(size);
  const accordion = createTag('section', {
    class: [
      'ax-lib-accordion',
      `ax-lib-accordion--size-${sizeClass}`,
      expanded ? 'ax-lib-accordion--open' : 'ax-lib-accordion--closed',
      searchResult ? 'ax-lib-accordion--search-result' : '',
    ].filter(Boolean).join(' '),
    'data-library-id': library.id || '',
  });

  accordion.append(
    createHeader(library, expanded, onToggle, strings),
    createPanel(library, emit, expanded, strings, toolHrefs),
  );

  return {
    element: accordion,
    setExpanded(isOpen) {
      accordion.classList.toggle('ax-lib-accordion--open', isOpen);
      accordion.classList.toggle('ax-lib-accordion--closed', !isOpen);
      const header = accordion.querySelector('.ax-lib-accordion-header');
      const panel = accordion.querySelector('.ax-lib-accordion-panel');
      const icon = accordion.querySelector('.ax-lib-toggle-icon');
      if (header) header.setAttribute('aria-expanded', String(isOpen));
      if (panel) {
        if (isOpen) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      }
      if (icon) icon.innerHTML = isOpen ? MINUS_ICON : PLUS_ICON;
    },
  };
}
