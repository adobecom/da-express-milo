# Report: Authoring Instruction Quality

Assessment of how helpful each kitchen sink file is for a content author trying to use the block. Evaluated on:

- **Title** — Does the H1 correctly identify the block?
- **Variant list** — Are available variants listed and explained?
- **Authoring instructions** — Are there written instructions explaining structure, required fields, cell layout, etc.?
- **Screenshots** — Are there annotated images showing the authoring table structure?
- **Examples** — Are live block examples rendered for each variant?
- **Issues** — Anything broken, misleading, or outdated?

---

## Quality Tiers

### Tier 1 — Well-Documented

These files have a correct title, written instructions, and variant examples. Usable as-is.

| Block | Strengths | Gaps |
|---|---|---|
| `wayfinder` | Explains table structure with inline authoring example, documents all 4 variants, explains button styling conventions | Missing `borderless` variant description in prose |
| `ax-marquee` | Documents 3 variants with screenshots, explains button ordering behavior | Duplicate of `marquee.html` content — consider consolidating |
| `marquee` | Same as `ax-marquee` — full instruction coverage | Identical copy of ax-marquee docs (see deduplication note) |
| `ax-columns` | Variant list present, screenshots included | Documents milo `columns` variants mixed in with ax-columns |
| `cards` | Updated instructions + variant list | Has struck-through (~~old text~~) left inline — remove legacy content |
| `collapsible-card` | Instructions present | No screenshots |
| `banner` | Variant descriptions present | `light` variant listed but may be milo-inherited; no screenshots |
| `hover-cards` | Instructions present | Instructions sparse |
| `how-to-cards` | Instructions present, covers schema variant | `summary` variant undocumented |
| `how-to-steps` | Instructions present | `noschema` variant described but may be removed from JS |
| `susi-light` | Comprehensive variant list with all authoring options | Verify `edu` variant is still active |
| `quotes` | `singular` variant covered | `carousel` variant absent |
| `pricing-cards` | Instructions + screenshots | |
| `ratings` | Variant documented | Sparse instructions |
| `tabs-ax` | Variant list and examples | `m-spacing` and `pill` variants may be stale |
| `search-marquee` | Instructions present | |
| `seo-nav` | Instructions present | |
| `table-ax` | Instructions, explains show/sticky variants | Block name mismatch (no `table-ax` in code) |
| `gen-ai-cards` | Instructions and variant examples | |
| `template-list` | Instructions, variant list | `large` and `toc-container` variants undocumented |
| `cta-carousel` | Instructions + variant examples | |
| `hero-color` | Instructions present | |
| `icon-list` | Instructions present | |

---

### Tier 2 — Partially Documented

Title is present but instructions are thin, screenshot-only, or variants are incompletely covered.

| Block | Has Title | Has Variants | Has Instructions | Key Issue |
|---|---|---|---|---|
| `ax-panels` | Yes | No | Yes (minimal) | No variant coverage |
| `ax-table-of-contents` | Yes | No | No | `horizontal` variant not documented |
| `browse-by-category` | Yes | Yes (`card`, `fullwidth`) | Yes | Variant explanations are brief |
| `content-toggle` | Yes | No | Yes | No variant shown |
| `content-toggle-v2` | No | Yes (`padding-20`) | Yes | Only 1 of 4 padding variants shown; no H1 title |
| `cta-cards` | Yes | No | Yes (minimal) | |
| `drawer-cards` | Yes | Yes (`logo`) | Yes | |
| `embed` | Yes | No | No | Platform variants (`embed-instagram`, `embed-twitter`) not explained |
| `faq` | Yes | No | Yes (1 line) | Instructions are a single sentence |
| `faqv2` | Yes | Yes (partial) | No | `bold`, `small`, `no-background` variants missing |
| `floating-buttons` | Yes | No | Yes | |
| `gen-ai-row` | Yes | No | Yes | No matching block in code |
| `grid-marquee` | Yes | Yes (`ratings`) | Yes | |
| `headline` | Yes | No | Yes | |
| `highlight` | No H1 | No | No | No title, no instructions, just examples |
| `holiday-blade` | No H1 | Yes (`still`) | Yes | No H1 title |
| `how-to-steps-carousel` | Yes | Yes | Yes | |
| `how-to-v2` | No H1 | No | No | No title, no instructions |
| `how-to-v3` | No H1 | No | No | No title, no instructions |
| `interactive-marquee` | Wrong H1 | Yes (shown not explained) | Yes | H1 is pulled from content text, not a block name |
| `link-list` | Yes | Yes | Yes | Some stale variants documented |
| `long-text` | Yes | No | Yes | |
| `make-a-project` | Yes | Yes (`centered`) | Yes | |
| `pricing-summary` | Yes | Yes (`feature`) | Yes | No matching block in code |
| `pricing-table` | Yes | Yes | Yes | `sticky-show3` variant may be removed |
| `sticky-promo-bar` | Yes | Yes (`loadinbody`, `rounded`) | Yes | |
| `submit-email` | Yes | No | No | No instructions |
| `template-x` | Yes | No | Yes | All 4 variants undocumented |
| `template-x-carousel-toolbar` | Yes | No | Yes | |
| `toggle-bar` | Yes | Yes (`float`, `sticky`) | Yes | `dark` variant missing |
| `tutorials` | Yes | No | Yes | |

