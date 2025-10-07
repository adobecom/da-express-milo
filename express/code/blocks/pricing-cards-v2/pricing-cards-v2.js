import {
  getLibs,
  fixIcons,
  addTempWrapperDeprecated, decorateButtonsDeprecated,
} from '../../scripts/utils.js';
import { debounce } from '../../scripts/utils/hofs.js';
import { formatSalesPhoneNumber } from '../../scripts/utils/location-utils.js';
import {
  formatDynamicCartLink,
  shallSuppressOfferEyebrowText,
  fetchPlanOnePlans,
} from '../../scripts/utils/pricing.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

let createTag; let getConfig;
let replaceKeyArray;

const blockKeys = [
  'header',
  'borderParams',
  'explain',
  'mPricingRow',
  'mCtaGroup',
  'featureList',
  'compare',
];
const SAVE_PERCENTAGE = '((savePercentage))';
const SALES_NUMBERS = '((business-sales-numbers))';
const PRICE_TOKEN = '((pricing))';
const YEAR_2_PRICING_TOKEN = '[[year-2-pricing-token]]';
const BASE_PRICING_TOKEN = '[[base-pricing-token]]';

function tagFreePlan(cardContainer) {
  const cards = Array.from(cardContainer.querySelectorAll('.card'));
  let disableAllToggles = true;
  const freePlanStatus = [];

  for (const card of cards) {
    let isFreePlan = true;
    const pricingSections = card.querySelectorAll('.pricing-section');
    for (const section of pricingSections) {
      const price = section.querySelector('.pricing-price > strong')?.textContent;
      if (price && parseInt(price, 10) > 0) {
        isFreePlan = false;
        disableAllToggles = false;
        break;
      }
    }
    freePlanStatus.push(isFreePlan ? card.querySelector('.billing-toggle') : undefined);
  }

  freePlanStatus.forEach((billingToggle) => {
    if (disableAllToggles && billingToggle) {
      billingToggle.remove();
    } else if (billingToggle) {
      billingToggle.classList.add('suppressed-billing-toggle');
    }
  });
}

function suppressOfferEyebrow(specialPromo) {
  if (specialPromo.parentElement) {
    specialPromo.className = 'hide';
    specialPromo.parentElement.className = '';
    specialPromo.parentElement.classList.add('card-border');
    specialPromo.remove();
  }
}

async function getPriceElementSuffix(placeholderArr, response) {
  const cleanPlaceholderArr = placeholderArr.map((placeholder) => placeholder.replace('((', '').replace('))', ''));
  const placeholdersResponse = await replaceKeyArray(cleanPlaceholderArr, getConfig());

  return cleanPlaceholderArr.map((key, i) => (key.includes('vat') && !response.showVat
    ? ''
    : placeholdersResponse[i] || '')).join(' ');
}

// eslint-disable-next-line default-param-last
function handlePriceToken(pricingArea, priceToken = YEAR_2_PRICING_TOKEN, newPrice, priceSuffix = '') {
  try {
    const paragraphs = Array.from(pricingArea.querySelectorAll('p'))
      .filter((p) => p.textContent.includes(priceToken));
    if (paragraphs.length === 0) return;
    const hasPrice = newPrice !== undefined && newPrice !== null && `${newPrice}` !== '';
    const replacement = [newPrice, priceSuffix].filter(Boolean).join(' ');
    paragraphs.forEach((p) => {
      if (hasPrice) {
        p.innerHTML = p.innerHTML.replaceAll(priceToken, replacement);
      } else if (p.textContent.trim() === priceToken) {
        p.textContent = '';
      } else {
        p.innerHTML = p.innerHTML.replaceAll(priceToken, '');
      }
    });
  } catch (e) {
    window.lana.log(e);
  }
}

