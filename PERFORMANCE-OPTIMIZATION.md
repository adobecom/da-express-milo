# Performance Optimization Plan

Planning notes from a performance assessment of da-express-milo, with focus on the
homepage (`/express/`). Claims marked **[INFERENCE]** were not directly verified.
Nothing here is measured yet — validate every item with the process in
[How to test](#how-to-test).

Homepage composition (section order): `grid-marquee` (LCP) → `gen-ai-cards` →
`discover-cards` → `quotes` + pricing fragment (`content-toggle-v2` + three
`merch-card-collection`s) → logo-row fragment → `banner` → `list` → `floating-button`.

---

## 1. Assessment

### Low effort

1. **Mobile never preloads the LCP image.** `preloadLCPImage` (`scripts.js`) copies
   `sources[0]` including its `media`. On the marquee, `sources[0]` is the 2000w webp
   with `media="(min-width: 600px)"`, so phones get a preload that never matches and
   the 750w mobile image is discovered late. Fix: emit one preload per `<source>` with
   its own `media`, or preload only the source whose `matchMedia` matches.
2. **`fetchpriority=high` on five images.** `decorateLCPImage` marks every first-section
   image eager + high (background + 4 card faces), so they contend with the real LCP
   image. Only the LCP candidate should be high.
3. **Logo row serves `width=2000` for 200×72 logos.** Use `?width=400`; the first logo
   is also missing `loading="lazy"`.
4. **Quotes block:** background is an absolute `https://www.adobe.com/...png` (not webp),
   referenced three times, and the author photo is rendered twice (desktop + mobile
   containers). Use webp, relative URL, one container + CSS.
5. **Stylesheets are JS-injected.** `loadStyles()` adds them only after `scripts.js`
   evaluates, while `body{display:none}` blocks paint. Preload them from `head.html`.
6. **Geo lookup runs on every load** for the CN redirect (`getCountry()`); defer to idle
   if it costs a request [INFERENCE].

### High effort

1. **Pricing fragment renders all three tabs** (two are `inert`/hidden): ~8 merch cards,
   ~20 nested custom elements, ~15 WCS price resolutions below the fold. Build hidden
   tabs on activation; load the merch/MAS library on approach (IntersectionObserver).
2. **~25 unused slot `<p>`s per `merch-card-collection`** (`searchText`, `filtersText`,
   …). Strip at authoring or use a lighter variant.
3. **grid-marquee drawers:** defer drawer content/video construction until first
   hover/tap.
4. **Block weight:** `grid-marquee` ≈31KB, `gen-ai-cards` ≈30KB, `quotes` ≈36KB (JS+CSS)
   for mostly static marketing content. Audit for dead variants.
5. **`lottie-player.1.5.6.js` is 400KB.** Confirm it is only ever loaded on demand;
   consider `lottie-web` light or `dotlottie-wc`.

### Fundamental / architectural

1. **Serial loading chain:** HTML → `scripts.js` → Milo `utils.js` → `loadArea` →
   block JS/CSS → fragments → fragment blocks → merch lib → price calls. Each arrow is a
   round trip; above-the-fold content depends on at least three.
2. **JS-gated visibility:** `body{display:none}` means FCP waits for JS+CSS although
   the HTML is server-rendered.
3. **Client-side fragments:** pricing and logo row cost an extra hop each.
4. **Two render-blocking design systems:** Milo `styles.css` + Express `styles.css`
   (53KB) with significant overlap.
5. **Martech** (`instrument.js` 32KB + Alloy, 3s `alloyLoader` wait) competes for the
   main thread; scheduling is controlled by Milo.

---

## 2. Fonts and `font-display`

- The `font-display: swap` rules in `express/code/styles/styles.css` are all on
  `local()` fallback faces (Trebuchet, Arial). Local fonts have no load period, so the
  descriptor is a no-op there — they are not hurting anything.
- Adobe Clean comes from Typekit via Milo (`libs/utils/fonts.js` loads
  `https://use.typekit.net/<kit>.css`); its `font-display` is set by the kit.
- Swap's real cost is a visible reflow (CLS), which the `size-adjust` /
  `ascent-override` / `descent-override` fallbacks exist to minimize. The alternatives
  have costs too: `block` hides text up to ~3s on slow networks (likely worse for
  bounce/DAU); `optional` means many first visits never see Adobe Clean.

Plan:

1. **Measure first.** Pull field CLS and font-swap timing for `/express/` and correlate
   DAU/bounce by connection class. If DAU does not move with CLS, fonts are not the
   lever.
2. **If swap is the problem, tune the fallback**, not Milo: recompute overrides against
   Adobe Clean's real metrics (the current 95% `size-adjust` looks approximate) and
   preload the 1–2 above-the-fold weights.
3. **If a different `font-display` is still wanted,** change it via the kit setting or
   Milo's font config and bring the data from step 1 to the Milo team. Patching Milo's
   loader locally breaks on every upgrade.

---

## 3. Shortening the loading chain while keeping Document Authoring

Authoring is untouched by everything below: authors keep writing block tables in DA,
Edge Delivery keeps producing `<div class="block-name">` markup. Changes live in code
or at the CDN.

### Tier 1 — start downloads earlier (code only)

1. **Speculatively preload the first-section block.** At `scripts.js` module eval,
   read the first section's block class names from server HTML and add
   `modulepreload` (JS) and `preload as=style` (CSS) for Express-owned blocks, so they
   download in parallel with Milo `utils.js` instead of after `loadArea`.
   - Milo's `getBlockData` resolves a block to `codeRoot` unless its name is in Milo's
     `C1_BLOCKS`; no Express block directory collides with a Milo block name, so
     Express block paths are predictable. An explicit allowlist of hero blocks avoids
     guessing paths for Milo-owned blocks.
   - Milo's `loadStyle` dedupes on `link[rel="stylesheet"]`, so a `rel=preload` link
     does not suppress the real stylesheet.
   - Note: a `modulepreload` for Milo `utils.js` from `scripts.js` would gain nothing —
     `loadPage()` already starts that `import()` synchronously at module eval.
2. **Prefetch fragment HTML.** Scan `main a[href*="/fragments/"]` and preload each
   same-origin `.plain.html` at low priority, so the fetch is in flight while the main
   area decorates. Must mirror Milo's request (`fetch(url, { cache: 'default' })`,
   same-origin, so `as=fetch` + `crossorigin`) or the browser fetches twice.
