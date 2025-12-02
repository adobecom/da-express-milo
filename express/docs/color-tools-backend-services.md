## Color Tools & Explore Palettes – Backend Services Guide

This document outlines the **backend services** that power the Color Tools surface (wheel / image / base tools) and the **Explore color palettes** gallery (search + inspiration feed). It is written for service owners and feature engineers who need to integrate or extend these flows from the Franklin (`da-express-milo`) front end.

The high‑level pattern is:

- The **Franklin front end** is buildless and runs in the browser.
- All calls to protected or internal services go through **small proxy endpoints** (edge/serverless “functions”), which:
  - Read **env/secret config** (e.g. `ETHOS_ENDPOINT`, `STOCK_ENDPOINT`),
  - Attach IMS/auth headers as needed,
  - Normalize responses into **front‑end friendly JSON**.

---

## 1. Service Inventory

| Service | Env / Config Keys (examples) | Primary Use Cases | Surfaces |
| --- | --- | --- | --- |
| **Ethos Theme APIs** | `ETHOS_ENDPOINT` | Palette & theme search, curated lists (e.g. “1.5K color palettes”, “Popular searches”). | Explore Palettes gallery, future “browse” tab in Color Tools. |
| **Kuler Legacy APIs** | `KULER_ENDPOINT` | Back‑compat for older palette IDs and themes that still live in Kuler indexes. | Deep links from legacy URLs, migration tools. |
| **Adobe Stock APIs** | `STOCK_ENDPOINT` | Fetch representative imagery for a palette, or suggest palettes from image search. | Palette cards (thumbnail imagery), future “get palette from image search result”. |
| **Autotag** | `AUTOTAG_ENDPOINT` | Generate tags, moods, and search phrases from an image or palette. | Explore search chips, palette details, image extract workflows. |
| **Ethos / Adobe Libraries (CC Libraries)** | `CCLIBRARIES_ENDPOINT`, `CCLIBRARIES_ENV` | Persist palettes as CC library themes; list/update/delete saved palettes. | “Save to Library” actions on Color Tools and Explore cards. |
| **Behance GraphQL + REST** | `BEHANCE_GRAPHQL_ENDPOINT`, `BEHANCE_REST_ENDPOINT` | Community‑driven inspiration (palettes used in Behance projects, popularity signals). | Explore ranking, “popular / trending” sort modes, detail sidebars. |
| **Universal Search** | `UNIVERSAL_SEARCH_ENDPOINT`, `UNIVERSAL_SEARCH_PROXY` | Global search suggestions and ranked palette results for typed queries. | Explore search box, popular searches row, “load more” pagination. |

> NOTE: Actual key names may differ by environment; see environment configuration or deployment pipeline for the canonical variable list.

---

## 2. Integration Pattern (Franklin / `da-express-milo`)

### 2.1 Edge / Function Layer

All sensitive services should be called via **proxy endpoints** rather than directly from the browser. Typical responsibilities:

- Read `X-Request-ID`, locale, IMS cookies as needed.
- Forward HTTPS calls to the downstream service using env‑provided base URLs.
- Apply rate‑limiting and basic input validation.
- Normalize and trim responses into a compact JSON schema tailored for the Color tools UX.

Suggested naming convention (examples):

- `GET /api/color/ethos/themes` → Ethos theme search
- `GET /api/color/ethos/theme/{id}` → Fetch specific theme by ID
- `POST /api/color/autotag` → Autotag an image or palette
- `POST /api/color/libraries/themes` → Create/update CC library theme
- `GET /api/color/search` → Universal Search wrapper for palettes

> Where these routes live (Helix functions, edge run‑time, or platform‑specific handlers) depends on deployment, but the **front end should only know about the `/api/color/*` surface**, not the raw internal endpoints.

### 2.2 Front-End Consumption

- Explore gallery and Color Tools block use `fetch('/api/color/...')` with:
  - ISO‑locale hints (e.g. `?locale=en-US`),
  - Lightweight query params (search terms, sort keys, pagination cursors).
- Responses are expected in **plain JSON** with:
  - Stable identifiers (`id`, `externalId`, `source`),
  - Display fields (names, hex arrays, preview URLs),
  - Analytics‑ready metadata (origin service, sort bucket, experiment flags).

---

## 3. Per-Service Contracts (Conceptual)

> These are **idealized contracts** for the Color surfaces; adapt to match actual downstream APIs.

### 3.1 Ethos Theme APIs

- **Purpose**: Provide curated & searchable color themes.
- **Downstream**: `ETHOS_ENDPOINT` (internal) – multi‑tenant, locale‑aware.
- **Proxy endpoints**:
  - `GET /api/color/ethos/themes`
    - Query: `q` (search string), `mood`, `category`, `sort` (`popular`, `recent`), `cursor`.
    - Returns:
      ```json
      {
        "items": [
          {
            "id": "ethos:theme:123",
            "name": "Eternal Sunshine of the Spotless Mind",
            "hex": ["#F4EAD5", "#9AC0D5", "#49738C", "#BF6A40"],
            "source": "ethos",
            "attribution": { "creator": "Adobe", "locale": "en-US" },
            "stats": { "views": 15230, "uses": 832 }
          }
        ],
        "cursor": "eyJwYWdlIjoyfQ=="
      }
      ```
  - `GET /api/color/ethos/theme/{id}` – hydrate a single theme when the user opens details or deep links from a shared URL.

### 3.2 Kuler Legacy APIs

- **Purpose**: Support old Kuler‑style palette IDs and imports.
- **Pattern**:
  - Proxy only when a theme ID is **not found in Ethos** or carries a `kuler:` prefix.
  - Normalize legacy formats into the same `{ id, name, hex[] }` schema used by Ethos.