function handleSpecialPromo(
  specialPromo,
  isPremiumCard,
  response,
) {
  if (specialPromo?.textContent.includes(SAVE_PERCENTAGE)) {
    const offerTextContent = specialPromo.textContent;
    const shouldSuppress = shallSuppressOfferEyebrowText(
      response.savePer,
      offerTextContent,
      isPremiumCard,
      true,
      response.offerId,
    );

    if (shouldSuppress) {
      suppressOfferEyebrow(specialPromo);
    } else {
      specialPromo.innerHTML = specialPromo.innerHTML.replace(
        SAVE_PERCENTAGE,
        response.savePer,
      );
    }
  }
  if (
    !isPremiumCard
    && specialPromo?.parentElement?.classList?.contains('special-promo')
  ) {
    specialPromo.parentElement.classList.remove('special-promo');
    if (specialPromo.parentElement.firstChild.innerHTML !== '') {
      specialPromo.parentElement.firstChild.remove();
    }
  }
}

function handleSavePercentage(savePercentElem, isPremiumCard, response) {
  if (savePercentElem) {
    const offerTextContent = savePercentElem.textContent;
    if (
      shallSuppressOfferEyebrowText(
        response.savePer,
        offerTextContent,
        isPremiumCard,
        true,
        response.offerId,
      )
    ) {
      savePercentElem.remove();
    } else {
      savePercentElem.innerHTML = savePercentElem.innerHTML.replace(
        SAVE_PERCENTAGE,
        response.savePer,
      );
    }
  }
}

function handlePriceSuffix(priceEl, priceSuffix, priceSuffixTextContent) {
  const parentP = priceEl.parentElement;
  if (parentP.children.length > 1) {
    Array.from(parentP.childNodes).forEach((node) => {
      if (node === priceEl) return;
      if (node.nodeName === '#text') {
        priceSuffix.append(node);
      } else {
        priceSuffix.before(node);
      }
    });
  } else {
    priceSuffix.textContent = priceSuffixTextContent;
  }
}

async function handleRawPrice(price, basePrice, response, priceSuffix, priceRow) {
  const [priceReduced, priceWas, priceNow] = await replaceKeyArray([
    'price-reduced',
    'price-was',
    'price-now',
  ], getConfig());
  price.innerHTML = response.formatted;
  basePrice.innerHTML = response.formattedBP || '';
  if (response.price?.length > 6) {
    price.classList.add('long-price');
    basePrice.classList.add('long-price');
  }
  if (basePrice.innerHTML !== '') {
    price.classList.add('price-active');

    const priceReducedElement = createTag('p');

    const reducedText = createTag('span', { class: 'visually-hidden' });
    reducedText.textContent = priceReduced;
    priceReducedElement.appendChild(reducedText);

    const del = createTag('del');
    const wasText = createTag('span', { class: 'visually-hidden' });
    wasText.textContent = priceWas;
    priceReducedElement.appendChild(wasText);
    del.appendChild(basePrice.cloneNode(true));
    priceReducedElement.appendChild(del);

    const ins = createTag('ins');
    const nowText = createTag('span', { class: 'visually-hidden' });
    nowText.textContent = priceNow;
    priceReducedElement.appendChild(nowText);
    ins.appendChild(price.cloneNode(true));
    priceReducedElement.appendChild(ins);
    priceRow.append(priceReducedElement, priceSuffix);
  } else {
    price.classList.remove('price-active');
    priceRow.append(price, priceSuffix);
  }
}

