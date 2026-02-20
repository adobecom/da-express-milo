# Universal Search Plugin

> Image-based similarity search against Adobe Stock using the Universal Search API.

## Overview

The Universal Search plugin provides similarity (reverse-image) search capabilities
for Adobe Stock assets. Users upload an image and receive visually similar stock
results. The plugin supports both **authenticated** and **anonymous** endpoints,
automatically selecting the correct one based on the user's auth state.

It follows the modular action-group architecture with two action groups in a single module (`actions/UniversalSearchActions.js`):
- **SearchActions** - Image upload, similarity search, and data-availability checks
- **UrlActions** - Endpoint URL construction based on auth state

## Features

- **Similarity Search** - Upload an image to find visually similar Adobe Stock assets
- **Pagination** - Configurable batch size (default 20), page numbers, and start index
- **Auth-Aware Routing** - Automatically routes to authenticated or anonymous API endpoints
- **Data Availability Check** - Lightweight probe to determine if results exist before fetching a full page
- **Provider API** - Clean, consumer-friendly `UniversalSearchProvider` wrapping raw plugin dispatch

## Configuration

**Feature Flag:** `ENABLE_UNIVERSAL` (enabled by default; set to `false` to disable)

**Service Config:**

```javascript
universal: {
  baseUrl: 'https://adobesearch.adobe.io/universal-search/v2',
  apiKey: 'API_KEY',
  endpoints: {
    similarity: '/similarity-search',
    anonymousImageSearch: 'https://search.adobe.io/imageSearch',
  },
}
```

## Endpoints

| Auth State | URL |
|------------|-----|
| **Authenticated** | `https://adobesearch.adobe.io/universal-search/v2/similarity-search` |
| **Anonymous** | `https://search.adobe.io/imageSearch` |

## Topics

| Topic | Key | Description |
|-------|-----|-------------|
| `search.byImage` | `UniversalSearchTopics.SEARCH.BY_IMAGE` | Find visually similar stock images by uploading an image (auth or anonymous) |
| `search.checkAvailability` | `UniversalSearchTopics.SEARCH.CHECK_AVAILABILITY` | Check if similarity search returns results for a given image |
| `url.get` | `UniversalSearchTopics.URL.GET` | Get endpoint URL and path based on auth state (authenticated vs anonymous) |

## Action Groups

| Group | Key | Actions |
|-------|-----|---------|
| `search` | `UniversalSearchActionGroups.SEARCH` | `searchByImage`, `checkDataAvailability` |
| `url` | `UniversalSearchActionGroups.URL` | `getSearchUrl` |

## Usage

### Via Provider

```javascript
const provider = await serviceManager.getProvider('universal');

// Similarity search
const results = await provider.searchByImage(imageFile, {
  limit: 10,
  page: 2,
});
// results => { themes: [...], total_results: 42, ... }

// Check if any results exist (lightweight)
const hasResults = await provider.checkDataAvailability(imageFile);
// hasResults => true | false

// Get endpoint URL for current auth state
const { fullUrl, basePath, api, searchPath } = provider.getSearchUrl();
```

### Via Plugin Dispatch

```javascript
import { UniversalSearchTopics } from './plugins/universal/topics.js';

const plugin = serviceManager.getPlugin('universal');

// Similarity search
const results = await plugin.dispatch(UniversalSearchTopics.SEARCH.BY_IMAGE, {
  imageFile,
  pageNumber: 1,
  batchSize: 20,
});

// Get URL info
const urlInfo = await plugin.dispatch(UniversalSearchTopics.URL.GET, true);
```

## Request Format

The `searchByImage` action builds a `FormData` body with:

| Field | Type | Description |
|-------|------|-------------|
| `request` | JSON string | `{ scope: ["stock"], limit, start_index, asset_type: ["images"] }` |
| `image` | File | The uploaded image |

**Default batch size:** 20

## Response Structure

The raw API response is parsed into a normalized format:

```javascript
{
  themes: [/* array of stock asset items */],
  total_results: 42,
  result_sets: [/* raw result sets preserved */],
  // ...other raw fields preserved
}
```

## Authentication

- **Optional** - The plugin works in both authenticated and anonymous modes.
- **Authenticated requests** send `Authorization: Bearer <token>` along with `x-api-key: API_KEY`.
- **Anonymous requests** use `x-api-key: API_KEY` and hit the public `search.adobe.io` endpoint.
- Common headers include `x-product: PRODUCT` and `x-product-location: PRODUCT_LOCATION`.

## Related Files

- `UniversalSearchPlugin.js` - Main plugin class
- `topics.js` - Topic and action-group definitions
- `actions/UniversalSearchActions.js` - Search, availability, and URL construction actions (SearchActions, UrlActions)
- `index.js` - Plugin manifest
- `../../providers/UniversalSearchProvider.js` - Consumer-facing provider

---

**Version:** 1.0
**Last Updated:** February 2026
