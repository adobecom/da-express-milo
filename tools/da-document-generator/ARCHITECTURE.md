# DA Document Generator — Architecture Reference

This is the technical deep-dive for `da-document-generator`. It documents every module, how data flows between them, and the full feature set as currently implemented. For a quick usage summary see [README.md](./README.md).

## 1. Overview

DA Document Generator is a browser-only React app for bulk-creating (or updating) DA (Document Authoring) pages from product data. A user supplies a set of Zazzle product IDs (pasted or via CSV/XLSX upload), optionally enriches/validates that data against the Zazzle API, routes each row to an HTML template based on its `product_type` (or overrides routing with a single template for all rows), and generates one DA document per row by substituting `{{placeholder}}` tokens in the template. From there, rows can be previewed, published, unpublished, or deleted — individually or in bulk — with QA checks run both immediately after generation and against the live page after publish.

Everything runs client-side against three external APIs: the DA Admin API (`admin.da.live`), the AEM Admin API (`admin.hlx.page`), and the Zazzle partner API (`www.zazzle.com/svc/partner/adobeexpress`). There is no backend of its own.

## 2. High-level workflow

1. **Provide product data** — paste product IDs or upload a `.csv`/`.xlsx` file (Step "Product Data").
2. **Hydrate / validate** (optional) — fetch each row's product from Zazzle to fill in missing fields and/or confirm the ID resolves to a real product.
3. **Confirm routing** (Step "Config Sheet") — a DA sheet maps each `product_type` to a template path + output directory. Alternatively, enable **Override template** to force every selected row through one chosen template/output directory regardless of product type.
4. **Select rows and generate** (Step "Generate") — for each selected row: fetch the routed template (cached per template path during a bulk run), substitute placeholders, run placeholder QA, version the existing doc if one is about to be overwritten, and POST the HTML to DA.
5. **Preview / Publish / Unpublish / Delete** — per row or in bulk, using the AEM Admin API. Publish additionally fetches the live page and runs a second QA pass against the rendered HTML.

## 3. Tech stack & project layout

- **React 19 + TypeScript**, **Vite 8**, **Tailwind CSS v4** (via `@tailwindcss/vite`), **TanStack Query** (`QueryClientProvider` wraps the app in `src/main.tsx`, but no component currently issues a `useQuery` call — data fetching is done with plain `fetch`/async functions, not the query cache).
- CSV parsing via `papaparse`; `.xlsx` parsing/export via `xlsx` (SheetJS).

```
src/
  App.tsx                        top-level state + step orchestration
  main.tsx                       token bootstrap, React root
  types.ts                       shared type definitions
  index.css                      Tailwind entry
  api/
    daApi.ts                     DA Admin + AEM Admin API calls, URL/template helpers
    zazzleApi.ts                 Zazzle product lookup
  lib/
    generate.ts                  template substitution, output path, QA checks
  components/
    CsvUpload.tsx                Step 2: product data input, hydrate/validate, data table
    TemplateOverridePanel.tsx    Step 1: config sheet + template override
    GeneratePanel.tsx            Step 3: generate/preview/publish/unpublish/delete
  sample_data/
    zazzle_getproduct_sample.json  example raw Zazzle API response (reference only)
```

**Build/deploy**: `vite.config.ts` sets `base` to `/` in dev (`vite serve`) and to `/tools/da-document-generator/dist/` for production builds, because the built app is served directly by DA.live from the committed `dist/` folder rather than from a standalone host. `npm run build` runs `tsc -b && vite build`; the output in `dist/` is checked into the repo.

## 4. Authentication

Token resolution happens once, at startup, in `src/main.tsx` (`initToken`):

1. If `import.meta.env.VITE_DA_TOKEN` is set (local `.env.local`), use it directly.
2. Otherwise, dynamically import the DA shell SDK from `https://da.live/nx/utils/sdk.js` (10s timeout to load the module, 5s timeout to resolve its token promise) and use `sdkData.token`.
3. If either step fails or times out, the token is set to `null` and the app renders unauthenticated — DA-write operations will then throw `'DA token not set; set VITE_DA_TOKEN or run from DA.live'`.

