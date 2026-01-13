/**
 * Filters Component (Shared)
 * 
 * WIREFRAME FILE - Shows shared filters structure
 * 
 * Used By: Strips (Palettes), Gradients
 * Not Used By: Extract (no filters needed)
 * 
 * Architecture Decision:
 * - Shared component used by multiple renderers
 * - Vanilla DOM (no Lit components needed for dropdowns)
 * - Each renderer includes this in their layout
 * - Emits filter-change events back to renderer
 * 
 * Filters:
 * - Type: All, Linear, Radial, Conic (for gradients)
 * - Category: All, Nature, Abstract, Vibrant, etc.
 * - Time: All, Recent, Popular, Trending
 */

import { createTag } from '../../../scripts/utils.js';

/**
 * Create filters component
 * @param {Object} options - Configuration
 * @param {Array} options.filters - Array of filter configs
 * @param {Function} options.onFilterChange - Filter change callback
 * @param {string} options.variant - Variant type (strips, gradients)
 * @returns {Object} Filters component with { element, getValues, reset }
 */
export function createFiltersComponent(options = {}) {
  const {
    filters = [],
    onFilterChange,
    variant = 'strips',
  } = options;

  console.log('[FiltersComponent] Creating filters for variant:', variant);

  // Current filter values
  const filterValues = {};

  /**
   * Create a single dropdown filter
   * @param {Object} filter - Filter config
   * @returns {HTMLElement} Dropdown element
   */
  function createDropdown(filter) {
    const { id, label, options: filterOptions } = filter;

    const dropdown = createTag('div', { class: 'filter-dropdown' });

    // Label
    const labelEl = createTag('label', { 
      class: 'filter-label',
      for: `filter-${id}`,
    });
    labelEl.textContent = label;

    // Select
    const select = createTag('select', {
      id: `filter-${id}`,
      class: 'filter-select',
      'aria-label': `Filter by ${label}`,
    });

    // Options
    filterOptions.forEach(opt => {
      const option = createTag('option', { value: opt.value });
      option.textContent = opt.label;
      select.appendChild(option);
    });

    // Event listener
    select.addEventListener('change', (e) => {
      filterValues[id] = e.target.value;
      console.log('[FiltersComponent] Filter changed:', id, '=', e.target.value);
      onFilterChange?.(filterValues);
    });

    dropdown.appendChild(labelEl);
    dropdown.appendChild(select);

    return dropdown;
  }

  /**
   * Get default filters based on variant
   */
  function getDefaultFilters() {
    if (variant === 'gradients') {
      return [
        {
          id: 'type',
          label: 'Type',
          options: [
            { label: 'All Gradients', value: 'all' },
            { label: 'Linear', value: 'linear' },
            { label: 'Radial', value: 'radial' },
            { label: 'Conic', value: 'conic' },
          ],
        },
        {
          id: 'category',
          label: 'Category',
          options: [
            { label: 'All Categories', value: 'all' },
            { label: 'Nature', value: 'nature' },
            { label: 'Abstract', value: 'abstract' },
            { label: 'Vibrant', value: 'vibrant' },
            { label: 'Pastel', value: 'pastel' },
          ],
        },
        {
          id: 'time',
          label: 'Time',
          options: [
            { label: 'All Time', value: 'all' },
            { label: 'Recent', value: 'recent' },
            { label: 'Popular', value: 'popular' },
            { label: 'Trending', value: 'trending' },
          ],
        },
      ];
    }

    // Default: strips/palettes
    return [
      {
        id: 'type',
        label: 'Type',
        options: [
          { label: 'All Palettes', value: 'all' },
          { label: 'Monochromatic', value: 'monochromatic' },
          { label: 'Analogous', value: 'analogous' },
          { label: 'Complementary', value: 'complementary' },
          { label: 'Triadic', value: 'triadic' },
        ],
      },
      {
        id: 'category',
        label: 'Category',
        options: [
          { label: 'All Categories', value: 'all' },
          { label: 'Nature', value: 'nature' },
          { label: 'Abstract', value: 'abstract' },
          { label: 'Vibrant', value: 'vibrant' },
          { label: 'Pastel', value: 'pastel' },
        ],
      },
      {
        id: 'time',
        label: 'Time',
        options: [
          { label: 'All Time', value: 'all' },
          { label: 'Recent', value: 'recent' },
          { label: 'Popular', value: 'popular' },
          { label: 'Trending', value: 'trending' },
        ],
      },
    ];
  }

  // 1. Create container
  const container = createTag('div', { class: 'filters-container' });

  // 2. Create results count (optional)
  const resultsCount = createTag('div', { class: 'results-count' });
  resultsCount.textContent = '1.5K Results'; // TODO: Make dynamic
  container.appendChild(resultsCount);

  // 3. Create dropdowns
  const filtersToUse = filters.length > 0 ? filters : getDefaultFilters();
  
  filtersToUse.forEach(filter => {
    const dropdown = createDropdown(filter);
    container.appendChild(dropdown);
  });

  // 4. Public API
  return {
    element: container,
    
    // Get current filter values
    getValues: () => {
      console.log('[FiltersComponent] Current filters:', filterValues);
      return { ...filterValues };
    },
    
    // Reset all filters to default
    reset: () => {
      console.log('[FiltersComponent] Resetting filters');
      container.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
      });
      Object.keys(filterValues).forEach(key => {
        filterValues[key] = 'all';
      });
      onFilterChange?.(filterValues);
    },
    
    // Update results count
    updateCount: (count) => {
      resultsCount.textContent = `${count.toLocaleString()} Results`;
    },
    
    // Cleanup
    destroy: () => {
      console.log('[FiltersComponent] Destroying');
      container.remove();
    },
  };
}
