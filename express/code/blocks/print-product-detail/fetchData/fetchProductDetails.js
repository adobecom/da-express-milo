import { getLibs } from '../../../scripts/utils.js';
import { exchangeRegionForTopLevelDomain } from '../utilities/utility-functions.js';

export function formatUrlForEnvironment(url) {
  if (window.location.hostname === 'localhost') {
    return `http://localhost:3001?url=${url}`;
  }
  const URLFormatted = url;
  return URLFormatted;
}

export default async function fetchAPIData(productId, parameters, endpoint, idType = 'productId') {
  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { ietf } = getConfig().locale;
  let apiDataFetch;
  let parametersString;
  const topLevelDomain = exchangeRegionForTopLevelDomain(ietf);
  if (parameters) {
    parametersString = Object.entries(parameters).map(([key, value]) => `${key}=${value}`).join('&');
  } else {
    parametersString = '';
  }
  const url = `https://www.zazzle.${topLevelDomain}/svc/partner/adobeexpress/v1/${endpoint}?${idType}=${productId}&${parametersString}`;
  try {
    apiDataFetch = await fetch(formatUrlForEnvironment(url));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.info(error);
  }
  const apiDataJSON = await apiDataFetch.json();
  const apiData = apiDataJSON.data;
  return apiData;
}
export async function fetchUIStrings() {
  const apiDataFetch = await fetch('/express/code/blocks/print-product-detail/sample_data/UIStrings.json');
  const apiDataJSON = await apiDataFetch.json();
  return apiDataJSON;
}
