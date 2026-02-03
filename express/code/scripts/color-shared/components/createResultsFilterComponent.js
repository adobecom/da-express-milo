import { createTag } from '../../../scripts/utils.js';
import { createSearchAdapter } from '../adapters/litComponentAdapters.js';

export function createResultsFilterComponent(options = {}) {
  const {
    onSearch,
    placeholder = 'Search colors and palettes...',
  } = options;

  const adapter = createSearchAdapter({
    onSearch: (query) => {
      onSearch?.(query);
    },
  });

  const container = createTag('div', { class: 'color-search-wrapper' });
  
  const label = createTag('label', { 
    class: 'search-label',
    for: 'color-search-input',
  });
  label.textContent = 'Search';
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
