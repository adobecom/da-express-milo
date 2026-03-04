/* eslint-disable import/named, import/extensions */
import { getLibs } from '../../scripts/utils.js';

export const GRID_PAGE_SIZE = 12;

let loadStyle;
let getLibConfig;

async function loadGridUtils() {
  if (!loadStyle || !getLibConfig) {
    ({ loadStyle, getConfig: getLibConfig } = await import(`${getLibs()}/utils/utils.js`));
  }
}

export async function loadGridStyles() {
  await loadGridUtils();
  const codeRoot = getLibConfig().codeRoot || '/express/code';
  const href = `${codeRoot}/blocks/blog-posts-v2/blog-posts-v2-grid.css`;

  if (!document.querySelector('link[href*="blog-posts-v2-grid.css"]')) {
    loadStyle(href);
  }
}

export async function createGridLoadMore({
  createTag, replaceKey, getConfig, onLoadMore,
}) {
  const loadMoreStr = await replaceKey('load-more', getConfig());
  const buttonLabel = loadMoreStr !== 'load more' ? loadMoreStr : 'Load more';
  const loadMore = createTag('button', {
    type: 'button',
    class: 'load-more button secondary',
    'aria-label': buttonLabel,
  });
  const iconWrapper = createTag('span', { class: 'load-more-icon', 'aria-hidden': 'true' });
  const text = createTag('span', { class: 'load-more-text' });
  text.textContent = buttonLabel;

  loadMore.append(iconWrapper, text);

  loadMore.addEventListener('click', async () => {
    loadMore.remove();
    await onLoadMore();
  });

  return loadMore;
}