async function handlePrice(pricingArea, specialPromo, groupID) {
  const priceEl = Array.from(pricingArea.querySelectorAll('a')).find((anchor) => anchor.textContent === PRICE_TOKEN);

  const pricingBtnContainer = pricingArea.querySelector('.action-area, .button-container');
  if (!pricingBtnContainer) return;
  if (!priceEl) return;

  const pricingSuffixTextElem = pricingBtnContainer.nextElementSibling;
  const placeholderArr = pricingSuffixTextElem.textContent?.split(' ');

  const priceRow = createTag('div', { class: 'pricing-row' });
  const price = createTag('span', { class: 'pricing-price' });
  const basePrice = createTag('span', { class: 'pricing-base-price' });
  const priceSuffix = createTag('div', { class: 'pricing-row-suf' });

  const response = await fetchPlanOnePlans(priceEl?.href);
  if (response.term && groupID) {
    BlockMediator.set(groupID, response.term);
  }

  const priceSuffixTextContent = await getPriceElementSuffix(
    placeholderArr,
    response,
  );

  const isPremiumCard = response.ooAvailable || false;
  const savePercentElem = pricingArea.querySelector('.card-offer');
  handlePriceSuffix(priceEl, priceSuffix, priceSuffixTextContent);
  handleRawPrice(price, basePrice, response, priceSuffix, priceRow);
  handleSavePercentage(savePercentElem, isPremiumCard, response);
  handleSpecialPromo(specialPromo, isPremiumCard, response);
  handlePriceToken(pricingArea, YEAR_2_PRICING_TOKEN, response.y2p, priceSuffixTextContent);
  handlePriceToken(pricingArea, BASE_PRICING_TOKEN, response.formattedBP);
  priceEl?.parentNode?.remove();
  if (!priceRow) return;
  pricingArea.prepend(priceRow);
  pricingBtnContainer?.remove();
  pricingSuffixTextElem?.remove();
}

async function createPricingSection(
  header,
  pricingArea,
  ctaGroup,
  specialPromo,
  groupID,
) {
  const pricingSection = createTag('div', { class: 'pricing-section' });
  pricingArea.classList.add('pricing-area');
  const offer = pricingArea.querySelector(':scope > p > i');
  if (offer) {
    offer.classList.add('card-offer');
    offer.parentElement.outerHTML = offer.outerHTML;
  }
  await handlePrice(pricingArea, specialPromo, groupID);

  ctaGroup.classList.add('card-cta-group');
  ctaGroup.querySelectorAll('a').forEach((a, i) => {
    a.classList.add('large');
    if (i === 1) a.classList.add('secondary');
    if (a.parentNode.tagName.toLowerCase() === 'strong' || a.getAttribute('href').includes('adobesparkpost.app.link')) {
      a.classList.add('button', 'primary');
      a.parentNode.remove();
    }
    if (a.parentNode.tagName.toLowerCase() === 'p') {
      a.parentNode.remove();
    }

    const headerText = header?.querySelector('h2')?.textContent;
    a.setAttribute('aria-label', `${a.textContent.trim()} ${headerText}`);
    formatDynamicCartLink(a);
    ctaGroup.append(a);
  });
  const texts = pricingArea.querySelectorAll(':scope > p');
  if (texts) {
    texts.forEach((text) => {
      text.classList.add('description-text');
    });
  }
  pricingSection.append(pricingArea);
  pricingSection.append(ctaGroup);
  return pricingSection;
}

function readBraces(inputString, cardBorder) {
  if (!inputString) {
    return null;
  }

  // Pattern to find ((...))
  const pattern = /\(\((.*?)\)\)/g;
  const matches = Array.from(inputString.trim().matchAll(pattern));

  if (matches.length > 0) {
    const [token, promoType] = matches[matches.length - 1];
    let specialPromo = createTag('div');
    const textContent = inputString?.split(token)[0]?.trim();
    cardBorder.classList.add(promoType.replaceAll(' ', ''));
    if (textContent && textContent.length > 0) {
      specialPromo = createTag('h2');
      specialPromo.textContent = textContent;
      cardBorder.append(specialPromo);
      return specialPromo;
    }
    return null;
  }
  return null;
}

