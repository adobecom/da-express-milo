/* eslint-disable import/named, import/extensions */

export const GRID_PAGE_SIZE = 12;

/**
 * Load the grid variant CSS stylesheet.
 */
export function loadGridStyles() {
  if (!document.querySelector('link[href*="blog-posts-v2-grid.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('./blog-posts-v2-grid.css', import.meta.url).href;
    document.head.append(link);
  }
}

/**
 * Create a template-x style load-more button for the grid variant.
 * @param {object} options
 * @param {Function} options.createTag - Tag creation utility
 * @param {Function} options.replaceKey - Localization key replacement utility
 * @param {Function} options.getConfig - Config getter utility
 * @param {Function} options.onLoadMore - Callback when load-more is clicked
 * @returns {Promise<HTMLElement>} The load-more container element
 */
export async function createGridLoadMore({
  createTag, replaceKey, getConfig, onLoadMore,
}) {
  const loadMoreDiv = createTag('div', { class: 'load-more' });
  const loadMoreStr = await replaceKey('load-more', getConfig());
  const buttonLabel = loadMoreStr !== 'load more' ? loadMoreStr : 'Load more';
  const loadMoreButton = createTag('button', { class: 'load-more-button', 'aria-label': buttonLabel });
  const loadMoreText = createTag('p', { class: 'load-more-text' });

  loadMoreButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 1v20M1 11h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

  loadMoreText.textContent = buttonLabel;

  loadMoreDiv.append(loadMoreButton, loadMoreText);

  loadMoreButton.addEventListener('click', async () => {
    loadMoreButton.classList.add('disabled');
    loadMoreDiv.remove();
    await onLoadMore();
  });

  return loadMoreDiv;
}
