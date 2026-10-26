# Express LCP: deferred commerce and fast hero

Branch: `tier-1-perf-fixes` (commits `b718eb538`, `fd1d8211f`, `88dd76adc`)

This branch takes hero commerce, analytics wiring and serial script/style fetches off the
critical path for Express pages, and adds an opt-in "fast hero" that paints the first-section
`grid-marquee` before Milo's section pipeline runs. It does not change Milo. Each behavior can be
turned on or off per page with metadata.

---

## Results

Measured with the repo's `performance-testing` skill (Moto G Power profile, Slow 4G, 4× CPU,
cold cache, 10 runs per URL). The LCP element is the hero H1 in every run.

| Page | Branch | `main` | Change |
|---|---|---|---|
| `/drafts/echen/performance/fast-hero` (`hero-fast: on`) | **1,581 ms** | 6,842 ms | −5,260 ms (−77%), 95% CI [−6,218, −4,303] |
| `/express/` (branch fixes, no fast hero) | 5,744 ms | 6,381 ms* | about −0.6 s |

\* Earlier run, compared against the fast-hero draft on `main`. Treat it as directional only.

CLS on the deployed fast-hero draft: **0.0044** (target ≤ 0.1). H1 renders at its final
size (28 px on mobile) in the first paint.

Target: field p75 LCP ≤ 2.5 s. Lab numbers are pessimistic. Confirm in CrUX or Search Console
after release.

---

## Code changes

### 1. Hero commerce is deferred (Tier 1b)
**Files:** `express/code/scripts/utils.js` (`deferHeroCommerce`), `express/code/scripts/scripts.js`
(`loadDeferredMerch`, `onFirstSectionLoaded`, `whenRendered`)

- **Problem:** an OST link (`/tools/ost?…`) in section 1 makes Milo's `preloadLcpCodeFiles` import
  `merch.js` and `commerce.js` (~230 KB) before the hero can paint.
- **Fix:**
  - **Gate:** deferral only happens on a **portrait phone** (`body[data-device="mobile"]` from the
    user agent, and `(orientation: portrait) and (max-width: 767px)` at load) **and** when the page
    has `show-floating-cta` set to `yes`/`y`/`true`/`on`. There `grid-marquee` hides the hero CTAs
    and the floating CTA stands in for them, so a late checkout href costs nothing. Landscape
    phones, tablets, desktop, and pages without a floating CTA keep Milo's eager behavior.
  - In `decorateArea` (document only), section 1 OST links not marked `#_dnb` get their href moved to
    `data-deferred-merch` and replaced with `#`, so Milo never sees commerce in section 1.
  - When section 1 finishes loading (Milo removes `data-status`), each parked link is restored and
    passed to Milo's own `loadBlock` with the `merch link-block` classes, the same shape autoblocking
    produces. Hero button classes such as `primaryCTA` are copied onto the merch replacement.
  - A link only loads once it has a layout box (`ResizeObserver`). On mobile, `grid-marquee` hides the
    hero CTAs below 768 px, so the hidden button is never built.
  - Fallback: `loadDeferredMerch` also runs after `loadArea()` in case MEP replaced section 1. Links
    are queued only once (`data-merch-queued`).
- **Opt-out:** metadata `defer-hero-commerce: off`.
- **Known limit:** on mobile, Milo's global navigation still imports `merch.js`/`commerce.js`
  (`global-navigation.js:63`). The hero no longer needs them, but they still download.
- **Trade-off:** none visible. The parked link is hidden on portrait phones, so it's never built.
  If the phone rotates to a width ≥ 768 px, the link appears with `href="#"` and becomes a
  working checkout link once merch loads (about 10 s on Slow 4G).

### 2. The templates placeholder pass is gated (Tier 1c)
**File:** `express/code/scripts/scripts.js` (`needsContentReplace`)

- **Before:** `content-replace.js` ran on any URL containing `/express/templates/`, including the
  templates root, and was awaited before decoration.
- **Now:** it runs only when one of these is true:
  - `sheet-powered: Y`
  - the page is `template-search-page` or `live: N`
  - the page is `/express/templates/default`
  - the title contains `{{`
  - the page has a `.browse-by-category` block
  - a hash link points at a metadata key
  - `main` contains content-replace markers

### 3. Deferring analytics wiring is opt-in (Tier 1a)
**File:** `express/code/scripts/scripts.js`

- With `defer-instrument: on`, the `instrument.js` import moves from before `await loadArea()` to
  after it.
- The default is unchanged (it still loads early) until the analytics owners confirm nothing in it
  must attach before Milo's page-view event.

### 4. Fast hero (Tier 1e)
**Files:** `express/code/scripts/scripts.js` (`renderFastHero`, `reserveGnavSpace`),
`express/code/blocks/grid-marquee/grid-marquee.js`, `express/code/styles/styles.css`

- `grid-marquee` now exports `renderCritical(el)`.
  - It builds the legacy layout (headline, background, cards, ratings slot) synchronously from
    authored content: no `getConfig`, no placeholders, no fetch.
  - It returns `false` for new-mode authoring (headline in `grid-marquee-hero`).
  - `init()` skips anything already rendered. It only swaps in the RTL-correct logo and loads ratings.