---

### Tier 3 — Minimal / Documentation-Only Shell

These files have little to no authoring guidance. They function as block examples but provide no instruction for authors.

| Block | Has Title | Has Instructions | Primary Issue |
|---|---|---|---|
| `animation` | Yes | No | No instructions; no variants documented |
| `app-banner` | Yes | Yes | Instructions thin; screenshots absent |
| `app-ratings` | No H1 | No | No title, no instructions |
| `ax-accordion` | No H1 | No | No title, no instructions |
| `ax-marquee-dynamic-hero` | Wrong H1 | No | H1 is an article title from content ("30 Good Morning quotes...") |
| `banner-bg` | No H1 | No | No title, no instructions; 2 color variants missing |
| `billing-radio` | Yes | Yes | No matching block in code |
| `blog-article-marquee` | No H1 | No | No title, no instructions |
| `blog-columns` | No H1 | No | No title, no instructions |
| `blog-feature-marquee` | No H1 | No | No title, no instructions |
| `blog-posts` | Yes | No | No instructions |
| `blog-posts-v2` | Yes | No | No instructions |
| `carousel-card-mobile` | Yes | Yes | No matching block in code |
| `category-list` | Wrong H1 | Yes | Title says "Long text" but block is `category-list`; no matching block |
| `collapsible-rows` | No H1 | No | No title, no instructions |
| `color-how-to-carousel` | No H1 | No | No title, no instructions |
| `colors-how-to-carousel` | No H1 | No | Duplicate of `color-how-to-carousel` |
| `colors-seo-page` | No H1 | No | Not a block KS — full page example |
| `comparison-table-v2` | Wrong H1 | Yes (minimal) | H1 is actual page copy ("Nobody Does it Like Adobe Express") |
| `content-cards` | No H1 | No | No title, no instructions |
| `feature-grid` | Yes | Yes | Duplicate title with `feature-grid-desktop` |
| `feature-grid-desktop` | Yes | Yes | Duplicate of `feature-grid` |
| `feature-list` | Yes | No | No instructions |
| `firefly-card` | Yes | No | No matching block in code; no instructions |
| `floating-button` | Yes | No | `meta-powered` variant missing |
| `floating-panel` | No H1 | No | No title, no instructions |
| `fragment` | Yes | No | Milo block; no instructions |
| `frictionless-quick-action` | No H1 | No | No title, no instructions |
| `fullscreen-marquee` | Yes | No | No instructions; `image`/`video` variants shown but not explained |
| `hero-animation` | Yes | Yes | No matching block in code; Milo block |
| `image-list` | Yes | No | No instructions |
| `layouts` | Yes | No | Milo block; no instructions |
| `legal` | Yes | No | Milo block; no instructions |
| `link-blade` | No H1 | No | No title, no instructions |
| `list` | Yes | No | Milo block; no instructions |
| `logo-row` | No H1 | No | No title, no instructions |
| `multifunctional-button` | No H1 | No | Wrong filename; no title, no instructions |
| `page-list` | Yes | No | No instructions |
| `playlist` | No H1 | No | No title, no instructions |
| `premium-plan` | Yes | No | No matching block in code; no instructions |
| `pricing-cards-simplified-kitchen-sink` | Yes | Yes | Wrong filename; covers simplified-pricing-cards |
| `pricing-cards-v2` | Wrong H1 | Yes | H1 is Swedish page copy ("Stick ut med Adobe Express. Välj din plan.") |
| `promotion` | Yes | No | No instructions |
| `puf` | Yes | Yes | No matching block in code |
| `quick-action-cards` | Yes | No | No matching block in code; no instructions |
| `quick-action-hub` | Yes | No | No instructions |
| `ribbon-banner` | Yes | No | `text-light`, `light` variants missing; no instructions |
| `split-action` | Yes | Yes (some) | |
| `steps` | Yes | No | Milo block; instructions absent |
| `table-of-contents` | Yes | No | Milo block; no instructions |
| `table-of-contents-seo-feature` | Yes | No | No matching block; no instructions |
| `template-x-promo` | Yes | No | No instructions |
| `test` | No H1 | No | Scratch/test file — should be removed |
| `toc` | Yes | No | Milo block; no instructions |
| `toc-seo` | No H1 | No | No title, no instructions |
| `z-pattern` | No H1 | No | No matching block; no title, no instructions |