3. **Static hints in `head.html`:** preload `/express/code/styles/styles.css`,
   `modulepreload` `/express/code/scripts/utils.js` (static import of `scripts.js`,
   otherwise discovered only after `scripts.js` parses), and `preconnect` to
   `use.typekit.net` / `p.typekit.net` (Milo only warms these inside `loadArea`).
   Milo `styles.css` cannot be preloaded statically because its origin depends on host
   (`setLibs`: `/libs` in prod, `*--milo--adobecom.aem.live` elsewhere).

### Tier 2 — render the hero without JS (code refactor, authoring unchanged)

1. Rewrite `grid-marquee` so its core layout CSS targets the **authored** markup
   (`.grid-marquee > div:nth-child(n) > div`) instead of JS-built wrappers; JS only adds
   behavior (drawers, ratings, checkout links) and never re-parents above-the-fold
   nodes. Pin the authored shape to the kitchen-sink page and nala fixtures.
2. Inline a small (~2–4KB) critical stylesheet per hero block, e.g.
   `blocks/grid-marquee/grid-marquee.critical.css` — via `head.html` (every page pays for
   every hero, so only viable for a few) or via the edge (Tier 3).
3. Replace global `body{display:none}` with hiding only undecorated non-first sections.
   Roll out per block (e.g. a body class set only when the first block has critical
   CSS), not globally, or other heroes flash half-decorated.

### Tier 3 — edge-side decoration (infrastructure)

Edge Delivery has no server rendering, but adobe.com is fronted by a customer CDN
[INFERENCE: which CDN and whether edge compute is available is unconfirmed — this is
the gating question]. A streaming HTML-rewriting worker can:

- inline the matching critical CSS for the page's first block;
- inline fragments (fetch `.plain.html` at the edge, cached) — authors still author
  fragments as separate documents;
- pre-decorate the hero — requires every block to be idempotent (skip if already
  decorated) so edge and client never double-decorate. Only for the marquee, and only
  if Tier 2 is insufficient.

`.aem.page` preview bypasses the worker, so the client path must remain correct.

---

## 4. Moving to a build process (pre-rendering)

### What it would take

1. **Isomorphic block split** across 132 blocks: `render(el)` (pure DOM in → DOM out,
   no browser APIs) and `hydrate(el)` (listeners, observers, media queries). 141 JS
   files under `blocks/` reference `window`, `matchMedia`, cookies, or `localStorage`.
