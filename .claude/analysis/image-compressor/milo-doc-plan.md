# Image Compressor — Milo-doc authoring plan

**Target page:** `/express/feature/image/compress/jpg`
**Scope:** Hero swap (HARMAN add-on funnel → `frictionless-quick-action` + fallback columns + mobile-variant block), how-to step 1 copy update, purple promo `banner` block, FAQ rewrite (HARMAN references purged), breadcrumb rebrand to "Image Compressor", metadata migrated to mirror Image Resize + mobile fork-button CTAs added.
**Reference pattern:** live `/express/feature/image/resize` page.
**Output:** `.claude/authoring/image-compressor/page.docx` (~3.77 MB — includes embedded how-to icons + content-block illustrations pulled from live DA media).

---

## How this doc was produced

The authoring package was synthesized from three inputs:

1. **Figma summary (copy authority)** — `.claude/figma-summaries/image-compressor-acom.md`. All hero copy, step copy, content-block copy, link-list pills, and banner heading come verbatim from this file.
2. **Block-reuse analysis (structure authority)** — `.claude/analysis/image-compressor/block-reuse.md`. Confirmed zero net-new blocks required for the Acom page.
3. **Live-page HTML diffing (authoring-shape + metadata authority)** — the live `/express/feature/image/resize` page supplied the 3-variant hero split pattern, `steps highlight image schema` how-to variant, `link-list` pill rail, `banner` default variant, metadata block shape, and the mobile fork-button CTA metadata. The current `/express/feature/image/compress/jpg` HTML supplied the reused content-block illustration asset URLs.

Driver script: `.claude/authoring/image-compressor/build.py`. Imports helpers from `.claude/tools/build_milo_doc.py`. Produces `page.docx` in a single idempotent invocation.

python-docx version: **1.2.0** (confirmed present). `docx_mode = "full"`.

---

## Deltas applied after first build (user Q&A)

| # | Delta | Resolution |
|---|---|---|
| 1 | Upload animation MP4 URL | Set to live Resize page MP4: `media_184ba127fa10e6b95b4bf300c8397d00186227aeb.mp4` (charter mirrors resize-image). |
| 2 | `metadata.template` | Dropped — neither live compress nor live Resize emits this; xlsx inheritance still applies if any. |
| 3 | `branch-*` metas | Dropped — HARMAN-specific keys (`branch-category=addOns`, `branch-launch-add-on-id=w66g0258l`, etc.). Live Resize has no `branch-*`. |
| 4 | `sticky-promo-bar` block | Removed — copy referenced the deprecated HARMAN add-on. |
| 5 | FAQ Q1 | Rewritten to describe on-page frictionless flow (no HARMAN). |
| 6 | FAQ Q2 | Dropped — third-party-account question no longer applicable. |
| 7 | FAQ Q3 | Formats corrected to match `QA_CONFIGS['compress-image']` — JPEG/JPG/PNG/WebP (removed BMP, GIF). |
| 8 | Breadcrumb leaf | Rebranded "JPEG Compressor" → "Image Compressor". |
| 9 | Mobile fork-button CTA metas | Added: `main-cta-link`, `fork-cta-1-*`, `fork-cta-2-*`, `fork-cta-2-*-frictionless` (10 keys mirrored from live Resize). |

---

## Page metadata keys (final)

Authored as the **last block** (`metadata`) of the DA doc.

| Key | Value | Why / Reference |
|---|---|---|
| `Title` | Free image compressor \| Adobe Express | Figma H1 + live Resize `<title>` pattern |
| `Description` | Easily compress your images in one click using Adobe Express. Use the online photo compressor to instantly change the file size of any image to share across your social channels. | Figma hero subhead |
| `Short Title` | Image Compressor | Figma rebrand |
| `show-floating-cta` | yes | Charter + live Resize |
| `desktop-floating-cta` | floating-button | Live Resize + current live Compress |
| `mobile-floating-cta` | mobile-fork-button-frictionless | Charter (upgrade from current `no-button`); live Resize |
| `frictionless-safari` | on | Charter + live Resize + live Compress |
| `main-cta-link` | https://adobesparkpost.app.link/c4bWARQhWAb | Live Resize + live Compress (same URL) |
| `fork-cta-1-icon` | cc-express | Live Resize |
| `fork-cta-1-icon-text` | Adobe Express | Live Resize |
| `fork-cta-1-text` | Get free app | Live Resize |
| `fork-cta-1-link` | https://adobesparkpost.app.link/5pSIOLrnqTb | Live Resize |
| `fork-cta-2-icon` | SX_GlobeGrid_18_N | Live Resize |
| `fork-cta-2-icon-text` | Web version | Live Resize |
| `fork-cta-2-text` | Continue | Live Resize |
| `fork-cta-2-link` | https://adobesparkpost-web.app.link/e/00XSYb7H5Hb | Live Resize |
| `fork-cta-2-link-frictionless` | #mobile-fqa-upload | Live Resize |
| `fork-cta-2-text-frictionless` | Upload photo | Live Resize |
| `breadcrumbs` | n/a | Breadcrumbs block handles it explicitly |
| `breadcrumbs-from-url` | off | Both live pages |
| `breadcrumbs-hidden-entries` | image,video,design | Both live pages |
| `quickaction-upload-page` | on | Live Resize |
| `theme` | No Brand Header | Live Resize |
| `show-free-plan` | yes | Both live pages |
| `marquee-inject-logo` | yes | Both live pages |

