import { getLibs, getIconElementDeprecated } from '../../../scripts/utils.js';
import { formatProductDescriptions } from '../utilities/data-formatting.js';
import BlockMediator from '../../../scripts/block-mediator.min.js';
import axAccordionDecorate from '../../ax-accordion/ax-accordion.js';
import { detectMobile } from '../utilities/utility-functions.js';
import stickyPromoBar from '../../sticky-promo-bar/sticky-promo-bar.js';

let createTag;
let loadStyle;
let getConfig;

export default async function createProductDetailsSection(productDescriptions) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const productDetailsSectionContainer = createTag('div', {
    class: 'pdpx-product-details-section',
  });
  const productDetailsSectionTitleContainer = createTag('div', {
    class: 'pdpx-product-details-section-title-container',
  });
  const productDetailsSectionTitle = createTag(
    'span',
    { class: 'pdpx-product-details-section-title' },
    'Product Details',
  );
  productDetailsSectionTitleContainer.appendChild(productDetailsSectionTitle);
  productDetailsSectionContainer.appendChild(
    productDetailsSectionTitleContainer,
  );
  const accordionBlock = createTag('div', {
    class: 'ax-accordion pdpx-product-details-accordion',
  });
  const mapToAccordionFormat = (descriptions) => descriptions.map((item) => ({
    title: item.title,
    content: item.description,
  }));
  accordionBlock.accordionData = mapToAccordionFormat(productDescriptions);
  await axAccordionDecorate(accordionBlock);
  productDetailsSectionContainer.appendChild(accordionBlock);
  const formFieldToAccordionTitle = {
    media: 'Paper',
    cornerstyle: 'Corner Style',
    style: 'Size',
    qty: null,
  };
  BlockMediator.subscribe('product:updated', (e) => {
    const { attributes, formData } = e.newValue || {};
    if (!attributes || !formData) return;
    const oldFormData = e.oldValue?.formData || {};
    let changedField = null;
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== oldFormData[key]) {
        changedField = key;
      }
    });
    const updatedDescriptions = formatProductDescriptions(attributes, formData);
    const mappedData = mapToAccordionFormat(updatedDescriptions);
    const forceExpandTitle = changedField
      ? formFieldToAccordionTitle[changedField]
      : null;
    accordionBlock.updateAccordion(mappedData, forceExpandTitle);
  });
  return productDetailsSectionContainer;
}

export function createAssuranceLockup() {
  const config = getConfig();
  const { ietf } = config.locale;
  const assuranceLockupContainer = createTag('div', {
    class: 'pdpx-assurance-lockup-container',
  });
  const assuranceLockupItem1 = createTag('div', {
    class: 'pdpx-assurance-lockup-item',
  });
  const assuranceLockupItem1Icon = getIconElementDeprecated('shield_check_icon');
  const assuranceLockupItem1Text = createTag(
    'span',
    { class: 'pdpx-assurance-lockup-item-text' },
    '100% satisfaction guarantee',
  );
  const assuranceLockupItem2 = createTag('div', {
    class: 'pdpx-assurance-lockup-item',
  });
  const assuranceLockupItem2Icon = getIconElementDeprecated('print_icon');
  const assuranceLockupItem2Text = createTag(
    'span',
    { class: 'pdpx-assurance-lockup-item-text' },
    'Made and printed in the USA',
  );
  const sentinelDiv = createTag('div', {
    id: 'pdpx-checkout-button-sentinel-div',
  });
  assuranceLockupItem1.append(
    assuranceLockupItem1Icon,
    assuranceLockupItem1Text,
  );

  assuranceLockupItem2.append(
    assuranceLockupItem2Icon,
    assuranceLockupItem2Text,
  );
  assuranceLockupContainer.appendChild(assuranceLockupItem1);
  if (ietf === 'en-US') {
    assuranceLockupContainer.appendChild(assuranceLockupItem2);
  }
  assuranceLockupContainer.appendChild(sentinelDiv);
  return assuranceLockupContainer;
}

export function createCheckoutButtonHref(templateId, parameters, productType) {
  const productSettingsString = JSON.stringify(parameters);
  const encodedParametersString = encodeURIComponent(productSettingsString);
  const taskIdMap = {
    zazzle_shirt: 'tshirt',
    zazzle_businesscard: 'businesscard',
  };
  const taskId = taskIdMap[productType] || productType;
  const urlParams = new URLSearchParams({
    category: 'templates',
    taskId,
    loadPrintAddon: 'true',
    print: 'true',
    action: 'customize-and-print-zazzle-iframe',
    source: 'a.com-print-and-deliver-seo',
    entryPoint: 'a.com-print-and-deliver-seo',
    mv: 'other',
    url: 'express/print',
  });
  const urlParamsString = urlParams.toString();
  const urlParamsStringFinal = `${urlParamsString}&productSettings=${encodedParametersString}`;
  const checkoutButtonHref = `https://new.express.adobe.com/design-remix/template/${templateId}?${urlParamsStringFinal}`;
  return checkoutButtonHref;
}

