import { createTag } from '../../../scripts/utils.js';

export function convertImageSize(imageURL, newSize) {
  if (!imageURL) return imageURL;
  try {
    const lastUnderscoreIndex = imageURL.lastIndexOf('_');
    const afterUnderscore = imageURL.substring(lastUnderscoreIndex + 1);
    const extensionIndex = afterUnderscore.indexOf('.');
    const fileExtension = extensionIndex !== -1 ? afterUnderscore.substring(extensionIndex) : '';
    const newImageURL = imageURL.substring(0, lastUnderscoreIndex + 1) + newSize + fileExtension;
    const dotIndex = newImageURL.lastIndexOf('.');
    const newImageURLFinal = `${newImageURL.substring(0, dotIndex + 1)}webp?max_dim=${newSize}`;
    return newImageURLFinal;
  } catch (error) {
    return imageURL;
  }
}

export function createHeroImageSrcset(imageURL) {
  const sizes = [200, 400, 600, 800, 1000];
  return sizes.map((size) => `${convertImageSize(imageURL, size)} ${size}w`).join(', ');
}

export function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android|iphone|ipad|ipod|blackberry|iemobile|webos|opera mini/i.test(
    userAgent.toLowerCase(),
  );
}

export function detectMobileWithUAData() {
  const userAgent = navigator.userAgentData;
  if (!userAgent) return false;
  return (
    userAgent.mobile
    || userAgent.platform === 'Android'
    || userAgent.platform === 'iOS'
  );
}

export function detectMobileWithBrowserWidth() {
  return window.innerWidth <= 500;
}

export function detectMobile() {
  return isMobileDevice() || detectMobileWithUAData() || detectMobileWithBrowserWidth();
}

export function formatPaperThickness(thickness) {
  const thicknessFormatted = `${thickness.replace('_', '.')}pt thickness`;
  return thicknessFormatted;
}

export function formatPaperWeight(weight) {
  const [weightValue, gsmValue] = weight.split('lb');
  const weightFormatted = `${weightValue}lb weight`;
  const gsmFormatted = gsmValue?.replace('gsm', ' GSM');
  return { weight: weightFormatted, gsm: gsmFormatted };
}

export function extractTemplateId(block) {
  const templateIdBlock = block.children[0].children[1].textContent;
  const urlParams = new URLSearchParams(window.location.search);
  const templateIdURL = urlParams.get('templateId');
  const templateId = templateIdURL || templateIdBlock;
  return templateId;
}

export function formatDeliveryEstimateDateRange(minDate, maxDate) {
  const options = { month: 'short', day: 'numeric' };
  const minFormatted = new Date(minDate).toLocaleDateString('en-US', options);
  const maxFormatted = new Date(maxDate).toLocaleDateString('en-US', options);
  return `${minFormatted} - ${maxFormatted}`;
}

export function formatLargeNumberToK(totalReviews) {
  if (totalReviews > 1000) {
    const hundreds = Math.round((totalReviews % 1000) / 100);
    if (hundreds === 0) {
      return `${Math.round(totalReviews / 1000)}k`;
    }
    return `${Math.round(totalReviews / 1000)}.${Math.round((totalReviews % 1000) / 100)}k`;
  }
  return totalReviews;
}

export function exchangeRegionForTopLevelDomain(region) {
  const urlParams = new URLSearchParams(window.location.search);
  const regionURL = urlParams.get('region');
  const regionFinal = regionURL || region;
  const regionToTopLevelDomainMap = {
    'en-GB': 'co.uk',
    'en-US': 'com',
    'en-CA': 'ca',
    'en-AU': 'au',
    'en-NZ': 'nz',
  };
  let topLevelDomain = regionToTopLevelDomainMap[regionFinal];
  if (regionFinal !== 'en-US' && regionFinal !== 'en-GB') {
    topLevelDomain = 'com';
  }
  return topLevelDomain;
}

export async function formatPriceZazzle(price, differential = false) {
  const { getCountry } = await import(
    '../../../scripts/utils/location-utils.js'
  );
  const country = await getCountry();
  const { getCurrency, formatPrice } = await import(
    '../../../scripts/utils/pricing.js'
  );
  const currency = await getCurrency(country);
  const urlParams = new URLSearchParams(window.location.search);
  const region = urlParams.get('region');
  const currencyMap = {
    'en-GB': 'GBP',
    'en-US': 'USD',
    'en-CA': 'CAD',
    'en-AU': 'AUD',
    'en-NZ': 'NZD',
  };
  const currencyFinal = currencyMap[region] || currency;
  let priceDifferentialOperator;
  const localizedPrice = await formatPrice(price, currencyFinal);
  if (differential) {
    priceDifferentialOperator = price >= 0 ? '+' : '';
  } else {
    priceDifferentialOperator = '';
  }
  const formattedPrice = priceDifferentialOperator + localizedPrice;
  return formattedPrice;
}

export function formatStringSnakeCase(string) {
  const normalizedString = string.replace(/[^a-zA-Z0-9\s]/g, '_');
  const formattedString = normalizedString
    .trim()
    .toLowerCase()
    .replace(/ /g, '_');
  return formattedString;
}

export async function addPrefetchLinks(ietf) {
  const topLevelDomain = exchangeRegionForTopLevelDomain(ietf);
  const prefetchLink1 = createTag('link', {
    rel: 'dns-prefetch',
    href: `https://www.zazzle.${topLevelDomain}`,
  });
  const prefetchLink2 = createTag('link', {
    rel: 'dns-prefetch',
    href: `https://rlv.zcache.${topLevelDomain}`,
  });
  const preconnectLink1 = createTag('link', {
    rel: 'preconnect',
    href: `https://www.zazzle.${topLevelDomain}`,
  });
  const preconnectLink2 = createTag('link', {
    rel: 'preconnect',
    href: `https://rlv.zcache.${topLevelDomain}`,
  });
  document.head.append(prefetchLink1, prefetchLink2, preconnectLink1, preconnectLink2);
}
