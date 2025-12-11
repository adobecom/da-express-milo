import {
  getLibs,
  getIconElementDeprecated,
} from '../../../../scripts/utils.js';
import createMiniPillOptionsSelector from '../customizationInputs/createMiniPillOptionsSelector.js';
import { createDrawerHead, closeDrawer } from './createDrawerContent.js';
import updateAllDynamicElements from '../../utilities/event-handlers.js';

let createTag;

export default async function createDrawerContentPaperType(
  customizationOptions,
  labelText,
  attributeName,
  productDetails,
  defaultValue,
  drawerType,
  drawerContainer,
) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const drawerHead = createDrawerHead('Select Paper Type');
  const drawerBody = createTag('div', { class: 'pdpx-drawer-body' });
  const defaultValueSafe = defaultValue || customizationOptions[0].name;

  const defaultValueOption = customizationOptions.find(
    (option) => option.name === defaultValueSafe,
  );
  const defaultValueImageSrc = new URL(defaultValueOption.thumbnail);
  defaultValueImageSrc.searchParams.set('max_dim', '1000');
  const defaultValueImageSrcLarge = defaultValueImageSrc.toString();
  const heroImageContainer = createTag('div', {
    class: 'pdpx-drawer-hero-image-container',
  });
  heroImageContainer.appendChild(
    createTag('img', {
      class: 'pdpx-drawer-hero-image',
      src: defaultValueImageSrcLarge,
      alt: defaultValueOption.title,
    }),
  );
  const titleRow = createTag('div', { class: 'pdpx-drawer-title-row' });
  const drawerTitle = createTag(
    'span',
    { class: 'pdpx-drawer-title' },
    defaultValueOption.title,
  );
  titleRow.appendChild(drawerTitle);
  const recommendedBadge = createTag(
    'span',
    { class: 'pdpx-recommended-badge' },
    'Recommended',
  );
  if (defaultValueSafe !== '175ptmatte') {
    recommendedBadge.style.visibility = 'hidden';
  }
  titleRow.appendChild(recommendedBadge);
  const pillsContainer = createTag('div', {
    class: 'pdpx-drawer-pills-container',
  });
  const specs = [
    defaultValueOption.thickness,
    defaultValueOption.weight,
    defaultValueOption.gsm,
  ].filter(Boolean);
  specs.forEach((spec) => {
    const pill = createTag('div', { class: 'pdpx-drawer-pill' });
    pill.append(
      getIconElementDeprecated('circle-check-mark'),
      createTag('span', { class: 'pdpx-drawer-pill-text' }, spec),
    );
    pillsContainer.appendChild(pill);
  });
  const argumentObject = {
    customizationOptions,
    labelText,
    attributeName,
    productDetails,
    defaultValue,
    drawerType,
  };
  const paperTypeSelectorContainer = await createMiniPillOptionsSelector(
    argumentObject,
  );
  const description = createTag('div', { class: 'pdpx-drawer-description' });
  description.innerHTML = defaultValueOption.description;
  const infoContainer = createTag('div', { class: 'pdpx-drawer-foot-info-container' });
  const infoText = createTag('div', { class: 'pdpx-drawer-foot-info-text' });
  infoText.appendChild(
    createTag('div', { class: 'pdpx-drawer-foot-info-name' }, defaultValueOption.title),
  );
  infoContainer.append(
    createTag('img', { src: defaultValueOption.thumbnail, alt: defaultValueOption.title }),
    infoText,
  );
  const selectButton = createTag('button', { class: 'pdpx-drawer-foot-select-button' }, 'Select');
  selectButton.addEventListener('click', () => {
    closeDrawer();
  });
  const drawerFoot = createTag('div', { class: 'pdpx-drawer-foot' });
  drawerFoot.append(infoContainer, selectButton);
  drawerBody.append(
    heroImageContainer,
    titleRow,
    pillsContainer,
    paperTypeSelectorContainer,
    description,
  );
  drawerContainer.append(drawerHead, drawerBody, drawerFoot);
}
