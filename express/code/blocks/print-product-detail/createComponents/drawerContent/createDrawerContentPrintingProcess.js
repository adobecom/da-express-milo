import { getLibs, getIconElementDeprecated } from '../../../../scripts/utils.js';
import { createDrawerHead } from './createDrawerContent.js';

let createTag;

export default async function createDrawerContentPrintingProcess(productDetails, drawerContainer) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const drawerHead = createDrawerHead('Printing Process');
  const drawerBody = createTag('div', { class: 'pdpx-drawer-body' });

  const printingProcessOptionsContainer = createTag('div', { class: 'pdpx-printing-process-options-container' });
  const classicPrintingOptionsContainer = createTag('div', { class: 'pdpx-printing-process-option-container' });
  const classicPrintingImageContainer = createTag('div', { class: 'pdpx-printing-process-option-image-container' });
  const classicPrintingInfoContainer = createTag('div', { class: 'pdpx-printing-process-option-info-container' });
  const classicPrintingColorLockup = createTag('div', { class: 'pdpx-printing-process-option-color-lockup' });
  classicPrintingColorLockup.append(getIconElementDeprecated('cmyk_droplet_cyan'), getIconElementDeprecated('cmyk_droplet_magenta'), getIconElementDeprecated('cmyk_droplet_yellow'), getIconElementDeprecated('cmyk_droplet_black'), productDetails.classicPrintingSummary);

  classicPrintingInfoContainer.appendChild(createTag('span', { class: 'pdpx-printing-process-option-info-title' }, productDetails.classicPrintingTitle));
  classicPrintingInfoContainer.appendChild(createTag('p', { class: 'pdpx-printing-process-option-info-description' }, productDetails.classicPrintingDescription));
  classicPrintingInfoContainer.appendChild(classicPrintingColorLockup);
  classicPrintingImageContainer.appendChild(createTag('img', { class: 'pdpx-printing-process-option-image', src: 'https://asset.zcache.com/assets/graphics/pd/productAttributeHelp/underbasePrintProcess/Classic.jpg', alt: 'Classic Printing' }));
  classicPrintingOptionsContainer.append(
    classicPrintingImageContainer,
    classicPrintingInfoContainer,
  );

  const vividPrintingOptionsContainer = createTag('div', { class: 'pdpx-printing-process-option-container' });
  const vividPrintingImageContainer = createTag('div', { class: 'pdpx-printing-process-option-image-container' });
  const vividPrintingInfoContainer = createTag('div', { class: 'pdpx-printing-process-option-info-container' });
  const vividPrintingColorLockup = createTag('div', { class: 'pdpx-printing-process-option-color-lockup' });
  vividPrintingColorLockup.append(getIconElementDeprecated('cmyk_droplet_cyan'), getIconElementDeprecated('cmyk_droplet_magenta'), getIconElementDeprecated('cmyk_droplet_yellow'), getIconElementDeprecated('cmyk_droplet_black'), getIconElementDeprecated('cmyk_droplet_white'), productDetails.vividPrintingSummary);
  vividPrintingInfoContainer.appendChild(createTag('span', { class: 'pdpx-printing-process-option-info-title' }, productDetails.vividPrintingTitle));
  vividPrintingInfoContainer.appendChild(createTag('p', { class: 'pdpx-printing-process-option-info-description' }, productDetails.vividPrintingDescription));
  vividPrintingInfoContainer.appendChild(vividPrintingColorLockup);
  vividPrintingImageContainer.appendChild(createTag('img', { class: 'pdpx-printing-process-option-image', src: 'https://asset.zcache.com/assets/graphics/pd/productAttributeHelp/underbasePrintProcess/Vivid.jpg', alt: 'Vivid Printing' }));
  vividPrintingOptionsContainer.append(vividPrintingImageContainer, vividPrintingInfoContainer);

  printingProcessOptionsContainer.append(
    classicPrintingOptionsContainer,
    vividPrintingOptionsContainer,
  );
  drawerBody.appendChild(printingProcessOptionsContainer);
  drawerContainer.append(drawerHead, drawerBody);
}