export function setupCheckoutGradientToggle() {
  const wrapper = document.querySelector('.pdpx-product-info-wrapper');
  const button = document.getElementById('pdpx-checkout-button-container');
  const sentinel = document.getElementById('pdpx-checkout-button-sentinel-div');
  if (!wrapper || !button || !sentinel) return;
  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        button.classList.add('hide-gradient');
      } else {
        button.classList.remove('hide-gradient');
      }
    },
    { root: wrapper, threshold: 1.0, rootMargin: '0px 0px -48px 0px' },
  );
  io.observe(sentinel);
}

export async function createCheckoutButton(productDetails) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`)]).then(([utils]) => {
    ({ createTag, getConfig, loadStyle } = utils);
  });
  const config = getConfig();
  await new Promise((resolve) => {
    loadStyle(
      `${config.codeRoot}/blocks/sticky-promo-bar/sticky-promo-bar.css`,
      resolve,
    );
  });
  const defaultURL = `https://new.express.adobe.com/design-remix/template/${productDetails.templateId}`;
  const validRegions = ['en-US', 'en-GB'];
  const outOfRegion = !validRegions.includes(productDetails.region);
  const isMobile = detectMobile();
  let CTAText;
  const CTATextMobile = "Print with Adobe Express isn't available on mobile. Open on desktop to get started.";
  const CTATextDesktop = 'Customize and print it';
  const CTATextOutOfRegion = 'Print with Adobe Express isn’t available yet in your region. Check back soon!';
  if (outOfRegion) {
    CTAText = CTATextOutOfRegion;
  } else if (isMobile) {
    CTAText = CTATextMobile;
  } else {
    CTAText = CTATextDesktop;
  }
  const CTATextContainer = createTag(
    'span',
    { class: 'pdpx-checkout-button-cta-text-container' },
    CTAText,
  );
  const buttonDisabled = outOfRegion || isMobile;
  const checkoutButtonContainer = createTag('div', {
    class: 'pdpx-checkout-button-container',
    id: 'pdpx-checkout-button-container',
  });
  const checkoutButton = createTag('a', {
    class: 'pdpx-checkout-button',
    id: 'pdpx-checkout-button',
    href: defaultURL,
  });
  if (buttonDisabled) {
    checkoutButtonContainer.classList.add('pdpx-checkout-button-disabled');
  }
  const CTAIcon = createTag('img', {
    class: 'pdpx-checkout-button-icon',
    src: '/express/code/icons/print-icon.svg',
    width: '22',
    height: '22',
    alt: 'Print icon',
  });
  const CTATextElement = createTag(
    'span',
    { class: 'pdpx-checkout-button-text' },
    CTAText,
  );
  const checkoutButtonSubhead = createTag('div', {
    class: 'pdpx-checkout-button-subhead',
  });
  const checkoutButtonSubheadImage = createTag('img', {
    class: 'pdpx-checkout-button-subhead-image',
    src: '/express/code/icons/powered-by-zazzle.svg',
    alt: 'Zazzle logo',
    width: '123',
    height: '14',
  });
  const checkoutButtonSubheadLink = createTag(
    'a',
    {
      class: 'pdpx-checkout-button-subhead-link',
      href: 'https://www.zazzle.com/returns',
    },
    'Returns guaranteed',
  );
  const checkoutButtonSubheadText = createTag(
    'span',
    { class: 'pdpx-checkout-button-subhead-text' },
    'through 100% satisfaction promise.',
  );
  if (!buttonDisabled) {
    checkoutButton.append(CTAIcon);
  }
  checkoutButton.append(CTATextElement);
  checkoutButtonSubhead.append(
    checkoutButtonSubheadImage,
    checkoutButtonSubheadLink,
    checkoutButtonSubheadText,
  );
  if (buttonDisabled) {
    const stickyPromoBarContent = createTag('div', {
      class: 'sticky-promo-bar rounded',
    });
    const stickyPromoBarTextContainer = createTag('div');
    stickyPromoBarTextContainer.appendChild(CTATextContainer);
    stickyPromoBarContent.appendChild(stickyPromoBarTextContainer);
    await stickyPromoBar(stickyPromoBarContent);
    // Sticky bar is moved to end of main by sticky-promo-bar.js for correct stacking order
  } else {
    checkoutButtonContainer.append(checkoutButton, checkoutButtonSubhead);
  }
  return checkoutButtonContainer;
}
