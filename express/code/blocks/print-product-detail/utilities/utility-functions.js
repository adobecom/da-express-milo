import { getLibs, createTag } from '../../../scripts/utils.js';

export function updateImageUrl(url, maxDim) {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('max_dim', String(maxDim));
    return urlObj.toString();
  } catch {
    return url;
  }
}

export function createHeroImageSrcset(url) {
  const widths = [400, 800, 1200, 1600];
  return widths.map((w) => `${updateImageUrl(url, w)} ${w}w`).join(', ');
}

export function flattenOptionGroups(selector) {
  if (!selector?.optionGroups || !Array.isArray(selector.optionGroups)) {
    return [];
  }
  return selector.optionGroups.flatMap(
    (group) => (group.options || []).map((option) => ({ ...option, groupTitle: group.title })),
  );
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

export function extractInitialImageUrl(block) {
  for (const row of block.children) {
    const key = row.children[0]?.textContent?.trim();
    if (key === 'heroImage') {
      return row.children[1]?.querySelector('a')?.href
        ?? row.children[1]?.textContent?.trim()
        ?? null;
    }
  }
  return null;
}

export function extractTemplateId(block) {
  const templateIdBlock = block.children[0].children[1].textContent;
  const urlParams = new URLSearchParams(window.location.search);
  const templateIdURL = urlParams.get('templateId');
  const templateId = templateIdURL || templateIdBlock;
  return templateId;
}

export function formatDeliveryEstimateDateRange(minDate, maxDate) {
  const locale = document.documentElement.lang || 'en-US';
  const options = { month: 'short', day: 'numeric' };
  const minFormatted = new Date(minDate).toLocaleDateString(locale, options);
  const maxFormatted = new Date(maxDate).toLocaleDateString(locale, options);
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
  return String(totalReviews);
}

function getEffectiveRegion(ietf) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('region') || ietf;
}

export function exchangeRegionForTopLevelDomain(region) {
  const regionToTopLevelDomainMap = {
    'en-GB': 'co.uk',
    'en-US': 'com',
    'en-CA': 'ca',
    'en-AU': 'au',
    'en-NZ': 'nz',
  };
  return regionToTopLevelDomainMap[getEffectiveRegion(region)] || 'com';
}

export async function formatPriceZazzle(price, differential = false) {
  const { getCountry } = await import('../../../scripts/utils/location-utils.js');
  const country = await getCountry();
  const [{ getCurrency, formatPrice }, { getConfig }] = await Promise.all([
    import('../../../scripts/utils/pricing.js'),
    import(`${getLibs()}/utils/utils.js`),
  ]);
  const currency = await getCurrency(country);
  const { ietf } = getConfig().locale;
  const currencyMap = {
    'en-GB': 'GBP',
    'en-US': 'USD',
    'en-CA': 'CAD',
    'en-AU': 'AUD',
    'en-NZ': 'NZD',
  };
  const currencyFinal = currencyMap[getEffectiveRegion(ietf)] || currency;
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

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]);

function cleanNode(node, doc) {
  const fragment = doc.createDocumentFragment();
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      fragment.appendChild(doc.createTextNode(child.textContent));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      if (ALLOWED_TAGS.has(child.tagName.toLowerCase())) {
        const el = doc.createElement(child.tagName.toLowerCase());
        el.appendChild(cleanNode(child, doc));
        fragment.appendChild(el);
      } else {
        fragment.appendChild(cleanNode(child, doc));
      }
    }
  });
  return fragment;
}

export function sanitizeHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const cleaned = cleanNode(doc.body, document);
  const wrapper = document.createElement('div');
  wrapper.appendChild(cleaned);
  return wrapper.innerHTML;
}

export function formatStringSnakeCase(string) {
  const normalizedString = string.replace(/[^a-zA-Z0-9\s]/g, '_');
  const formattedString = normalizedString.trim().toLowerCase().replace(/ /g, '_');
  return formattedString;
}

export async function addPrefetchLinks() {
  if (document.querySelector('link[href*="zazzle."]')) return;
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
    href: `https://rlv.zcache.${topLevelDomain}`,
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
      import('../sdk/index.min.js'),
      import(`${getLibs()}/utils/utils.js`),
    ]);

    const { locale } = getConfig();
    const urlParams = new URLSearchParams(window.location.search);
    const testRegion = urlParams.get('testRegion');
    const { language, region } = testRegion
      ? { language: 'en', region: testRegion.toLowerCase() }
      : normalizeLocale(locale?.ietf);

    const store = createZazzlePDPStore({ language, region });

    return {
      env: store.env,
      sdk: store,
    };
  })();
  return storePromise;
}
