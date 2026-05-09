# da-express-milo — Page Metadata Reference

Complete catalog of every metadata key read by the codebase. Generated from live codebase inspection. Use this when authoring `add_metadata(...)` in `build.py` — never guess keys or values.

---

## How to use this reference

1. Decide which categories apply to your page (see decision rules in `implement.md` Step M2).
2. Look up each key below — note the **Values** column and any **Dependencies**.
3. For any key not listed here, run `grep -r 'getMetadata' express/code/` to find it, then add it.

---

## Category A — SEO (always include)

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `Title` | page title string | `<title>` tag + OG title | AEM default |
| `Description` | description string | `<meta name="description">` | AEM default |
| `Short Title` | short title string | breadcrumbs, nav truncation | `template-list/breadcrumbs.js:2,6` |

---

## Category B — Frictionless gating

| Key | Values | Effect | Dependencies | File |
|-----|--------|--------|-------------|------|
| `frictionless-safari` | `on` | Enables Safari/iOS support for upload + quick actions. Without this, iOS Safari is ineligible. Android always qualifies without it. | none | `frictionless-quick-action-mobile.js`, `mobile-fork-button-frictionless.js`, `utils.js:434` |
| `fqa-off` | any | Disables FQA entirely; skips all FQA init | none | `utils.js:417` — **Do NOT author** (runtime-injected by `hideQuickActionsOnDevices()`) |
| `fqa-on` | any | Explicitly enables FQA | none | `utils.js:417` — **Do NOT author** (runtime-injected) |

---

## Category C — Floating CTA

> **All keys in this category are gated by `show-floating-cta`.** None of them have any effect unless `show-floating-cta` is truthy — `buildAutoBlocks()` (`utils.js:614`) only auto-injects the floating CTA block when `show-floating-cta` is set, and `collectFloatingButtonData()` is only called by that block on init.

### Master toggle + block variant selectors (required cluster)

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `show-floating-cta` | `yes` / `y` / `true` / `on` (case-insensitive) | Master gate. Auto-injects the floating CTA block. Nothing else in this category has effect without it. | `utils.js:614` |
| `desktop-floating-cta` | block variant name (see below) | Which floating CTA block variant to inject on desktop | `utils.js:620` |
| `mobile-floating-cta` | block variant name (see below) | Which floating CTA block variant to inject on mobile | `utils.js:620` |

Valid block variant names: `floating-button`, `multifunction-button`, `mobile-fork-button`, `mobile-fork-button-frictionless`, `mobile-fork-button-dismissable`

### Required CTA destination (must be present when `show-floating-cta` is set)

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `main-cta-link` | URL string | Fallback CTA link for all devices | `floating-cta.js:378,389` |
| `main-cta-text` | text string | Fallback CTA button label for all devices | `floating-cta.js:379,390` |

### Optional device-specific CTA overrides (take precedence over main-cta-* on that device)

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `desktop-floating-cta-link` | URL string | Desktop-specific CTA link | `floating-cta.js:374` |
| `desktop-floating-cta-text` | text string | Desktop-specific CTA label | `floating-cta.js:375` |
| `mobile-floating-cta-link` | URL string | Mobile-specific CTA link | `floating-cta.js:376` |
| `mobile-floating-cta-text` | text string | Mobile-specific CTA label | `floating-cta.js:377` |

### CTA tool slots (only for `multifunction-button` variant — `collectFloatingButtonData()` reads these)

Loop runs for i = 1..7. **Loop breaks at first missing `cta-N-icon`** — missing icon in slot 2 silently drops slots 2-7. Each slot requires ALL THREE keys:

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `cta-1-icon` | icon identifier string | Icon for tool slot 1. Break condition: missing = no tools render | `floating-cta.js:386` |
| `cta-1-link` | URL string | Link for tool slot 1 | `floating-cta.js:389` |
| `cta-1-text` | text string | Label for tool slot 1 | `floating-cta.js:390` |
| `cta-2-icon` | icon identifier string | Icon for tool slot 2 (only if slot 1 exists) | `floating-cta.js` |
| `cta-2-link` | URL string | Link for tool slot 2 | `floating-cta.js` |
| `cta-2-text` | text string | Label for tool slot 2 | `floating-cta.js` |

