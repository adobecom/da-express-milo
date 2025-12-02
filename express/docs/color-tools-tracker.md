# Color Tools Rebuild Tracker

**Status**: In Progress
**Owners**: Color Web Team, da-express-milo Team
**Last Updated**: Nov 25, 2025

## Overview
This living document tracks the migration of Adobe Color tools (Wheel, Extract, Accessibility) from the legacy `colorweb` stack to `da-express-milo`. We are rebuilding these as reusable, build-free native ESM web components composed into Franklin blocks.

## Quick Links
- [Architecture & Gap Report](./color-tools-gap-report.md)
- [Authoring Guide](./color-tools-authoring.md)
- [QA Checklist](./color-tools-qa.md)
- [Legacy Audit](./color-tools-legacy-audit.md)

## Workstreams

### 1. Foundation & State
- [ ] **Controller Upgrade**: Add metadata, analytics hooks, persistence to `ColorThemeController.js`.
- [ ] **Analytics Bridge**: Wire `express:color-tools-action` events to Adobe Analytics via `scripts.js` or dedicated instrumentation.

### 2. Component Library (`libs/color-components`)
- [ ] **Color Wheel**: Add draggable markers, spokes, base color indicator.
- [ ] **Swatch Rail**: Create `color-swatch-rail` with reorder, add/remove, lock, and quick actions.
- [ ] **Harmony Toolbar**: Create icons/dropdown for rule selection.
- [ ] **Image Extractor**: Port `CreateFromImage` logic (drop zone, zoom, worker-based extraction).
- [ ] **Base Color Tools**: Sliders/inputs for precise color tuning.

### 3. Block & Authoring (`blocks/color-tools`)
- [ ] **Marquee Layout**: Implement Figma-aligned hero (tabs, action bar, right-rail palette).
- [ ] **Tabs & Routing**: Deep-link support (`?color-tools-tab=image`) and history management.
- [ ] **Metadata Parsing**: Update block to read hero copy, media, and config from section metadata.

### 4. Future Variants
- [ ] `image-marquee`
- [ ] `accessibility-marquee`
- [ ] `lite` (inline tools)

## Change Log

| Date | Description |
| --- | --- |
| 2025-11-25 | Created tracker. Initial plan approved. |