2. **Milo:** `loadArea` is Milo's. Either run Milo inside a headless renderer (fragile,
   upstream changes) or replace its decoration (effectively leaving Milo for rendering).
3. **Non-bakeable content** stays client/edge: MEP/Target personalization, geo
   redirect, geo pricing (WCS), IMS state, martech, experiments. Baked HTML needs a
   neutral default for each.
4. **Pipeline:** publish trigger (Edge Delivery has no confirmed publish webhook
   [INFERENCE] — poll status/query-index or hook the publish flow); a dependency graph
   so fragment/placeholder/nav/code changes rebuild dependents; incremental builds
   across ~90 locales; storage + CDN routing with plain Edge Delivery HTML as fallback;
   purge on publish.
5. **Preview parity:** `.aem.page` / `?dapreview` stay client-rendered, so there are two
   render paths; add a per-block prerendered-vs-client diff test (reuse the
   `comparison` skill tooling).

### Benefits

- Hero paints from HTML: no `body{display:none}`, no loading chain. Largest gains in
  mobile LCP/CLS.
- Less main-thread JS at load (INP, low-end devices).
- Fragments inline — no extra fetches.
- Crawlers see final markup [INFERENCE: may help SEO].
- Rendering failures surface at build time, not in users' browsers.

### Costs

- Every block refactored, plus a permanent discipline for every future block —
  quarters, not sprints.
- Divergence from Milo: fork its rendering or run it unsupported; harder upgrades; you
  own a rendering stack.
- Publish latency for authors; stale pages if the dependency graph is wrong.
- Two render paths (prerender vs preview) can drift — "fine in preview" stops being
  proof.
- New infrastructure to own and staff on-call; today Edge Delivery operates all of it.
- Personalized/priced regions stay client-side, so the homepage's commercial sections
  keep part of the cost.
- Hydration gap: content visible before it is interactive.

### Recommendation

Do Tiers 1–3 first. Tier 2 already forces the render/hydrate split, but only for
above-the-fold blocks (~10–15, not 132). If field data still shows a gap, full
prerendering becomes an incremental extension. Two org questions decide viability:
can we run code at the adobe.com CDN, and is leaving Milo's runtime acceptable?

---

## How to test

Three layers; only field data is ground truth.

### Field (what users experience)

- **Edge Delivery RUM / OpTel** — real-user LCP/CLS/INP per page, device, region
  [INFERENCE: confirm Milo has not disabled collection]. Baseline before work, confirm
  after.
- **CrUX / PageSpeed Insights** — 28-day rolling, what search ranking uses; too slow to
  judge a single change.
- The font/DAU question is only answerable here: CLS/LCP by connection class correlated
  with bounce/activation.

### Lab A/B (did this change help?)

Use the `performance-testing` skill (`compare.mjs`): PSI mobile emulation (Moto G Power,
4× CPU, Slow 4G), cold cache per run, 10 runs per URL, Welch CI verdict. Branch vs main
on `.aem.live` (`.aem.page` returns 401) or two local branches.

- Always test vs control back-to-back on the same machine; the delta is the signal.
- Run with `?martech=off` (isolate our code) and without (real conditions).
- Mobile first; then a couple of locales (`/de/express/`, `/jp/express/`).
- **Gap:** the skill records LCP/FCP/TTFB only. Add CLS capture in `lib/measure.mjs`
  before evaluating any font change.

### Diagnosis (why is it slow?)

- **WebPageTest** (mobile, Slow 4G): waterfall + filmstrip show the loading chain and
  the late mobile LCP request directly. Re-run per fix to confirm the chain shortened.
- **DevTools Performance** for long tasks (block decoration, merch components, Alloy).
  Use the Slow 4G preset — "Fast 4G" was made faster in 2024.
- **Lighthouse** for its opportunity list only; its simulated throttling matches neither
  field nor the skill.

### Process

1. Before work: OpTel + CrUX baseline for `/express/`, one WebPageTest trace.
2. Per change: `compare.mjs` branch vs main, mobile, martech on/off; `comparison` skill
   on affected pages for visual regressions.
3. CI: `compare.mjs` exits 2 on regression — gate PRs touching above-the-fold blocks or
   `scripts.js` on a few key pages.
4. After ship: check OpTel at 1–2 weeks. A lab win that doesn't show in field data did
   not happen.
