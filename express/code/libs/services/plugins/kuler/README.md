# Kuler Plugin

> Adobe Color themes and gradients service plugin.

## Overview

The Kuler Plugin provides access to Adobe Color (formerly Kuler) APIs for searching, exploring, creating, and managing color themes and gradients. It's a complex plugin with multiple action groups handling distinct functional areas.

## Architecture

The plugin uses a modular action group architecture where related actions are organized into separate action group classes. This design allows:

- Better code organization and maintainability
- Easier testing of individual action groups
- Extensibility — new action groups can be added without modifying the main plugin
- Reusability — other plugins can follow the same pattern

### Constructor Options

| Option | Type | Description |
|--------|------|-------------|
| `serviceConfig` | Object | Kuler service config (baseUrl, apiKey, endpoints) |
| `appConfig` | Object | Application config (features, environment) |

## Features

- 🔍 **Search** - Search themes and gradients by term, tag, hex, or similar colors
- 🗺️ **Explore** - Browse/explore themes and gradients with filter, sort, and time criteria
- 🎨 **Themes** - Get, save, and delete color themes
- 🌈 **Gradients** - Save and delete gradients
- ❤️ **Likes** - Like and unlike themes

## Configuration

**Feature Flag:** `ENABLE_KULER`

**Service Config:**

```javascript
kuler: {
  baseUrl: 'https://search.adobe.io/api/v2',
  apiKey: '<your-api-key>',
  endpoints: {
    search: '/search',
    api: '/api/v2',
    themePath: '/themes',
    gradientPath: '/gradient',
    themeBaseUrl: 'https://themes.adobe.io',
    likeBaseUrl: 'https://asset.adobe.io',
    gradientBaseUrl: 'https://gradient.adobe.io',
    exploreBaseUrl: 'https://themesb3.adobe.io',
  },
}
```

## Topics

Topics define the available actions for the Kuler service. Use these with `plugin.dispatch()` for direct API access, or use the `KulerProvider` for a friendlier interface.

| Topic | Description |
|-------|-------------|
| `search.themes` | Search for color themes via search.adobe.io |
| `search.gradients` | Search for gradients via search.adobe.io |
| `search.published` | Check if a theme/gradient is published (by URL or asset ID) |
| `explore.themes` | Browse/explore themes via themesb3.adobe.io |
| `explore.gradients` | Browse/explore gradients via themesb3.adobe.io |
| `theme.get` | Get a specific theme by ID |
| `theme.save` | Save/publish a theme |
| `theme.delete` | Delete a published theme |
| `gradient.save` | Save/publish a gradient |
| `gradient.delete` | Delete a published gradient |
| `like.update` | Like or unlike a theme |

## Action Groups

All action groups are defined in `actions/KulerActions.js`.

| Group | Class | Actions | Description |
|-------|-------|---------|-------------|
| `search` | `SearchActions` | fetchThemeList, fetchGradientList, searchPublishedTheme | Search via search.adobe.io. Builds JSON-encoded `q` parameter queries. |
| `explore` | `ExploreActions` | fetchExploreThemes, fetchExploreGradients | Browse/explore via themesb3.adobe.io using filter/sort/time parameters. |
| `theme` | `ThemeActions` | fetchTheme, saveTheme, deleteTheme | Theme CRUD operations. Uses `ValidationError` for input validation. |
| `gradient` | `GradientActions` | saveGradient, deleteGradient | Gradient CRUD operations. Uses `ValidationError` for input validation. |
| `like` | `LikeActions` | updateLikeStatus | Like/unlike operations. Uses `ValidationError` for input validation. |

## Usage

### Via Provider (Recommended)

```javascript
import { serviceManager } from './services/index.js';

// Plugin is lazy-loaded on demand — no init() needed
const kuler = await serviceManager.getProvider('kuler');

// Search themes
const themes = await kuler.searchThemes('sunset', {
  typeOfQuery: 'term',  // 'term' | 'tag' | 'hex' | 'similarHex'
  page: 1,
});

// Search gradients
const gradients = await kuler.searchGradients('ocean');

// Explore/browse themes (via themesb3.adobe.io)
const explored = await kuler.exploreThemes({
  filter: 'public',     // 'public' | 'my_themes'
  sort: 'create_time',  // 'create_time' | 'like_count' | 'view_count' | 'random'
  time: 'month',        // 'all' | 'month' | 'week'
  page: 1,
});

// Explore/browse gradients
const exploredGradients = await kuler.exploreGradients({
  filter: 'public',
  sort: 'like_count',
  time: 'all',
});

// Check if an asset is published on Kuler
const published = await kuler.checkIfPublished('asset-id', 'GRADIENT');

// Search published by URL
const result = await kuler.searchPublished(fullSearchUrl);

// Get specific theme
const theme = await kuler.getTheme('theme-id');

// Save theme (requires authentication)
await kuler.saveTheme(themeData, ccLibrariesResponse);

// Delete theme (requires authentication)
await kuler.deleteTheme({ id: 'theme-id', name: 'Theme Name' });

// Save gradient (requires authentication)
await kuler.saveGradient(gradientData, ccLibrariesResponse);

// Delete gradient (requires authentication)
await kuler.deleteGradient({ id: 'gradient-id', name: 'Gradient Name' });

// Like/unlike theme (requires authentication)
await kuler.updateLike({ id: 'theme-id', like: { user: null }, source: 'KULER' });
```