> In practice, only `cta-1-*` is used on current pages. Slots 3-7 exist in code but no live page uses them.

### Optional floating CTA enhancements

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `use-floating-cta-lottie-arrow` | `yes`/`y`/`true`/`on` | Shows animated Lottie scroll arrow | `floating-cta.js:369` |
| `floating-cta-drawer-delay` | numeric ms string (default `0`) | Delay before drawer UI appears | `floating-cta.js:370` |
| `floating-cta-suppress-until-not-visible` | `yes`/`y`/`true`/`on` | Mobile only: hides CTA while `.suppress-until-not-visible` element is in viewport | `floating-cta.js:371` |
| `show-floating-cta-app-store-badge` | `yes`/`y`/`true`/`on` | Adds Apple/Google app store badge to drawer | `floating-cta.js:367` |
| `ctas-above-divider` | comma-separated tool IDs | Which tools appear above visual divider | `floating-cta.js:368` |
| `floating-cta-bubble-sheet` | sheet URL | External sheet config source | `floating-cta.js:381` |
| `floating-cta-live` | `Y` | Live status indicator | `floating-cta.js:382` |

### Floating CTA dependency chain (visual)

```
show-floating-cta = on  ← nothing below has effect without this
├── desktop-floating-cta = <variant>   (which block to inject on desktop)
├── mobile-floating-cta  = <variant>   (which block to inject on mobile)
├── main-cta-link        (required CTA destination)
├── main-cta-text        (required CTA label)
├── desktop-floating-cta-link / -text  (optional per-device override)
├── mobile-floating-cta-link / -text   (optional per-device override)
└── [only if variant = multifunction-button]
    cta-1-icon  ← loop break condition (read by collectFloatingButtonData())
    cta-1-link
    cta-1-text
    [cta-2-icon / cta-2-link / cta-2-text ...]
```

---

## Category D — Mobile fork button

Used with `mobile-fork-button`, `mobile-fork-button-frictionless`, `mobile-fork-button-dismissable` block variants.

Loop runs for i = 1, 2 only. **Break condition: missing `fork-cta-N-icon`.**

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `fork-eligibility-check` | `on` (case-insensitive, trim-tolerant) | Gate: restricts fork button to Android only. Without this, fork button shows on all mobile. | `mobile-fork-button-utils.js:60` |
| `fork-cta-1-icon` | icon identifier string | Icon for fork option 1. Missing = loop breaks, no options rendered | `mobile-fork-button-utils.js:80-94` |
| `fork-cta-1-link` | URL or `#mobile-fqa-upload` | Link for fork option 1. `#mobile-fqa-upload` triggers upload flow | `mobile-fork-button-utils.js:87-88` |
| `fork-cta-1-text` | text string | Button label for fork option 1 | `mobile-fork-button-utils.js:89-90` |
| `fork-cta-1-icon-text` | text string | Label shown next to icon | `mobile-fork-button-utils.js:85-86` |
| `fork-cta-2-icon` | icon identifier string | Icon for fork option 2 | `mobile-fork-button-utils.js` |
| `fork-cta-2-link` | URL or `#mobile-fqa-upload` | Link for fork option 2 | `mobile-fork-button-utils.js` |
| `fork-cta-2-text` | text string | Label for fork option 2 | `mobile-fork-button-utils.js` |
| `fork-cta-2-icon-text` | text string | Label shown next to second icon | `mobile-fork-button-utils.js` |
| `fork-button-header` | text string | Title/header above fork options | `mobile-fork-button-utils.js:149` |

