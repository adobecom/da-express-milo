import { createTag } from '../../../scripts/utils.js';

export function createFiltersComponent(options = {}) {
  const {
    filters = [],
    onFilterChange,
    variant = 'strips',
  } = options;


  const filterValues = {};

  function createDropdown(filter) {
    const { id, label, options: filterOptions } = filter;

    const dropdown = createTag('div', { class: 'filter-dropdown' });

    const labelEl = createTag('label', { 
      class: 'filter-label',
      for: `filter-${id}`,
    });
    labelEl.textContent = label;

    const select = createTag('select', {
      id: `filter-${id}`,
      class: 'filter-select',
      'aria-label': `Filter by ${label}`,
    });

    filterOptions.forEach(opt => {
      const option = createTag('option', { value: opt.value });
      option.textContent = opt.label;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      filterValues[id] = e.target.value;
      onFilterChange?.(filterValues);
    });

    dropdown.appendChild(labelEl);
    dropdown.appendChild(select);

    return dropdown;
  }

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

  const container = createTag('div', { class: 'filters-container' });

  const resultsCount = createTag('div', { class: 'results-count' });
  resultsCount.textContent = '1.5K Results'; // TODO: Make dynamic
  container.appendChild(resultsCount);

  const filtersToUse = filters.length > 0 ? filters : getDefaultFilters();
  
  filtersToUse.forEach(filter => {
    const dropdown = createDropdown(filter);
    container.appendChild(dropdown);
  });

  return {
    element: container,
    
    getValues: () => {
      return { ...filterValues };
    },
    
    reset: () => {
      container.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
      });
      Object.keys(filterValues).forEach(key => {
        filterValues[key] = 'all';
      });
      onFilterChange?.(filterValues);
    },
    
    updateCount: (count) => {
      resultsCount.textContent = `${count.toLocaleString()} Results`;
    },
    
    destroy: () => {
      container.remove();
    },
  };
}