### 3.3 Adobe Stock APIs

- **Purpose**: Associate representative imagery with palettes, or generate palettes from stock image search.
- **Proxy endpoints** (examples):
  - `GET /api/color/stock/search`
    - Query: `q` (tags), `license`, `locale`, `cursor`.
    - Returns a minimal set of fields:
      ```json
      {
        "items": [
          {
            "id": "stock:12345",
            "thumbnailUrl": "https://.../12345.jpeg",
            "aspectRatio": 1.5,
            "primaryPalette": ["#0D1A36", "#6BA7D6", "#F2D4A1"],
            "attribution": { "author": "Stock Contributor", "href": "https://stock.adobe.com/..." }
          }
        ],
        "cursor": "..."
      }
      ```
  - `GET /api/color/stock/palette-from-image?id=stock:12345` – optional helper to derive a refined theme from a specific Stock image (can reuse the same clustering engine as the Image Extractor tab).

### 3.4 Autotag

- **Purpose**: Generate **moods, tags, and phrases** for palettes and images to improve search and discoverability.
- **Proxy endpoint**:
  - `POST /api/color/autotag`
    - Body:
      ```json
      {
        "hex": ["#FF7500", "#122583", "#0077FF", "#6BB5FF", "#FFF7E0"],
        "imageUrl": "https://.../optional-reference.jpg",
        "locale": "en-US"
      }
      ```
    - Returns:
      ```json
      {
        "tags": ["warm", "retro", "sunset"],
        "moods": ["Happy", "Vaporwave"],
        "searchPhrases": ["retro sunset palette", "orange and blue color scheme"]
      }
      ```
- **Usage**:
  - Explore page may call this when publishing/refreshing curated palettes.
  - Color Tools may call it after image extraction or manual palette creation to suggest tags and search shortcuts.

### 3.5 Adobe Libraries (CC Libraries)

- **Purpose**: Let authenticated users **save and reuse** palettes as CC library themes.
- **Proxy endpoints**:
  - `GET /api/color/libraries/themes` – list themes for the current user (paginated).
  - `POST /api/color/libraries/themes`
    - Body:
      ```json
      {
        "name": "My Color Theme",
        "hex": ["#FF7500", "#122583", "#0077FF", "#6BB5FF", "#FFF7E0"],
        "source": "express-color-tools",
        "workflow": "color-tools-wheel"
      }
      ```
  - `PUT /api/color/libraries/themes/{id}` – update existing theme.
  - `DELETE /api/color/libraries/themes/{id}` – delete theme.
- **Auth**:
  - Relies on IMS cookies; proxy is responsible for attaching the right OAuth tokens / headers.

### 3.6 Behance GraphQL + REST

- **Purpose**: Use **community signals** (projects, appreciations) to influence palette ranking or show where palettes were used.
- **Proxy endpoints** (examples):
  - `GET /api/color/behance/palette-usage?id=ethos:theme:123`
  - `GET /api/color/behance/trending-palettes?cursor=...`
- **Returned data**:
  - Project counts, thumbnails, and links used purely for display/ordering. Avoid leaking unnecessary user PII back to the browser.

### 3.7 Universal Search

- **Purpose**: Power the main **search box** and **popular searches** on Explore.
- **Proxy endpoints**:
  - `GET /api/color/search/suggest?q=summer&locale=en-US`
    - Returns an ordered list of suggestions (palettes, moods, tags).
  - `GET /api/color/search?q=neutral%20palette&sort=popular&timeRange=all&cursor=...`
    - Merges Ethos, Kuler, and (optionally) Behance/Stock signals into a single ranked result set:
      ```json
      {
        "items": [
          {
            "id": "ethos:theme:123",
            "hex": ["#D9D0C1", "#F7F4EC", "#8E7C64", "#574B3A"],
            "label": "Neutral living room",
            "origin": "ethos",
            "score": 0.92
          }
        ],
        "cursor": "..."
      }
      ```

---

## 4. Security, Config, and Environments

- **Secrets & endpoints**
  - All base URLs, API keys, and client IDs live in environment configuration (e.g., GitHub Actions secrets, Helix env, or deployment‑platform variables).
  - Never commit raw endpoints that expose internal topology or secrets; refer to them via `FOO_ENDPOINT` names.

- **IMS / Auth**
  - The proxy layer is responsible for:
    - Validating IMS cookies / access tokens,
    - Enforcing login requirements for save‑to‑library or personalized feeds,
    - Mapping user IDs to downstream services where needed.

- **Locales & Regions**
  - Front end should always send a locale hint (`locale`, `uiLocale`) and region where applicable.
  - Services that do not support localization should still be wrapped so that we can add translation/normalization later without touching the UI code.

---

## 5. Implementation Notes & Next Steps

- **For Explore Palettes**:
  - Ethos should be considered the **primary source of truth** for palette data; other services (Behance, Kuler) enrich or backfill.
  - Universal Search provides the search and suggestion layer on top of these sources.

- **For Color Tools**:
  - Start with **local, client‑only** behaviors (wheel, image extraction) and progressively add:
    - Autotag calls to generate moods/tags,
    - Optional “Save to Libraries” using the libraries proxy.
  - Ensure all service interactions are surfaced as analytics events (e.g., `express:color-tools-action` with `sourceService` and `workflow` fields) to support ingestion and experimentation.

This guide should evolve alongside the actual proxy implementations. When you add or change a service integration, update this doc with the new route(s), expected payload shape, and any auth or rate‑limiting nuances.