**Frictionless variants:** Each key above has a `-frictionless` suffix sibling checked first when the block is in frictionless mode (e.g. `fork-cta-1-icon-frictionless`, `fork-cta-1-link-frictionless`). Falls back to the non-suffixed key.

### Fork button dependency chain (visual)

```
[fork-eligibility-check = on]  ← optional Android gate
Loop i = 1, 2:
  fork-cta-N-icon  ← break condition
  fork-cta-N-link
  fork-cta-N-text
  fork-cta-N-icon-text  (optional)
  [All above have -frictionless suffix sibling, checked first]
fork-button-header  (optional)
```

---

## Category E — Page routing and redirects

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `adobe-home-redirect` | `on` | Redirects to adobe.com (or locale-prefixed). Highest priority in `getRedirectUri()`. | `utils.js:77` |
| `pep-destination` | Branch Link URL | PEP conversion destination. Second priority after `adobe-home-redirect`. | `utils.js:86` |

---

## Category F — Navigation customization

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `gnav-source` | URL to nav fragment | Custom global nav source. Default: `{locale.prefix}/express/localnav-express` | `scripts.js:503` |
| `footer-source` | URL to footer fragment | Custom footer source. Default: injected from standard location | `scripts.js:477` |

---

## Category G — Hero / marquee content injection

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `hero-title` | text string | Replaces `Default template title` placeholder in hero animation | `content-replace.js:338` |
| `hero-text` | text string | Replaces `Default template text` placeholder | `content-replace.js:342` |
| `hero-inject-logo` | `on` / `yes` | Injects Adobe Express logo into first headline + hero animation | `scripts.js:399`, `headline.js` |
| `marquee-inject-logo` | `on` / `yes` | Injects logo into marquee block | `interactive-marquee.js`, `frictionless-quick-action.js` |
| `create-link` | URL string (default `/`) | Primary create link in hero animation and nav. Device-specific overrides: `create-link-{device}` | `content-replace.js:349,356` |
| `create-text` | text string | Replaces `default-create-link-text` placeholder | `content-replace.js:194` |

---

## Category H — Template list and search

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `q` | search query string | Template search query | `template-list.js:20` |
| `tasks` | comma-separated task names | Template task filter. `tasks-x` provides device override | `content-replace.js:350,357` |
| `topics` | pipe-separated topic codes | Template topic filter. `topics-x` provides device override | `template-list.js:20` |
| `locales` | pipe-separated locale codes | Template locale filter | `template-list.js:18` |
| `premium` | filter string | Template premium status filter | `template-list.js:20` |
| `initial-template-view` | `sm` / `md` / `lg` / `no` | Initial template grid size | `template-list.js:12` |
| `placeholder-format` | aspect ratio (e.g. `16:9`, `1x1`) | Template placeholder image ratio | `template-list.js:16` |
| `template-search-page` | `Y` | Marks page as template search results; affects breadcrumbs + content decoration | `breadcrumbs.js:8`, `content-replace.js:266` |
| `sheet-powered` | `Y` | Page data comes from a JSON sheet source | `scripts.js:505`, `breadcrumbs.js:8` |
| `top-templates-title` | text string | Replaces SEO nav top-templates title placeholder | `content-replace.js:362` |
| `top-templates-text` | text string | Replaces SEO nav top-templates text placeholder | `content-replace.js:366` |
| `show-search-marquee-link-list` | `Y` / `yes` | Shows link list in search marquee | `template-list.js` |
| `show-browse-by-category` | `yes`/`true`/`on`/`Y` (to show; absence = show too) | **Inverted:** set to one of these values to show; explicitly set to something else to hide | `content-replace.js:373` |

---

## Category I — Schema markup control

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `show-faq-schema` | `no` to disable; omit to enable | Controls FAQ JSON-LD structured data. Default = enabled. | `faq.js:7`, `faqv2.js:388` |
| `show-howto-schema` | `no` to disable; omit to enable | Controls How-To JSON-LD structured data. Default = enabled. | `how-to-v3.js:112` |

