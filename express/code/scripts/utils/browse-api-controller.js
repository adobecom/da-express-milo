import { getLibs } from '../utils.js';
import { memoize } from './hofs.js';

const endpoints = {
  stage: {
    cdn: 'https://www.stage.adobe.com/ax-uss-api-v2/',
    url: 'https://hz-template-search-stage.adobe.io/uss/v3/query',
  },
  prod: {
    cdn: 'https://www.adobe.com/ax-uss-api-v2/',
    url: 'https://hz-template-search.adobe.io/uss/v3/query',
  },
};
const experienceId = 'default-seo-experience';

const mFetch = memoize(
  (url, data) => fetch(url, data).then((r) => (r.ok ? r.json() : null)),
  { ttl: 1000 * 60 * 60 * 24 },
);

export default async function getData() {
  /* eslint-disable no-console */
  console.group('[browse-api-controller] getData DEBUG');

  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { locale } = getConfig();

  console.log('Current URL:', window.location.pathname);
  console.log('Locale prefix:', locale.prefix);

  const textQuery = window.location.pathname
    .split('/')
    .filter(Boolean)
    .map((s) => s.trim())
    .filter(
      // subpaths only - also filter 'drafts' so /drafts/templates/ works like /express/templates/
      (s) => !['express', 'drafts', 'templates', 'colors', locale.prefix.replace('/', '')].includes(s),
    )
  // capitalize as flyer's res payload size > Flyer's
    .map((s) => s && String(s[0]).toUpperCase() + String(s).slice(1))
    .reverse()
    .join(' ');

  console.log('Extracted textQuery:', textQuery);

  if (textQuery === 'Search') {
    // turn off for search pages
    console.log('❌ Search page detected - CKG disabled');
    console.groupEnd();
    return null;
  }

  if (!textQuery || textQuery.trim() === '') {
    console.warn('❌ Empty textQuery - no path segments found');
    console.groupEnd();
    return null;
  }

  const data = {
    experienceId,
    querySuggestion: {
      facet: {
        'function:querySuggestions': {},
      },
    },
    textQuery,
    locale: locale.ietf || 'en-US',
    queries: [{
      id: 'template_1',
      scope: { entities: ['HzTemplate'] },
    }],
  };

  let result = null;
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('ckg-env') || getConfig().env.name;
  const endpoint = endpoints[env === 'prod' ? 'prod' : 'stage'];

  console.log('Environment:', env);
  console.log('Endpoint:', endpoint.cdn);
  console.log('Request payload:', data);

  try {
    result = await mFetch(endpoint.cdn, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.adobe.search-request+json',
      },
      body: JSON.stringify(data),
    });

    console.log('API Response:', result);

    if (result?.status?.httpCode !== 200) {
      console.error('❌ Invalid status code:', result?.status?.httpCode);
      throw new Error(`Invalid status code ${result?.status?.httpCode}`);
    }

    const buckets = result.querySuggestionResults?.groupResults?.[0]?.buckets;
    console.log('Raw buckets:', buckets);

    const filtered = buckets?.filter((pill) => pill?.metadata?.status === 'enabled');
    console.log('Filtered buckets (enabled only):', filtered);

    if (!filtered || filtered.length === 0) {
      console.warn('❌ No enabled CKG pills found in response');
    } else {
      console.log(`✅ Found ${filtered.length} enabled CKG pills`);
    }

    console.groupEnd();
    return filtered || null;
  } catch (err) {
    console.error('❌ CKG API Error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    window.lana?.log('error fetching sdc browse api:', err.message);
    console.groupEnd();
    return null;
  }
  /* eslint-enable no-console */
}
