import { getLibs, addTempWrapperDeprecated, decorateButtonsDeprecated } from '../../scripts/utils.js';
import {
  fetchPlanOnePlans,
  formatDynamicCartLink,
} from '../../scripts/utils/pricing.js';
import { debounce } from '../../scripts/utils/hofs.js';
import handleTooltip, { adjustElementPosition } from '../../scripts/widgets/tooltip.js';

let createTag; let getConfig;
let replaceKeyArray; let formatSalesPhoneNumber;

const SALES_NUMBERS = '((business-sales-numbers))';
const PRICE_TOKEN = '((pricing))';
const YEAR_2_PRICING_TOKEN = '((year-2-pricing-token))';

function getHeightWithoutPadding(element) {
  const styles = window.getComputedStyle(element);
  const paddingTop = parseFloat(styles.paddingTop);
  const paddingBottom = parseFloat(styles.paddingBottom);
  return element.clientHeight - paddingTop - paddingBottom;
}

function equalizeHeights(el) {
  const classNames = ['.plan-explanation', '.card-header'];
  const cardCount = el.querySelectorAll('.simplified-pricing-cards .card').length;
  if (cardCount === 1) return;
  for (const className of classNames) {
    const headers = el.querySelectorAll(className);
    let maxHeight = 0;
    headers.forEach((placeholder) => {
      placeholder.style.height = 'unset';
    });
    if (window.screen.width > 1279) {
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

async function getPriceElementSuffix(placeholderArr, response) {
  const cleanPlaceholderArr = placeholderArr.map((placeholder) => placeholder.replace('((', '').replace('))', ''));
  const placeholdersResponse = await replaceKeyArray(cleanPlaceholderArr, getConfig());
  return cleanPlaceholderArr.map((key, i) => (key.includes('vat') && !response.showVat && placeholdersResponse[i].replaceAll(' ', '') !== key.replaceAll('-', '')
    ? ''
    : ((placeholdersResponse[i].replaceAll(' ', '') !== key.replaceAll('-', '') ? placeholdersResponse[i] : '') || ''))).join(' ');
}

function handleYear2PricingToken(pricingArea, y2p, priceSuffix) {
  try {
    const elements = pricingArea.querySelectorAll('p');
    const year2PricingToken = Array.from(elements).find(
      (p) => p.textContent.includes(YEAR_2_PRICING_TOKEN),
    );
    if (!year2PricingToken) return;
    if (y2p) {
      year2PricingToken.innerHTML = year2PricingToken.innerHTML.replace(
        YEAR_2_PRICING_TOKEN,
        `${y2p} ${priceSuffix}`,
      );
    } else {
      year2PricingToken.textContent = '';
    }
  } catch (e) {
    window.lana.log(e);
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
    priceRow.append(basePrice, price, priceSuffix);
  }
}

async function createPricingSection(
  header,
  pricingArea,
  ctaGroup,
) {
  pricingArea.classList.add('pricing-area');
  const priceEl = [...pricingArea.querySelectorAll('a')].filter((link) => link.textContent.includes(PRICE_TOKEN))[0];

  if (priceEl) {
    const pricingSuffixTextElem = priceEl.closest('p').nextElementSibling;
    const placeholderArr = pricingSuffixTextElem.textContent?.split(' ');

    const priceRow = createTag('div', { class: 'pricing-row' });
    const price = createTag('span', { class: 'pricing-price' });
    const basePrice = createTag('span', { class: 'pricing-base-price' });
    const priceSuffix = createTag('div', { class: 'pricing-row-suf' });
    const response = await fetchPlanOnePlans(priceEl?.href);
    const priceSuffixTextContent = await getPriceElementSuffix(
      placeholderArr,
      response,
    );
    handlePriceSuffix(priceEl, priceSuffix, priceSuffixTextContent);
    handleRawPrice(price, basePrice, response, priceSuffix, priceRow);

    handleTooltip(pricingArea.querySelectorAll('p'));
    handleYear2PricingToken(pricingArea, response.y2p, priceSuffixTextContent);
    pricingArea.prepend(priceRow);
    priceEl?.parentNode?.remove();
    pricingSuffixTextElem?.remove();
  }

  ctaGroup.classList.add('card-cta-group');
  ctaGroup.querySelectorAll('a').forEach((a, i) => {
    a.classList.add('large');
    if (i === 1) a.classList.add('secondary');
    if (a.parentNode.tagName.toLowerCase() === 'strong') {
      a.classList.add('button', 'primary');
    }
    formatDynamicCartLink(a);
    if (a.textContent.includes(SALES_NUMBERS)) {
      formatSalesPhoneNumber([a], SALES_NUMBERS);
    }
    const headerText = header?.querySelector('h2')?.textContent;
    a.setAttribute('aria-label', `${a.textContent.trim()} ${headerText}`);
  });
}

function decorateHeader(header, planExplanation) {
  header.classList.add('card-header');
  header.querySelectorAll('p').forEach((p) => {
    if (p.innerHTML.trim() === '') p.remove();
  });
  planExplanation.classList.add('plan-explanation');
  const hideButtonWrapper = createTag('div', { class: 'toggle-switch-wrapper' });
  const hideButton = createTag('div', { class: 'toggle-switch' });
  hideButton.innerText = '>';
  hideButton.addEventListener('click', () => {
    const { classList } = header.parentElement;
    if (classList.contains('hide')) {
      classList.remove('hide');
      adjustElementPosition();
    } else {
      classList.add('hide');
    }
  });
  header.append(hideButtonWrapper);
  hideButtonWrapper.append(hideButton);
}

function decorateCardBorder(card, source) {
  const pattern = /\(\((.*?)\)\)/g;
  const matches = Array.from(source.textContent?.matchAll(pattern));
  if (matches.length > 0) {
    const [, promoType] = matches[matches.length - 1];
    card.classList.add(promoType.replaceAll(' ', ''));
    source.textContent = source.textContent.replace(pattern, '').trim();
    if (source.textContent !== '') {
      source.classList.add('promo-eyebrow-text');
      card.classList.add('promo-text');
    } else {
      source.style.display = 'none';
    }
  }
  source.style.display = 'none';
}

function getDefaultExpandedIndex(el) {
  let defaultOpenIndex = 0;
  let q;
  el.classList.forEach((cl) => {
    if (cl.includes('default-expanded-')) {
      q = cl;
    }
  });
  if (q) {
    defaultOpenIndex = parseInt(q.split('default-expanded-')[1], 10) - 1;
  }
  return defaultOpenIndex;
}

export default async function init(el) {
  addTempWrapperDeprecated(el, 'simplified-pricing-cards');
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`), import('../../scripts/utils/location-utils.js')]).then(([utils, placeholders, locationUtils]) => {
    ({ createTag, getConfig } = utils);
    ({ replaceKeyArray } = placeholders);
    ({ formatSalesPhoneNumber } = locationUtils);
  });

  const rows = Array.from(el.querySelectorAll(':scope > div'));
  const cardCount = rows[0].children.length;
  const cards = [];

  const defaultOpenIndex = getDefaultExpandedIndex(el);

  /* eslint-disable no-await-in-loop */
  for (let cardIndex = 0; cardIndex < cardCount; cardIndex += 1) {
    const card = createTag('div', { class: 'card' });
    if (cardIndex !== defaultOpenIndex) {
      card.classList.add('hide');
    }
    decorateCardBorder(card, rows[1].children[0]);
    decorateHeader(rows[0].children[0], rows[2].children[0]);
    await createPricingSection(
      rows[0].children[0],
      rows[3].children[0],
      rows[4].children[0],
    );

    for (let j = 0; j < rows.length - 2; j += 1) {
      card.appendChild(rows[j].children[0]);
    }
    cards.push(card);
  }

  el.innerHTML = '';
  el.appendChild(createTag('div', { class: 'card-wrapper' }));
  for (const card of cards) {
    el.children[0].appendChild(card);
  }
  rows[rows.length - 2].classList.add('pricing-footer');
  rows[rows.length - 1].querySelector('a').classList.add('button', 'compare-all-button');
  el.appendChild(rows[rows.length - 2]);
  el.appendChild(rows[rows.length - 1]);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        equalizeHeights(el);
        observer.unobserve(entry.target);
        adjustElementPosition();
      }
    });
  });

  document.querySelectorAll('.simplified-pricing-cards .card').forEach((column) => {
    observer.observe(column);
  });
  await decorateButtonsDeprecated(el);

  window.addEventListener('resize', debounce(() => {
    equalizeHeights(el);
  }, 100));
}
