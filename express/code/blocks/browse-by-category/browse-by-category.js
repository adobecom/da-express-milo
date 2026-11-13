import { decorateButtonsDeprecated, getLibs } from '../../scripts/utils.js';
import buildCarousel from '../../scripts/widgets/carousel.js';

let createTag;

export function decorateHeading(block, payload) {
  const headingSection = createTag('div', { class: 'browse-by-category-heading-section' });
  const heading = createTag('h3', { class: 'browse-by-category-heading' });
  const viewAllButtonWrapper = createTag('p', { class: 'browse-by-category-link-wrapper' });
  const subHeaderContent = payload.heading.match(/\((.+)\)/);
  let subheaderElement;
  if (subHeaderContent) {
    subheaderElement = createTag('div', { class: 'browse-by-category-sub-heading' });
    [, subheaderElement.textContent] = subHeaderContent;
    payload.heading = payload.heading.slice(0, subHeaderContent.index);
  }

  if (payload.viewAllLink.href !== '') {
    const viewAllButton = createTag('a', { class: 'browse-by-category-link', href: payload.viewAllLink.href });
    viewAllButton.setAttribute('aria-label', `${payload.viewAllLink.text} ${payload.heading}`);
    viewAllButton.textContent = payload.viewAllLink.text;
    viewAllButtonWrapper.append(viewAllButton);
  }
  if (payload.heading === 'null'
    || payload.heading === ''
    || payload.heading === 'undefined'
    || payload.heading === null) {
    heading.textContent = '';
  } else {
    heading.textContent = payload?.heading;
  }
  headingSection.append(heading);
  const headingContainer = createTag('div');
  headingContainer.append(heading);
  if (subheaderElement) headingContainer.append(subheaderElement);
  headingSection.append(headingContainer, viewAllButtonWrapper);

  block.append(headingSection);
}

function markImagesDecorative(picture) {
  picture?.querySelectorAll('img').forEach((img) => {
    img.setAttribute('alt', '');
    ['title', 'aria-label', 'aria-labelledby'].forEach((attr) => img.removeAttribute(attr));
  });
}

export function decorateCategories(block, payload) {
  const categoriesWrapper = createTag('div', { class: 'browse-by-category-categories-wrapper' });

  payload.categories.forEach((categoryCard) => {
    const category = createTag('div', { class: 'browse-by-category-card' });
    const categoryImageWrapper = createTag('div', { class: 'browse-by-category-image-wrapper' });
    const categoryImageShadowWrapper = createTag('div', { class: 'browse-by-category-image-shadow-wrapper' });
    const categoryImageShadow = createTag('div', { class: 'browse-by-category-image-shadow' });
    const categoryImage = categoryCard.image;
    markImagesDecorative(categoryImage);
    const categoryTitle = createTag('p', { class: 'browse-by-category-card-title' });
    const categoryAnchor = createTag('a', { class: 'browse-by-category-card-link' });

    categoryTitle.textContent = categoryCard.text;

    categoryAnchor.title = categoryCard.text;
    categoryAnchor.href = categoryCard.link;
    categoryImageShadowWrapper.append(categoryImageShadow, categoryImage);
    categoryImageWrapper.append(categoryImageShadowWrapper);
    category.append(categoryAnchor, categoryImageWrapper, categoryTitle);
    categoriesWrapper.append(category);
  });

  block.append(categoriesWrapper);
}

export default async function decorate(block) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  await decorateButtonsDeprecated(block);
  const rows = Array.from(block.children);
  const headingDiv = rows.shift();

  const payload = {
    heading: headingDiv.querySelector('h2, h3, h4') ? headingDiv.querySelector('h2, h3, h4').textContent.trim() : '',
    viewAllLink: {
      text: headingDiv.querySelector('a.button') ? headingDiv.querySelector('a.button').textContent.trim() : '',
      href: headingDiv.querySelector('a.button') ? headingDiv.querySelector('a.button').href : '',
    },
    categories: [],
  };

  rows.forEach((row) => {
    payload.categories.push({
      image: row.querySelector('picture'),
      text: row.querySelector('a')?.textContent.trim() || 'missing category text',
      link: row.querySelector('a')?.href || 'missing category link',
    });
  });

  block.replaceChildren();

  decorateHeading(block, payload);
  decorateCategories(block, payload);
  buildCarousel('.browse-by-category-card', block.querySelector('.browse-by-category-categories-wrapper') || block);

  if (block.classList.contains('fullwidth')) {
    const blockWrapper = block.parentNode;

    if (blockWrapper && blockWrapper.classList.contains('browse-by-category-wrapper')) {
      blockWrapper.classList.add('fullwidth');
    }
  }
}
