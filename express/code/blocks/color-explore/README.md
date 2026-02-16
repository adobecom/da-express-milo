# color-explore block

**Purpose:** Display shared strip/summary components only. No wrappers, no wiring focus.

- Palette strips use the **`<color-palette>` Web Component** (single implementation). Future variants (e.g. summary card) may use `createColorStrip` / `createSummaryStripCard` from `color-shared/dev/MWPW-187682/` (not loaded in this PR).
- When variant is **strips** or **palettes**, the block shows each variant group (Horizontal, Vertical, Compact, With labels, Color blindness label, Spec parity, States, Summary card) with **direct rendering** — no card containers, no result-list chrome (search/filters) in variant slots.
- Shared component **contract and API** are defined in `color-shared/components/strips/SHARED_COMPONENT_CONTRACT.md`; this block does not define them.
