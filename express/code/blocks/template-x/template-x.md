# template-x Block

A dynamic template gallery block for Adobe Express. Fetches design templates from the templates API and renders them as a browsable, filterable grid or carousel.

---

## Files

| File | Purpose |
|---|---|
| `template-x.js` | Main entry point. Parses block config, fetches templates, builds layout (grid/carousel/holiday), toolbar, tabs, search, breadcrumbs. |
| `template-rendering.js` | Renders individual template cards: static thumbnail + hover media player + CTA/share buttons. |
| `breadcrumbs.js` | Builds breadcrumb `<nav>` for template SEO pages and search result pages. |
| `template-x.css` | All styles for the block and its variants. |
| `sample-template.json` | Example of the API response shape for a single template. |
| `sample-webpage-template.json` | Example API response for a `Webpage_Template` asset type. |

---

## How It Works

### Initialization (`decorate`)

1. Imports `createTag`, `getConfig`, `getMetadata`, `replaceKey`, `replaceKeyArray` from Milo libs.
2. Calls `constructProps(block)` to parse the block's table rows into a `props` object.
3. Calls `determineTemplateXType(props)` to derive layout variant classes (e.g. `horizontal`, `fullwidth`, `holiday`).
4. Clears the block's DOM and calls `buildTemplateList(block, props, type)`.

### Props Parsing (`constructProps`)

Each table row in the block maps to config via column count:

| Columns | Meaning |
|---|---|
| 1 | Content row — heading/title displayed above the template grid |
| 2 | Key/value config pair (see **Prop Keys** below) |
| 3 | Template stats row — key + enabled flag + heading text |
| 4 | Manual "blank template" card to inject into the grid |
| 5 | Holiday block config — enabled + icon + background color + animation |

String values `"null"`, `"no"`, `"false"`, `"off"` are treated as falsy/empty.

### Prop Keys (2-column rows)

| Key | Type | Description |
|---|---|---|
| `tasks` | string | Task filter for API (e.g. `flyer`, `social-media`) |
| `topics` | string | Topic filter for API |
| `locales` | string | Locale filter, defaults to `en` |
| `behaviors` | string | Behavior filter (e.g. `still`, `animated`) |
| `premium` | string | Licensing filter (`all`, `free`, `premium`) |
| `animated` | string | Animation filter (`all`, `static`, `animated`) |
| `limit` | number | Templates per page fetch, defaults to `70` |
| `collection id` | string | Override default collection URN |
| `sort` | string | Sort order (`&orderBy=-remixCount`, etc.) |
| `orientation` | string | `horizontal` renders a carousel; default is vertical grid |
| `width` | string | Grid width: `full`, `sixcols`, `fourcols` |
| `mini` | boolean | Compact card size |
| `load more templates` | boolean | Adds a "Load More" button at the bottom |
| `tool bar` | boolean | Shows the filter/sort/view toolbar |
| `search bar` | boolean | Pulls in the sticky search bar from `BlockMediator` |
| `template stats` | boolean + string | Shows a template count heading in the toolbar |
| `tabs` | string | Comma-separated tab labels (optionally with collection IDs: `Flyers (urn:...)`) |
| `template order` | string | Comma-separated template IDs to pin to the front |
| `hide jump to categories` | boolean | Hides the jump-to-category side panel |
| `taas query` | string | Use TaaS (Template-as-a-Service) endpoint instead of the default API |
| `holiday block` | boolean | Enables collapsible holiday-themed layout (see holiday section) |
| `mv` | string | Marketing tracking param appended to CTA URLs |
| `sdid` | string | Marketing tracking param appended to CTA URLs |
| `source` | string | Marketing tracking param appended to CTA URLs |
| `action` | string | Marketing tracking param appended to CTA URLs |
| `zazzle url` | string | Base URL for print iframe modal (flyer/t-shirt variants) |
| `taskid` | string | Task ID passed to Zazzle print iframe |
| `custom url config` | string | JSON string `{baseUrl, queryParams}` to override CTA href (templateId URN auto-appended) |
| `initial template view` | string | Starting grid zoom: `sm`, `md`, or `lg` |
| `print` | string | Enables print variant: `flyer` or `t-shirt` opens an iFrame modal instead of Express |
| `experiment` | string | CSS class name applied for running A/B experiments |

