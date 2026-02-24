# Stock Plugin

> Adobe Stock integration for searching stock images, curated gallery lookups, data availability checks, and stock.adobe.com redirect URL generation.

## Overview

The Stock Plugin is a `BaseApiService` plugin that exposes Adobe Stock capabilities through topic-based actions and a provider wrapper. It organizes functionality into action groups for search, curated galleries, data checks, and redirect URL generation.

The plugin normalizes Stock search responses by mapping `files` to `themes` for consistency with other service-layer plugins.

## Features

- 🔎 **Search Files** - Query Adobe Stock images with pagination support
- 🖼️ **Curated Galleries** - Return curated gallery names and fetch gallery content by curated name
- ✅ **Data Availability** - Check whether a Stock endpoint has available data
- 🔗 **Redirect URLs** - Build Stock file and contributor URLs without HTTP calls
- 🧩 **Provider API** - Use friendly methods via `StockProvider` with safe error handling

## Configuration

**Feature Flag:** `ENABLE_STOCK`

**Service Config:**

```javascript
stock: {
  baseUrl: 'https://stock.adobe.io/Rest/Media/1',
  apiKey: 'ColorWeb',
  endpoints: {
    search: '/Search/Files',
    redirect: 'https://stock.adobe.com',
    contributor: '/contributor',
  },
}
```

## Topics

| Topic | Description |
|-------|-------------|
| `stock.search.files` | Search Adobe Stock files/images |
| `stock.gallery.getCuratedList` | Return curated gallery names |
| `stock.gallery.getByName` | Fetch gallery results for a curated gallery name |
| `stock.data.checkAvailability` | Check whether a Stock endpoint returns data |
| `stock.redirect.getFileUrl` | Build a stock file URL (`/images/id/{fileId}`) |
| `stock.redirect.getContributorUrl` | Build a contributor profile URL (`/contributor/{creatorId}`) |

## Action Groups

| Action Group | Purpose |
|-------------|---------|
| `search` | Search/Files API actions |
| `gallery` | Curated gallery list and lookup actions |
| `data` | Data availability checks |
| `redirect` | Redirect URL builder actions |

## Usage

### Via Provider (Recommended)

```javascript
import { initApiService, serviceManager } from './services/integration/index.js';

await initApiService();

const stock = await serviceManager.getProvider('stock');

// Search stock images
const searchResults = await stock.searchThemes('sunset', { page: 1 });

// Get curated galleries
const curated = await stock.getCuratedGalleries();

// Fetch a curated gallery by name
const wilderness = await stock.getGalleryByName('Wilderness', { page: 1 });

// Check endpoint availability
const isAvailable = await stock.checkDataAvailability(
  'https://stock.adobe.io/Rest/Media/1/Search/Files?...'
);

// Build redirect URLs (sync)
const fileUrl = stock.getFileRedirectUrl(123456789);
const contributorUrl = stock.getContributorUrl(42);
```

### Via Plugin Dispatch

```javascript
import { initApiService, serviceManager } from './services/integration/index.js';
import { StockTopics } from './services/integration/plugins/stock/topics.js';

await initApiService();
const stockPlugin = serviceManager.getPlugin('stock');

// Search
const searchData = await stockPlugin.dispatch(StockTopics.SEARCH.FILES, {
  main: 'sunset',
  pageNumber: 1,
});

// Curated list
const curatedList = await stockPlugin.dispatch(StockTopics.GALLERY.GET_CURATED_LIST);

// Curated gallery by name
const gallery = await stockPlugin.dispatch(StockTopics.GALLERY.GET_BY_NAME, {
  main: 'Wilderness',
  pageNumber: 1,
});

// Availability check
const available = await stockPlugin.dispatch(
  StockTopics.DATA.CHECK_AVAILABILITY,
  'https://stock.adobe.io/Rest/Media/1/Search/Files?...'
);

// Redirect URL builders
const imageUrl = stockPlugin.dispatch(StockTopics.REDIRECT.GET_FILE_URL, 123456789);
const authorUrl = stockPlugin.dispatch(StockTopics.REDIRECT.GET_CONTRIBUTOR_URL, 42);
```

## Response Structure

### Search (`stock.search.files` / `searchThemes`)

```javascript
{
  themes: [
    {
      id: 123456789,
      title: '...',
      // ... Adobe Stock file fields
    }
  ],
  nb_results: 2500,
  hasMore: true
  // ... other Stock response fields
}
```

### Curated List (`stock.gallery.getCuratedList` / `getCuratedGalleries`)

```javascript
{
  themes: [
    { title: 'Wilderness' },
    { title: 'Flavour' },
    { title: 'Travel' }
  ]
}
```

### Gallery by Name (`stock.gallery.getByName` / `getGalleryByName`)

```javascript
// Valid curated gallery name -> same structure as Search response
{
  themes: [/* stock file items */],
  nb_results: 100,
  hasMore: false
}

// Unknown gallery name
undefined
```

### Data Availability (`stock.data.checkAvailability` / `checkDataAvailability`)

```javascript
true // when endpoint is reachable and has files/themes
false // on empty results, non-OK response, or fetch/parsing failure
```

### Redirect URL Builders

```javascript
// stock.redirect.getFileUrl / getFileRedirectUrl
'https://stock.adobe.com/images/id/123456789'

// stock.redirect.getContributorUrl / getContributorUrl
'https://stock.adobe.com/contributor/42'
```

## Authentication

**API key required (service-level), no user login token required by plugin methods.**

- Requests include `x-api-key` from `serviceConfig.apiKey`
- The plugin adds `x-product: AdobeColor/4.0`
- Standard JSON headers are included by `BaseApiService`

## Notes

- Search criteria supports `main` or `query`; provider maps `searchThemes(query, { page })` to plugin criteria.
- Search uses fixed batch size of `36` and computes pagination with offset.
- Redirect actions are pure URL builders and do not perform HTTP calls.
- Provider methods use safe execution wrappers and return `null` (or `false` for availability checks) on failures.
- `parseStockData` normalizes Stock responses by renaming `files` to `themes` and computing `hasMore` from `offset + themes.length < nb_results`.
- `buildSearchParams` constructs Stock Search/Files query parameters: `search_parameters[words]`, `content_type:photo` filter, `premium: false`, locale `en-US`, and offset-based pagination.
- `checkAvailability` uses raw `fetch()` directly (not `plugin.get()`) to perform a standalone GET with plugin headers.
- Redirect URL builders fall back to `https://stock.adobe.com` (base) and `/contributor` (contributor path) when `plugin.endpoints.redirect` or `plugin.endpoints.contributor` are not configured.
- `getByName` delegates to `stock.search.files` dispatch using the gallery name as both `main` and `query`, returning `undefined` for non-curated names.

## Related Files

- `StockPlugin.js` - Main plugin class and action group registration
- `actions/StockActions.js` - Search, gallery, data, and redirect action group implementations
- `topics.js` - Topic and action-group definitions
- `constants.js` - Curated gallery constants and default batch size
- `index.js` - Plugin manifest (`name`, `featureFlag`, loaders)
- `../../providers/StockProvider.js` - Provider wrapper API

---

**Version:** 1.0  
**Last Updated:** February 2026
