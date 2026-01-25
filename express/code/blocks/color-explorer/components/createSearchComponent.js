/**
 * Search Component (Shared)
 *
 * WIREFRAME FILE - Shows shared search structure
 *
 * Used By: Strips (Palettes), Gradients
 * Not Used By: Extract (no search needed)
 *
 * Architecture Decision:
 * - Shared component used by multiple renderers
 * - Wraps Lit <color-search> component via adapter
 * - Each renderer includes this in their layout
 * - Returns vanilla container with Lit component inside
 */

import { createTag } from '../../../scripts/utils.js';
import { createSearchAdapter } from '../adapters/litComponentAdapters.js';

/**
 * Create search component
 * @param {Object} options - Configuration
 * @param {Function} options.onSearch - Search callback
 * @param {string} options.placeholder - Placeholder text
 * @returns {Object} Search component with { element, adapter, clear }
 */
export function createSearchComponent(options = {}) {
  const {
    onSearch,
    placeholder = 'Search colors and palettes...',
  } = options;

  console.log('[SearchComponent] Creating search component');

  // 1. Create adapter for Lit <color-search> component
  const adapter = createSearchAdapter({
    onSearch: (query) => {
      console.log('[SearchComponent] Search query:', query);
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
      console.log('[SearchComponent] Clearing search');
      adapter.clear();
    },

    // Set query programmatically
    setQuery: (query) => {
      console.log('[SearchComponent] Setting query:', query);
      adapter.setQuery(query);
    },

    // Cleanup
    destroy: () => {
      console.log('[SearchComponent] Destroying');
      adapter.destroy();
    },
  };
}