function decorateHeader(header, borderParams, card, cardBorder) {
  const h2 = header.querySelector('h2');
  const headerImage = h2?.querySelector('img');
  const h2Text = h2?.innerText.trim();
  const h3 = createTag('h3');
  h3.innerText = h2Text;

  if (headerImage) h3.append(headerImage);
  header.append(h3);
  h2?.remove();

  // The raw text extracted from the word doc
  header.classList.add('card-header');
  const specialPromo = readBraces(borderParams?.innerText, cardBorder);
  borderParams?.remove();
  const premiumIcon = header.querySelector('img');
  // Finds the headcount, removes it from the original string and creates an icon with the hc
  const extractHeadCountExp = /(>?)\(\d+(.*?)\)/;
  if (extractHeadCountExp.test(h3.innerText)) {
    const headCntDiv = createTag('div', { class: 'head-cnt', alt: '' });
    const headCount = h3.innerText
      .match(extractHeadCountExp)[0]
      .replace(')', '')
      .replace('(', '');
    [h3.innerText] = h3.innerText.split(extractHeadCountExp);
    headCntDiv.textContent = headCount;
    headCntDiv.prepend(
      createTag('img', {
        src: '/express/code/icons/head-count.svg',
        alt: 'icon-head-count',
      }),
    );
    header.append(headCntDiv);
  }
  if (premiumIcon) h3.append(premiumIcon);
  header.querySelectorAll('p, div').forEach((p) => {
    if (p.innerHTML.trim() === '') p.remove();
  });
  card.append(header);
  cardBorder.append(card);
  return { cardWrapper: cardBorder, specialPromo };
}

function decorateBasicTextSection(textElement, className, card) {
  if (textElement.innerHTML.trim()) {
    textElement.classList.add(className);
    card.append(textElement);
  }
}

// Links user to page where plans can be compared
function decorateCompareSection(compare, el, card) {
  if (compare?.innerHTML.trim()) {
    compare.classList.add('card-compare');
    compare.querySelector('a')?.classList.remove('button', 'accent');
    // in a tab, update url
    const closestTab = el.closest('[role="tabpanel"]');
    if (closestTab) {
      try {
        const tabId = parseInt(closestTab.id.split('-').pop(), 10);
        const compareLink = compare.querySelector('a');
        const url = new URL(compareLink.href);
        url.searchParams.set('tab', tabId);
        compareLink.href = url.href;
      } catch (e) {
        // ignore
      }
    }
    card.append(compare);
  }
}

// In legacy versions, the card element encapsulates all content
// In new versions, the cardBorder element encapsulates all content instead
async function decorateCard({
  header,
  borderParams,
  explain,
  mPricingRow,
  mCtaGroup,
  featureList,
  compare,
}, el) {
  const card = createTag('div', { class: 'card' });
  const cardBorder = createTag('div', { class: 'card-border' });
  const cardBorderHeader = cardBorder.querySelector('h2, h3, h4, h5, h6');
  cardBorderHeader?.classList.add('card-promo-header');
  const { specialPromo, cardWrapper } = decorateHeader(header, borderParams, card, cardBorder);
  if (specialPromo) {
    el.classList.toggle('has-promo', true);
  }
  decorateBasicTextSection(explain, 'plan-explanation', card);
  const groupID = `${Date.now()}:${header.textContent.replace(/\s/g, '').trim()}`;
  const [mPricingSection] = await Promise.all([
    createPricingSection(header, mPricingRow, mCtaGroup, specialPromo, groupID),
  ]);
  mPricingSection.classList.add('monthly');

  card.append(mPricingSection);
  decorateBasicTextSection(featureList, 'card-feature-list', card);
  decorateCompareSection(compare, el, card);
  return cardWrapper;
}

function getHeightWithoutPadding(element) {
  const styles = window.getComputedStyle(element);
  const paddingTop = parseFloat(styles.paddingTop);
  const paddingBottom = parseFloat(styles.paddingBottom);
  return element.clientHeight - paddingTop - paddingBottom;
}