---

## Category J — Jarvis (AI Copilot)

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `jarvis-immediately-visible` | `true` | Shows Jarvis panel on page load (instead of hidden) | `scripts.js:31` |
| `jarvis-surface-id` | surface string (default `Acom_Express`) | Jarvis surface identifier for analytics | `scripts.js:76` |
| `jarvis-surface-version` | version string (default `1.0`) | Jarvis surface config version | `scripts.js:77` |

---

## Category K — Analytics and martech

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `martech` | `off` | Disables analytics/martech (URL param `?martech=off` also works; URL param takes precedence) | `scripts.js:526` |
| `pagetype` | page type string (e.g. `template`, `blog`) | Page category for analytics | `utils.js:701` |
| `ax-commerce-override` | comma-separated block names | Blocks to inject with Adobe Commerce experience | `utils.js:786` |

---

## Category L — Blog-specific

| Key | Values | Effect | Dependencies | File |
|-----|--------|--------|-------------|------|
| `template` | `blog` | Routes page to blog template with schema markup | none | `scripts.js:373` |
| `author` | author name string | Blog article author | `publication-date` must also be present | `scripts.js:405`, `blog.js:65` |
| `publication-date` | date string | Blog article date | `author` must also be present | `scripts.js:405` |
| `category` | category name | Blog article category for schema | none | `utils.js:701`, `blog.js:67` |
| `subheading` | text string | Blog subtitle below title | none | `blog.js:93` |

---

## Category M — Miscellaneous

| Key | Values | Effect | File |
|-----|--------|--------|------|
| `live` | `N` | Production only: marks page as unpublished. Ignored on stage/dev. | `content-replace.js:383` |
| `no-signup-required` | any (presence matters) | Signals no account signup needed; used by free-plan widget | `free-plan.js:21` |
| `preload-susi-light` | any | Preloads Susi search component during delayed script | `express-delayed.js:14` |
| `breadcrumbs` | `n/a` | Prevents auto-injection of breadcrumb block when using `add_breadcrumbs()` helper | DA content layer |
| `stopelement` | HTML tag or selector | Where TOC stops collecting sections | `toc-seo.js:772` |

---

## Silent failure patterns

These are known ways metadata fails without any runtime error — watch for them:

| Scenario | What happens |
|----------|-------------|
| `show-floating-cta` set without `main-cta-link` | Floating button renders but links to empty href — broken |
| `cta-1-icon` missing (or typo in key name) | No tool slots render in drawer — silent |
| `fork-cta-N-icon` missing for slot N | All slots ≥ N are dropped silently |
| Device-specific key set without base fallback | Works on that device only; other devices get empty button |
| `frictionless-safari` absent | iOS Safari users see the non-frictionless path (may be intended) |
| `show-faq-schema` / `show-howto-schema` absent | Schema is **enabled** — set to `no` to disable |
| `live: N` on non-production environment | Ignored — only affects production |

---

## Key reading locations (for deep-dive)

| File | What it holds |
|------|---------------|
| `express/code/scripts/utils.js` | Core `getMetadata()` definition; floating CTA init (~line 475, 614); frictionless gating (~line 417, 434) |
| `express/code/scripts/widgets/floating-cta.js` | Full floating CTA configuration (lines 359-408) |
| `express/code/scripts/utils/mobile-fork-button-utils.js` | Fork button + frictionless variants (lines 73-169) |
| `express/code/scripts/utils/content-replace.js` | Hero, SEO nav, and template content replacement (lines 194-401) |
| `express/code/scripts/scripts.js` | Page-wide init, template routing, nav injection |
| `express/code/blocks/faq/faq.js` | FAQ schema control |
| `express/code/blocks/how-to-v3/how-to-v3.js` | How-To schema control |
