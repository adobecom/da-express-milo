# Color Tools QA Checklist & Demo Notes

## 1. Manual QA Checklist

### Wheel Tab
- Verify the harmony dropdown updates the `<color-palette>` colors and wheel marker.
- Drag the wheel marker; ensure palette updates and `express:color-selected` is dispatched (observe via DevTools -> Event Listeners).
- Switch harmony rules and confirm URL remains stable.

### Image Tab
- Drop JPG/PNG or click to upload. Preview should render and palette pills should appear.
- Clicking a swatch copies the hex value (use DevTools `navigator.clipboard.readText()` to confirm).
- After extraction, switch to the Wheel tab and confirm the same palette is displayed.

### Base Tab (placeholder)
- Ensure placeholder text renders; verify future metadata (hero/body/CTA) still shows.

### Tabs & Routing
- Change tabs and confirm `?color-tools-tab=` updates.
- Reload the page with `?color-tools-tab=image` and confirm the Image tab is active.
- Observe `express:color-tools-tab-change` events (DevTools `window.addEventListener`).

### Accessibility / Responsiveness
- Resize to <900px width. Hero should stack with stage, dropzone remains usable.
- Tab buttons must be keyboard focusable (`Tab` -> `Enter` selects).
- Verify high-contrast backgrounds around new panels.

## 2. Demo Page

- Draft page: `drafts/color-tools-demo.md` (see file for authoring example).
- Publish via the preview/live buttons after running `npm run hlx@up`.
- Use the page to validate author metadata (eyebrow, CTA labels, default tab).

## 3. Follow-ups / Known Gaps

- Analytics pipeline: `express:color-tools-tab-change` needs to be wired into Adobe Analytics.
- Image extractor currently uses a simple pixel sampler; connect to the real ThreadPool/Autotag services for parity.
- SavePanel / CC Libraries actions are not yet enabled in the marquee layout.
- Additional variants (`image-marquee`, `author-tools-wide`) still need templates once requirements are finalized.

