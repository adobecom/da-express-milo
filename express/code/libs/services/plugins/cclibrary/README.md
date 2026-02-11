# CCLibrary Plugin

> Creative Cloud Libraries (Melville API) plugin for creating and managing libraries, themes, gradients, and element metadata.

## Overview

The CCLibrary Plugin provides topic-driven access to Adobe Creative Cloud Libraries through the Melville API.
It is implemented as a Pattern A plugin with action groups and a provider, enabling both low-level dispatch usage and a consumer-friendly provider API.

## Features

- 📚 **Library Management** - Create libraries and fetch paginated library lists
- 🧩 **Library Elements** - Fetch elements (themes/gradients) in a specific library
- 🎨 **Theme Operations** - Save, update, and delete theme elements
- 🌈 **Gradient Operations** - Save gradient elements
- 🏷️ **Metadata Updates** - Update element metadata (for example, renaming elements)

## Configuration

**Feature Flag:** `ENABLE_CCLIBRARY`

**Plugin Manifest Name:** `cclibrary`  
**Service Config Key:** `cclibraries`

**Service Config:**

```javascript
cclibraries: {
  baseUrl: 'https://cc-api-assets.adobe.io',
  melvilleBasePath: 'https://libraries.adobe.io/api/v1',
  endpoints: {
    libraries: '/libraries',
    themes: '/elements',
    metadata: '/metadata',
  },
}
```

## Topics

| Topic | Description |
|-------|-------------|
| `cclibrary.library.create` | Create a new library |
| `cclibrary.library.fetch` | Fetch libraries with pagination/filter options |
| `cclibrary.library.elements` | Fetch elements in a specific library |
| `cclibrary.theme.save` | Save a theme element into a library |
| `cclibrary.theme.saveGradient` | Save a gradient element into a library |
| `cclibrary.theme.delete` | Delete a library element |
| `cclibrary.theme.update` | Update an element's representation payload |
| `cclibrary.theme.updateMetadata` | Update element metadata (for example, name) |

## Action Groups

| Group | Actions |
|-------|---------|
| `library` | `createLibrary`, `fetchLibraries`, `fetchLibraryElements` |
| `theme` | `saveTheme`, `saveGradient`, `deleteTheme`, `updateTheme`, `updateElementMetadata` |

## Usage

### Via Provider (Recommended)

```javascript
import { serviceManager, initApiService } from './services/integration/index.js';

await initApiService();

const ccLibrary = await serviceManager.getProvider('cclibrary');

// Create library
const created = await ccLibrary.createLibrary('Brand Colors');

// List libraries
const libraries = await ccLibrary.fetchLibraries({ owner: 'self', limit: 20 });

// Fetch elements in library
const elements = await ccLibrary.fetchLibraryElements('lib-123', {
  start: 0,
  limit: 50,
  selector: 'representations',
});

// Save theme
await ccLibrary.saveTheme('lib-123', {
  name: 'Warm Sunset',
  type: 'colortheme',
  representations: [],
});

// Save gradient
await ccLibrary.saveGradient('lib-123', {
  name: 'Ocean Fade',
  type: 'gradient',
  representations: [],
});

// Update element representations
await ccLibrary.updateTheme('lib-123', 'elem-456', {
  client: 'express',
  type: 'colortheme',
  representations: [],
});

// Update metadata
await ccLibrary.updateElementMetadata('lib-123', [
  { id: 'elem-456', name: 'Renamed Theme' },
]);

// Delete element
await ccLibrary.deleteTheme('lib-123', 'elem-456');
```

### Via Plugin Dispatch

```javascript
import { CCLibraryTopics } from './services/integration/plugins/cclibrary/topics.js';

const plugin = serviceManager.getPlugin('cclibrary');

const libraries = await plugin.dispatch(CCLibraryTopics.LIBRARY.FETCH, {
  owner: 'all',
  start: 0,
  limit: 40,
});

const created = await plugin.dispatch(CCLibraryTopics.LIBRARY.CREATE, 'My Library');
```

## Response Structure

### `fetchLibraries(params)`

```javascript
{
  total_count: number,
  libraries: [
    {
      id: string,
      name: string,
      // ... API fields
    }
  ],
  _links: object
}
```

### `fetchLibraryElements(libraryId, params)`

```javascript
{
  total_count: number,
  elements: [
    {
      id: string,
      name: string,
      type: string, // e.g. 'colortheme' or 'gradient'
      // ... API fields
    }
  ]
}
```

### `saveTheme(...)` / `saveGradient(...)`

```javascript
{
  elements: [
    {
      id: string,
      name: string,
      type: string
    }
  ]
}
```

### `deleteTheme(...)` / `updateElementMetadata(...)`

```javascript
{}
```

### `updateTheme(...)`

```javascript
{
  id: string,
  representations: []
  // ... API fields
}
```

## Authentication

Bearer authentication is expected for CCLibrary operations.
Auth headers are provided through the shared service-layer auth flow (Adobe IMS token resolution in `BaseApiService`).

## Related Files

- `CCLibraryPlugin.js` - Main plugin class
- `topics.js` - Topic and action-group identifiers
- `actions/CCLibraryActions.js` - Action group implementations
- `../../providers/CCLibraryProvider.js` - Consumer-facing provider
- `index.js` - Plugin manifest

---

**Version:** 1.0  
**Last Updated:** February 2026
