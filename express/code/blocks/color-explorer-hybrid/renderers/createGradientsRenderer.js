/**
 * Gradients Renderer - Hardcoded POC
 * Displays a grid of gradient cards with filters and load more functionality
 */

export function createGradientsRenderer(options) {
  console.log('[GradientsRenderer] Initializing with options:', options);

  const { container, data = [], config = {} } = options;
  let displayedCount = 24; // Show 24 initially
  const loadMoreIncrement = 10; // Load 10 more
  const maxGradients = 34; // Total hardcoded gradients

  // Hardcoded gradient data
  const gradients = getHardcodedGradients();

  /**
   * Create filters section (3 dropdowns)
   */
  function createFiltersSection() {
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'gradients-filters';

    // Dropdown 1: Color Type (with selected state bg)
    const dropdown1 = createDropdown('Color gradients', [
      'Color gradients',
      'Monochrome',
      'Duotone',
      'Rainbow',
    ], true); // true = selected state

    // Dropdown 2: Style
    const dropdown2 = createDropdown('All', [
      'All',
      'Linear',
      'Radial',
      'Conic',
    ]);

    // Dropdown 3: Time
    const dropdown3 = createDropdown('All time', [
      'All time',
      'This week',
      'This month',
      'This year',
    ]);

    filtersContainer.appendChild(dropdown1);
    filtersContainer.appendChild(dropdown2);
    filtersContainer.appendChild(dropdown3);

    return filtersContainer;
  }

  /**
   * Create a single dropdown
   */
  function createDropdown(label, options, isSelected = false) {
    const dropdown = document.createElement('div');
    dropdown.className = `gradient-dropdown ${isSelected ? 'selected' : ''}`;

    const button = document.createElement('button');
    button.className = 'gradient-dropdown-button';

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    button.appendChild(labelSpan);

    // Add chevron icon
    const chevron = document.createElement('span');
    chevron.className = 'dropdown-chevron';
    chevron.innerHTML = '▼';
    button.appendChild(chevron);

    // Create dropdown menu
    const menu = document.createElement('div');
    menu.className = 'gradient-dropdown-menu';
    menu.style.display = 'none';

    options.forEach((option) => {
      const item = document.createElement('button');
      item.className = 'gradient-dropdown-item';
      item.textContent = option;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        labelSpan.textContent = option;
        menu.style.display = 'none';
        console.log('[GradientsRenderer] Filter changed:', label, '→', option);
        // TODO: Trigger filter change
      });
      menu.appendChild(item);
    });

    // Toggle menu on button click
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.style.display === 'block';

      // Close all other dropdowns
      document.querySelectorAll('.gradient-dropdown-menu').forEach((m) => {
        m.style.display = 'none';
      });

      menu.style.display = isOpen ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      menu.style.display = 'none';
    });

    dropdown.appendChild(button);
    dropdown.appendChild(menu);
    return dropdown;
  }

  /**
   * Create a single gradient card
   */
  function createGradientCard(gradient) {
    const card = document.createElement('div');
    card.className = 'gradient-card';
    card.setAttribute('data-gradient-id', gradient.id);

    // Gradient visual (80px height)
    const visual = document.createElement('div');
    visual.className = 'gradient-visual';
    visual.style.background = gradient.gradient;
    visual.setAttribute('aria-label', `${gradient.name} visual`);

    // Info section (name + action button)
    const info = document.createElement('div');
    info.className = 'gradient-info';

    const name = document.createElement('p');
    name.className = 'gradient-name';
    name.textContent = gradient.name;

    // Action button (open icon - use proper SVG icon)
    const actionBtn = document.createElement('button');
    actionBtn.className = 'gradient-action-btn';
    actionBtn.setAttribute('aria-label', `View ${gradient.name} details`);

    // Use proper OpenIn icon (SVG)
    const icon = document.createElement('span');
    icon.className = 'action-icon';
    icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 10.5V15.5C15 16.0523 14.5523 16.5 14 16.5H4.5C3.94772 16.5 3.5 16.0523 3.5 15.5V6C3.5 5.44772 3.94772 5 4.5 5H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12.5 3.5H16.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16.5 3.5L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    actionBtn.appendChild(icon);

    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[GradientsRenderer] Open modal for:', gradient.name);
      // TODO: Open modal with gradient details
    });

    info.appendChild(name);
    info.appendChild(actionBtn);

    card.appendChild(visual);
    card.appendChild(info);

    return card;
  }

  /**
   * Create load more button
   */
  function createLoadMoreButton() {
    const button = document.createElement('button');
    button.className = 'gradient-load-more-btn';

    const icon = document.createElement('span');
    icon.className = 'load-more-icon';
    icon.textContent = '+';

    const text = document.createElement('span');
    text.textContent = 'Load more';

    button.appendChild(icon);
    button.appendChild(text);

    button.addEventListener('click', () => {
      displayedCount = Math.min(displayedCount + loadMoreIncrement, maxGradients);
      console.log('[GradientsRenderer] Load more - now showing:', displayedCount);
      render();
    });

    return button;
  }

  /**
   * Render the gradients view
   */
  function render() {
    console.log('[GradientsRenderer] Rendering', displayedCount, 'gradients');

    if (!container) {
      console.error('[GradientsRenderer] No container provided');
      return;
    }

    container.innerHTML = '';

    // Title + Filters
    const header = document.createElement('div');
    header.className = 'gradients-header';

    const title = document.createElement('h2');
    title.className = 'gradients-title';
    title.textContent = '1.5K color gradients';

    const filters = createFiltersSection();

    header.appendChild(title);
    header.appendChild(filters);
    container.appendChild(header);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'gradients-grid';

    const visibleGradients = gradients.slice(0, displayedCount);
    visibleGradients.forEach((gradient) => {
      const card = createGradientCard(gradient);
      grid.appendChild(card);
    });

    container.appendChild(grid);

    // Load More button (only if more gradients available)
    if (displayedCount < maxGradients) {
      const loadMoreBtn = createLoadMoreButton();
      container.appendChild(loadMoreBtn);
    }

    console.log('[GradientsRenderer] ✅ Render complete');
  }

  /**
   * Update method (for future use)
   */
  function update(newData) {
    console.log('[GradientsRenderer] Update called with:', newData);
    // For now, just re-render
    render();
  }

  // Initial render
  render();

  return {
    render,
    update,
  };
}

/**
 * Get 34 hardcoded gradients for POC
 */
function getHardcodedGradients() {
  return [
    { id: 'g1', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
    { id: 'g2', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
    { id: 'g3', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
    { id: 'g4', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
    { id: 'g5', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
    { id: 'g6', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
    { id: 'g7', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
    { id: 'g8', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
    { id: 'g9', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
    { id: 'g10', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
    { id: 'g11', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
    { id: 'g12', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
    { id: 'g13', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
    { id: 'g14', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
    { id: 'g15', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
    { id: 'g16', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
    { id: 'g17', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
    { id: 'g18', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
    { id: 'g19', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
    { id: 'g20', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
    { id: 'g21', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
    { id: 'g22', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
    { id: 'g23', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
    { id: 'g24', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
    // 10 more for load more (25-34)
    { id: 'g25', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
    { id: 'g26', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
    { id: 'g27', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
    { id: 'g28', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
    { id: 'g29', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
    { id: 'g30', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
    { id: 'g31', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
    { id: 'g32', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
    { id: 'g33', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
    { id: 'g34', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
  ];
}
