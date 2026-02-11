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
- 🔒 **Writable Library Filtering** - Determine which libraries the user can write to (private, shared-editor, ACL)
- 🎯 **Swatch Conversion** - Convert internal color swatches to CC Library format (RGB, CMYK, HSB, LAB, Pantone)
- ⚠️ **Storage Full Detection** - Dedicated `StorageFullError` for HTTP 507 responses

## Configuration

**Feature Flag:** `ENABLE_CCLIBRARY`

**Plugin Manifest Name:** `cclibrary`  
**Service Config Key:** `cclibraries`

**Service Config:**

```javascript
cclibraries: {
  baseUrl: 'https://cc-api-assets.adobe.io',
  melvilleBasePath: 'https://libraries.adobe.io/api/v1',
  apiKey: 'API_KEY', // Required — injected as x-api-key header by BaseApiService
  endpoints: {
    libraries: '/libraries',
    themes: '/elements',
    metadata: '/metadata',
  },
}
```

> **Note:** The plugin's `baseUrl` resolves to `melvilleBasePath` from service config, falling back to `baseUrl` if not set.
> The `apiKey` field is required for the `x-api-key` header to be sent with every request.

## Constants

All magic values are centralized in `constants.js`:

```javascript
import {
  THEME_ELEMENT_TYPE,        // 'application/vnd.adobe.element.colortheme+dcx'
  GRADIENT_ELEMENT_TYPE,     // 'application/vnd.adobe.element.gradient+dcx'
  THEME_REPRESENTATION_TYPE, // 'application/vnd.adobe.colortheme+json'
  GRADIENT_REPRESENTATION_TYPE, // 'application/vnd.adobe.gradient+json'
  ALL_COLOR_ELEMENT_TYPES,   // Combined theme + gradient filter string
  LIBRARIES_PAGE_SIZE,       // 40
  ELEMENTS_PAGE_SIZE,        // 50
  MAX_ELEMENTS_PER_LIBRARY,  // 1000
  LIBRARY_OWNERSHIP,         // { PRIVATE, SHARED }
  LIBRARY_ROLE,              // { EDITOR, VIEWER }
  ERROR_CODE,                // { STORAGE_FULL }
  HTTP_STATUS,               // { STORAGE_FULL: 507 }
  COLOR_MODE,                // { RGB, CMYK, HSB, LAB }
} from './constants.js';
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

// Fetch elements in library (defaults to theme + gradient types)
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

### Writable Library Filtering

A library is considered writable when any of these conditions is true:
1. It is a **private** library (owned by the user).
2. It is **shared** and the user's bookmark role is `"editor"`.
3. It is **shared** and `asset_acl.directory_access` includes `"write"`.

```javascript
const ccLibrary = await serviceManager.getProvider('cclibrary');

// Fetch all libraries
const result = await ccLibrary.fetchLibraries({ owner: 'all' });

// Filter to only those the user can save into
const writableLibs = ccLibrary.filterWritableLibraries(result.libraries);

// Or check a single library
if (ccLibrary.isLibraryWritable(someLibrary)) {
  await ccLibrary.saveTheme(someLibrary.library_urn, themePayload);
}
```

### Swatch Format Conversion

Each swatch in a CC Library theme is an **array** of mode objects.
When the primary `colorMode` is not RGB, an entry for that mode is added first, followed by the mandatory RGB entry.
Pantone / spot-color metadata is attached to the RGB entry when present.

```javascript
const ccLibrary = await serviceManager.getProvider('cclibrary');

// Convert a single swatch (RGB values are 0-1 floats internally)
const ccSwatch = ccLibrary.convertSwatchToCCFormat(
  { rgb: { r: 0.9, g: 0.4, b: 0.2 } },
  'RGB'
);
// → [{ mode: 'RGB', value: { r: 230, g: 102, b: 51 } }]

// With Pantone data
const pantoneSwatch = ccLibrary.convertSwatchToCCFormat(
  { rgb: { r: 0.9, g: 0.4, b: 0.2 }, pantone: '185 C', isSpotColor: true },
  'RGB'
);
// → [{ mode: 'RGB', value: { r: 230, g: 102, b: 51 }, type: 'spot', spotColorName: 'PANTONE 185 C' }]

// Convert all swatches for a CMYK theme
const ccSwatches = ccLibrary.convertSwatchesToCCFormat(theme.swatches, 'CMYK');
// → Each swatch array contains [cmykEntry, rgbEntry]
```

### Storage Full Error Handling

```javascript
import { StorageFullError } from './services/core/Errors.js';

try {
  await ccLibrary.createLibrary('New Library');
} catch (error) {
  if (error instanceof StorageFullError) {
    // Show user-facing message that cloud storage is full
  }
}
```

> **Note:** When using the provider's `safeExecute` wrapper, errors are caught and logged automatically.
> To handle `StorageFullError` explicitly, use `plugin.dispatch()` directly or catch within the action call.

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

## Validation

All action methods validate required inputs before making API calls. Invalid inputs throw a `ValidationError` (from `../../core/Errors.js`) with contextual metadata:

```javascript
{
  field: 'libraryId',             // the invalid field
  serviceName: 'CCLibrary',       // plugin service name
  topic: 'cclibrary.theme.save'   // the dispatched topic
}
```

| Method | Required Fields |
|--------|----------------|
| `createLibrary` | `name` (non-empty string) |
| `fetchLibraryElements` | `libraryId` |
| `saveTheme` | `libraryId`, `themeData` (object) |
| `saveGradient` | `libraryId`, `gradientData` (object) |
| `deleteTheme` | `libraryId`, `elementId` |
| `updateTheme` | `libraryId`, `elementId`, `payload` (object) |
| `updateElementMetadata` | `libraryId`, `elements` (non-empty array) |

## Error Handling

| Error Type | Code | When |
|------------|------|------|
| `ValidationError` | `VALIDATION_ERROR` | Missing or invalid input parameters |
| `ApiError` | HTTP status code | Generic HTTP failures (400, 401, 403, 404, etc.) |
| `StorageFullError` | `STORAGE_FULL` | HTTP 507 — user's CC cloud storage is full |

## Authentication

Bearer authentication is expected for CCLibrary operations.
Auth headers are provided through the shared service-layer auth flow (Adobe IMS token resolution in `BaseApiService`).

The `x-api-key` header is injected automatically when `apiKey` is set in the service config.

## Related Files

- `CCLibraryPlugin.js` - Main plugin class (with 507 handleResponse override)
- `topics.js` - Topic and action-group identifiers
- `constants.js` - MIME types, pagination defaults, ownership constants
- `actions/CCLibraryActions.js` - Action group implementations
- `../../providers/CCLibraryProvider.js` - Consumer-facing provider (with utility helpers)
- `../../core/Errors.js` - Error types including `StorageFullError`
- `index.js` - Plugin manifest

---

**Version:** 1.1  
**Last Updated:** February 2026