function equalizeHeights(el) {
  const classNames = ['.plan-explanation', '.plan-text', '.pricing-area', '.card-cta-group', '.card-feature-list'];
  const cardCount = el.querySelectorAll('.pricing-cards-v2 .card').length;
  if (cardCount === 1) return;
  for (const className of classNames) {
    const headers = el.querySelectorAll(className);
    let maxHeight = 0;
    headers.forEach((placeholder) => {
      placeholder.style.height = 'unset';
    });
    if (window.screen.width >= 1200) {
      headers.forEach((header) => {
        if (header.checkVisibility()) {
          const height = getHeightWithoutPadding(header);
          maxHeight = Math.max(maxHeight, height);
        }
      });
      headers.forEach((placeholder) => {
        if (maxHeight > 0) {
          placeholder.style.height = `${maxHeight}px`;
        }
      });
    }
  }
}

export default async function init(el) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`), fixIcons(el)]).then(([utils, placeholdersMod]) => {
    ({ createTag, getConfig } = utils);
    ({ replaceKeyArray } = placeholdersMod);
  });
  const offers = Array.from(el.querySelectorAll('p > em'));

  // replace <em> with <i>
  offers.forEach((offer) => {
    const { parentElement } = offer; // <em>
    const i = document.createElement('i');
    i.innerHTML = offer.innerHTML;
    parentElement.replaceChild(i, offer);
  });
  await decorateButtonsDeprecated(el);
  addTempWrapperDeprecated(el, 'pricing-cards-v2');

  const currentKeys = [...blockKeys];
  const divs = currentKeys.map((_, index) => el.querySelectorAll(`:scope > div:nth-child(${index + 1}) > div`));

  const cards = Array.from(divs[0]).map((_, index) => currentKeys.reduce((obj, key, keyIndex) => {
    obj[key] = divs[keyIndex][index];
    return obj;
  }, {}));

  el.classList.add(`card-count-${cards.length}`);
  const cardFooter = el.querySelector(':scope > div:last-of-type');

  cardFooter.classList.add('card-footer', 'ax-grid-container', 'small-gap');
  el.querySelectorAll(':scope > div:not(:last-of-type)').forEach((d) => d.remove());
  const cardsContainer = createTag('div', { class: 'cards-container ax-grid-container small-gap' });

  const decoratedCards = await Promise.all(
    cards.map((card) => decorateCard(card, el)),
  );

  decoratedCards.forEach((card) => cardsContainer.append(card));
  const phoneNumberTags = [...cardsContainer.querySelectorAll('a')].filter(
    (a) => a.title.includes(SALES_NUMBERS),
  );

  if (phoneNumberTags.length > 0) {
    await formatSalesPhoneNumber(phoneNumberTags, SALES_NUMBERS);
  }

  el.append(cardFooter);
  el.prepend(cardsContainer);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        equalizeHeights(el);
        observer.unobserve(entry.target);
      }
    });
  });

  document.querySelectorAll('.pricing-cards-v2 .card').forEach((column) => {
    observer.observe(column);
  });

  const parentSection = el.closest('.section');
  if (parentSection) {
    // MutationObserver for display changes
    const mutationObserver = new MutationObserver(debounce((mutations) => {
      let displayChanged = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes'
            && (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
          const computedStyle = window.getComputedStyle(parentSection);
          const currentDisplay = computedStyle.display;

          if (!parentSection.dataset.prevDisplay) {
            parentSection.dataset.prevDisplay = currentDisplay;
          }

          if (parentSection.dataset.prevDisplay !== currentDisplay) {
            displayChanged = true;
            parentSection.dataset.prevDisplay = currentDisplay;
          }
        }
      });

      if (displayChanged && parentSection.offsetHeight > 0) {
        console.log('Section display changed, equalizing heights');
        equalizeHeights(el);
      }
    }, 100));

    mutationObserver.observe(parentSection, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      childList: false,
      subtree: false,
    });

    // Store observers for cleanup
    el.sectionMutationObserver = mutationObserver;

    // Cleanup function
    el.cleanupObservers = () => {
      if (el.sectionMutationObserver) {
        el.sectionMutationObserver.disconnect();
        el.sectionMutationObserver = null;
      }
    };
  }
  window.addEventListener('resize', debounce(() => {
    equalizeHeights(el);
  }, 100));

  tagFreePlan(cardsContainer);
  el.classList.add('loaded');
}
