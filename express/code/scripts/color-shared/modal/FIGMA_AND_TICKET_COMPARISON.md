# Modal shell — Figma + ticket comparison

Comparison of current code vs Figma spec and MWPW-185800 (and subtasks). Use for sign-off and regression checks.

---

## 1. Acceptance criteria (parent ticket MWPW-185800)

| Requirement | Figma / spec | Our code | Status |
|-------------|--------------|----------|--------|
| **Desktop:** Modal 898×604, 32px padding, 12px gap, 16px radius; content scrolls | Figma 5639-128522: 898×604, 32px padding, 12px gap, 16px radius | `.ax-color-modal-container` @ 1024px: 898×604, `--Spacing-Spacing-500` 32px, `--Spacing-Spacing-200` 12px, `--Corner-radius-corner-radius-200` 16px; content `overflow-y: auto` | ✅ |
| **Tablet:** Drawer 536px, 24px padding, min-height min(600px, 90vh), radius 20px; centered | Figma 8039-662847: 536×568, 24px padding, 12px gap, 20px radius | @ 768px: 536px width, 24px padding on content, min-height **min(604px, 90vh)** (604 to match desktop, avoid resize jump), radius 20px, centered | ✅ (min 604 vs 600: deliberate) |
| **Mobile:** Drawer max-width 600px, max-height 90vh, radius 20px top only; bottom sheet, handle | Figma 5525-290006: 375×764 frame, padding 8 16 16 16, maxWidth 600, radius 20px top | max-width 600px, max-height 90vh, radius 20px 20px 0 0, bottom sheet, handle visible; min-height min(304px, 50vh) (not from Figma — avoids flash) | ✅ |
| **Breakpoint:** 1024px switches modal ↔ drawer; resize in place (no reopen) | — | `BREAKPOINT_DESKTOP = 1024`; `getTypeForViewport(width)`; `switchMode(newType)` on resize/orientation (debounce 150ms); same DOM, class swap | ✅ |
| **Focus:** Trap (Tab), Escape closes, focus restored; role=dialog, aria-modal, aria-labelledby | — | `handleKeyboard` Tab trap + Escape; focus first focusable after open; overlay `role="dialog"` `aria-modal="true"` `aria-labelledby="ax-color-modal-title"` | ✅ |
| **Close:** Close button, backdrop click (drawer 500ms delay), swipe down when content at top | — | Close button; curtain click → close (drawer: `drawerOpenedAt` 500ms delay); touch: `scrollTop <= 2` and deltaY > 60 → close | ✅ |
| **Cleanup:** Listeners and DOM removed on close/destroy; no leaks | — | `close()`: remove resize, keydown, DOM after 300ms; `destroy()`: same + no onClose | ✅ |

---

## 2. Figma dimensions vs implementation

| Breakpoint | Figma node | Figma (width × height, padding, gap, radius) | Implementation | Match |
|------------|------------|---------------------------------------------|-----------------|--------|
| Desktop | 5639-128522 | 898×604, 32px pad, 12px gap, 16px radius | 1024px: 898×604, 32px, 12px gap, 16px radius | ✅ |
| Tablet | 8039-662847 | 536×568 (instance), 24px, 12px gap, 20px radius | 768px: 536px, 24px content padding, 12px gap, 20px radius; min(604px, 90vh), max 90vh | ✅ |
| Mobile | 5525-290006 | 375×764 frame, 8 16 16 16 pad, 12px gap, 20px top radius, maxWidth 600 | max-width 600, max-height 90vh, 20px top radius, 8/12/16 spacing in shell | ✅ |

---

## 3. Figma tokens (5639-126802) vs modal-styles.css

