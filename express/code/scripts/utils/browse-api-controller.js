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
  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { locale } = getConfig();

  const textQuery = window.location.pathname
    .split('/')
    .filter(Boolean)
    .map((s) => s.trim())
    .filter(
      (s) => !['express', 'drafts', 'templates', 'colors', locale.prefix.replace('/', '')].includes(s),
    )
    .map((s) => s && String(s[0]).toUpperCase() + String(s).slice(1))
    .reverse()
    .join(' ');

  if (textQuery === 'Search') {
    return null;
  }

  if (!textQuery || textQuery.trim() === '') {
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

  try {
    result = await mFetch(endpoint.cdn, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.adobe.search-request+json',
      },
      body: JSON.stringify(data),
    });

    if (result?.status?.httpCode !== 200) {
      throw new Error(`Invalid status code ${result?.status?.httpCode}`);
    }

    const buckets = result.querySuggestionResults?.groupResults?.[0]?.buckets;
    const filtered = buckets?.filter((pill) => pill?.metadata?.status === 'enabled');

    return filtered || null;
  } catch (err) {
    window.lana?.log('error fetching sdc browse api:', err.message);
    return null;
  }
}