- `scripts.js`, right after `preDecorateSections(document)`:
  - If `hero-fast` is `on`/`force` and section 1 contains only a `grid-marquee` (plus
    section-metadata), it loads the block JS/CSS and calls `renderCritical`.
  - It then adds `class="section"` and `data-hero-fast` to the section. The block CSS is scoped to
    `main .section`; without the class, the H1 painted at 60 px and then shrank.
  - `on` steps aside when `target: on` or `?mep` is present. `force` does not.
- `styles.css`: `main > div[data-hero-fast][data-hero-fast] { display: block }` overrides Milo's
  hidden-section rule.
- CLS protection:
  - **Nav:** Milo's `decorateHeader` only runs after personalization, so the nav (64 px) and the
    mobile localnav (40 px) used to push the early hero down. `reserveGnavSpace()` sets the same
    header `className` Milo sets later and mirrors Milo's `isLocalNav()` check.
    `header[data-reserve-localnav]:not(:has(+ .feds-localnav))` holds 40 px below 900 px until Milo
    inserts the localnav.
  - **Card images:** authored card images often lack `width`/`height`.
    `.grid-marquee .face img:not([height]) { aspect-ratio: auto 4 / 3 }` holds the box until the real
    ratio is known. Real images range from about 1.29:1 to 1.33:1, so a card can still move by a few
    pixels.

### 5. The critical path is preloaded at HTML parse
**Files:** `head.html` (`preloadCriticalPath`), `express/code/scripts/scripts.js` (`loadStyles`)

- **Problem:** before LCP the browser fetched these one after another:
  - HTML
  - then `scripts.js`
  - then `utils.js`
  - then Milo `styles.css`, Express `styles.css` and the hero block files

  The body stays hidden until Milo's `styles.css` loads.
- **Fix:** an inline script in `head.html` starts these at parse time:
  - `modulepreload` for `/express/code/scripts/utils.js`
  - `preload as=style` for Milo `styles.css`. The libs path copies `setLibs()` in
    `scripts/utils.js`; **keep the two in step**.
  - `preload as=style` for Express `styles.css` (skipped when `theme: doodlebug`)
  - when `hero-fast` is `on`/`force`: preloads for `grid-marquee.css` and `grid-marquee.js`
- **Required companion fix:** `loadStyles` used to skip any `link[href=…]`, which matched the
  preload links. The stylesheets were never added and the page stayed blank. It now matches
  `rel="stylesheet"` only. Milo's `loadLink` already does this.
- **Local lab breakdown** (same throttling):

  | Starts at HTML parse | LCP |
  |---|---|
  | nothing | 2.53 s |
  | `utils.js` | 2.04 s |
  | + Express styles + block | 2.08 s (Milo CSS is now the last file) |
  | + Milo `styles.css` | **1.17–1.30 s** |

- **Rejected alternative:** inlining a copy of Milo's section-hiding CSS so the body doesn't wait for
  Milo `styles.css`. LCP was the same (1.31 s), but the hero rendered without Milo's base styles
  (8 px body margin and other defaults) until the file arrived.

### Tests
`test/blocks/grid-marquee/grid-marquee.test.js` adds two tests:
- `renderCritical` paints legacy markup synchronously, and `init` doesn't re-render it.
- `renderCritical` declines new-mode authoring.

All 13 tests pass. ESLint and Stylelint are clean.

---

## Metadata reference

| Key | Values | Default | Effect |
|---|---|---|---|
| `hero-fast` | `on` / `force` / absent | absent (off) | Early `grid-marquee` render plus block preloads. `on` steps aside for `target: on` or `?mep`. |
| `defer-hero-commerce` | `off` | deferred on portrait phones when `show-floating-cta` is on | `off` restores Milo's eager merch for section 1 OST links. Landscape phones, tablets, desktop and pages without a floating CTA are never deferred. |
| `defer-instrument` | `on` | off | Loads `instrument.js` after `loadArea()`. |
| `target` | `on` / `postLCP` / `off` | page-defined | Milo-native. `postLCP` moves Target after LCP (Tier 0). |

---

## Authoring changes needed

None of these are applied to live pages yet. Each one is a production content change and needs owner
sign-off.

1. **Homepage `/express/`: add `hero-fast: on`.**
   - Precondition: confirm the airtel, indosat and humain personalization manifests don't modify
     section 1. If they do, keep it off, or use `force` only after the owners agree.
   - Precondition: section 1 must contain only the `grid-marquee` block (plus section-metadata).
     Otherwise the fast path does nothing.
2. **Templates `/express/templates/`: change `target: on` to `target: postLCP`.**
   - Open question: does any live Target activity change the `search-marquee`? If so, its owner
     signs off, or the change waits until the activity ends.
3. **Homepage hero price.** Decide whether the OST trial link stays in the hero. If it moves to the
   plans section, the deferred-commerce code isn't needed on that page.
4. **Hero card images.** Re-export or re-author the `grid-marquee` card images so they carry
   `width`/`height`. The draft has them; live `/express/` doesn't. The CSS 4:3 fallback covers the
   gap.
