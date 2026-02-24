# MWPW-187682: Ticket vs. code comparison

**Ticket:** [COLOR] [SHARED] Palette Strips – all variants (components only)  
**Status (Jira):** Ready for Sprint  
**Branch:** MWPW-187682

---

## Ticket scope (from description)

- **Scope:** Shared UI *components only*. Strip and palette web components (10 variants). No adapters, no renderers, no page orchestration.
- **Variants (10):**
  1. Desktop horizontal
  2. Desktop vertical
  3. Tablet L/S horizontal
  4. Mobile horizontal
  5. Compact (48px)
  6. With labels (hex/name)
  7. With color blindness label
  8. Summary + strip (card) — Figma 6407:340035
  9. Normal / Hover / Active states

- **References:** Figma CCEX-221263 (color-strip page, strip spec, container spec, Strip Summary card).

Ticket has **no explicit Acceptance Criteria** in the description; subtasks define the work.

---

## Subtasks (from Jira)

| Key | Summary | Status |
|-----|---------|--------|
| MWPW-187683 | Strip: horizontal + breakpoints (desktop, tablet L/S, mobile) | To Do |
| MWPW-187684 | Strip: with color blindness label | To Do |
| MWPW-187685 | Strip: compact (48px height) | To Do |
| MWPW-187686 | Strip: vertical variant | To Do |
| MWPW-187687 | Strip: with labels (hex/name) | To Do |
| MWPW-187688 | Spec parity: corner-radius (Start/Middle/End), gapSize, sizing | To Do |
| MWPW-187689 | Strip: states (Normal / Hover / Active) | To Do |
| MWPW-187690 | Summary strip component (card: title, count, strip, actions) | To Do |

---

## What’s in code

**Location:** `express/code/scripts/color-shared/palettes/`

| Item | Implementation |
|------|----------------|
| **createPaletteStrip()** | `palettes.js` — single variant `PALETTE_STRIP_VARIANTS.EXPLORE`. Wraps Lit `createPaletteAdapter` in a `.color-shared-palette-strip` wrapper. Returns `{ element, update, destroy }`. |
| **Explore variant** | Horizontal strip only; used by createStripsRenderer as the strip inside the card. No vertical, compact, or label variants. |
| **CSS** | `palettes.css` — `.color-shared-palette-strip`: height 80px, border-radius 8px, 0.5px border. Comment notes Figma spec 64px / 2px radius (not aligned). |
| **Card (summary + strip)** | Built in **createStripsRenderer** (renderer layer): card = visual (strip) + color-card-info (name + Edit/Share actions). No “count” in card. Ticket says “components only” and subtask 187690 is “Summary strip component (card: title, count, strip, actions)” — so the card may need to live in shared components to match scope. |

**Renderer:** `createStripsRenderer.js` uses `createPaletteStrip(..., PALETTE_STRIP_VARIANTS.EXPLORE)` and composes the card (strip + name + actions). Filters are still placeholder (“Filters (TODO)”).

---

## Gap: ticket vs. code

| Ticket / subtask | Code | Gap |
|------------------|------|-----|
| **10 variants (components only)** | 1 variant (explore) | Missing: vertical, tablet/mobile breakpoints, compact 48px, labels (hex/name), color blindness label, explicit Normal/Hover/Active, and possibly summary card as a shared component. |
| **MWPW-187683** Horizontal + breakpoints | Strip is horizontal only; no responsive strip variants or breakpoint-specific styling in palettes.css. | Add horizontal strip behavior at desktop/tablet L/S/mobile (or document that breakpoints are handled by layout, not strip component). |
| **MWPW-187684** Color blindness label | Not implemented. | New variant or option for color blindness label. |
| **MWPW-187685** Compact 48px | Strip is 80px. | Add compact variant (48px height). |
| **MWPW-187686** Vertical variant | Not implemented. | Add vertical strip variant. |
| **MWPW-187687** Labels (hex/name) | Not implemented. | Add variant/option for labels (hex and/or name). |
| **MWPW-187688** Spec parity (corner-radius, gapSize, sizing) | CSS uses 8px radius, 80px height. Figma spec (per comment) 64px, 2px radius; corner-radius Start/Middle/End not implemented. | Align with Figma: height, border-radius (including Start/Middle/End), gapSize, sizing. |
| **MWPW-187689** States (Normal / Hover / Active) | No explicit state styling in palettes.css. | Add styles (and possibly attributes) for normal, hover, active. |
| **MWPW-187690** Summary strip component (card: title, count, strip, actions) | Card is built in createStripsRenderer; has title (name), strip, actions (Edit/Share). No “count”. | Either move “summary card” into shared palettes as a component (with title, count, strip, actions) or confirm card stays in renderer and 187690 is satisfied by current card + createPaletteStrip. Add count if required. |

---

## Summary

- **Done:** One shared component, “Explore” variant: horizontal palette strip (via Lit adapter) in a wrapper; used inside a card built in createStripsRenderer (title + strip + Edit/Share actions). No other variants or spec parity yet.
- **Not done:** All 8 subtasks are still To Do. Pending: horizontal + breakpoints, vertical, compact 48px, labels, color blindness label, spec parity (corner-radius, gapSize, sizing), Normal/Hover/Active states, and clarifying whether the summary card (title, count, strip, actions) is a shared component (MWPW-187690) or remains in the renderer.

Use this to prioritize next work (e.g. spec parity 187688 + horizontal/breakpoints 187683, then compact 187685, then summary card 187690 and the rest).
