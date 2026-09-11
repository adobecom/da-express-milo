# Milo Doc Builder — Helper Reference & Authoring Knowledge

This file is the **single source of truth** for everything an agent needs to produce correct `.docx` Milo page documents — block shapes, metadata semantics, section-metadata gating, and live codebase investigation.

---

## How agents use this file

This file supports two distinct modes:

### Mode 1 — Generating a feature `build.py`

**Do not create or import a shared `.py` module.** Instead:

1. Read Part 7 (complete helper source).
2. Identify which high-level helpers the feature page actually needs (usually 6–10 of the 14 listed).
3. Copy the **low-level core** (everything under `# ----- low-level helpers` through `add_section_break`) **plus** only the high-level helpers needed into a `# ---- Milo helpers (inlined) ----` section near the top of `build.py`.
4. The resulting `build.py` is fully self-contained — no repo-internal imports, no `sys.path` tricks.

**Never:**
- Import from a `.claude/tools/` path
- Re-implement table shapes, borders, column widths, or heading styles by hand
- Omit the low-level core (the high-level helpers call it)

### Mode 2 — Investigating the codebase at runtime

Use **Part 4 (Runtime investigation protocol)** whenever:
- A charter or Figma summary mentions a metadata key not in the Part 3 catalog
- You want to know what metadata keys were recently added to the codebase
- You want to audit whether the catalog is complete relative to the live code
- You encounter unexpected page behaviour and want to trace it to a metadata key

Part 4 gives you exact `grep` and `git log` commands to run against the repo, a decision table for reading call-site context, and instructions for updating the catalog when you find a gap. **Always try Part 4 before asking the user about an unknown key.**

---

## Part 1 — Metadata concepts: page metadata vs section-metadata

Understanding the difference is essential for authoring correct pages. They are two separate blocks, serve entirely different purposes, and are never interchangeable.

### Page `metadata` block

- **One per page, at the very bottom of the document** (last block before nothing).
- Produces a `<meta>` tag in `<head>` for each key–value pair at parse time.
- Read by `getMetadata(key)` calls scattered throughout `scripts.js`, `utils.js`, and block files.
- Controls **global page behaviour**: SEO, floating CTAs, frictionless mode, logo injection, etc.
- Authored with `add_metadata(doc, { "Key": "value", ... })` — key casing matters (see catalog).

### `section-metadata` block

- **One per section, at the bottom of that section** (immediately before the section break `---`).
- Controls **how a single section behaves or is gated** — visibility, device targeting, anchor id.
- Only four keys are recognised: `showwith`, `audience`, `anchor`, `padding` (see table below).
- Authored with `add_showwith(doc, value)` (shorthand for single showwith) or `add_section_metadata(doc, { ... })` (generic).
- **Does not create `<meta>` tags** — it is read by `preDecorateSections()` at decoration time via `readBlockConfig()`.

### Why they look similar but are not

Both are 2-column key–value tables with a gray header row. The difference is:
- Page `metadata` → header reads **"Metadata"**, sits at the bottom of the entire doc, affects the whole page.
- `section-metadata` → header reads **"Section Metadata"**, sits inside one section, affects only that section.

A common authoring mistake is using `section-metadata` keys (`showwith`) inside the page `metadata` block or vice versa. Neither will work — the parsers are different.

---

## Part 2 — Section-metadata key catalog

Source: [express/code/scripts/utils.js:438–462](express/code/scripts/utils.js)

| Key | Values | What it does |
|---|---|---|
| `showwith` | `fqa-non-qualified` \| `fqa-qualified-desktop` \| `fqa-qualified-mobile` \| any page-meta key name | Removes the entire section unless the named page-level `<meta>` has `content="on"`. Checked against URL params first (non-prod), then head meta tags. Frictionless flag values (`fqa-*`) also trigger `hideQuickActionsOnDevices()` to set device body data. |
| `audience` | `mobile` \| `desktop` | Removes the section if `document.body.dataset.device` does not match. Applied before `showwith`. |
| `anchor` | any string slug | Sets the section's DOM `id` (e.g. `id="how-to"`). Only applied if `sectionRemove` is false. |
| `padding` | any value | Sets `data-padding="none"` on the section element. Only applied if `sectionRemove` is false and `anchor` is not set. |

### How the frictionless hero triplet works

A frictionless page always has three hero sections in this order:

```
Section 1:  columns (fullsize)      ← fallback / non-qualified browsers
            section-metadata        showwith = fqa-non-qualified

Section 2:  frictionless-quick-action    ← desktop / qualified non-Safari
            section-metadata             showwith = fqa-qualified-desktop

Section 3:  frictionless-quick-action-mobile  ← mobile / qualified mobile
            section-metadata                   showwith = fqa-qualified-mobile
```

At runtime, `hideQuickActionsOnDevices()` sets exactly one of these three flags to `on` in `<head>` based on user-agent and the `frictionless-safari` metadata. All three sections are present in the HTML; the ones not matching are removed from the DOM before render.

---

## Part 3 — Page metadata key catalog (categorised)