**Page metadata** (not block props) that also affect behavior:
- `template-experiment` — fallback experiment name if not set in props
- `external-template-cta-link-1` — override CTA href on eligible free/static templates (templateId auto-appended)
- `external-template-cta-link-2` — adds a secondary CTA button alongside the primary
- `short-title` — used in toolbar heading and breadcrumbs
- `toolbar-heading` — enables the template count heading
- `template-search-page` — marks page as a search results page (`Y`)
- `q` / `topics-x` / `topics` / `tasks-x` — passed through to API and analytics

---

## Rendering Flow

```
decorate()
  └─ constructProps()         — parse block table into props
  └─ determineTemplateXType() — derive variant class list
  └─ buildTemplateList()
       ├─ fetchAndRenderTemplates()   — default API fetch
       │   OR fetchAndRenderTemplatesFromTaas() — TaaS fetch
       ├─ decorateTemplates()         — populate grid, init masonry, attach analytics
       ├─ [optional] decorateToolbar()     — filter/sort/view toggle bar
       │    └─ decorateCategoryList()      — jump-to-category side panel
       ├─ [optional] importSearchBar()     — sticky search bar integration
       ├─ [optional] buildCarousel()       — horizontal carousel
       ├─ [optional] build2by2()           — tworow experiment gallery
       ├─ [optional] decorateLoadMoreButton()
       ├─ [optional] tabs setup            — tab buttons, re-fetch on click
       ├─ decorateBreadcrumbs()
       └─ [optional] decorateHoliday()     — seasonal themed layout
```

---

## Template Cards (`template-rendering.js`)

Each card is a `<div>` with two children:

### Still Wrapper
- Shows the static thumbnail image (lazy-loaded by default).
- First 4 templates in the first page section load eagerly with `fetchpriority=high`.
- Overlays a **plan badge** (`Free` tag or premium icon) and a **media type badge** (video, multipage-static, multipage-video) once the image loads.

### Hover Wrapper
- On `mouseenter` or `focusin`, media is rendered on-demand (not pre-loaded).
- **Image rotation**: Cycles through template pages; each image displays for 2 seconds then advances.
- **Video playback**: Fetches MP4 URL from rendition metadata; falls back to component link. Video plays, then cycles to next page.
- Supports both `image/webp` (via component link) and JPEG/PNG (via rendition link).
- Contains:
  - **Primary CTA** — "Edit this template" button linking to Express editor via branch URL.
  - **Secondary CTA** — Optional second button if `external-template-cta-link-2` metadata is set (free, static templates only).
  - **CTA link overlay** — Transparent `<a>` covering the thumbnail for click-through.
  - **Share button** — Copies a tracking-appended branch URL to clipboard with a tooltip.

### Print Variants (`flyer`, `t-shirt`, `print`)
Instead of an Express editor link, the CTA opens a **Zazzle iFrame modal** using `zazzle url`, `taskid`, `branchUrl`, and document `lang`.

### Custom / Experimental CTAs
- If `custom url config` prop is set, the CTA href is built from `baseUrl + queryParams + templateId` (URN extracted from template).
- If `external-template-cta-link-1` page metadata is set, it overrides the primary CTA for eligible templates (free + non-animated + non-print).
- `external-template-cta-link-2` adds a `.secondary-template-cta` button. Both experimental CTAs get `?templateId=<urn>` appended automatically.

---

## Layout Variants

| Class | Behavior |
|---|---|
| `horizontal` | Renders templates in a scrollable carousel |
| `tworow` | Horizontal 2×2 gallery using the `buildGallery` widget; overrides orientation to horizontal + full width |
| `fullwidth` | Full-width grid (165px card width) |
| `sixcols` | Six-column grid (165px card width) |
| `fourcols` | Four-column grid |
| `mini` | Compact card height |
| `holiday` | Collapsible seasonal banner (see below) |
| `print` / `flyer` / `t-shirt` | Uses iFrame CTA instead of Express editor; hides category list |

### Masonry
When there are more than 6 templates and orientation is not horizontal, the inner wrapper gets the `flex-masonry` class and a `Masonry` instance manages column layout. Redraws on `window resize`.

---

## Toolbar

