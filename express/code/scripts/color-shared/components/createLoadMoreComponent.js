/**
 * Load More Component
 * 
 * WIREFRAME FILE - Shows load more structure
 * 
 * Architecture Decision:
 * ✅ INCLUDED IN RENDERERS (not entry point)
 * 
 * Why?
 * - Pagination is variant-specific behavior
 * - Different variants may have different page sizes
 * - Renderer controls when/how to show more items
 * - Keeps entry point simple (no pagination logic)
 * 
 * Used By:
 * - Strips Renderer (Palettes) - loads 24, shows 10 more
 * - Gradients Renderer - loads 24, shows 10 more
 * 
 * Not Used By:
 * - Extract Renderer (no pagination needed)
 * 
 * Each Renderer:
 * 1. Creates this component in render()
 * 2. Appends after grid
 * 3. Handles click event
 * 4. Fetches more data or shows cached data
 * 5. Hides button when no more items
 */

import { createTag } from '../../../scripts/utils.js';

/**
 * Create load more button component
 * @param {Object} options - Configuration
 * @param {Function} options.onLoadMore - Load more callback
 * @param {number} options.remaining - Number of items remaining
 * @param {string} options.label - Button label
 * @returns {Object} Load more component with { element, updateRemaining, hide, show }
 */
export function createLoadMoreComponent(options = {}) {
  const {
    onLoadMore,
    remaining = 0,
    label = 'Load more',
  } = options;


  // 1. Create container
  const container = createTag('div', { class: 'load-more-container' });

  // 2. Create button
  const button = createTag('button', {
    class: 'load-more-button',
    type: 'button',
    'aria-label': `Load ${remaining} more items`,
  });

  // 3. Button content
  const buttonText = createTag('span', { class: 'button-text' });
  buttonText.textContent = remaining > 0 
    ? `${label} (${remaining})` 
    : label;

  // Optional: Loading spinner
  const spinner = createTag('span', { class: 'button-spinner' });
  spinner.style.display = 'none';
  spinner.innerHTML = '↻'; // Or use CSS spinner

  button.appendChild(buttonText);
  button.appendChild(spinner);

  // 4. Click handler
  let isLoading = false;

  button.addEventListener('click', async () => {
    if (isLoading) return;

    isLoading = true;

    // Show loading state
    buttonText.style.opacity = '0.5';
    spinner.style.display = 'inline-block';
    button.disabled = true;

    try {
      // Call callback
      await onLoadMore?.();
    } catch (error) {
      console.error('[LoadMoreComponent] ❌ Load more error:', error);
    } finally {
      // Hide loading state
      isLoading = false;
      buttonText.style.opacity = '1';
      spinner.style.display = 'none';
      button.disabled = false;
    }
  });

  container.appendChild(button);

  // 5. Hide if no remaining items
  if (remaining === 0) {
    container.style.display = 'none';
  }

  // 6. Public API
  return {
    element: container,
    
    // Update remaining count
    updateRemaining: (count) => {
      buttonText.textContent = count > 0 
        ? `${label} (${count})` 
        : label;
      button.setAttribute('aria-label', `Load ${count} more items`);
      
      if (count === 0) {
        container.style.display = 'none';
      } else {
        container.style.display = 'block';
      }
    },
    
    // Hide button
    hide: () => {
      container.style.display = 'none';
    },
    
    // Show button
    show: () => {
      container.style.display = 'block';
    },
    
    // Set loading state
    setLoading: (loading) => {
      isLoading = loading;
      button.disabled = loading;
      spinner.style.display = loading ? 'inline-block' : 'none';
      buttonText.style.opacity = loading ? '0.5' : '1';
    },
    
    // Cleanup
    destroy: () => {
      container.remove();
    },
  };
}

/**
 * USAGE EXAMPLE in Renderer:
 * 
 * // In createGradientsRenderer or createStripsRenderer:
 * 
 * function render(container) {
 *   // 1. Create grid
 *   const grid = createGrid();
 *   container.appendChild(grid);
 *   
 *   // 2. Create load more button
 *   const loadMore = createLoadMoreComponent({
 *     remaining: 10,  // 34 total - 24 shown = 10 remaining
 *     onLoadMore: async () => {
 *       const moreData = await fetchMoreData();
 *       renderMoreCards(moreData);
 *       loadMore.updateRemaining(0);  // No more left
 *     },
 *   });
 *   
 *   // 3. Append load more
 *   container.appendChild(loadMore.element);
 * }
 */
