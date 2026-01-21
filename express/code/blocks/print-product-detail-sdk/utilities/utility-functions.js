import { getLibs, createTag } from '../../../scripts/utils.js';

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
  const topLevelDomain = regionToTopLevelDomainMap[regionFinal];
  return topLevelDomain;
}

export async function formatPriceZazzle(price, differential = false) {
  const { getCountry } = await import('../../../scripts/utils/location-utils.js');
  const country = await getCountry();
  const { getCurrency, formatPrice } = await import('../../../scripts/utils/pricing.js');
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
  const formattedString = normalizedString.trim().toLowerCase().replace(/ /g, '_');
  return formattedString;
}

export async function addPrefetchLinks() {
  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { ietf } = getConfig().locale;
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
    href: `https://www.zazzle.${topLevelDomain}`,
  });
  document.head.appendChild(prefetchLink1);
  document.head.appendChild(prefetchLink2);
  document.head.appendChild(preconnectLink1);
  document.head.appendChild(preconnectLink2);
}

function normalizeLocale(ietf) {
  const SUPPORTED_REGIONS = new Set(['at', 'br', 'us', 'au', 'ca', 'gb', 'nz', 'de', 'ch', 'es', 'fr', 'be', 'jp', 'kr', 'nl', 'pt', 'se']);
  const SUPPORTED_LANGUAGES = new Set(['en', 'de', 'es', 'fr', 'ja', 'ko', 'nl', 'pt', 'sv']);
  if (!ietf) {
    return { language: 'en', region: 'us' };
  }

  const [languageRaw = 'en', regionRaw = 'us'] = ietf.split('-');
  const language = languageRaw.toLowerCase();
  const region = regionRaw.toLowerCase();

  return {
    language: SUPPORTED_LANGUAGES.has(language) ? language : 'en',
    region: SUPPORTED_REGIONS.has(region) ? region : 'us',
  };
}

let storePromise = null;
export async function createZazzleStore() {
  if (storePromise) return storePromise;
  storePromise = (async () => {
    const [{ createZazzlePDPStore }, { getConfig }] = await Promise.all([
      import('../sdk/index.js'),
      import(`${getLibs()}/utils/utils.js`),
    ]);

    const { locale } = getConfig();
    const { language, region } = normalizeLocale(locale?.ietf);

    const store = createZazzlePDPStore({ language, region });

    return {
      env: store.env,
      sdk: store,
    };
  })();
  return storePromise;
}