In practice, path 2 is how the tool is used almost all of the time — opened from within DA.live, which provides the token via its shell automatically. Path 1 (`VITE_DA_TOKEN` in `.env.local`) is a fallback for the rare case of running the app standalone (e.g. `npm run dev` in a plain browser tab), where there's no DA shell present to supply a token.

`getToken()`/`setToken()` in `src/api/daApi.ts` hold the token in a module-level variable; `getToken()` falls back to `VITE_DA_TOKEN` if `setToken` was never called with a truthy value.

## 5. Data model (`src/types.ts`)

| Type | Purpose |
|---|---|
| `CsvRow` | `Record<string, string>` — one row of product data. Always carries a synthetic `_id` key (string index) plus whatever columns were parsed/entered. |
| `InputSummary` | Aggregate stats over all rows: `total`, `duplicates` (dup `product_id` count), `duplicateSlugs` (dup `url_slug` count), `missing`, and the row-id sets behind those counts (`duplicateProductIdRowIds`, `duplicateSlugRowIds`). |
| `ProductTypeConfig` | `{ productType, templatePath, outputDir }` — one row of the config sheet, or the synthesized override config (`productType: ''`). |
| `RowStage` | Lifecycle state of a generated row (see below). |
| `QaCheck` | `{ id, label, description, pass }` — one QA rule result. |
| `QaResult` | `{ pass, checks: QaCheck[] }` — aggregate of all checks for one row. |
| `RowResult` | Per-row generation/publish state: `id`, `path`, `stage`, plus optional `error`, `editUrl`, `previewUrl`, `liveUrl`, `qa`. |

**`RowStage` lifecycle** — the order a row actually moves through, with branches:

```
pending → generating → generated → previewing → previewed → publishing → published → unpublishing → unpublished
                            ↘ qa-fail                                                                      ↘ (back to publishing)
any stage → error (on any failed API call)
any post-generate stage → deleting → pending (delete succeeds, row resets) | error (delete fails)
```

Note: `qa-fail` is defined in the type but the current generate/publish handlers always set `stage: 'generated'`/`'published'` with a `qa` result attached rather than ever setting `stage: 'qa-fail'` — QA failure is surfaced via the `qa.pass` flag and the Issues column, not a separate stage.

## 6. Top-level orchestration (`src/App.tsx`)

State owned here:

- `rows` / `selectedRows` — all parsed rows vs. the checked subset from `CsvUpload`.
- `csvReadiness` — `{ dataComplete, idsValid, noDuplicates }`, bubbled up from `CsvUpload`.
- `hasGeneratedResults` — bubbled up from `GeneratePanel`; drives the "locked" state.
- `configSheetPath` / `configSheetStatus` / `productTypeConfigs` — bubbled up from `TemplateOverridePanel`.
- `templateOverrideEnabled` / `overrideConfig` — override toggle and the resolved override config.

`DEFAULT_CONFIG_SHEET` (`/adobecom/da-express-milo/doc-generator-presets`) is the initial config sheet path passed into `TemplateOverridePanel`.

**Locking pattern**: once `hasGeneratedResults` is true (i.e. the user has clicked Generate at least once and not yet reset), the Config Sheet panel, template override controls, and Product Data panel all render as `disabled`. This prevents changing inputs out from under results that reference them. `GeneratePanel`'s "Reset Results" action clears `hasGeneratedResults` and unlocks everything again.

**`generateBlockReason`** — a single derived string (or `undefined`) that both disables the Generate button and shows as its tooltip. Checked in this precedence order (first match wins):

1. `selectedRows.length === 0` → "Select at least one row to generate"
2. Override enabled but no valid `overrideConfig` → "Select a valid template override or uncheck the override option to continue"
3. Override disabled and config sheet status is `invalid`/`error` → "Config sheet is invalid — fix it before generating"
4. Override disabled and some selected row has no `product_type` → "Run Hydrate to assign product types before generating"
5. Override disabled and some selected row's `product_type` has no matching config entry → "Config sheet missing entries for: …"
6. Selected rows contain duplicate product IDs / slugs → "Fix duplicate product IDs or URL slugs before generating"
7. Any combination of incomplete data / unvalidated IDs → the corresponding "Fill in…" / "Validate…" message