**Intentionally dropped** (see "Deltas applied"):
- `template` — not emitted on live pages; any `/express/feature/metadata.xlsx` inheritance still applies
- All `branch-*` — HARMAN-specific; live Resize has none

**Not emitted** (platform defaults or author-non-editable): `og:*`, `twitter:*`, `canonical`, `universal-nav`, `mobile-gnav-v2`, `jarvis-chat`, `google-login`, `target`, `testing`, `robots`, `mepgeolocation`, `viewport`.

---

## Section metadata

| Section | Key | Value | Effect |
|---|---|---|---|
| 1 — `columns (fullsize)` hero | `showwith` | `fqa-non-qualified` | Shown when frictionless QA is unavailable (fallback). |
| 2 — `frictionless-quick-action` hero | `showwith` | `fqa-qualified-desktop` | Shown on qualified desktop browsers. |
| 3 — `frictionless-quick-action-mobile` hero | `showwith` | `fqa-qualified-mobile` | Shown on qualified mobile browsers (incl. iOS Safari when `frictionless-safari: on`). |

All three patterns mirror the live Resize page.

---

## Blocks used

| # | Block | Variant(s) | Purpose | Net-new? |
|---|---|---|---|---|
| 1 | `columns` | `fullsize` | Fallback hero (non-qualified users) | No |
| 2 | `frictionless-quick-action` | (no variant class — `Quick-Action: compress-image` row) | Qualified-desktop hero | No |
| 3 | `frictionless-quick-action-mobile` | (no variant class — `Quick-Action: compress-image` row) | Qualified-mobile hero | No |
| 4 | `steps` | `highlight image schema` | How-to-compress-a-JPEG 3-step strip | No |
| 5–8 | `columns` | (default) | Four content blocks | No |
| 9 | `link-list` | (default) | Discover even more pill rail | No |
| 10 | `banner` | (default — no variant class) | Purple promo band | No |
| 11 | `faq` | (default) | 4-Q FAQ accordion (was 5; Q2 dropped) | No |
| 12 | `breadcrumbs` | (default) | Breadcrumb trail | No |
| 13 | `metadata` | (default) | Page head metadata | No (page-level) |

**Zero net-new blocks.** The purple promo band is intentionally authored as the `banner` default variant — per the block-reuse analysis this is a **reuse-as-is** decision that supersedes the charter's "new build" framing in `§ da-express-milo Requirements` line 30. The existing `banner` default variant already produces the Figma design (solid `#5c5ce0` via `--color-info-accent`, centered white Adobe Clean Black h2).

`Quick-Action` is authored as a table row (read by `frictionless-quick-action.js:778-782` — `quickActionRow?.[0].children[1]?.textContent`), **not** as a CSS variant class on the block element.

---

## build.py runtime errors

_(empty)_ — `build.py` ran cleanly after every edit pass.

```
Wrote /Users/shairilkansal/prx-android/da-express-milo/.claude/authoring/image-compressor/page.docx (3770756 bytes)
```

---

## Locales / variants

- **Desktop 1280px:** covered (Figma node 0:3 + live Resize pattern).
- **Mobile:** covered via `frictionless-quick-action-mobile` block. Same `QA_CONFIGS` + dispatch; no mobile-specific authoring divergence required beyond the `fallback` fragment pointer.
- **iOS Safari:** enabled by `frictionless-safari: on`.
- **Locale variants:** NOT included — Milo locale pages are managed separately via the translation pipeline. The authored `page.docx` targets `en` only. Tier 2 follow-up: confirm whether the localisation pipeline auto-picks up the new doc or requires manual re-author.

---

## Draft-page testing caveat (important — highlight to author)

When testing on DA draft pages at `/drafts/nala/test-gen/...` or similar paths, the path-level `/express/feature/metadata.xlsx` does **not** inherit — draft paths sit outside the `/express/feature/*` scope. Any metadata key relied on for testing (e.g. `gnav-source`, `footer-source`, inherited floating-CTA defaults) must be authored directly on the draft page. This does not affect the production page at `/express/feature/image/compress/jpg`, where xlsx inheritance applies normally.

If a draft-page test needs to validate floating-CTA / fork-button behavior, the tester must copy the full metadata block (including the `fork-cta-*` keys) onto the draft — the emitted `page.docx` already contains these explicitly so a full-doc upload satisfies this automatically.

---

## Notes for the content author

**No asset replacements needed** — all assets resolved to real URLs during the delta pass:
- Upload animation: reused live Resize MP4
- How-to icons: reused live Resize page PNGs
- Content-block illustrations: reused live Compress page PNGs

**Sign-off checklist:**
- [ ] Upload DA-hosted `page.docx` to `/express/feature/image/compress/jpg`
- [ ] Preview via Sidekick (`{branch}--da-express-milo--adobecom.aem.page/...`)
- [ ] Confirm three-variant hero renders correctly on desktop, mobile, iOS Safari
- [ ] Confirm `banner` promo band renders `#5c5ce0` with white centered h2 (no CTA row)
- [ ] Confirm breadcrumb leaf reads "Image Compressor"
- [ ] Confirm floating mobile fork-button appears on mobile viewports
- [ ] Publish once CCEverywhere SDK has `compressImage` live (see charter Tier 1 cross-repo dependency)
