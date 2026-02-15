# Curated Plugin

> Curated color themes from CloudFront-hosted JSON endpoints.

## Overview

The Curated Plugin fetches pre-curated/popular color themes from a static JSON endpoint. It provides curated content from multiple sources including Behance, Kuler, Stock, and Color Gradients.

## Features

- 📦 **Fetch All** - Get all curated themes in one request
- 🔖 **Filter by Source** - Get themes from a specific source
- 📊 **Grouped Data** - Get all themes organized by source

## Configuration

**Feature Flag:** `ENABLE_CURATED`

**Service Config:**

```javascript
curated: {
  baseUrl: 'https://d2ulm998byv1ft.cloudfront.net/curaredData.json',
  endpoints: {},
}
```

## Topics & Action Groups

| Topic | Description |
|-------|-------------|
| `curated.data.fetch` | Fetch all curated data |
| `curated.data.fetchBySource` | Fetch themes filtered by source |
| `curated.data.fetchGroupedBySource` | Fetch themes grouped by source (behance, kuler, stock, gradients) |

**Action Group:** `data` (CuratedDataActions)

## Source Types

| Source | Constant | Description |
|--------|----------|-------------|
| Behance | `BEHANCE` | Themes from Behance projects |
| Kuler | `KULER` | Themes from Adobe Color |
| Stock | `STOCK` | Themes from Adobe Stock |
| Gradients | `COLOR_GRADIENTS` | Gradient color themes |

## Usage

### Via Provider (Recommended)

```javascript
import { serviceManager, initApiService } from './services/index.js';
import { CuratedSources } from './services/plugins/curated/topics.js';

await initApiService();
const curated = await serviceManager.getProvider('curated');

// Fetch all curated data
const allData = await curated.fetchCuratedData();
console.log('All themes:', allData?.files);

// Fetch themes by source (e.g. Stock)
const stockThemes = await curated.fetchBySource(CuratedSources.STOCK);
console.log('Stock themes:', stockThemes?.themes);

// Fetch all themes grouped by source
const grouped = await curated.fetchGroupedBySource();
console.log('Behance:', grouped?.behance?.themes?.length);
console.log('Kuler:', grouped?.kuler?.themes?.length);
console.log('Stock:', grouped?.stock?.themes?.length);
console.log('Gradients:', grouped?.gradients?.themes?.length);
```

### Via Dispatch

```javascript
import { CuratedTopics, CuratedSources } from './services/plugins/curated/topics.js';

const curatedPlugin = serviceManager.getPlugin('curated');

// Fetch all data
const data = await curatedPlugin.dispatch(CuratedTopics.DATA.FETCH);

// Fetch by source
const behanceThemes = await curatedPlugin.dispatch(
  CuratedTopics.DATA.FETCH_BY_SOURCE,
  CuratedSources.BEHANCE
);

// Fetch grouped by source
const grouped = await curatedPlugin.dispatch(CuratedTopics.DATA.FETCH_GROUPED_BY_SOURCE);
```

## Response Structure

### fetchCuratedData()

```javascript
{
  files: [
    {
      source: 'BEHANCE' | 'KULER' | 'STOCK' | 'COLOR_GRADIENTS',
      id: 'string',
      title: 'string',
      thumbnail_url: 'string',
      swatches: [
        { hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } }
      ],
      // ... other theme properties
    }
  ]
}
```

### fetchBySource(source)

```javascript
{
  themes: [/* filtered theme objects */]
}
```

### fetchGroupedBySource()

```javascript
{
  behance: { themes: [...] },
  kuler: { themes: [...] },
  stock: { themes: [...] },
  gradients: { themes: [...] },
}
```

## Authentication

**None required** - This is a public JSON endpoint hosted on CloudFront.

## Notes

- The plugin overrides `getHeaders()` to provide minimal headers (no API key or auth)
- The `baseUrl` is the complete URL to the JSON file
- Response data is cached at the CDN level

## Related Files

- `CuratedPlugin.js` - Main plugin class
- `topics.js` - Topic, action group, and source definitions
- `actions/CuratedDataActions.js` - Data fetch action group

---

**Version:** 1.0  
**Last Updated:** January 2026

