import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import templatePromoCarousel from '../template-promo-carousel/template-promo-carousel.js';

let createTag;
let getConfig;
let replaceKey;

function getStillWrapperIcons(templateType) {
  let planIcon = null;
  if (templateType === 'free') {
    planIcon = createTag('span', { class: 'free-tag' });
    planIcon.append('Free');
  } else {
    planIcon = getIconElementDeprecated('premium');
  }
  return { planIcon };
}

async function handleOneUp(blockElement, { imageElements, templateLinks, premiumTagsElements }) {
  const parent = blockElement.parentElement;
  parent.classList.add('one-up');
  const img = imageElements[0];
  const templateType = premiumTagsElements[0]?.textContent?.trim().toLowerCase();

  // Create image wrapper following the same pattern as template rendering
  const imgWrapper = createTag('div', { class: 'image-wrapper' });

  if (img && img.parentElement) {
    img.parentElement.insertBefore(imgWrapper, img);
    imgWrapper.append(img);
  }

  // Get and append the plan icon to the image wrapper
  const { planIcon } = getStillWrapperIcons(templateType);
  if (planIcon) {
    imgWrapper.append(planIcon);
  }

  const templateEditLink = templateLinks[0];
  templateEditLink.style.display = 'none';

  const editThisTemplate = await replaceKey('edit-this-template', getConfig()) ?? 'Edit this template';
  const editTemplateButton = createTag('a', {
    href: templateEditLink?.href,
    title: `${editThisTemplate} ${img?.alt}`,
    class: 'button accent',
    'aria-label': `${editThisTemplate} ${img?.alt}`,
  });

  editTemplateButton.textContent = await replaceKey('edit-this-template', getConfig()) ?? 'Edit this template';
  const buttonContainer = createTag('section', { class: 'button-container' });
  buttonContainer.append(editTemplateButton);

  parent.append(buttonContainer);
}

export default async function decorate(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`)]).then(([utils, placeholders]) => {
    const { createTag: createTagUtil, getConfig: getConfigUtil } = utils;
    const { replaceKey: replaceKeyUtil } = placeholders;
    createTag = createTagUtil;
    getConfig = getConfigUtil;
    replaceKey = replaceKeyUtil;
  });

  block.parentElement.classList.add('ax-template-promo');

  const templateLinks = [...(block?.querySelectorAll('a') || [])];
  const imageElements = [...(block?.querySelectorAll('picture > img') || [])];
  const premiumTagsElements = [...(block?.querySelectorAll('h4') || [])];
  premiumTagsElements.forEach((tag) => {
    tag.style.display = 'none';
  });
  const isOneUp = imageElements.length === 1;
  const variantsData = { imageElements, templateLinks, premiumTagsElements };

  // INIT LOGIC
  isOneUp
    ? handleOneUp(block, variantsData)
    : templatePromoCarousel(block, variantsData);
}
