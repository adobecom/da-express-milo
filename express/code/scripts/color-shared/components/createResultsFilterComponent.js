import { createTag } from '../../../scripts/utils.js';
import { createSearchAdapter } from '../adapters/litComponentAdapters.js';
import { createColorFiltersPlaceholders } from '../i18n/loadColorFiltersPlaceholders.js';

export function createResultsFilterComponent(options = {}) {
  const {
    onSearch,
    placeholder,
    strings = createColorFiltersPlaceholders(),
  } = options;

  const resolvedPlaceholder = placeholder ?? strings.searchPlaceholder;

  const adapter = createSearchAdapter({
    placeholder: resolvedPlaceholder,
    onSearch: (query) => {
      onSearch?.(query);
    },
  });

  const container = createTag('div', { class: 'color-search-wrapper' });
  
  const label = createTag('label', { 
    class: 'search-label',
    for: 'color-search-input',
  });
  label.textContent = strings.searchLabel;
  label.style.display = 'none';

  container.appendChild(label);
  container.appendChild(adapter.element);

  return {
    element: container,
    adapter,
    
    clear: () => {
      adapter.clear();
    },
    
    setQuery: (query) => {
      adapter.setQuery(query);
    },
    
    destroy: () => {
      adapter.destroy();
    },
  };
}
