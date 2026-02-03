/**
 * Results Filter Component (Internal)
 * 
 * ⚠️ NOT the main search-marquee block!
 * This is for filtering/searching WITHIN already-loaded results.
 * 
 * Used By: Strips (Palettes), Gradients renderers
 * Not Used By: Extract (no filtering needed)
 * 
 * Architecture Decision:
 * - Internal component for client-side result filtering
 * - Wraps Lit <color-search> component via adapter
 * - Each renderer can include this for filtering their results
 * - Returns vanilla container with Lit component inside
 * 
 * Main Page Search:
 * - For the main search hero, use the standalone `search-marquee` block
 * - Located: express/code/blocks/search-marquee/
 */

import { createTag } from '../../../scripts/utils.js';
import { createSearchAdapter } from '../adapters/litComponentAdapters.js';

/**
 * Create results filter component
 * @param {Object} options - Configuration
 * @param {Function} options.onSearch - Filter callback (filters loaded results)
 * @param {string} options.placeholder - Placeholder text
 * @returns {Object} Filter component with { element, adapter, clear }
 */
export function createResultsFilterComponent(options = {}) {
  const {
    onSearch,
    placeholder = 'Search colors and palettes...',
  } = options;


  // 1. Create adapter for Lit <color-search> component
  const adapter = createSearchAdapter({
    onSearch: (query) => {
      onSearch?.(query);
    },
  });

  // 2. Wrap in container for consistent styling
  const container = createTag('div', { class: 'color-search-wrapper' });
  
  // Optional: Add label
  const label = createTag('label', { 
    class: 'search-label',
    for: 'color-search-input',
  });
  label.textContent = 'Search';
  label.style.display = 'none'; // Screen reader only

  // 3. Add Lit component
  container.appendChild(label);
  container.appendChild(adapter.element);

  // 4. Public API
  return {
    element: container,
    adapter,
    
    // Clear search
    clear: () => {
      adapter.clear();
    },
    
    // Set query programmatically
    setQuery: (query) => {
      adapter.setQuery(query);
    },
    
    // Cleanup
    destroy: () => {
      adapter.destroy();
    },
  };
}
