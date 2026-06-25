# MWPW-198863 — Color Modal Delay: Root Cause Analysis & Fix

## Problem Statement

Enterprise premium users navigating from `color.adobe.com` to Adobe Express via **"Create with my color palette"** experienced a ~6 second delay before the "Edit your color palette" modal appeared.

---

## Root Cause Analysis

### The Slow API Call

The modal flow made a blocking call to the Melville libraries API before rendering anything:

```
GET /api/v1/libraries?owner=all
```

| User Type  | Response Time | Response Size | Reason |
|------------|--------------|---------------|--------|
| Consumer   | ~618 ms      | small         | Personal libraries only |
| Enterprise | ~5,940 ms    | ~16 kB        | Personal + org brand libraries included |

Enterprise accounts receive all org brand libraries in the response. For users in large organisations this can be tens of libraries, causing significant serialisation and network overhead.

### What the Old Code Did

```
startup()
  └─ _run()
       └─ resolveLibrary()         ← BLOCKED HERE for ~6 s (enterprise)
            ├─ GET /api/v1/libraries?owner=all
            ├─ filter writable, non-brand libs
            └─ createLibrary() if none found
       └─ brandsUIComponents.load()   ← brands JS bundle
       └─ openColorThemeDialog(library)  ← modal finally appears
```

The modal could not render at all until `resolveLibrary()` completed, because `libraryAssetId` was required as a mandatory input to `x-brands-color-theme-manager`. The library URN is only needed at the moment the user clicks **Save** — there was no reason to block the UI on it.

---

## Changes Made

### 1. `ColorsProductEntryFeature.ts` — Branched modal open strategy

The fix is gated behind the **`colorsProductEntryPerfPreload`** feature flag (`colors-entry-perf-preload`, default `false`). The old sequential behavior is preserved when the flag is off.

#### Old path (`isPerfPreloadEnabled = false`) — unchanged behavior

```
_setupModalPrerequisites()
  ├─ Promise.all([resolveLibrary(), brandsUIComponents.load()])
  │    resolveLibrary = sequential library fetch + optional create
  └─ returns { library, swatches }

_showModal()
  ├─ if !library → endAction(modalOpen) → return false (no modal)
  ├─ openColorThemeDialog({ library })  ← modal opens with library set
  └─ endAction(modalOpen)

_run()
  ├─ removeQueryParams(["colorPalette"])
  └─ updateQueryParam("learn") if premium   ← fired here, library guaranteed
```

#### New path (`isPerfPreloadEnabled = true`) — fast open

```
_setupModalPrerequisites()
  ├─ brandsUIComponents.load()   ← only wait for JS bundle (~fast)
  └─ returns { library: null, swatches }

_showModal()
  ├─ openColorThemeDialog({ library: null })  ← modal opens immediately
  ├─ endAction(modalOpen)                     ← perf marker fires here
  └─ void resolveLibrary()                    ← background, non-blocking
       .then(resolvedLibrary)
         ├─ push libraryAssetId + library onto live element
         └─ updateQueryParam("learn") if premium + modal still open
       .catch()
         └─ _closeDialog()  ← dismiss modal if library can't be found

_run()
  └─ removeQueryParams(["colorPalette"])  ← "learn" param handled in background cb
```

**Key technique — pre-render to `DocumentFragment`:** `openColorThemeDialog` renders the Lit template into a `DocumentFragment` first, captures `fragment.firstElementChild` as a typed direct reference (`_colorThemeManagerEl`), and passes the element (not the template) to `_openOverlay`. This gives a stable handle to the live DOM element so `libraryAssetId` and `library` can be pushed onto it after the background resolve completes — without fighting the Lit `ref` directive (which only fires during the initial render-to-fragment, not after `openOverlay` moves the element into the overlay shadow DOM).

### 2. `BrandsColorThemeManager.ts` — Save button guard

Changed `libraryAssetId` from `private` with `!` (required) to a public `@property()` with a default empty string so it can be set post-render:

```typescript
// Before
@property() private libraryAssetId!: string;

// After
@property() libraryAssetId = "";
```

Added a guard to `disableSave()`:

```typescript
private disableSave(): boolean {
    return (
        this._swatches.length < MIN_SWATCHGROUP_SIZE ||
        this._swatches.length > MAX_SWATCHGROUP_SIZE ||
        this._isSaving ||
        this._isThemeNameInvalid ||
        (this.colorsProductEntry && !this.libraryAssetId)  // ← new guard
    );
}
```

