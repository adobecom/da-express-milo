# Modal features — industry comparison

How our color-shared modal compares to W3C ARIA patterns, common implementations, and native `<dialog>`. Sources: [W3C APG Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), MDN, Stanford UIT, and responsive drawer/modal patterns.

---

## 1. W3C ARIA / APG requirements

| Requirement | APG / W3C | Our implementation | Status |
|-------------|-----------|--------------------|--------|
| **Role & semantics** | `role="dialog"`; label via `aria-labelledby` or `aria-label` | Overlay has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="ax-color-modal-title"` | ✅ |
| **Focus trap** | Tab / Shift+Tab must not leave dialog; wrap at first/last focusable | `handleKeyboard`: Tab wraps to last→first, Shift+Tab first→last | ✅ |
| **Escape closes** | Escape must close the dialog | `handleKeyboard`: `e.key === 'Escape'` → `close()` | ✅ |
| **Initial focus** | Focus moves into dialog on open; first focusable or static element (e.g. title with tabindex="-1") for long content | We focus first focusable (`firstFocusable?.focus()`) | ✅ (optional: focus title for very long content per APG) |
| **Focus return on close** | Focus returns to element that invoked the dialog | We do **not** restore focus to trigger on close | ⚠️ Gap |
| **Inert background** | Content outside dialog not interactable; `aria-modal="true"` or `<dialog>` | `aria-modal="true"`; curtain blocks pointer; no `inert` on body | ✅ (consider `inert` on main for stricter AT) |
| **Close control** | Dedicated close button as descendant of dialog | Close button inside overlay with `aria-label="Close modal"` | ✅ |

---

## 2. Keyboard interaction

| Key | APG / common | Ours | Status |
|-----|--------------|------|--------|
| **Tab** | Next focusable; wrap to first at end | Same; wrap at last focusable | ✅ |
| **Shift+Tab** | Previous focusable; wrap to last at start | Same | ✅ |
| **Escape** | Close dialog | Close | ✅ |
| **Enter/Space on close** | — | Close button is focusable and activates on click | ✅ |

---

## 3. Responsive pattern (modal vs drawer)

| Pattern | Common practice | Ours | Status |
|---------|------------------|------|--------|
| **Desktop** | Centered modal, fixed or max dimensions, backdrop | 898×604 centered modal @ 1024px, backdrop | ✅ |
| **Tablet** | Often drawer or narrow modal; 536px drawer is common | 536px drawer @ 768px, min-height, centered | ✅ |
| **Mobile** | Bottom sheet, slide up, drag handle, max-height (e.g. 90vh) | Bottom sheet, handle, max-height 90vh, radius top only | ✅ |
| **Breakpoint** | Single breakpoint (e.g. 1024px) to switch modal ↔ drawer | 1024px; `getTypeForViewport(width)`; resize switches in place | ✅ |
| **Resize behavior** | No reopen; same DOM with class/layout swap | `switchMode(newType)`; same DOM, class swap; no reopen | ✅ |

---

## 4. Gestures & dismissal

| Feature | Common | Ours | Status |
|---------|--------|------|--------|
| **Backdrop click** | Tap outside closes (often with option to disable) | Curtain click → close; drawer: 500ms delay to avoid accidental close on open | ✅ |
| **Swipe down (drawer)** | Swipe down to close when content at top | Touch: `scrollTop <= 2` and `deltaY > 60` → close | ✅ |
| **Handle** | Visual handle on bottom sheet for affordance | Handle element in drawer shell | ✅ |

---

## 5. Screen reader & announcements

| Feature | Common | Ours | Status |
|---------|--------|------|--------|
| **Live region** | Optional; announce open/close for context | `announceToScreenReader()` with `aria-live="polite"`, `aria-atomic="true"`, role="status" | ✅ |
| **Label** | Dialog has visible label referenced by `aria-labelledby` | Title has id `ax-color-modal-title`; overlay `aria-labelledby="ax-color-modal-title"` | ✅ |

---

## 6. Native `<dialog>` vs our approach

| Aspect | Native `<dialog>` | Our implementation (div + ARIA) |
|--------|-------------------|----------------------------------|
| **Element** | `<dialog>` with `.showModal()` / `.close()` | `<div role="dialog">` with manual DOM add/remove |
| **Focus** | Browser traps focus and restores to trigger | We trap focus manually; **no focus restore** on close |
| **Escape** | Built-in | Manual keydown handler |
| **Backdrop** | `::backdrop` pseudo-element | Curtain div with class |
| **Inert** | Automatic when modal | We use `aria-modal="true"`; no `inert` on document |
| **Why custom** | Legacy support, full control over layout (drawer/modal swap), no dependency on dialog polyfill | Same; allows single component to be modal or drawer by viewport |

**Summary:** We match ARIA semantics and behavior except **focus return on close**. Using `<dialog>` would give built-in focus restore and inert; our div approach is valid and matches common custom implementations.

---

## 7. Recommended improvement (focus return)

- **APG:** “When a dialog closes, focus returns to the element that invoked the dialog.”
- **Implementation:** Before opening, store `document.activeElement` (or the trigger passed in). In `close()`, before removing the modal, call `savedFocus?.focus()` (e.g. in the same setTimeout that removes the DOM, or just before).
- **Scope:** Low effort; improves keyboard and screen-reader flow.

---

## 8. Checklist summary

| Area | Match | Gap |
|------|--------|-----|
| ARIA role, aria-modal, aria-labelledby | ✅ | — |
| Focus trap (Tab / Shift+Tab) | ✅ | — |
| Escape to close | ✅ | — |
| Initial focus in dialog | ✅ | — |
| **Focus return on close** | — | ⚠️ Not implemented |
| Backdrop click (with drawer delay) | ✅ | — |
| Swipe down to close (drawer) | ✅ | — |
| Responsive modal ↔ drawer at 1024px | ✅ | — |
| Screen reader announcements | ✅ | — |
| Cleanup (listeners, DOM) | ✅ | — |
