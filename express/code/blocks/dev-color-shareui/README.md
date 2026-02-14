# dev-color-shareui

**Single Phase 1 test surface for Color Shared UI (ShareUI).** One block, one page: all devs work here during Phase 1. No strips or data fetch—minimal pretend DOM that simulates the **modal shell contract** only.

## What it does

- **Click an icon → modal opens.** Type (palette/gradient) doesn’t matter for now.
- Tests what a shell modal is for: open on click, focus trap, close (Escape, close button, backdrop).
- Uses `createModalManager` and stub content only. No color-explore, no strips.

## Usage

Add a section with block class **dev-color-shareui** on a test page. You get a short line of copy and a row of icon-style buttons (`.dev-color-shareui-cards`); each click opens the same modal with stub content. Over time you can add more sections for other share components—one long page, single point of testing.

## Tests

**Modal shell:** Automated tests live in `test/scripts/color-shared/modal/createModalManager.test.js`. They use in-file dummy HTML only (no dev block dependency). Run: `npm test` or `npx wtr "test/scripts/color-shared/modal/createModalManager.test.js" --node-resolve --port=2001`.

**Manual:** On a page with the block, click **Stub (tall content)** and confirm the modal body scrolls and does not overflow the viewport (content area has max-height, scrollbar when needed).

## After Phase 1

When shared UI is stable, integrate the same flow from color-shared into the prod blocks as needed; this block can remain as a living demo or be retired.
