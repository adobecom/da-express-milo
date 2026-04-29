# Report: Block Completeness

Audit of kitchen sink coverage across all blocks in `express/code/blocks/`.

**Summary:** 115 blocks in code | 112 kitchen sink files | 84 matched | 31 blocks missing a KS | 28 KS files with no matching block

---

## Blocks Missing a Kitchen Sink

These blocks exist in `express/code/blocks/` but have no corresponding file in `content/docs/library/kitchen-sink/`.

| Block | Notes |
|---|---|
| `ax-grid-demo` | Internal demo/dev block |
| `blog-article-columns` | Distinct from `blog-columns`, no KS exists |
| `ckg-link-list` | No KS |
| `color-blindness` | Color tool block, no KS |
| `color-contrast-checker` | Color tool block, no KS |
| `color-explore` | Color tool block, no KS |
| `color-extract` | Color tool block, no KS |
| `color-headline` | Color tool block, no KS |
| `color-search-marquee` | Color tool variant of search-marquee, no KS |
| `color-wheel` | Color tool block, no KS |
| `discover-cards` | No KS |
| `frictionless-quick-action-mobile` | Mobile-specific variant of frictionless-quick-action, no KS |
| `grid-marquee-hero` | No KS — distinct from `grid-marquee` |
| `link-list-v2` | Exists in code; `link-list.html` covers v1 only |
| `login-page` | No KS |
| `mobile-fork-button` | No KS |
| `mobile-fork-button-dismissable` | No KS |
| `mobile-fork-button-frictionless` | No KS |
| `multifunction-button` | KS file is named `multifunctional-button.html` (name mismatch) |
| `pricing-cards-credits` | No KS |
| `pricing-footer` | No KS |
| `print-product-detail` | No KS |
| `prompt-marquee` | No KS |
| `simplified-pricing-cards` | KS file named `pricing-cards-simplified-kitchen-sink.html` (name mismatch) |
| `simplified-pricing-cards-v2` | No KS |
| `standalone-search-bar` | No KS |
| `swp-demo` | Internal demo block, no KS |
| `template-promo` | No KS |
| `template-promo-carousel` | No KS |
| `template-x-carousel` | No KS — distinct from `template-x-carousel-toolbar` |
| `templates-as-a-service` | No KS |

---

## Kitchen Sink Files With No Matching Block

These KS files reference blocks that do not exist in `express/code/blocks/`. They fall into three categories:

### Likely Milo-Inherited Blocks
These blocks are probably loaded from the milo upstream; authoring docs are still valid for Express pages.

| KS File | Likely Origin |
|---|---|
| `animation.html` | Milo |
| `columns.html` | Milo |
| `fragment.html` | Milo |
| `hero-animation.html` | Milo |
| `layouts.html` | Milo |
| `legal.html` | Milo |
| `marquee.html` | Milo (Express has `ax-marquee`) |
| `steps.html` | Milo |
| `table-of-contents.html` | Milo |
| `toc.html` | Milo duplicate/alias |

### Renamed, Superseded, or Merged Blocks
The KS file refers to a block that has been renamed or replaced.

| KS File | Issue |
|---|---|
| `browse-by-collaboration.html` | No `browse-by-collaboration` block exists; likely merged into `browse-by-category` |
| `carousel-card-mobile.html` | No `carousel-card-mobile` block in code |
| `category-list.html` | Block not found; title says "Long text" — likely misnamed |
| `colors-how-to-carousel.html` | Duplicate of `color-how-to-carousel.html` (extra "s" in name) |
| `feature-grid-desktop.html` | Duplicate of `feature-grid.html`, same title |
| `gen-ai-row.html` | No `gen-ai-row` block in code |
| `multifunctional-button.html` | Code block is `multifunction-button` (name mismatch — see above) |
| `pricing-cards-simplified-kitchen-sink.html` | Code block is `simplified-pricing-cards` (see above) |
| `table-ax.html` | No `table-ax` block; possibly maps to `pricing-table` or milo's table |
| `table-of-contents-seo-feature.html` | No matching block |

### Questionable or Test Files
These files appear to be test artifacts, data pages, or pages with repurposed content.

| KS File | Issue |
|---|---|
| `ax-marquee-dynamic-hero.html` | H1 title is a blog article headline, not a block name |
| `billing-radio.html` | No `billing-radio` block in code |
| `colors-seo-page.html` | Not a block — appears to be a full page example |
| `comparison-table-v2.html` | H1 is actual page content ("Nobody Does it Like Adobe Express") |
| `firefly-card.html` | No `firefly-card` block in code |
| `puf.html` | No `puf` block; "PUF" may be a Milo block |
| `premium-plan.html` | No `premium-plan` block in code |
| `pricing-summary.html` | No `pricing-summary` block in code |
| `quick-action-cards.html` | No `quick-action-cards` block (there is `quick-action-hub`) |
| `test.html` | Test/scratch file, no H1 title |
| `toc-seo.html` | No H1 title |
| `z-pattern.html` | No `z-pattern` block in code, no H1 title |

---

## Naming Mismatches to Fix

| KS Filename | Correct Name |
|---|---|
| `multifunctional-button.html` | Rename to `multifunction-button.html` |
| `pricing-cards-simplified-kitchen-sink.html` | Rename to `simplified-pricing-cards.html` |

---

## Recommendations

1. **Create new KS files** for the 31 blocks that are entirely missing coverage. Priority blocks (high-usage, multiple variants): `mobile-fork-button`, `simplified-pricing-cards`, `simplified-pricing-cards-v2`, `link-list-v2`, `template-promo`, `template-x-carousel`, `grid-marquee-hero`.
2. **Rename mismatched files**: `multifunctional-button.html` → `multifunction-button.html`, `pricing-cards-simplified-kitchen-sink.html` → `simplified-pricing-cards.html`.
3. **Remove or archive test/orphan files**: `test.html`, `colors-seo-page.html`, `z-pattern.html`.
4. **Deduplicate**: Merge `colors-how-to-carousel.html` into `color-how-to-carousel.html`; remove `feature-grid-desktop.html` in favor of `feature-grid.html`.
5. **Fix wrong H1 titles**: `ax-marquee-dynamic-hero.html`, `comparison-table-v2.html`, `pricing-cards-v2.html` (Swedish title), `category-list.html`.
