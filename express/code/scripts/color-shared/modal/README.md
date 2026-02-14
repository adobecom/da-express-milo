# Color shared modal (implementation)

Shell and content for the color shared modal. **Docs and spec live in `dev/19-modal-shell/`.**

- **Spec & code review:** [dev/19-modal-shell/CODE_REVIEW_AND_SPEC.md](../../../../../dev/19-modal-shell/CODE_REVIEW_AND_SPEC.md)
- **Figma CSS notes:** [dev/19-modal-shell/figma-5525-252389-css.md](../../../../../dev/19-modal-shell/figma-5525-252389-css.md)
- **Architecture:** [dev/19-modal-shell/MODAL-ARCHITECTURE.md](../../../../../dev/19-modal-shell/MODAL-ARCHITECTURE.md)

This folder: `createModalManager.js`, `modal-styles.css`, palette/gradient modal content, icons. Screen reader announcements (aria-live) are inlined in `createModalManager.js`. Stub content for shell testing lives in the dev block (dev-color-shareui) and is removed with it.

---

### modal-styles.css

Prod-only shell styles (no stub/demo styles; those live in dev-color-shareui.css). All shell classes use **ax-color-** prefix (e.g. `.ax-color-modal-curtain`, `.ax-color-drawer-modal-container`). Body state: `.ax-color-modal-open`.

- **MWPW-185800:** Shell only — curtain, container, dimensions, breakpoints (768 / 1024).
- **MWPW-186962:** Responsive switch modal ↔ drawer at 1024px; transitions for smooth mode change.
- **Breakpoint 1024:** Desktop (standard modal) at viewport **≥1024px**; tablet (drawer) at viewport **&lt;1024px** (1024 is inclusive for desktop, exclusive for tablet). Having both systems is intentional; on resize we swap class names (one system at a time). Transitions are disabled during the swap and on drawer at tablet/desktop to avoid artifacts.
- No palette/gradient/toolbar content styles in this file.
- **Variables (all local — no `styles.css`):**  
  - **From Figma:** PascalCase tokens (e.g. `--Spacing-Spacing-500`, `--Corner-radius-corner-radius-200`) from the modal design spec.  
  - **Not from Figma:** (1) Lowercase aliases for use in rules (e.g. `--spacing-500`). (2) Modal-only typography/colors so the modal does not depend on global `styles.css`; to be compared/deduped with global later. Full variable source and spec: CODE_REVIEW_AND_SPEC.md (see dev/19-modal-shell). Keep long variable/spec notes in this README, not in the CSS file.