The Save button is disabled until `libraryAssetId` is populated, preventing a save attempt before the library is resolved.

### 3. `ColorsProductEntryFeature.spec.ts` — Test corrections

Two tests were updated to match the correct behavior per flag value:

| Test | Before | After |
|------|--------|-------|
| `does not open the overlay when createLibrary rejects during startup` | asserted `openOverlayStub` called once | asserted `not.have.been.called` (default flag = false, old path) |
| `does not add the learn query param when library resolution fails` | asserted `openOverlayStub` called once | asserted `not.have.been.called` (default flag = false) |

All 69 tests pass.

---

## Performance Markers

| Path | `beginAction` | `endAction(modalOpen)` |
|------|--------------|------------------------|
| Old (`isPerfPreloadEnabled = false`) | `startup()` | After modal opens (or when no library found — early exit) |
| New (`isPerfPreloadEnabled = true`) | `startup()` — also triggers preload of bundle + library | Immediately after modal opens (before library resolves) |

The new path reports a shorter `modalOpen` time because the metric now measures the user-visible moment (modal on screen) rather than the full library resolution time. Library resolution time is still observable separately via the Melville API trace.

---

## Files Changed

| File | Change |
|------|--------|
| `apps/project-x/features/x-colors-product/src/feature/ColorsProductEntryFeature.ts` | Branched `_setupModalPrerequisites` + `_showModal` on `isPerfPreloadEnabled`; added `_colorThemeManagerEl` field; pre-render pattern in `openColorThemeDialog`; moved `updateQueryParam("learn")` to background callback for perf path |
| `apps/project-x/web/src/components/x-brands/brands-color-theme-manager/BrandsColorThemeManager.ts` | Made `libraryAssetId` public with default `""`; added `colorsProductEntry && !libraryAssetId` guard to `disableSave()` |
| `apps/project-x/features/x-colors-product/src/feature/ColorsProductEntryFeature.spec.ts` | Reverted two assertions that were incorrect for default flag value |

---

## Pros and Cons

### Pros

- **Instant perceived performance** — the modal appears as soon as the JS bundle loads (~fast CDN hit) rather than after the Melville API responds. For enterprise users this saves ~5–6 seconds of blank-screen time.
- **Zero regression risk on rollout** — the fast path is disabled by default (`colorsProductEntryPerfPreload = false`). The old blocking behavior is fully preserved and exercised by all existing tests. The flag can be ramped incrementally.
- **Graceful degradation** — if library resolution fails in the background, the modal is automatically dismissed and the error is logged. The user is not left in a broken state with a Save button they can't use.
- **Save button guard prevents data loss** — `disableSave()` returns `true` while `libraryAssetId` is empty, so a user who clicks Save very quickly cannot trigger a save against an unresolved library.
- **No change to the UX for consumer users** — consumer accounts already get a fast `GET /api/v1/libraries` response (~618 ms), so the improvement is primarily felt by enterprise users. The flag lets the team validate the experience on a segment before enabling broadly.
- **Perf markers are accurate** — `endAction(modalOpen)` fires at the moment the modal becomes visible, which is what the metric should measure.

### Cons

- **Transient disabled Save button** — enterprise users will see the Save button disabled for the duration of library resolution (~5–6 s). While this is better than a blank screen, it may be confusing without a loading indicator or tooltip explaining why Save is unavailable. A future improvement would be a spinner or skeleton state on the Save button.
- **Two code paths to maintain** — the flag branching doubles the logical surface area in `_setupModalPrerequisites` and `_showModal`. Once the flag is fully ramped and validated the old path should be deleted.
- **Background error handling is fire-and-forget** — the `void resolveLibrary().catch()` pattern means an error in the catch handler itself would be silently swallowed. This is standard for background tasks but slightly harder to trace in production logs.
- **`_colorThemeManagerEl` is a mutable field on the feature** — the direct element reference pattern is pragmatic but couples the feature to the internal DOM structure of the overlay. If `openOverlay` changes how it renders the element (e.g. wraps it), `_colorThemeManagerEl` would remain valid but the property push would still work because it targets the element directly, not its position in the tree.
- **`learn` query param timing differs between paths** — in the old path, `updateQueryParam("learn")` fires before the user has interacted with the modal; in the new path it fires once the background resolve completes. This is correct behavior (the param should only be set when the library is confirmed), but is a subtle divergence that requires understanding both paths.
