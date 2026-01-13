/**
 * Color Explorer - Gradients Renderer
 * Renders gradient cards in a grid with filters and pagination
 * Reference: Figma 5729-94820 (Explore Gradients)
 */

import { createTag } from '../../../scripts/utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import BlockMediator from '../../../scripts/block-mediator.min.js';

/**
 * Create gradients renderer
 * @param {Object} options - Configuration options
 * @returns {Object} Renderer instance
 */
export function createGradientsRenderer(options) {
  const base = createBaseRenderer(options);
  const { createCard, createGrid, getData, emit, getState } = base;

  // Private state
  let gridElement = null;
  let loadMoreButton = null;
  let filterElements = {
    typeDropdown: null,
    categoryDropdown: null,
    timeDropdown: null,
  };

  /**
   * Generate CSS gradient string from color stops
   * @param {Object} gradient - Gradient data
   * @returns {string} CSS gradient string
   */
  function generateGradientCSS(gradient) {
    const { type = 'linear', angle = 90, colorStops = [] } = gradient;

    if (colorStops.length === 0) return 'linear-gradient(90deg, #ccc, #999)';

    const stops = colorStops
      .map((stop) => `${stop.color} ${stop.position * 100}%`)
      .join(', ');

    if (type === 'radial') {
      return `radial-gradient(circle, ${stops})`;
    }

    return `linear-gradient(${angle}deg, ${stops})`;
  }

  /**
   * Extract core colors from gradient
   * @param {Object} gradient - Gradient data
   * @returns {Array<string>} Core colors
   */
  function extractCoreColors(gradient) {
    if (gradient.coreColors && gradient.coreColors.length > 0) {
      return gradient.coreColors;
    }

    // Extract from color stops
    if (gradient.colorStops && gradient.colorStops.length > 0) {
      const totalStops = Math.min(5, gradient.colorStops.length);
      const step = gradient.colorStops.length / totalStops;
      const colors = [];

      for (let i = 0; i < totalStops; i += 1) {
        const index = Math.floor(i * step);
        colors.push(gradient.colorStops[index].color);
      }

      return colors;
    }

    return ['#CCCCCC'];
  }

  /**
   * Create filters section
   * @returns {HTMLElement} Filters container
   */
  function createFiltersSection() {
    const state = getState();
    const container = createTag('div', { class: 'gradients-filters' });

    // Title and count
    const titleRow = createTag('div', { class: 'filters-title-row' });
    const title = createTag('h2', { class: 'gradients-count' }, `${state.totalCount || '1.5K'} color gradients`);
    titleRow.append(title);

    // Dropdowns container
    const dropdownsContainer = createTag('div', { class: 'filters-dropdowns' });

    // Type dropdown (Color gradients) - has selected state in Figma (#e1e1e1)
    const typeDropdown = createDropdown('Type', 'Color gradients', [
      { value: 'all', label: 'Color gradients' },
      { value: 'linear', label: 'Linear only' },
      { value: 'radial', label: 'Radial only' },
    ], state.filterType || 'all', (value) => emit('filter-change', { type: 'filterType', value }), true);
    filterElements.typeDropdown = typeDropdown;

    // Category dropdown (All)
    const categoryDropdown = createDropdown('Category', 'All', [
      { value: 'all', label: 'All' },
      { value: 'nature', label: 'Nature' },
      { value: 'sunset', label: 'Sunset' },
      { value: 'ocean', label: 'Ocean' },
      { value: 'vibrant', label: 'Vibrant' },
    ], state.filterCategory || 'all', (value) => emit('filter-change', { type: 'filterCategory', value }), false);
    filterElements.categoryDropdown = categoryDropdown;

    // Time dropdown (All time)
    const timeDropdown = createDropdown('Time', 'All time', [
      { value: 'all', label: 'All time' },
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'This week' },
      { value: 'month', label: 'This month' },
    ], state.filterTime || 'all', (value) => emit('filter-change', { type: 'filterTime', value }), false);
    filterElements.timeDropdown = timeDropdown;

    dropdownsContainer.append(typeDropdown, categoryDropdown, timeDropdown);
    titleRow.append(dropdownsContainer);
    container.append(titleRow);

    return container;
  }

  /**
   * Create dropdown element
   * @param {string} label - Dropdown label
   * @param {string} placeholder - Placeholder text
   * @param {Array} options - Dropdown options
   * @param {string} selectedValue - Currently selected value
   * @param {Function} onChange - Change handler
   * @param {boolean} isSelected - Whether this dropdown should have selected styling
   * @returns {HTMLElement} Dropdown element
   */
  function createDropdown(label, placeholder, options, selectedValue, onChange, isSelected = false) {
    const dropdown = createTag('div', { class: 'filter-dropdown' });
    const select = createTag('select', {
      class: 'filter-select',
      'aria-label': label,
    });

    // Add selected attribute for darker background (first dropdown in Figma)
    if (isSelected) {
      select.setAttribute('data-selected', 'true');
      select.classList.add('selected');
    }

    options.forEach((opt) => {
      const option = createTag('option', {
        value: opt.value,
        selected: opt.value === selectedValue,
      }, opt.label);
      select.append(option);
    });

    select.addEventListener('change', (e) => onChange(e.target.value));

    dropdown.append(select);
    return dropdown;
  }

  /**
   * Create gradient card (Figma 5736-190107: gradient visual + name + 1 action button)
   * @param {Object} gradient - Gradient data
   * @returns {HTMLElement} Card element
   */
  function createGradientCard(gradient) {
    const card = createCard(gradient);
    card.classList.add('gradient-card');

    // 1. Gradient visual (80px height, matches Figma)
    const gradientVisual = createTag('div', {
      class: 'gradient-visual',
      style: `background: ${generateGradientCSS(gradient)}`,
      'aria-label': `${gradient.name || 'Gradient'} visual`,
    });

    // 2. Info row: name on left, 1 action button on right
    const infoContainer = createTag('div', { class: 'gradient-info' });
    
    const nameEl = createTag('p', { class: 'gradient-name' }, gradient.name || 'Unnamed Gradient');
    
    // Actions container with ONLY Open button
    const actionsContainer = createTag('div', { class: 'gradient-actions' });
    
    // Open modal button (ONLY button - matches Figma)
    const openButton = createTag('button', {
      class: 'gradient-action-btn open-btn',
      'aria-label': `View ${gradient.name || 'gradient'} details`,
    });
    openButton.innerHTML = '<span class="action-icon">⤢</span>';
    
    actionsContainer.append(openButton);
    infoContainer.append(nameEl, actionsContainer);

    // Assemble card: gradient visual + info (NO palette swatches)
    card.append(gradientVisual, infoContainer);

    // Click handler
    card.addEventListener('click', () => emit('item-click', gradient));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        emit('item-click', gradient);
      }
    });

    return card;
  }

  /**
   * Create load more button
   * @returns {HTMLElement} Button element
   */
  function createLoadMoreButton() {
    const state = getState();
    const button = createTag('button', {
      class: 'load-more-button',
      type: 'button',
    });

    const icon = createTag('span', { class: 'load-more-icon' }, '+');
    const text = createTag('span', { class: 'load-more-text' }, 'Load more');

    button.append(icon, text);

    // Disable if no more data
    if (!state.hasMore) {
      button.disabled = true;
      button.classList.add('disabled');
    }

    button.addEventListener('click', () => {
      if (!button.disabled) {
        emit('load-more');
      }
    });

    return button;
  }

  /**
   * Render function
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement} Rendered content
   */
  async function render(container) {
    const wrapper = createTag('div', { class: 'gradients-renderer' });

    // 1. Filters section
    const filters = createFiltersSection();
    wrapper.append(filters);

    // 2. Gradients grid
    const grid = createGrid();
    grid.classList.add('gradients-grid');
    const data = getData();

    if (data.length === 0) {
      const emptyMsg = createTag('p', { class: 'empty-message' }, 'No gradients found.');
      wrapper.append(emptyMsg);
      return wrapper;
    }

    data.forEach((gradient) => {
      const card = createGradientCard(gradient);
      grid.append(card);
    });

    wrapper.append(grid);
    gridElement = grid;

    // 3. Load more button
    const state = getState();
    if (state.hasMore !== false) {
      const loadMore = createLoadMoreButton();
      wrapper.append(loadMore);
      loadMoreButton = loadMore;
    }

    return wrapper;
  }

  /**
   * Update function
   * @param {Array} newData - New data
   */
  function update(newData) {
    base.setData(newData);

    if (!gridElement) return;

    gridElement.innerHTML = '';

    if (newData.length === 0) {
      const emptyMsg = createTag('p', { class: 'empty-message' }, 'No gradients found.');
      gridElement.append(emptyMsg);
      return;
    }

    newData.forEach((gradient) => {
      const card = createGradientCard(gradient);
      gridElement.append(card);
    });

    // Update load more button state
    if (loadMoreButton) {
      const state = getState();
      if (state.hasMore === false) {
        loadMoreButton.disabled = true;
        loadMoreButton.classList.add('disabled');
      } else {
        loadMoreButton.disabled = false;
        loadMoreButton.classList.remove('disabled');
      }
    }
  }

  return {
    ...base,
    render,
    update,
    createGradientCard,
    generateGradientCSS,
  };
}

