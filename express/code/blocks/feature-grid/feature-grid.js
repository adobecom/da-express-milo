import { getLibs } from '../../scripts/utils.js';
import { isVideoLink } from '../../scripts/widgets/video.js';

let createTag;
let createOptimizedVideo;

function renderImageOrVideo(media, container) {
  let updatedMedia;
  if (media.tagName.toUpperCase() === 'PICTURE') {
    updatedMedia = media.querySelector('img');
  } else if (!media?.href) {
    return null;
  } else if (isVideoLink(media?.href)) {
    // Use centralized video utility for consistent preload strategy
    // Even autoplay videos should respect preload="none" if below fold
    updatedMedia = createOptimizedVideo({
      src: media.href,
      container,
      attributes: {
        class: 'hero-animation-background',
        playsinline: '',
        autoplay: '',
        loop: '',
        muted: '',
      },
    });
  }
  return updatedMedia;
}

function renderGridNode({
  media,
  title,
  subText,
  cta,
}, index, colorProperties) {
  const gridItem = createTag('a', { class: `grid-item item-${index + 1}` });
  const updatedMedia = renderImageOrVideo(media, gridItem);
  gridItem.href = cta?.href;

  if (title) gridItem.append(title);
  if (subText) gridItem.append(subText);
  if (cta) {
    cta.classList.add('cta');
    cta.classList.remove('button');
    gridItem.append(cta);
  }
  if (colorProperties['card-image']) {
    gridItem.style = `background-image:${colorProperties['card-image']}; background-size: auto;`;
  }

  if (colorProperties['card-color']) {
    gridItem.style = `background-color:${colorProperties['card-color']}; background-image:none`;
  }
  if (index < 4) {
    gridItem.append(updatedMedia);
  } else {
    gridItem.prepend(updatedMedia);
  }
  return gridItem;
}

const decorateLoadMoreSection = (block, loadMoreInfo) => {
  const loadMoreWrapper = createTag('div', { class: 'load-more-div' });
  const loadMoreButton = createTag('button', { class: 'load-more-button' });
  const loadMoreText = createTag('span', { class: 'load-more-text' });
  const toggleChev = createTag('div', { class: 'load-more-chev' });

  [loadMoreText.textContent] = loadMoreInfo.text;
  loadMoreButton.append(loadMoreText, toggleChev);
  loadMoreWrapper.append(loadMoreButton);
  block.append(loadMoreWrapper);

  loadMoreButton.addEventListener('click', () => {
    block.classList.toggle('expanded');
    if (block.classList.contains('expanded')) {
      [, loadMoreText.textContent] = loadMoreInfo.text;
    } else {
      [loadMoreText.textContent] = loadMoreInfo.text;
    }
  });
};

function getLoadMoreText(rows) {
  const loadMoreText = rows.pop().textContent.split('|').map((item) => item.trim());
  const loadMore = { text: loadMoreText };
  return loadMore;
}

const extractProperties = (block) => {
  const possibleColorRow = Array.from(block.querySelectorAll(':scope > div'))[1];
  const content = possibleColorRow?.innerText.trim();
  const allProperties = {};
  if (content.charAt(0) === ('#')) {
    allProperties['card-color'] = content;
    possibleColorRow.remove();
  } else if (content.includes('linear-gradient')) {
    allProperties['card-image'] = content;
    block.removeChild(possibleColorRow);
  }
  return allProperties;
};

export default async function decorate(block) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  ({ createOptimizedVideo } = await import('../../scripts/utils/video.js'));
  const colorProperties = extractProperties(block);
  const inputRows = block.querySelectorAll(':scope > div > div');
  block.innerHTML = '';
  const rows = Array.from(inputRows);
  const heading = rows.shift();
  const loadMoreSection = rows.length > 4 ? getLoadMoreText(rows) : null;
  const gridProps = rows.map((row) => {
    const subText = row.querySelector('p');
    const media = row.querySelector('p:last-of-type > a, p:last-of-type > picture');
    const title = row.querySelector('h2');
    const cta = row.querySelector('a');
    return {
      media,
      title,
      subText,
      cta,
    };
  });

  const gridContainer = createTag('div', { class: 'grid-container' });
  const gridItems = gridProps.map((props, index) => renderGridNode(props, index, colorProperties));
  heading.classList.add('heading');

  gridItems.forEach((gridItem) => {
    gridContainer.append(gridItem);
  });

  block.append(heading, gridContainer);

  if (gridProps.length > 4) {
    decorateLoadMoreSection(block, loadMoreSection);
  }
}
