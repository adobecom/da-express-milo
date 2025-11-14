import { memoize, throttle, debounce } from '../../../scripts/utils/hofs.js';

const url = 'https://adobesearch-atc.adobe.io/uss/v3/autocomplete';
const experienceId = 'default-templates-autocomplete-v1';
const scopeEntities = ['HzTemplate'];
const wlLocales = ['en-US', 'fr-FR', 'de-DE', 'ja-JP'];
const emptyRes = { queryResults: [{ items: [] }] };

export async function fetchAPI({ limit = 5, textQuery, locale = 'en-US' }) {
  if (!textQuery || !wlLocales.includes(locale)) {
    return [];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': window.atob('cHJvamVjdHhfbWFya2V0aW5nX3dlYg=='),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      experienceId,
      textQuery,
      locale,
      queries: [
        {
          limit,
          id: experienceId,
          scope: { entities: scopeEntities },
        },
      ],
    }),
  })
    .then((response) => response.json())
    .then((response) => (response.queryResults?.[0]?.items ? response : emptyRes))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Autocomplete API Error: ', err);
      return emptyRes;
    });
  return res.queryResults[0].items;
}

const memoizedFetchAPI = memoize(fetchAPI, {
  key: (options) => options.textQuery,
  ttl: 30 * 1000,
});

export default function useInputAutocomplete(
  updateUIWithSuggestions,
  getConfig,
  { throttleDelay = 300, debounceDelay = 500, limit = 5 } = {},
) {
  const state = { query: '', waitingFor: '' };

  const fetchAndUpdateUI = async () => {
    const currentSearch = state.query;
    state.waitingFor = currentSearch;
    const suggestions = await memoizedFetchAPI({
      textQuery: currentSearch,
      limit,
      locale: getConfig().locale.ietf,
    });
    if (state.waitingFor === currentSearch) {
      updateUIWithSuggestions(suggestions);
    }
  };
  const throttledFetchAndUpdateUI = throttle(fetchAndUpdateUI, throttleDelay, { trailing: true });
  const debouncedFetchAndUpdateUI = debounce(fetchAndUpdateUI, debounceDelay);

  const inputHandler = (e) => {
    state.query = e.target.value;
    if (state.query.length < 4 || state.query.endsWith(' ')) {
      throttledFetchAndUpdateUI();
    } else {
      debouncedFetchAndUpdateUI();
    }
  };
  return { inputHandler };
}
