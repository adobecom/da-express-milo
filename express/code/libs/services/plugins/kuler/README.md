# Kuler Plugin

> Adobe Color themes and gradients service plugin.

## Overview

The Kuler Plugin provides access to Adobe Color (formerly Kuler) APIs for searching, creating, and managing color themes and gradients. It's a complex plugin with multiple action groups handling distinct functional areas.

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
  },
}
```

## Topics

Topics define the available actions for the Kuler service. Use these with `plugin.dispatch()` for direct API access, or use the `KulerProvider` for a friendlier interface.

| Topic | Description |
|-------|-------------|
| `search.themes` | Search for color themes |
| `search.gradients` | Search for gradients |
| `search.published` | Check if theme is published |
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
| `search` | `SearchActions` | fetchThemeList, fetchGradientList, searchPublishedTheme | Search-related operations |
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

// Get specific theme
const theme = await kuler.getTheme('theme-id');

// Save theme (requires authentication)
await kuler.saveTheme(themeData, ccLibrariesResponse);

// Delete theme (requires authentication)
await kuler.deleteTheme({ id: 'theme-id', name: 'Theme Name' });

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

// Get theme
const theme = await kulerPlugin.dispatch(KulerTopics.THEME.GET, 'theme-id');
```

## API Details

### Search

Kuler search expects a `q` parameter with a JSON-encoded query object (e.g. `q={"term":"value"}`). Results are paginated with a default batch size of 72.

### Search Criteria

| Parameter | Type | Description |
|-----------|------|-------------|
| `main` | string | Search query |
| `typeOfQuery` | string | Query type: `term`, `tag`, `hex`, `similarHex` |
| `pageNumber` | number | Page number (1-indexed) |

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

## Authentication

- **Search operations**: Work without authentication
- **Save/Delete/Like operations**: Require user authentication via Adobe IMS

## Related Files

- `KulerPlugin.js` — Main plugin class
- `topics.js` — Topic and action group definitions
- `actions/KulerActions.js` — All action group implementations (SearchActions, ThemeActions, GradientActions, LikeActions)
- `../../providers/KulerProvider.js` — Consumer-friendly provider

---

**Version:** 2.0  
**Last Updated:** February 2026