### Via Plugin Dispatch

```javascript
import { serviceManager } from './services/index.js';
import { KulerTopics } from './services/plugins/kuler/topics.js';

const kulerPlugin = await serviceManager.loadPlugin('kuler');

// Search themes
const result = await kulerPlugin.dispatch(KulerTopics.SEARCH.THEMES, {
  main: 'sunset',
  typeOfQuery: 'term',
  pageNumber: 1,
});

// Explore themes
const explored = await kulerPlugin.dispatch(KulerTopics.EXPLORE.THEMES, {
  filter: 'public',
  sort: 'create_time',
  time: 'month',
  pageNumber: 1,
});

// Get theme
const theme = await kulerPlugin.dispatch(KulerTopics.THEME.GET, 'theme-id');
```

## API Details

### Search (search.adobe.io)

Kuler search expects a `q` parameter with a JSON-encoded query object (e.g. `q={"term":"value"}`). Results are paginated with a default batch size of 72. Authenticated users receive additional `metadata=all` in responses.

#### Search Criteria

| Parameter | Type | Description |
|-----------|------|-------------|
| `main` | string | Search query |
| `typeOfQuery` | string | Query type: `term`, `tag`, `hex`, `similarHex` |
| `pageNumber` | number | Page number (1-indexed) |

### Explore (themesb3.adobe.io)

The explore/browse endpoint uses filter, sort, and time parameters instead of search queries. Results are paginated with a default batch size of 72.

#### Explore Criteria

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `filter` | string | `'public'` | Filter mode: `public` or `my_themes` |
| `sort` | string | `'create_time'` | Sort field (see Sort Values below) |
| `time` | string | `'month'` | Time filter: `all`, `month`, `week` |
| `pageNumber` | number | `1` | Page number (1-indexed) |

#### Sort Values

| Constant | Value | Description |
|----------|-------|-------------|
| `ALL_THEMES` | `create_time` | Newest first |
| `MOST_POPULAR` | `like_count` | Most liked |
| `MOST_USED` | `view_count` | Most viewed |
| `RANDOM` | `random` | Random order |
| `MY_PUBLISHED` | `my_themes` | User's own published themes |

### Theme Data Structure

```javascript
{
  name: 'My Theme',
  swatches: [
    { rgb: { r: 255, g: 128, b: 64 } },
    // ... more swatches
  ],
  tags: ['sunset', 'warm'],
  harmony: {
    baseSwatchIndex: 0,
    mood: 'vibrant',
    rule: 'analogous',
    sourceURL: '',
  },
}
```

### Response Transforms

The `providers/transforms.js` module provides helpers for normalizing API responses:

| Transform | Description |
|-----------|-------------|
| `themeToGradient(theme)` | Converts a theme (0-1 RGB swatches) to a normalized gradient object |
| `themesToGradients(themes)` | Batch version of `themeToGradient` |
| `gradientApiResponseToGradient(apiData)` | Parses gradient API response (0-255 RGB stops) to a normalized gradient |
| `gradientApiResponsesToGradients(array)` | Batch version of `gradientApiResponseToGradient` |

## Authentication

- **Search and Explore operations**: Work without authentication (authenticated users get additional metadata)
- **Save/Delete/Like operations**: Require user authentication via Adobe IMS

## Related Files

- `KulerPlugin.js` — Main plugin class
- `topics.js` — Topic and action group definitions
- `actions/KulerActions.js` — All action group implementations (SearchActions, ExploreActions, ThemeActions, GradientActions, LikeActions)
- `../../providers/KulerProvider.js` — Consumer-friendly provider
- `../../providers/transforms.js` — Response transform utilities

---

**Version:** 3.0  
**Last Updated:** February 2026
