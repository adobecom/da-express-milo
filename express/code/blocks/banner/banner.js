import { getLibs, fixIcons, decorateButtonsDeprecated } from '../../scripts/utils.js';
import { formatSalesPhoneNumber } from '../../scripts/utils/location-utils.js';
import { normalizeHeadings } from '../../scripts/utils/decorate.js';

let createTag;

export default async function decorate(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`), decorateButtonsDeprecated(block)]).then(([utils]) => {
    ({ createTag } = utils);
  });
  const section = block.closest('.section');
  if (section?.style?.background) block.style.background = section.style.background;

  const isBannerLightVariant = block.classList.contains('light');
  const isBannerStandoutVariant = block.classList.contains('standout');
  const isBannerCoolVariant = block.classList.contains('cool');

  if (isBannerStandoutVariant) {
    const contentContainer = createTag('div', { class: 'content-container' });
    for (const child of block.children) {
      contentContainer.append(child);
    }
    block.replaceChildren(contentContainer);
  } else if (isBannerCoolVariant) {
    const wrapperEl = createTag('div', { class: 'wrapper' });
    const contentContainer = createTag('div', { class: 'content-container' });

    wrapperEl.append(contentContainer);

    for (const child of block.children) {
      contentContainer.append(child);
    }
    block.replaceChildren(wrapperEl);
  }

  normalizeHeadings(block, ['h2', 'h3']);
  const buttons = block.querySelectorAll('a.button');
  if (buttons.length > 1) {
    block.classList.add('multi-button');
  }
  // button on dark background
  buttons.forEach((button) => {
    button.classList.remove('primary');
    button.classList.remove('secondary');

    if (isBannerStandoutVariant || isBannerCoolVariant) {
      button.classList.remove('accent');
      button.classList.add('large', 'primary');
    } else if (isBannerLightVariant) {
      button.classList.remove('accent');
      button.classList.add('large', 'primary', 'reverse');
    } else {
      button.classList.add('accent', 'dark');
      if (block.classList.contains('multi-button')) {
        button.classList.add('reverse');
      }
    }

    if (!button.getAttribute('aria-label')) {
      const label = button.textContent?.trim() || button.title;
      if (label) button.setAttribute('aria-label', label);
    }
  });

  const phoneNumberTags = block.querySelectorAll('a[title="{{business-sales-numbers}}"]');
  if (phoneNumberTags.length > 0) {
    try {
      await formatSalesPhoneNumber(phoneNumberTags);
    } catch (error) {
      window.lana?.log(`Error fetching sales phones numbers: ${error.message}`, { tags: 'banner', severity: 'error' });
    }
  }
  fixIcons(block);
}