| Token | Spec value / use | In code | Match |
|-------|------------------|---------|--------|
| Spacing/Spacing-500 | 32 — container padding | `--Spacing-Spacing-500: 32px` | ✅ |
| Spacing/Spacing-200 | 12 — gap | `--Spacing-Spacing-200: 12px` | ✅ |
| Spacing/Spacing-100 | 8 — header/close | `--Spacing-Spacing-100: 8px` | ✅ |
| Corner-radius 200 | 16 — modal | `--Corner-radius-corner-radius-200: 16px` | ✅ |
| Corner-radius 500 | 100 — close button | `--Corner-radius-corner-radius-500: 100px` | ✅ |
| Alias/background/app-frame/elevated | #ffffff | `--Alias-background-app-frame-elevated: #ffffff` | ✅ |
| Elevation/Dialog | 0 4px 16px | `--Elevation-Dialog: 0 4px 16px rgba(0,0,0,0.16)` | ✅ |
| Palette/gray/100, 200 | #E9E9E9, #e1e1e1 | `--Palette-gray-100`, `-200` | ✅ |
| Icon/primary/gray/default | #292929 | `--Icon-primary-gray-default: #292929` | ✅ |

Additional vars in code (aliases, typography) are documented in README as “not from Figma” for dedupe later.

---

## 4. Jira subtasks vs implementation

| Key | Summary | Requirement | Implementation | Status |
|-----|---------|-------------|-----------------|--------|
| MWPW-186960 | Modal container (desktop) | Structure, overlay, 898×604, close, animations | Overlay + `.ax-color-modal-container` 898×604, close button, .hidden transition | ✅ |
| MWPW-186961 | Drawer container (mobile/tablet) | Bottom sheet, tablet 536×600, slide up/down | Drawer base + 768px tablet 536px; transform translateY for slide; handle at mobile | ✅ |
| MWPW-186962 | Responsive (modal ↔ drawer) | 1024px breakpoint, switch on resize/orientation, smooth | `switchMode()`, resize + orientationchange debounced 150ms; no-transition class during swap; min-height pinned when resizing down | ✅ |
| MWPW-186963 | State management | Open/close, no nested state; switch reuses content | Single `currentModal`, `isOpen`, `modalType`; switchMode rewrites classes in place | ✅ |
| MWPW-186966 | Accessibility & tooltips | ARIA (role, aria-modal, aria-labelledby), Escape, Tab trap, focus restore, screen reader announcer; tooltips content-level | role=dialog, aria-modal, aria-labelledby; handleKeyboard Tab + Escape; focus first focusable; inlined `announceToScreenReader()` (no separate file) | ✅ |
| MWPW-186968 | Mobile gestures | Backdrop tap with delay; swipe down when content at top | Backdrop 500ms delay; touch: scrollTop ≤ 2 and deltaY > 60 → close | ✅ |

---

## 5. Spec vs code — gaps and notes

| Item | Spec / Figma | Code | Note |
|------|--------------|------|------|
| Tablet min-height | min(600px, 90vh) in AC | min(604px, 90vh) | Intentional: match desktop 604 to avoid resize jump; AC can be updated. |
| Mobile min-height | Not in Figma | min(304px, 50vh) | Added for stability (no flash); not from Figma. |
| screenReaderAnnouncer | Spec listed separate file | Inlined in createModalManager.js | Announcer logic in same file; no separate module. |
| createModalStubContent | Spec in modal folder | In dev block only (dev-color-shareui-stub-content.js) | Stub for shell testing lives in dev block; not in prod modal path. |
| Desktop short viewport | — | @ 1024px and max-height 768px: height auto, max-height 85vh | Matches “desktop limited height” in spec. |
| Reduced motion | — | prefers-reduced-motion: reduce → transition none | WCAG 2.3.3. |

---

## 6. Files (current)

| Spec doc | Actual | Note |
|----------|--------|------|
| createModalManager.js | ✅ | Manager, open/close/destroy, resize, gestures, inlined announcer |
| modal-styles.css | ✅ | Shell only, ax-color-*, breakpoints, reduced motion, no-transition |
| screenReaderAnnouncer.js | ❌ removed | Replaced by inlined announcer in createModalManager.js |
| createModalStubContent.js | ❌ not in modal | In dev block (dev-color-shareui); not imported by modal |
| logModalDimensions.js | ✅ | Present; not called from createModalManager (prod). Optional dev use. |

---

**Last comparison:** Run lint + tests and update PROD_READINESS.md when signing off.