Source files for runtime discovery (read these when a key's behaviour is unclear):
- [express/code/scripts/utils.js](express/code/scripts/utils.js) — frictionless, floating CTA, section gating
- [express/code/scripts/scripts.js](express/code/scripts/scripts.js) — template, hero logo, Jarvis, sheet-powered
- [express/code/scripts/widgets/floating-cta.js](express/code/scripts/widgets/floating-cta.js) — full floating CTA config
- [express/code/scripts/utils/mobile-fork-button-utils.js](express/code/scripts/utils/mobile-fork-button-utils.js) — fork button config

### Category A — SEO & Page Identity

These are always included. Key casing matches what DA / Milo reads.

| Key | Example value | What it controls |
|---|---|---|
| `Title` | `Compress a JPEG image online` | `<title>` tag and OG title |
| `Description` | `Use Adobe Express to...` | `<meta name="description">` |
| `Short Title` | `JPEG Compressor` | Used by breadcrumb auto-builder (`template-list/breadcrumbs.js:31`) |
| `theme` | `express-dark` | Body theme class applied by Milo |
| `template` | `blog` | Only emit for blog pages — triggers blog marquee + author header ([scripts.js:293](express/code/scripts/scripts.js)) |
| `breadcrumbs` | `n/a` | Set to `n/a` if a `breadcrumbs` block handles rendering explicitly; prevents auto-breadcrumb injection |

### Category B — Frictionless / Quick Action

Include these on any page that uses a frictionless-quick-action block.

| Key | Example value | What it controls | Source |
|---|---|---|---|
| `frictionless-safari` | `on` | Makes iOS Safari users eligible for the frictionless path (otherwise Safari users get the non-qualified fallback). Set to `on` for features where the CCEverywhere SDK works in Safari. | [utils.js:428](express/code/scripts/utils.js) |
| `fqa-off` / `fqa-on` | *(auto-set)* | **Do not author these** — they are injected at runtime by `hideQuickActionsOnDevices()` as legacy signals. Authoring them in the metadata block would break the auto-detection logic. | [utils.js:411](express/code/scripts/utils.js) |

### Category C — Floating CTA Button *(all keys work as a unit)*

The floating button is auto-created by `buildAutoBlocks()` ([utils.js:607](express/code/scripts/utils.js)) when `show-floating-cta` is truthy. All keys below are read by `floating-cta.js` and `mobile-fork-button-utils.js`. Author them together — a floating button with a missing link or text key will silently produce an empty button.

**Gate key (required to enable floating button at all):**

| Key | Value | What it controls |
|---|---|---|
| `show-floating-cta` | `on` | Master switch. Accepted: `yes`, `y`, `true`, `on`. Triggers `buildAutoBlocks()` and the same-URL CTA deduplication logic. |

**Block selector (which floating button variant to render):**

| Key | Example value | What it controls |
|---|---|---|
| `desktop-floating-cta` | `floating-button` | Block name to inject on desktop. Valid values: `floating-button`, `multifunction-button`, `mobile-fork-button`, `mobile-fork-button-frictionless`, `mobile-fork-button-dismissable`. |
| `mobile-floating-cta` | `mobile-fork-button-frictionless` | Block name to inject on mobile. Same valid values as above. |

**CTA copy & destination (used by both floating button and same-URL deduplication):**

| Key | Example value | What it controls |
|---|---|---|
| `main-cta-link` | `https://express.adobe.com/...` | Primary CTA URL. Fallback when device-specific link is absent. Also used by same-URL CTA hiding logic to suppress duplicate CTAs in the page body. |
| `main-cta-text` | `Try for free` | Primary CTA label. Fallback when device-specific text is absent. |
| `desktop-floating-cta-link` | `https://express.adobe.com/...` | Desktop-specific CTA destination. Overrides `main-cta-link` on desktop. |
| `desktop-floating-cta-text` | `Get started` | Desktop-specific CTA label. Overrides `main-cta-text` on desktop. |
| `mobile-floating-cta-link` | `https://adobeexpress.page.link/...` | Mobile-specific CTA destination (often a Branch deep link). |
| `mobile-floating-cta-text` | `Edit for free` | Mobile-specific CTA label. |

**Drawer / display behaviour:**

| Key | Example value | What it controls |
|---|---|---|
| `floating-cta-drawer-delay` | `3000` | Milliseconds to wait before showing the floating drawer. Default: 0 (immediate). |
| `floating-cta-suppress-until-not-visible` | `on` | Hide the floating button while the page-body CTA with the same URL is in the viewport. Accepted: `yes`, `y`, `true`, `on`. |
| `show-floating-cta-app-store-badge` | `on` | Show an App Store / Play Store badge inside the floating button. Accepted: `on`. |
| `use-floating-cta-lottie-arrow` | `on` | Animate a Lottie arrow on the floating button. Accepted: `yes`, `y`, `true`, `on`. |
| `ctas-above-divider` | `2` | Number of CTAs shown above the divider line in `multifunction-button`. |
| `floating-cta-bubble-sheet` | `/express/placeholders.json` | URL of a JSON sheet for localised bubble copy inside the floating button. |
| `floating-cta-live` | `on` | Enables live-mode for the floating button (shows real-time user count or similar). |

**Fork button multi-CTA slots** (`cta-N-*` pattern, N = 1, 2, 3, …):

These are used by `multifunction-button` and `mobile-fork-button` variants to populate individual CTA rows. Each slot is independent.

| Key pattern | Example | What it controls |
|---|---|---|
| `cta-N-icon` | `cta-1-icon` = `app-icon.png` | Icon URL for the Nth CTA in the fork button. Absence of this key means the Nth slot is empty and the block short-circuits. |
| `cta-N-link` | `cta-1-link` = `https://...` | Destination URL for the Nth CTA. |
| `cta-N-text` | `cta-1-text` = `Edit in app` | Label for the Nth CTA. |

**Fork-button eligibility:**

| Key | Value | What it controls |
|---|---|---|
| `fork-eligibility-check` | `on` | When `on`, the Android eligibility check in `androidCheck()` runs — only Android users see the fork button path. When absent or `off`, all users are eligible. |
| `fork-button-header` | `Choose how to edit` | Header text shown above the fork button options drawer. |

### Category D — Logo Injection

| Key | Value | What it controls | Blocks that read it |
|---|---|---|---|
| `hero-inject-logo` | `on` / `yes` | Injects the Adobe Express logo into the first `<h1>` on the page | [scripts.js:319](express/code/scripts/scripts.js) |
| `marquee-inject-logo` | `on` / `yes` | Injects the Express logo into the first marquee/hero block | ax-columns, ax-marquee, frictionless-quick-action, fullscreen-marquee, headline, search-marquee, and more |
| `marquee-inject-photo-logo` | `on` / `yes` | Injects the photo-variant logo instead of the default Express logo | ax-columns, ax-marquee, color-headline |

### Category E — Jarvis AI Assistant

Only include on pages where the AI chat bubble is explicitly required.

| Key | Example value | What it controls |
|---|---|---|
| `jarvis-immediately-visible` | `on` | Shows the Jarvis chat bubble immediately on load (default: lazy) |
| `jarvis-surface-id` | `Acom_Express` | Identifies the Jarvis surface context. Default: `Acom_Express` — only set if the charter specifies a custom surface. |
| `jarvis-surface-version` | `1.0` | Jarvis surface version. Default: `1.0`. |

### Category F — Navigation & Footer

These have defaults and rarely need explicit authoring. Only set them when overriding the default.

| Key | Default | What it controls |
|---|---|---|
| `footer-source` | `/federal/footer/footer` | Path to the footer fragment. Override for custom footers. |
| `gnav-source` | `/{locale}/express/localnav-express` | Path to the global nav fragment. Override for locale-specific or custom navs. |

### Category G — FAQ & How-To Schema

| Key | Value | What it controls |
|---|---|---|
| `show-faq-schema` | `no` | Set to `no` to suppress the FAQ JSON-LD schema that `faq.js` auto-injects. Default: schema is injected. Source: [faq.js:7](express/code/blocks/faq/faq.js) |
| `show-howto-schema` | `no` | Set to `no` to suppress the HowTo JSON-LD schema from `how-to-v3.js`. Source: [how-to-v3.js:112](express/code/blocks/how-to-v3/how-to-v3.js) |

### Category H — Martech / Analytics

| Key | Value | What it controls |
|---|---|---|
| `martech` | `off` | Set to `off` to disable martech scripts entirely (used on opt-out / privacy pages). |
| `category` | `photo` | Product category signal consumed by analytics. Source: [utils.js:694](express/code/scripts/utils.js) |

### Category I — Template / Search Pages

Only relevant for template gallery pages. Do not include on feature/tool pages.

| Key | Example | What it controls |
|---|---|---|
| `sheet-powered` | `Y` | Enables sheet-powered template fetching ([scripts.js:423](express/code/scripts/scripts.js)) |
| `template-search-page` | `Y` | Marks the page as a search results page |
| `tasks` | `remove-background` | Template task filter |
| `topics` | `business` | Template topic filter |
| `short-title` | `Background Remover` | Used in auto-generated breadcrumbs on template pages |
| `placeholder-format` | `4:3` | Aspect ratio filter for template list |

### Category J — Misc / Advanced

| Key | Value | What it controls |
|---|---|---|
| `adobe-home-redirect` | `on` | Redirects `adobe.com` root visitors to Express. Rare — only on homepage-adjacent pages. |
| `pep-destination` | `https://...` | Destination URL for PEP (post-entitlement page) redirect flow. |
| `ax-commerce-override` | `pricing-cards,upsell` | Comma-separated list of blocks to override with AX commerce variants. |

---

## Part 4 — Runtime investigation protocol

The catalog in Part 3 is a snapshot. New metadata keys are added regularly. This section teaches agents how to investigate the live codebase at any time — to look up an unknown key, audit what's changed recently, or detect catalog gaps — without asking the user.

---

### 4a — Look up a specific key you already know about

Run these in order, stopping as soon as you find the key:

```bash
# Step 1 — core scripts (covers ~80 % of feature-page keys)
grep -n "getMetadata(" express/code/scripts/utils.js express/code/scripts/scripts.js | grep "the-key-name"

# Step 2 — widget layer (floating CTA family, fork button)
grep -rn "getMetadata(" express/code/scripts/widgets/ express/code/scripts/utils/ --include="*.js" | grep "the-key-name"

# Step 3 — block files (block-specific keys like marquee-*, search-marquee-*, template-*)
grep -rn "getMetadata(" express/code/blocks/ --include="*.js" | grep "the-key-name"
```

Once you find the call site, read ±10 lines of context to characterise the key (see 4c below).

**Priority files** — check these directly for the key families listed:

| File | Key family it owns |
|---|---|
| [express/code/scripts/utils.js](express/code/scripts/utils.js) | frictionless (`fqa-*`, `frictionless-safari`), section gating (`showwith`, `audience`), floating CTA gate (`show-floating-cta`, `${device}-floating-cta`) |
| [express/code/scripts/scripts.js](express/code/scripts/scripts.js) | `template`, `hero-inject-logo`, `sheet-powered`, `jarvis-*`, `gnav-source`, `footer-source` |
| [express/code/scripts/widgets/floating-cta.js](express/code/scripts/widgets/floating-cta.js) | All `floating-cta-*`, `desktop-floating-cta-*`, `mobile-floating-cta-*`, `main-cta-*`, `cta-N-*`, `ctas-above-divider` |
| [express/code/scripts/utils/mobile-fork-button-utils.js](express/code/scripts/utils/mobile-fork-button-utils.js) | `fork-button-header`, `fork-eligibility-check`, `cta-1-*` — cross-check here for any fork-button key; it sometimes reads a key the widget doesn't |
| [express/code/blocks/faq/faq.js](express/code/blocks/faq/faq.js) | `show-faq-schema` |
| [express/code/blocks/how-to-v3/how-to-v3.js](express/code/blocks/how-to-v3/how-to-v3.js) | `show-howto-schema` |
| [express/code/blocks/template-list/breadcrumbs.js](express/code/blocks/template-list/breadcrumbs.js) | `short-title`, `tasks`, `tasks-x`, `template-search-page`, `sheet-powered` |

---

### 4b — Discover all keys in the codebase right now (full enumeration)

Run this to get a deduplicated, sorted list of every string passed to `getMetadata` in the live codebase:

```bash
grep -rh "getMetadata(" express/code/ --include="*.js" \
  | grep -oP "getMetadata\(['\`]\K[^'\`]+" \
  | sort -u
```

To also see which file each key is read from:

```bash
grep -rn "getMetadata(" express/code/ --include="*.js" \
  | grep -oP "^[^:]+:\d+:.*getMetadata\(['\`]\K[^'\`]+" \
  | sort -t"'" -k2
```

> Template literals like `` getMetadata(`${device}-floating-cta`) `` produce dynamic keys. These appear in the output as `${device}-floating-cta` — mentally expand them to `desktop-floating-cta` and `mobile-floating-cta`.

---

### 4c — Characterise a key from its call-site context

After finding a call site, read ±15 lines. Answer these four questions:

**1. What value does the code expect?**

| Code pattern | What to author |
|---|---|
| `=== 'on'` | `on` |
| `includes(getMetadata(...), 'on')` or `.includes('on', 'yes', 'y', 'true')` | `on` (any accepted) |
| `=== 'Y'` | `Y` — exact case, not `yes` or `on` |
| `?.toLowerCase()` before comparison | any casing works |
| `\|\| 'default-value'` | key is optional; only author to override the default |
| the value is used directly as a URL or path | author a full URL |
| the value is used as a block name | author an exact block class name from the valid-values list |

**2. Is this key required or optional?**
- Required: code behaviour breaks or silently degrades when the key is absent → always author it.
- Optional: code has `|| fallback` or a null guard, and the fallback is acceptable → author only when overriding.

**3. Does it trigger side effects?**
- Does reading this key also call another function or inject additional DOM elements? (e.g. `show-floating-cta` triggers `buildAutoBlocks()` which creates the floating button block). If so, note the other keys the triggered code reads — they must all be authored together.

**4. Which other keys form a group with it?**
- Look at the same function or config object for sibling `getMetadata` calls. If multiple keys are read inside one config block (like the floating-cta config object), treat them as a unit — author all or author none.

---

### 4d — Find keys added since the catalog was last written

Use git to surface metadata keys that appear in new or modified code since a given date:

```bash
# Keys added in the last 30 days (new getMetadata calls in changed lines)
git log --since="30 days ago" -p -- "express/code/**/*.js" \
  | grep "^+" \
  | grep -oP "getMetadata\(['\`]\K[^'\`]+" \
  | sort -u
```

To narrow to a specific file area (e.g. floating CTA changes only):

```bash
git log --since="30 days ago" -p -- "express/code/scripts/widgets/floating-cta.js" \
  | grep "^+" \
  | grep -oP "getMetadata\(['\`]\K[^'\`]+"
```

To see the full commit context for any key you find:

```bash
git log --since="30 days ago" --all -S "the-key-name" --source -- "express/code/**/*.js" \
  | head -20
# Then read the introducing commit:
git show <commit-hash> -- express/code/path/to/file.js
```

---

### 4e — Detect catalog gaps (keys in code not in this file)

Run the full enumeration (4b), then compare against what Part 3 documents. Any key in the grep output that is **not** in one of the Part 3 tables is a catalog gap.

When you find a gap:
1. Characterise the key using 4c.
2. Decide which category in Part 3 it belongs to.
3. Add it to the correct table with `file:line` source.
4. If it forms a group with existing keys (e.g. a new `floating-cta-*` key), add it to that group's table, not as a standalone entry.

**Do not ask the user** about a gap key until you've tried 4a–4c. Most gaps resolve from reading the code in under 2 minutes.

---

## Part 5 — Buildable block catalog

Every block this agent can author, with its helper, the exact block name as it appears in the docx header row, and what it produces on the live page.

### Frictionless hero triplet

These three always appear together in the order below. Each is gated by a `section-metadata` showwith key immediately after it.

| # | Helper | Docx header | Live output | Showwith gate |
|---|---|---|---|---|
| 1 | `add_columns_fullsize_hero(...)` | `columns (fullsize)` | Full-width two-column hero with h1, subhead, CTA link, and upload animation. Shown to non-qualified browsers (no FQA SDK). | `fqa-non-qualified` |
| 2 | `add_frictionless_quick_action(...)` | `frictionless-quick-action` | Desktop FQA hero — upload card with heading, CTA, file restrictions, ToS links, and a `Quick-Action` config row that tells the SDK which tool to open. | `fqa-qualified-desktop` |
| 3 | `add_frictionless_quick_action_mobile(...)` | `frictionless-quick-action-mobile` | Mobile FQA hero — 5-row variant with tagline, tap-to-upload copy, fallback fragment link, and `Quick-Action` config row. | `fqa-qualified-mobile` |

**Key parameter notes:**
- `quick_action_id` must be a confirmed key in `QA_CONFIGS` ([frictionless-utils.js:86–130](express/code/scripts/utils/frictionless-utils.js)). This is the SDK tool identifier (e.g. `remove-background`, `resize-image`, `compress-image`).
- `upload_animation_url` must be the full `https://main--da-express-milo--adobecom.aem.live/media_....mp4` URL. Never reuse another feature's animation without a charter amendment.
- Mobile variant requires a `fallback_fragment_url` pointing to the non-frictionless fallback fragment.

### Body blocks

| Helper | Docx header | Live output | Notes |
|---|---|---|---|
| `add_how_to_steps(...)` | `steps (highlight, image, schema)` | Icon-left, title+body-right rows. Auto-emits an h2 paragraph above the block. Schema variant injects HowTo JSON-LD unless suppressed by `show-howto-schema: no`. | `steps` param overrides variant string |
| `add_how_to_cards(...)` | `how-to-cards` or `how-to-cards (summary)` | Numbered card carousel. Optional header row (H2 + body). Card rows are single-column (h3 + p). JS auto-adds step numbers — do NOT author them. `summary` variant replaces numbers with per-card icons (picture as first child). `schema` modifier injects HowTo JSON-LD. **Use this block for any "icon + title + body" horizontal card pattern** — the `summary` variant covers it without a new block. | Derived from [how-to-cards.js:168–221](express/code/blocks/how-to-cards/how-to-cards.js) |
| `add_content_column(...)` | `columns` | Single row with image on one side, h2 + body text on the other. `image_side` param swaps order. | Use alternating left/right across sequential calls |
| `add_link_list(...)` | `link-list` | h3 heading + one paragraph per link. Renders as a horizontal pill-link rail on the live page. | Typically used for "Discover even more" cross-links |
| `add_banner(...)` | `banner` or `banner (variant)` | Full-width promotional band. Pass `variant=None` (Python `None`, **not** the string `"default"`) for the default indigo band — header row reads `banner` with no parentheses. Optional `cta` tuple renders a pill button. | **Color → variant:** `#5C5CE0` indigo = `None` (default); `#0070F2` blue = `'cool'`; `#F5F5F5` near-white = `'light'`; `#272727` near-black = `'standout'`. Layout-only (no bg change): `'compact'`, `'narrow'`. |
| `add_faq(...)` | `faq` | Accordion of question/answer pairs. Auto-emits an h2 paragraph above. Auto-injects FAQ JSON-LD schema unless suppressed by `show-faq-schema: no`. | Answer can be a plain string or a `parts` list for mixed content |

### Navigation & metadata blocks

| Helper | Docx header | Live output | Notes |
|---|---|---|---|
| `add_breadcrumbs(...)` | `breadcrumbs` | Breadcrumb trail. Last crumb (current page) is plain text (no link). | When using this block, set `breadcrumbs: n/a` in the page metadata block to prevent auto-injection |
| `add_metadata(...)` | `metadata` | Page-level `<meta>` tags. One per doc, always last. | URL values are rendered as hyperlinks automatically |

### Structural helpers (not blocks)

| Helper | What it emits | When to use |
|---|---|---|
| `add_section_break(doc)` | centered `---` paragraph (DA section separator only — no Word section break) | Between every section. Every section boundary needs one. |
| `add_h2(doc, text)` | Standalone `Heading 2` paragraph | Between blocks where a heading sits outside a table (e.g. above `how-to-steps`, above `faq`). Do not put these inside block tables. |
| `add_showwith(doc, value)` | `section-metadata` with a single `showwith` row | Immediately after a hero block to gate its visibility. |
| `add_section_metadata(doc, pairs)` | `section-metadata` with multiple key–value rows | When a section needs more than just `showwith` (e.g. `showwith` + `anchor`). |

---

## Part 6 — Constants

| Name | Value | Use |
|---|---|---|
| `HEADER_FILL` | `"EFEFEF"` | Gray header row background |
| `BORDER_COLOR` | `"D0D0D0"` | Table border colour |
| `LINK_COLOR` | `"1473E6"` | Hyperlink blue |
| `TERMS_URL` | `https://www.adobe.com/legal/terms.html` | Adobe ToS link |
| `PRIVACY_URL` | `https://www.adobe.com/privacy/policy.html` | Adobe Privacy link |

---

## Part 7 — Complete helper source

Copy from here when writing self-contained `build.py` scripts. Include the **full low-level core** plus only the high-level helpers the page uses.

```python
# ---- Milo helpers (inlined from .claude/tools/build_milo_doc.md) --------
# Low-level core (always include all of these):
#   set_cell_shading, set_cell_borders, set_table_borders, merge_row_cells,
#   add_hyperlink, add_runs, _apply_heading_style, write_cell,
#   add_block, add_section_break
# High-level (paste only what this page uses):
#   add_h2, add_showwith, add_section_metadata,
#   add_columns_fullsize_hero, add_frictionless_quick_action,
#   add_frictionless_quick_action_mobile, add_how_to_steps,
#   add_content_column, add_banner, add_link_list,
#   add_faq, add_breadcrumbs, add_metadata

import io
import requests
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

HEADER_FILL  = "EFEFEF"
BORDER_COLOR = "D0D0D0"
LINK_COLOR   = "1473E6"
TERMS_URL    = "https://www.adobe.com/legal/terms.html"
PRIVACY_URL  = "https://www.adobe.com/privacy/policy.html"

# ----- low-level helpers ---------------------------------------------------

def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), color_hex)
    tcPr.append(shd)


def set_cell_borders(cell, color=BORDER_COLOR, sz="4"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ("top", "left", "bottom", "right"):
        b = OxmlElement(f'w:{edge}')
        b.set(qn('w:val'), 'single')
        b.set(qn('w:sz'), sz)
        b.set(qn('w:space'), '0')
        b.set(qn('w:color'), color)
        tcBorders.append(b)
    tcPr.append(tcBorders)


def set_table_borders(table, color=BORDER_COLOR, sz="4"):
    tbl = table._tbl
    tblPr = tbl.find(qn('w:tblPr'))
    tblBorders = OxmlElement('w:tblBorders')
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        b = OxmlElement(f'w:{edge}')
        b.set(qn('w:val'), 'single')
        b.set(qn('w:sz'), sz)
        b.set(qn('w:space'), '0')
        b.set(qn('w:color'), color)
        tblBorders.append(b)
    tblPr.append(tblBorders)


def merge_row_cells(table, row_idx):
    row = table.rows[row_idx]
    first = row.cells[0]
    for c in row.cells[1:]:
        first = first.merge(c)
    return first


def add_hyperlink(paragraph, text, url):
    part = paragraph.part
    r_id = part.relate_to(
        url,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        is_external=True,
    )
    hyperlink = OxmlElement('w:hyperlink')
    hyperlink.set(qn('r:id'), r_id)
    new_run = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    color = OxmlElement('w:color')
    color.set(qn('w:val'), LINK_COLOR)
    rPr.append(color)
    u = OxmlElement('w:u')
    u.set(qn('w:val'), 'single')
    rPr.append(u)
    new_run.append(rPr)
    t = OxmlElement('w:t')
    t.text = text
    t.set(qn('xml:space'), 'preserve')
    new_run.append(t)
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)
    return hyperlink


def add_runs(paragraph, parts):
    """parts: list of tuples — ('text', str) | ('em', str) | ('link', text, url) | ('br',)"""
    for p in parts:
        kind = p[0]
        if kind == 'text':
            paragraph.add_run(p[1])
        elif kind == 'em':
            r = paragraph.add_run(p[1])
            r.italic = True
        elif kind == 'link':
            add_hyperlink(paragraph, p[1], p[2])
        elif kind == 'br':
            paragraph.add_run().add_break()


def _apply_heading_style(paragraph, level):
    """Apply Word's built-in Heading N style so DA ingest emits a real <hN>."""
    try:
        paragraph.style = paragraph.part.document.styles[f'Heading {level}']
    except KeyError:
        run = paragraph.runs[-1] if paragraph.runs else paragraph.add_run()
        run.bold = True
        run.font.size = Pt({1: 20, 2: 16, 3: 13}.get(level, 13))


def write_cell(cell, content_blocks, bold_all=False):
    """content_blocks: list — ('p', parts) | ('h', level, text) | ('ul', [items]) | ('img', url, alt)"""
    cell.text = ""
    first = True
    for block in content_blocks:
        if first:
            p = cell.paragraphs[0]
            first = False
        else:
            p = cell.add_paragraph()
        kind = block[0]
        if kind == 'p':
            add_runs(p, block[1])
            if bold_all:
                for run in p.runs:
                    run.bold = True
        elif kind == 'h':
            p.add_run(block[2])
            _apply_heading_style(p, block[1])
        elif kind == 'ul':
            for i, item_parts in enumerate(block[1]):
                lp = p if i == 0 else cell.add_paragraph()
                lp.style = cell.part.document.styles['List Bullet']
                add_runs(lp, item_parts)
        elif kind == 'img':
            # Image blob is fetched at build time and embedded directly in the docx.
            # When the author pastes the docx into DA, DA uploads the embedded blob
            # to AEM and generates the media_* URL automatically — nothing to replace.
            # Therefore: url must be reachable NOW (Figma MCP asset, local file path,
            # or picsum seed). Never use an AEM media_* path — it does not exist yet
            # and requests.get() will 404, silently falling back to [image: alt].
            url, alt = block[1], block[2]
            try:
                data = requests.get(url, timeout=20).content
                run = p.add_run()
                run.add_picture(io.BytesIO(data), width=Inches(2.6))
            except Exception:
                r = p.add_run(f"[image: {alt}]")
                r.italic = True


# ----- block builders ------------------------------------------------------

def add_block(doc, name, rows, col_widths=None):
    """Bordered table with gray header row. rows: list of cell-block lists."""
    ncols = max((len(r) for r in rows), default=1)
    table = doc.add_table(rows=1 + len(rows), cols=ncols)
    table.autofit = False
    set_table_borders(table)

    hcell = merge_row_cells(table, 0)
    set_cell_shading(hcell, HEADER_FILL)
    hcell.text = ""
    hp = hcell.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    hr = hp.add_run(name)
    hr.bold = True
    hr.font.size = Pt(11)

    for ri, row in enumerate(rows, start=1):
        if len(row) == 1 and ncols > 1:
            c = merge_row_cells(table, ri)
            write_cell(c, row[0])
        else:
            for ci, cell_blocks in enumerate(row):
                write_cell(table.rows[ri].cells[ci], cell_blocks)

    if col_widths and len(col_widths) == ncols:
        for ri in range(len(table.rows)):
            for ci, w in enumerate(col_widths):
                try:
                    table.rows[ri].cells[ci].width = Inches(w)
                except Exception:
                    pass

    doc.add_paragraph()
    return table


def add_section_break(doc):
    """Insert a centered `---` paragraph (DA section separator). No Word section break — that caused double-separator rendering bugs."""
    p = doc.add_paragraph("---")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER


# ----- high-level block helpers --------------------------------------------

def add_h2(doc, text):
    return doc.add_paragraph(text, style='Heading 2')


def add_showwith(doc, value, col_widths=(3.3, 3.3)):
    return add_block(
        doc, "section-metadata",
        [[[('p', [('text', 'showwith')])], [('p', [('text', value)])]]],
        col_widths=list(col_widths),
    )


def add_section_metadata(doc, pairs, col_widths=(3.3, 3.3)):
    rows = [
        [[('p', [('text', k)])], [('p', [('text', v)])]]
        for k, v in pairs.items()
    ]
    return add_block(doc, "section-metadata", rows, col_widths=list(col_widths))


def add_columns_fullsize_hero(
    doc, *, headline, subhead, cta_text, cta_url,
    upload_animation_url, col_widths=(3.3, 3.3),
):
    return add_block(
        doc, "columns (fullsize)",
        [[
            [
                ('h', 1, headline),
                ('p', [('text', subhead)]),
                ('p', [('link', cta_text, cta_url)]),
            ],
            [('p', [('link', "Upload animation (MP4)", upload_animation_url)])],
        ]],
        col_widths=list(col_widths),
    )


def add_frictionless_quick_action(
    doc, *, headline, subhead, upload_animation_url,
    upload_heading_text, upload_heading_em,
    upload_cta_text, upload_cta_url,
    file_restrictions_text, quick_action_id,
    terms_url=TERMS_URL, privacy_url=PRIVACY_URL,
    col_widths=(3.3, 3.3),
):
    """Desktop FQA hero — 3-row pattern:
      (headline + subhead, empty)
      (video link, upload card with heading + CTA + restrictions + ToS)
      (Quick-Action, <id>)
    quick_action_id must be a key in QA_CONFIGS in frictionless-utils.js.
    """
    return add_block(
        doc, "frictionless-quick-action",
        [
            [
                [('h', 1, headline), ('p', [('text', subhead)])],
                [('p', [('text', '')])],
            ],
            [
                [('p', [('link', "Alternate video source (MP4)", upload_animation_url)])],
                [
                    ('p', [
                        ('text', upload_heading_text),
                        ('br',),
                        ('text', 'or '),
                        ('em', upload_heading_em),
                    ]),
                    ('p', [('link', upload_cta_text, upload_cta_url)]),
                    ('p', [('text', file_restrictions_text)]),
                    ('p', [
                        ('text', 'By uploading your image or video, you agree to the Adobe '),
                        ('link', 'Terms of Use', terms_url),
                        ('text', ' and '),
                        ('link', 'Privacy Policy', privacy_url),
                    ]),
                ],
            ],
            [
                [('p', [('text', 'Quick-Action')])],
                [('p', [('text', quick_action_id)])],
            ],
        ],
        col_widths=list(col_widths),
    )


def add_frictionless_quick_action_mobile(
    doc, *, headline, subhead, tagline, upload_animation_url,
    tap_prefix_text, tap_em_text,
    file_restrictions_text, fallback_fragment_url, quick_action_id,
    terms_url=TERMS_URL, privacy_url=PRIVACY_URL,
    col_widths=(3.3, 3.3),
):
    """Mobile FQA hero — 5-row pattern."""
    return add_block(
        doc, "frictionless-quick-action-mobile",
        [
            [
                [
                    ('h', 1, headline),
                    ('p', [('text', subhead)]),
                    ('p', [('text', tagline)]),
                ],
                [('p', [('text', '')])],
            ],
            [
                [('p', [('link', "Alternate video source (MP4)", upload_animation_url)])],
                [('p', [('text', tap_prefix_text), ('em', tap_em_text)])],
            ],
            [
                [('p', [('text', '')])],
                [
                    ('p', [('text', file_restrictions_text)]),
                    ('p', [
                        ('text', 'By uploading your image or video, you agree to the Adobe '),
                        ('link', 'Terms of Use', terms_url),
                        ('text', ' and '),
                        ('link', 'Privacy Policy', privacy_url),
                    ]),
                ],
            ],
            [
                [('p', [('text', 'fallback')])],
                [('p', [('link', fallback_fragment_url, fallback_fragment_url)])],
            ],
            [
                [('p', [('text', 'Quick-Action')])],
                [('p', [('text', quick_action_id)])],
            ],
        ],
        col_widths=list(col_widths),
    )


def add_how_to_steps(
    doc, *, heading, steps, variant="highlight, image, schema",
    col_widths=(2.0, 4.6),
):
    """steps: list of {icon_url, icon_alt, title, body}. Emits h2 above block."""
    add_h2(doc, heading)
    rows = [
        [
            [('img', s['icon_url'], s['icon_alt'])],
            [('h', 3, s['title']), ('p', [('text', s['body'])])],
        ]
        for s in steps
    ]
    return add_block(doc, f"steps ({variant})", rows, col_widths=list(col_widths))


def add_how_to_cards(
    doc, *, cards, heading=None, body=None,
    variant=None, schema=False,
    col_widths=(6.6,),
):
    """Numbered how-to card carousel. Derived from how-to-cards.js:168-221.

    Row schema (from JS init()):
      Row 0 (optional): single-column — H2 + body paragraph.
                        JS line 177: steps[0].querySelector('h2') → .text class.
                        Omit entirely if no heading is needed.
      Rows 1-N:         single-column — h3 title + p body per card.
                        JS line 182: each remaining div becomes a card <li>.
                        JS auto-adds step number circle — do NOT author numbers in h3.

    variant: None (default numbered) or 'summary' (icons instead of numbers).
    schema:  True adds 'schema' modifier → HowTo JSON-LD injected at runtime.

    For 'summary' variant, each card dict may include 'icon_url' and 'icon_alt'.
    The icon picture must be the FIRST child of the card cell (JS line 156-163:
    firstElement is PICTURE → promoted to step-icon). Pass icon_width=0.6 for 40px icons.

    cards: list of dicts with keys: title (str), body (str),
           and optionally icon_url + icon_alt (summary variant only).
    """
    modifiers = []
    if variant:
        modifiers.append(variant)
    if schema:
        modifiers.append('schema')
    block_name = "how-to-cards" if not modifiers else f"how-to-cards ({', '.join(modifiers)})"

    rows = []
    # Row 0 — optional header text section (JS line 177-181)
    if heading:
        header_content = [('h', 2, heading)]
        if body:
            header_content.append(('p', [('text', body)]))
        rows.append([header_content])

    # Card rows — JS line 182: content = div.querySelector('div')
    for card in cards:
        cell = []
        # summary variant: icon picture MUST be first child (JS line 156-163)
        if variant == 'summary' and card.get('icon_url'):
            cell.append(('img', card['icon_url'], card.get('icon_alt', ''), 0.6))
        cell.append(('h', 3, card['title']))     # JS line 115: step.querySelector('h3')
        cell.append(('p', [('text', card['body'])]))  # JS line 116: step.querySelector('p')
        rows.append([cell])

    return add_block(doc, block_name, rows, col_widths=list(col_widths))


def add_content_column(
    doc, *, image_url, image_alt, heading, body,
    image_side='left', col_widths=(3.3, 3.3),
):
    image_cell = [('img', image_url, image_alt)]
    text_cell = [('h', 2, heading), ('p', [('text', body)])]
    cells = [image_cell, text_cell] if image_side == 'left' else [text_cell, image_cell]
    return add_block(doc, "columns", [cells], col_widths=list(col_widths))


def add_banner(doc, *, heading, variant=None, cta=None, col_widths=(6.6,)):
    """Pass variant=None (Python None, not the string 'default') for indigo #5C5CE0.
    Color → variant: #5C5CE0 indigo = None; #0070F2 blue = 'cool';
    #F5F5F5 near-white = 'light'; #272727 dark = 'standout'.
    Layout-only (no bg change): 'compact', 'narrow'.
    cta = optional (text, url) tuple.
    """
    block_name = "banner" if not variant else f"banner ({variant})"
    content = [('h', 2, heading)]
    if cta:
        content.append(('p', [('link', cta[0], cta[1])]))
    return add_block(doc, block_name, [[content]], col_widths=list(col_widths))


def add_link_list(doc, *, heading, links, col_widths=(6.6,)):
    """`link-list` block. links: list of (text, url) tuples."""
    content = [('h', 3, heading)]
    content.extend([('p', [('link', t, u)]) for t, u in links])
    return add_block(doc, "link-list", [[content]], col_widths=list(col_widths))


def add_faq(doc, *, heading, qa_pairs, col_widths=(3.3, 3.3)):
    """qa_pairs: list of (question, answer) where answer is str or add_runs parts list.
    Emits h2 above block.
    """
    add_h2(doc, heading)
    rows = []
    for q, a in qa_pairs:
        a_parts = [('text', a)] if isinstance(a, str) else a
        rows.append([
            [('p', [('text', q)])],
            [('p', a_parts)],
        ])
    return add_block(doc, "faq", rows, col_widths=list(col_widths))


def add_breadcrumbs(doc, *, crumbs, col_widths=(6.6,)):
    """crumbs: list of (text, url_or_None). Last crumb (current page) has url=None."""
    content = []
    for text, url in crumbs:
        if url:
            content.append(('p', [('link', text, url)]))
        else:
            content.append(('p', [('text', text)]))
    return add_block(doc, "breadcrumbs", [[content]], col_widths=list(col_widths))


def add_metadata(doc, pairs, col_widths=(3.3, 3.3)):
    """pairs: dict or list of (key, value). URL values become self-referential hyperlinks."""
    items = pairs.items() if isinstance(pairs, dict) else pairs
    rows = []
    for k, v in items:
        if isinstance(v, str) and (v.startswith('http://') or v.startswith('https://')):
            val_parts = [('link', v, v)]
        else:
            val_parts = [('text', str(v))]
        rows.append([
            [('p', [('text', k)])],
            [('p', val_parts)],
        ])
    return add_block(doc, "metadata", rows, col_widths=list(col_widths))
```

---

## Part 8 — Self-contained `build.py` template

Use this skeleton when generating a feature build script.

```python
"""Build .claude/authoring/<feature-slug>/page.docx for <feature>.

Target page : /express/feature/...
Reference   : /express/feature/image/resize  (or whichever page this mirrors)
Deltas from charter:
  - <note any block-reuse overrides or charter amendments here>

Self-contained: all Milo helper functions are inlined below — no repo-internal
imports required. Structural conventions live in the helpers; this script only
declares WHAT the page says, not HOW each block is shaped.

Run : python3 .claude/authoring/<feature-slug>/build.py
Deps: pip install python-docx requests
Helper conventions live in .claude/tools/build_milo_doc.md — if DA rejects
the docx, fix the inlined helpers here AND update build_milo_doc.md so future
features inherit the fix.
"""
import io, os
import requests
from docx import Document
from docx.shared import Pt, Cm, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

OUT_PATH = os.path.join(os.path.dirname(__file__), "page.docx")

# ---- Milo helpers (inlined from .claude/tools/build_milo_doc.md) --------
# [paste low-level core + selected high-level helpers here]


# ---- Assets (URLs) and copy (strings) -----------------------------------
# Keep each concern in one place so content-ops can eyeball a diff.
H1      = "<headline>"
SUBHEAD = "<subhead paragraph>"
UPLOAD_ANIMATION_URL = "<https://main--da-express-milo--adobecom.aem.live/media_....mp4>"
# ... more constants ...


def build():
    doc = Document()
    for s in doc.sections:
        s.left_margin = s.right_margin = Cm(1.5)
        s.top_margin = s.bottom_margin = Cm(1.5)

    # --- Hero triplet (fallback → desktop → mobile) ----------------------
    add_columns_fullsize_hero(doc, headline=H1, subhead=SUBHEAD, ...)
    add_showwith(doc, "fqa-non-qualified")
    add_section_break(doc)

    add_frictionless_quick_action(doc, headline=H1, subhead=SUBHEAD,
                                  quick_action_id="<qa-id>", ...)
    add_showwith(doc, "fqa-qualified-desktop")
    add_section_break(doc)

    add_frictionless_quick_action_mobile(doc, headline=H1, subhead=SUBHEAD,
                                         quick_action_id="<qa-id>", ...)
    add_showwith(doc, "fqa-qualified-mobile")
    add_section_break(doc)

    # --- Body ------------------------------------------------------------
    add_how_to_steps(doc, heading="<H2>", steps=[...])
    add_section_break(doc)

    add_content_column(doc, image_side='left', image_url=..., heading=..., body=...)
    add_section_break(doc)

    add_link_list(doc, heading="Discover even more.", links=[("Label", "url"), ...])
    add_section_break(doc)

    add_banner(doc, heading="<promo heading>")
    add_section_break(doc)

    add_faq(doc, heading="Frequently asked questions.", qa_pairs=[(q, a), ...])
    add_section_break(doc)

    add_breadcrumbs(doc, crumbs=[("Home", url), ("Feature", url), ("<leaf>", None)])
    add_section_break(doc)

    # --- Metadata (always last, no section break after) ------------------
    add_metadata(doc, {
        # Category A — SEO
        "Title": "...",
        "Description": "...",
        "Short Title": "...",
        # Category B — Frictionless (if applicable)
        "frictionless-safari": "on",
        # Category C — Floating CTA (author as a complete group or not at all)
        "show-floating-cta": "on",
        "desktop-floating-cta": "floating-button",
        "mobile-floating-cta": "mobile-fork-button-frictionless",
        "main-cta-link": "https://...",
        "main-cta-text": "Try for free",
        # Category D — Logo injection (if applicable)
        "marquee-inject-logo": "on",
    })

    doc.save(OUT_PATH)
    print(f"Wrote {OUT_PATH} ({os.path.getsize(OUT_PATH)} bytes)")


if __name__ == "__main__":
    build()
```