---

## Cross-Cutting Issues

### Wrong or Missing H1 Titles
These files need their H1 corrected:

| File | Current H1 | Correct Value |
|---|---|---|
| `ax-marquee-dynamic-hero.html` | "30 Good Morning quotes to get the day started!" | "AX-Marquee Dynamic Hero" |
| `comparison-table-v2.html` | "Nobody Does it Like Adobe Express" | "Comparison Table V2" |
| `pricing-cards-v2.html` | "Stick ut med Adobe Express. Välj din plan." | "Pricing Cards V2" |
| `category-list.html` | "Long text" | "Category List" |
| `interactive-marquee.html` | Pulled from block content | "Interactive Marquee" |

### Stale/Struck-Through Content
- `cards.html` contains inline struck-through content (`~~old instructions~~`) left from an update pass. Remove the old text.

### Duplicate Files
- `marquee.html` and `ax-marquee.html` have nearly identical documentation. They should either be clearly differentiated or one should link to the other.
- `feature-grid.html` and `feature-grid-desktop.html` have the same H1 and similar content. Consolidate.
- `color-how-to-carousel.html` and `colors-how-to-carousel.html` are duplicates.

### Screenshot-Heavy, Instruction-Light Files
Several files (e.g., `ax-columns`, `ax-marquee`) use screenshots of the authoring table rather than written descriptions. While screenshots are helpful, they become stale when the block changes. Prefer supplementing with written column-by-column descriptions.

---

## Priority Fix List

| Priority | File | Action |
|---|---|---|
| High | `ax-marquee-dynamic-hero.html` | Fix H1 title; add authoring instructions |
| High | `cards.html` | Remove struck-through legacy content |
| High | `template-x.html` | Add all 4 variant examples and descriptions |
| High | `interactive-marquee.html` | Fix H1; document all 6 variants |
| High | `faqv2.html` | Add instructions; document `bold`, `small`, `no-background` variants |
| High | `comparison-table-v2.html` | Fix H1 title |
| High | `pricing-cards-v2.html` | Fix H1 title (currently Swedish) |
| Medium | `ax-table-of-contents.html` | Document `horizontal` variant |
| Medium | `banner.html` | Add screenshots; document `compact` and `multi-button` |
| Medium | `quotes.html` | Add `carousel` variant example |
| Medium | `embed.html` | Add instructions explaining `embed-instagram`/`embed-twitter` |
| Medium | `ribbon-banner.html` | Add instructions; document `text-light` variant |
| Medium | `floating-button.html` | Document `meta-powered` variant |
| Low | `marquee.html` / `ax-marquee.html` | Differentiate or consolidate |
| Low | `feature-grid.html` / `feature-grid-desktop.html` | Consolidate into one file |
| Low | `color-how-to-carousel.html` / `colors-how-to-carousel.html` | Remove duplicate |
| Low | `test.html` | Delete |