This is the main gate a new contributor needs to understand before touching either `CsvUpload` or `TemplateOverridePanel`, since both feed into it.

## 7. Step 1 — Config Sheet & Template Override (`TemplateOverridePanel.tsx`)

### Config sheet validation

`validateConfigSheet(path)` calls `fetchSheet(path)` (a DA "sheet" document, fetched as JSON via `daApi.ts`) and checks its columns:

- **Required**: `Product Type`, `Template Path`, `Output Directory` — missing any of these → `status: 'invalid'`.
- **Optional**: `Product Name` — missing it degrades to a warning message but still `status: 'valid'`; template names in the override dropdown then fall back to showing the raw template path.
- Rows are kept as `ProductTypeConfig` entries only if both `Product Type` and `Template Path` are present; if zero such rows exist after filtering, the sheet is `invalid`.
- On success, valid rows are converted to `ProductTypeConfig[]` (passed up via `onConfigSheetLoad`) and separately to `TemplateOption[]` (used to populate the override dropdown — any row with a `Template Path`, even without a `Product Type`).
- Fetch failures are classified by status code prefix (`403`/`404`) into friendlier messages.

**Timing**: validated once on mount (via `initialConfigSheetPath` + a ref-held `validateConfigSheetRef`, kept current with `useLayoutEffect` so the debounce effect always calls the latest closure without adding it as a dependency), then re-validated 600ms after the path input stops changing (`localPath` debounce effect, guarded so it doesn't refire for the path that was just validated).

### Template override

When the "Override template" checkbox is enabled, the user picks one `TemplateOption` from a dropdown populated **only from the config sheet's rows** (there is no free-text template path entry in override mode — it reuses whatever the sheet already lists). Selecting an option triggers `handleConfirm` 600ms later, which:

1. Runs `cat(templatePath)` (fetch template HTML) and `checkDirectoryExists(outputDir)` concurrently via `Promise.allSettled` — one failing doesn't block the other from reporting.
2. Runs `validateTemplate(html)` (see below) on success.
3. Calls `onOverrideChange({ productType: '', templatePath, outputDir })` only if the template validation status is `'ready'` or `'warning'`; on `'invalid'`/`'error'`, calls `onOverrideChange(undefined)` — this is what feeds `overrideConfig` in `App.tsx` and ultimately gates `generateBlockReason`.

### Template validation (`daApi.ts`)

- `extractPlaceholders(html)` — regex `\{\{([^}]+)\}\}`, deduplicated.
- `validateTemplate(html)` — `{ status, placeholders, issues }`:
  - Missing `<main...>` element → hard `issues` entry, forces `status: 'invalid'`.
  - Zero placeholders found → soft `issues` entry, `status: 'warning'` (unless already invalid).
  - Otherwise `status: 'ready'`.

### Missing product-type coverage warning

When override is **disabled** and the config sheet is valid, `App.tsx` computes `missingProductTypes` — the set of distinct `product_type` values present in `selectedRows` that have no matching entry in `productTypeConfigs` — and passes it down to render a red "Product Type Coverage" callout listing the offending types.

## 8. Step 2 — Product Data (`CsvUpload.tsx`)

The largest and most stateful component. Its responsibilities:

### Input modes

- **Manual** (`handleManualSubmit`) — textarea of IDs, split on newlines/commas, each becomes a row with empty `product_type`/`title`/`short_title`/`description`/`url_slug` columns and a fixed default column set.
- **Upload** — `.csv` via PapaParse (`header: true`, trimmed headers) or `.xlsx` via SheetJS (first sheet, `defval: ''`, values coerced to strings). Both paths assign a synthetic `_id` (stringified row index) and run `ensureShortTitle`.
- `ensureShortTitle(fields, rows)` guarantees a `short_title` column exists: if there's no `title` column either, it inserts an empty `title` column right after `product_id`; it then inserts `short_title` right after `title`, defaulted to the row's `title` value.

### Duplicate detection (`computeSummary`)

Builds two maps (`product_id → row ids`, `url_slug → row ids`), and treats any value shared by 2+ rows as a duplicate. Returns `duplicateProductIdRowIds`/`duplicateSlugRowIds` as `Set<string>` so lookups elsewhere are O(1).

### Validate vs. Hydrate

Both call `fetchProductFromTemplate(product_id)` (Zazzle) per row, in parallel (`Promise.all`, no explicit concurrency cap — unlike the Generate panel):

- **Validate** (`handleValidate`) only records whether each row's ID resolved (`validationStatus: 'valid' | 'invalid'`); rows with no `product_id` at all are immediately `'invalid'`.
- **Hydrate** (`handleHydrate`) additionally fills empty tracked columns from the Zazzle response via `buildZazzleMap` (`title`/`short_title` ← `rootRawTitle`, `description` ← `description`, `initial_pretty_preferred_view_url` ← `initialPrettyPreferredViewUrl`, `department_name` ← `departmentName`, `product_type` ← `productType`, `plural_unit_label`/`singular_unit_label` ← their Zazzle equivalents), records which columns were newly filled per row (`zazzleHydratedFields`), auto-derives `url_slug` from `short_title` via `slugify()` if still empty, and separately stores `zazzleReferenceValues` (title + description) for **every** matched row — even ones with nothing to hydrate — purely so already-filled cells can be diffed against Zazzle's value without ever overwriting user-entered text.

### Content warning heuristics (`computeContentWarnings`)

Run over `title`/`short_title`/`url_slug`/`description` on every hydrate:

| Warning | Rule |
|---|---|
| `title_too_long` | value longer than 50 characters |
| `slug_char_mismatch` | value contains any character that isn't alphanumeric/whitespace (would get stripped from a slug) |
| `casing_issue` | title-cased first word, but a later non-stop-word starts lowercase, or a stop word (from a fixed list: `a, an, the, and, but, or, nor, for, so, yet, in, on, at, to, by, of, up, as, is, it, vs, via`) is capitalized mid-title |
| `slug_isolated_char` | `url_slug` contains a single-character token bounded by hyphens/ends, e.g. `mother-s-day` |
| `mojibake` | value contains common UTF-8-as-Latin-1 mis-decoding byte sequences (`â€`, `Ã`, `Â` followed by a non-space) |

### Row prioritization (`computeRowWarningPriority`)

Rows are sorted (and, when a filter is active, the "first warning" divider is placed) by a fixed priority: missing required column (1) > duplicate `product_id` (2) > duplicate `url_slug` (3) > `title_too_long` (4) > `slug_char_mismatch` (5) > `casing_issue` (6) > `slug_isolated_char` (7) > `mojibake` (8) > differs-from-Zazzle-reference (9) > no warning (0). `computeRowHasWarning` uses the same inputs to answer just yes/no, used for the "any warning" table styling.

### Selection model

`checkedRowIds` defaults on every new `rows` load (not on validate/hydrate) to every row with priority `0` (no warnings) whose validation status isn't `'invalid'` — so a manual selection edit survives a subsequent Validate/Hydrate pass instead of being silently reset. The readiness signal sent to `App.tsx` (`dataComplete`, `idsValid`, `noDuplicates`) is computed **only over the currently checked rows**, not all rows.

### Filtering & export

`activeFilter` drives both the visible rows (`filteredRows`) and the clickable Stat tiles (Total / Selected / duplicate counts / per-warning-type counts). `handleExport` writes the currently filtered rows (respecting `tableColumns`) to `.csv` (PapaParse `unparse`) or `.xlsx` (SheetJS), named `product-data-<filter>-<date>`.

### Zazzle-diff cell styling

For `title`/`short_title`/`description` cells: purple background = hydrated this pass; green check = matches the stored Zazzle reference; amber warning + expandable row = differs from the Zazzle reference (click to reveal the Zazzle value inline). A cell that was itself hydrated in the same pass never shows the diff indicator against its own reference value — the comparison is skipped for those columns entirely.

## 9. Template application & QA (`src/lib/generate.ts`)

- **`applyTemplate(templateHtml, row)`** — for every column except `_id`, replaces all literal occurrences of `{{key}}` in the template using `split('{{key}}').join(value)` rather than a regex replace, specifically to avoid special-character/regex-escaping issues in either the key or the value.
- **`rowToOutputPath(row, outputDir)`** — `outputDir/url_slug`, or `outputDir/doc-{_id}` if `url_slug` is blank.
- **`runGenerationQa(html)`** — one check only: are there any `{{...}}` tokens left unsubstituted in the generated HTML. Run immediately after templating, before the document is written to DA.
- **`runPageQa(pageHtml)`** — parses the HTML with `DOMParser` and checks four things: non-empty `<title>`, non-empty `<meta name="description">`, non-empty `<meta property="og:image">`, and (again) no leftover placeholders. Run after publish, against the fetched **live** page HTML — so it reflects what actually rendered, not just what was written to DA.

## 10. DA / AEM Admin API layer (`src/api/daApi.ts`)

Constants: `DA_API = https://admin.da.live`, `HLX_ADMIN = https://admin.hlx.page`, `BRANCH = 'main'` (hardcoded — all preview/publish/unpublish calls target the `main` branch).

| Function | Method / endpoint | Purpose |
|---|---|---|
| `postDoc(dest, html)` | `POST {DA_API}/source{dest}.html` (multipart form, `data` blob) | Write a generated document. |
| `createDocVersion(dest, label)` | `POST {DA_API}/versionsource{dest}.html` | Snapshot the existing document before it gets overwritten. |
| `docExists(daPath)` | `HEAD {DA_API}/source{path}.html` | Check whether a path already has content (404 → false, 200 → true, anything else throws). |
| `cat(filePath)` | `GET {DA_API}/source{path}.html` | Fetch a document's raw HTML (used for templates). |
| `listDirectory(dirPath)` / `checkDirectoryExists(dirPath)` | `GET {DA_API}/list{dirPath}` | List/verify a DA directory; the latter wraps errors into a `{ valid, error }` result with 403/404-specific messages. |
| `fetchSheet(daPath)` | `GET {DA_API}/source{path}.json` | Fetch a DA sheet document's `data` array (used for the config sheet). |
| `triggerPreview(daPath, token)` | `POST {HLX_ADMIN}/preview/{org}/{repo}/{BRANCH}{contentPath}` | Trigger an AEM preview build. |
| `triggerPublish(daPath, token)` | `POST {HLX_ADMIN}/live/{org}/{repo}/{BRANCH}{contentPath}` | Publish to the live site. |
| `triggerUnpublish(daPath, token)` | `DELETE {HLX_ADMIN}/live/{org}/{repo}/{BRANCH}{contentPath}` | Remove from the live site. |
| `deleteDocument(daPath, token)` | `DELETE {DA_API}/source{path}.html` | Delete the DA source document entirely. |

Helpers:

- `parseDAPath(daPath)` — splits an admin-style path (`/org/repo/rest/of/path`) into `{ org, repo, contentPath }`.
- `daPathToPreviewUrl` / `daPathToLiveUrl` — build `https://main--{repo}--{org}.aem.page{contentPath}` / `.aem.live{contentPath}` from a DA path.
- `urlToSourcePath(url)` — normalizes any of: a `da.live` URL (reads the path out of its `#hash` fragment), an already-absolute path (`/org/repo/...`), a bare `org/repo/path` string, or an `aem.page`/`aem.live` URL (parses `main--repo--org` out of the hostname) into a single `/org/repo/path` admin source path.

## 11. Zazzle API layer (`src/api/zazzleApi.ts`)

Single function, `fetchProductFromTemplate(productId)`, calling `GET https://www.zazzle.com/svc/partner/adobeexpress/v1/getproductfromtemplate?templateId=<id>`. Any non-OK response, thrown error, or missing `data.product` resolves to `null` rather than throwing — every caller (`CsvUpload`'s validate/hydrate) treats a `null` result as the normal "this ID doesn't resolve" case, not an exceptional one. The `ZazzleProduct` interface only declares the subset of fields this app actually reads (`id`, `rootRawTitle`, `description`, `initialPrettyPreferredViewUrl`, `departmentName`, `productType`, `quantities`, `pluralUnitLabel`, `singularUnitLabel`) — the real API response is much larger (see `src/sample_data/zazzle_getproduct_sample.json` for a full example).

## 12. Step 3 — Generate panel (`GeneratePanel.tsx`)

### Pre-generation preview

Before anything is generated, `previewRows` (derived, not stored in state) shows every input row's would-be output path — resolved via the override config if set, else by looking up `productTypeConfigs` for the row's `product_type` — and whether a config was found at all. A background effect walks these paths through a small worker pool (`CONCURRENCY = 3`, tracked via a `checkedPaths` ref so a path is only ever checked once) calling `docExists` on each, populating `existenceStatus` so the table can show an "↻ update" badge for paths that already have content and warn the user about overwrites before they click Generate.

### Generation

- **Bulk** (`handleGenerate`): snapshots current `existenceStatus` up front (so later existence checks re-running for the same paths don't change already-decided overwrite behavior mid-run), initializes `results` to one `pending` row each, then processes the queue through `runBatch` (`CONCURRENCY = 3` worker pool, same pattern reused for preview/publish/unpublish/delete below). Per row: resolve config → resolve output path → fetch the template HTML (cached in a `Map` keyed by `templatePath` so a bulk run only fetches each distinct template once) → `applyTemplate` → `runGenerationQa` → if the path was known to already exist, best-effort `createDocVersion` (failures here are swallowed — versioning failing should not block the write) → `postDoc`.
- **Single row** (`handleGenerateRow`): same steps, but no template cache (not needed for one row) and the existence check is done inline rather than from a snapshot.
- A row with no matching config (no product-type entry and no override) is set straight to `stage: 'error'` with a message naming the missing product type.

### Preview / Publish / Unpublish / Delete

All four follow the same shape as generation: a bulk handler using `runBatch` over the eligible subset of `results` (filtered by current `stage`), and a mirrored per-row handler for the row-level action button. Notable specifics:

- **Publish** only targets rows in `previewed` stage. After `triggerPublish` succeeds, it best-effort fetches the row's live URL and runs `runPageQa` against the returned HTML, attaching the result to `qa` — but the row still transitions to `published` even if this fetch/QA step itself fails (publishing isn't rolled back for a QA-fetch failure).
- **Unpublish** targets `published` rows, clears `liveUrl` on success.
- **Delete** (bulk, via a confirmation modal) targets any row in a post-generate stage (`generated`, `qa-fail`, `previewing`, `previewed`, `publishing`, `published`, `unpublishing`, `unpublished`); on success the row resets back to a bare `{ id, path, stage: 'pending' }`, discarding its QA/preview/publish history. Per-row delete (`handleDeleteRow`) does the same for a single row without the modal.

### Derived UI state

`counts` (generated/previewable/previewed/publishable/error/published/unpublished/deletable) drives which bulk action buttons render at all:

- Preview button shows whenever any row is `generated`.
- Publish button shows whenever any row is `previewed` (note: `handlePublish`'s actual target filter additionally requires `r.qa?.pass`, i.e. it silently skips rows whose generation-time QA failed even though the button's visible count doesn't reflect that filter).
- Unpublish / bulk-delete buttons only appear once there are **2 or more** eligible rows — single-row actions are handled inline in the table instead.

### Modals

- **Reset Results** — clears local `results`/`existenceStatus` state and unlocks Steps 1–2. Explicitly does **not** delete any document already written to DA; the modal copy tells the user to use Delete first if that's the intent.
- **Bulk Delete** — lists every path about to be deleted before confirming.

## 13. Current behavior worth knowing before extending this tool

- TanStack Query is installed and wired up (`QueryClientProvider` in `main.tsx`), but nothing in the app currently issues a query through it — all network calls are plain `async`/`fetch` functions called directly from event handlers and effects.
- The template override dropdown is populated only from rows in the config sheet (any row with a `Template Path`, `Product Type` optional). There's no way to override to a template that isn't already listed in the sheet.
- `handlePublish`'s eligibility filter (`stage === 'previewed' && r.qa?.pass`) is stricter than what `showPublishBtn`'s `counts.publishable` reflects (`stage === 'previewed'` only) — a row that failed generation-time QA will show up in the publishable count but won't actually be included when Publish runs.
- `RowStage` includes a `'qa-fail'` value that no current code path ever assigns; QA failure is instead represented by `qa.pass === false` on a row that's otherwise `generated`/`published`.
