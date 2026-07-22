# Behance Plugin

> Integrates with the Behance API to search projects, browse curated galleries, and fetch graphic design content via GraphQL.

## Overview

The Behance Plugin provides access to the Behance creative community platform through both the REST v2 API and the GraphQL v3 API. It supports project keyword search, curated gallery browsing, gallery-specific project retrieval, and a GraphQL-powered graphic design feed for the home page.

This is a **complex plugin** using the Action Groups pattern, with three groups: `ProjectActions`, `GalleryActions`, and `GraphQLActions`.

## Features

- **Project Search** - Search Behance projects by keyword with sorting and pagination
- **Gallery List** - Retrieve curated Behance gallery categories by locale
- **Gallery Projects** - Browse projects within a specific gallery with pagination
- **Graphic Design Feed** - Fetch graphic design projects via GraphQL for the home page

## Configuration

**Feature Flag:** `ENABLE_BEHANCE`

**Service Config:**

```javascript
behance: {
  baseUrl: 'https://cc-api-behance.adobe.io/v2',
  apiKey: 'ColorWeb',
  endpoints: {
    projects: '/projects',
  },
}
```

> The GraphQL endpoint uses a separate base URL (`https://cc-api-behance.adobe.io/v3`) configured via `serviceConfig.graphqlBaseUrl`.

**Stage Override:**

```javascript
behance: {
  ...PROD_CONFIG.services.behance,
  baseUrl: 'https://cc-api-behance-stage.adobe.io/v2',
}
```

## Topics

| Topic | Action Group | Description |
|-------|-------------|-------------|
| `projects.search` | `projects` | Search Behance projects by keyword |
| `galleries.list` | `galleries` | Get curated gallery categories |
| `galleries.projects` | `galleries` | Get projects within a specific gallery |
| `graphql.graphicDesignList` | `graphql` | Fetch graphic design projects via GraphQL |

## Usage

### Via Provider (Recommended)

```javascript
const behance = await serviceManager.getProvider('behance');

// Search projects
const results = await behance.searchProjects('sunset', { sort: 'featured_date', page: 1 });

// Get gallery list
const galleries = await behance.getGalleryList({ locale: 'en' });

// Get gallery projects
const projects = await behance.getGalleryProjects('12345', { page: 1, perPage: 20 });

// Get graphic design list (GraphQL)
const designs = await behance.getGraphicDesignList({ slug: 'graphic-design', count: 10 });
```

### Via Plugin Dispatch

```javascript
import { BehanceTopics } from './plugins/behance/topics.js';

const plugin = serviceManager.getPlugin('behance');

// Search projects
const results = await plugin.dispatch(BehanceTopics.PROJECTS.SEARCH, {
  query: 'sunset',
  sort: 'featured_date',
  page: 1,
});

// Get gallery list
const galleries = await plugin.dispatch(BehanceTopics.GALLERIES.LIST, { locale: 'en' });

// Get gallery projects
const projects = await plugin.dispatch(BehanceTopics.GALLERIES.PROJECTS, {
  galleryId: '12345',
  locale: 'en',
  page: 1,
  perPage: 20,
});

// Get graphic design list (GraphQL)
const designs = await plugin.dispatch(BehanceTopics.GRAPHQL.GRAPHIC_DESIGN_LIST, {
  slug: 'graphic-design',
  count: 10,
});
```

## Authentication

Authentication is handled via the `apiKey` in the service config (default: `ColorWeb`). The plugin inherits header management from `BaseApiService`, which injects the API key and any auth tokens via middleware.

## Response Structures

### searchProjects

```json
{
  "projects": [
    { "id": 12345, "name": "Project Title", "covers": { ... } }
  ]
}
```

### getGalleryList

Returns gallery categories for the given locale.

### getGalleryProjects

```json
{
  "gallery": { ... },
  "entities": [ ... ]
}
```

### getGraphicDesignList (GraphQL)

```json
{
  "projects": {
    "nodes": [
      { "id": "123", "covers": { "size_202": { "url": "..." } } }
    ]
  }
}
```

## Related Files

| File | Description |
|------|-------------|
| `BehancePlugin.js` | Main plugin class — registers action groups |
| `topics.js` | Topic and action group definitions |
| `constants.js` | GraphQL queries and default values |
| `actions/BehanceActions.js` | Action group classes (`ProjectActions`, `GalleryActions`, `GraphQLActions`) |
| `../../providers/BehanceProvider.js` | Provider with `useAction` pattern for consumer-friendly API |
| `index.js` | Plugin manifest (name, feature flag, loaders) |

---

**Version:** 1.0  
**Last Updated:** February 2026