5. **`show-floating-cta: yes` on the test draft.** Without it, mobile commerce deferral does not
   apply on the draft. It also makes the draft's floating CTA and mobile fork button match the real
   homepage.
6. **Optional: `defer-instrument: on`**, only after the analytics owners confirm it's safe.

---

## Test links

### Fast hero (primary)
| Env | URL |
|---|---|
| Before | https://main--da-express-milo--adobecom.aem.live/drafts/echen/performance/fast-hero |
| After | https://tier-1-perf-fixes--da-express-milo--adobecom.aem.live/drafts/echen/performance/fast-hero?martech=off |
| After (preview) | https://tier-1-perf-fixes--da-express-milo--adobecom.aem.page/drafts/echen/performance/fast-hero?martech=off |

### Regression pages (no authoring change; branch code paths only)
| Page | Before | After |
|---|---|---|
| Homepage | https://main--da-express-milo--adobecom.aem.live/express/ | https://tier-1-perf-fixes--da-express-milo--adobecom.aem.live/express/?martech=off |
| Templates root | https://main--da-express-milo--adobecom.aem.live/express/templates/ | https://tier-1-perf-fixes--da-express-milo--adobecom.aem.live/express/templates/?martech=off |
| Templates default | https://main--da-express-milo--adobecom.aem.live/express/templates/default | https://tier-1-perf-fixes--da-express-milo--adobecom.aem.live/express/templates/default?martech=off |
| Pricing | https://main--da-express-milo--adobecom.aem.live/express/pricing | https://tier-1-perf-fixes--da-express-milo--adobecom.aem.live/express/pricing?martech=off |

### Flag checks on the fast-hero draft
- MEP preview (fast hero must step aside):
  `https://tier-1-perf-fixes--da-express-milo--adobecom.aem.live/drafts/echen/performance/fast-hero?mep`
- Milo branch override (head preload must follow `milolibs`):
  `https://tier-1-perf-fixes--da-express-milo--adobecom.aem.live/drafts/echen/performance/fast-hero?milolibs=main`

---

## Verification steps

1. **Fast hero renders early.** Open the fast-hero "After" URL. In DevTools:
   - the hero section has `data-hero-fast` and `class="section"`
   - `.grid-marquee` has `data-hero-fast="rendered"`
   - the H1 is 28 px on a mobile viewport from the first paint
2. **Preloads fire.** In the Network panel, these all start at HTML parse time, not after
   `scripts.js`:
   - `utils.js`
   - Milo `styles.css`
   - Express `styles.css`
   - `grid-marquee.css`
   - `grid-marquee.js`

   The page must not stay blank (that would be a `loadStyles` regression).
3. **Deferred commerce.**
   - Desktop: no `data-deferred-merch`; the trial CTA resolves eagerly as on `main`.
   - Landscape phone, tablet, or any mobile page without `show-floating-cta`: same as desktop.
   - Portrait phone with `show-floating-cta: yes`: the link is parked (`data-deferred-merch`,
     `href="#"`, hidden by the hero CSS) and never converted unless it becomes visible (rotation),
     then it becomes a `checkout-link` to `commerce.adobe.com/store/segmentation…`.
   - With `defer-hero-commerce: off`: Milo's eager behavior on every device.
4. **No layout shift.** Use a Performance trace or the `layout-shift` observer. Expect CLS < 0.01.
   The hero must not jump when the nav or localnav appears or when the card images load.
5. **Templates.** `content-replace.js` must not load on `/express/templates/` unless the page has
   placeholders. It must still load on `/express/templates/default` and on sheet-powered pages.
6. **Lab comparison.** From `.claude/skills/performance-testing/scripts`:
   ```sh
   node compare.mjs \
     --test    "https://tier-1-perf-fixes--da-express-milo--adobecom.aem.live/drafts/echen/performance/fast-hero" \
     --control "https://main--da-express-milo--adobecom.aem.live/drafts/echen/performance/fast-hero" \
     --runs 10 --warmup 1
   ```
   Expect test ≈ 1.6 s and control ≈ 6.4–6.8 s.

---

## Risks and follow-ups

| Risk | Mitigation |
|---|---|
| `head.html` copy of `setLibs()` drifts | Comment in both places; any `setLibs` change must update `head.html` |
| `renderCritical` and `init` drift apart | Unit tests in place; add Nala coverage for the two-phase render |
| Milo changes its section CSS or `decorateHeader` | Flags fall back to today's behavior; ask Milo for a supported early-reveal hook |
| Rotating a portrait phone to ≥ 768 px wide shows a late checkout href | Rare; link converts once visible. Option: build the segmentation URL in Express (needs MAS sign-off), or ask MAS for a checkout-only build |
| `merch.js`/`commerce.js` still load on mobile via the gnav | Milo-owned; raise with the Milo team |
| Homepage manifests and IMS still on the critical path | Tier 2: ask Milo for an opt-in `personalization: postLCP` |

Still to do: Nala tests for the deferred price link and the fast-hero render, cold-cache runs for
templates and Color, and a field CWV baseline before and after release.
