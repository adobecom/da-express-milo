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
 * Create a load-more button for the grid variant using secondary button style.
 * @param {object} options
 * @param {Function} options.createTag - Tag creation utility
 * @param {Function} options.replaceKey - Localization key replacement utility
 * @param {Function} options.getConfig - Config getter utility
 * @param {Function} options.onLoadMore - Callback when load-more is clicked
 * @returns {Promise<HTMLElement>} The load-more anchor element
 */
export async function createGridLoadMore({
  createTag, replaceKey, getConfig, onLoadMore,
}) {
  const loadMoreStr = await replaceKey('load-more', getConfig());
  const buttonLabel = loadMoreStr !== 'load more' ? loadMoreStr : 'Load more';
  const loadMore = createTag('a', {
    class: 'load-more button secondary',
    href: '#',
    'aria-label': buttonLabel,
  });

  loadMore.innerHTML = `<span class="load-more-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 1v20M1 11h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg></span><span class="load-more-text">${buttonLabel}</span>`;

  loadMore.addEventListener('click', async (event) => {
    event.preventDefault();
    loadMore.classList.add('disabled');
    loadMore.remove();
    await onLoadMore();
  });

  return loadMore;
}