Shown when `tool bar` prop is `true`. Sticks below the global navigation (offset calculated via `getGnavHeight`). Contains:

- **Template count heading** (if `template stats` is on)
- **Filter dropdowns**: Premium/Free toggle, Static/Animated toggle
- **Sort dropdown**: Most Relevant, Most Viewed, Rare & Original, Newest to Oldest, Oldest to Newest
- **View toggle**: Small / Medium / Large grid icons (hidden in tworow mode)
- **Mobile drawer**: Filter and sort options open in a slide-up drawer with an Apply button

Selecting a filter or sort option triggers `redrawTemplates()`, which clears and re-fetches templates with updated params.

---

## Category List (Jump to Category)

Shown alongside the toolbar (unless `hide jump to categories` is true, tworow mode, or print variants). Reads `x-task-categories` and `task-category-icons` from placeholders. Each category links to `/express/templates/search?tasks=...`. Template counts for each category are fetched lazily on `mouseover`. Hidden by default on print/flyer/t-shirt variants.

---

## Tabs

When `tabs` prop is set (comma-separated task names, optionally with collection IDs in parentheses), tab buttons appear in the content title area. Clicking a tab re-fetches templates filtered by that task and optionally a different `collectionId`. The active tab is highlighted.

---

## Search Bar

When both `tool bar` and `search bar` are true, the block pulls the sticky search bar element from `BlockMediator` and mounts it in the toolbar. Features:
- Autocomplete suggestions via `autocomplete-api-v3.js` (300ms throttle, 500ms debounce, 7 results)
- On submit, parses the query using `x-task-name-mapping` placeholders to extract a task, then navigates to an SEO page if one exists, otherwise to `/express/templates/search?...`

---

## Holiday Block

Enabled via a 5-column row in the block table. Transforms the block into a themed collapsible banner:
- Custom `backgroundColor` with auto-detected `textColor` (dark/light) via `isDarkOverlayReadable`
- Optional `holidayIcon` (picture or SVG link) in the toggle bar
- Optional `backgroundAnimation` (a video link converted via `transformLinkToAnimation`)
- Toggle button expands/collapses the template list; auto-expands after 3 seconds if `auto-expand` class is present
- On mobile, the toggle button is appended to the block directly; on desktop, it's inside the header bar

---

## Breadcrumbs (`breadcrumbs.js`)

Appended to the block if the page is under `/express/templates/...` and has a `.search-marquee` or `.template-x-carousel.bc` element.

- **SEO pages**: Builds crumbs from path segments, linking each that exists in `allTemplatesMetadata`. Task segments are translated via `x-task-categories` / `task-categories` placeholders. Other segments try the placeholder sheet.
- **Search pages** (URL has `?tasks=` or metadata `template-search-page=Y`): Builds a 2-crumb trail — task page + current `short-title`.

Structure: `Home > Templates > [task] > [short-title]`

---

## Analytics

All user interactions are tracked via `trackSearch` and `updateImpressionCache` from `template-search-api-v3`:

| Event | Trigger |
|---|---|
| `view-search-result` | Templates rendered (uses `searchId` URL param) |
| `select-template` | User clicks a CTA |
| `select-load-more` | User clicks Load More |
| `search-inspire` | User changes filter, sort, or category |
| `search-inspire` | User submits search bar or picks autocomplete suggestion |

A `linkspopulated` CustomEvent is dispatched after templates render so branch link tracking can attach.

---

## Template Data Shape

See `sample-template.json` for a full example. Key fields used by rendering:

| Field | Used for |
|---|---|
| `id` | Template URN; used in analytics and custom URL |
| `dc:title['i-default']` | Card alt text and aria-labels |
| `licensingCategory` | `free` tag vs premium icon |
| `pages[]` | Array of pages; drives media rotation |
| `pages[].rendition.image.thumbnail` | Static thumbnail (width, height, componentId, mediaType) |
| `pages[].rendition.video.thumbnail.componentId` | Signals this page has video |
| `assetType` | `Webpage_Template` gets special handling (single empty page) |
| `customLinks.branchUrl` | Base CTA URL |
| `_links['...rel/rendition'].href` | Templated URL for image/video renditions |
| `_links['...rel/component'].href` | Templated URL for webp/video component downloads |
