# Shared component + block import (quick guidance)

Use this pattern to add a **shared component** in color-shared and use it from a block (e.g. **color-wheel**). Example: **Action Menu** (tool switcher).

---

## Idea: Color Wheel, Color Blindness, Contrast Checker — same shell?

These three “tool” pages are **very similar**: same kind of layout (header with tool switcher, main content, optional sidebar, floating toolbar), same a11y/focus patterns, same URL/state concerns. One **idea** is to use **one shared shell** instead of three separate implementations:

- **Shared:** Action Menu (tabs: Palette / Color Wheel, Contrast Checker, Color blindness simulator), layout wrapper, floating toolbar, focus/keyboard behavior.
- **Per page:** Only the **main content** would differ (wheel + strips vs contrast form vs color-blindness simulator). Each block could call the same renderer with a `tool` or `panel` option, or pass a content factory so the shell stays in color-shared and the block supplies the inner panel.

That would let one renderer (or one shell component) power all three blocks; the block would only choose which tool/panel to show and wire data.

**Consolidation:** Splitting shared components and renderers into separate files can create long import/call chains. It may be worth **consolidating** (e.g. keeping renderer logic as functions inside the block file, or fewer larger modules) if that proves better for performance. The “renderer as a separate module” pattern is a structural choice, not required—inline renderer functions in the block are fine if they help.

---

## 1. Create the component in color-shared

**Location:** `express/code/scripts/color-shared/components/<name>.js`  
Example: `createActionMenuComponent.js`

**Pattern:**

- Export a **factory function** that accepts options and returns an object with at least `element` (the DOM node). Optionally add `destroy()`, getters, or other API.
- Build DOM with `createTag` from `../../../scripts/utils.js` or plain `document.createElement`.
- Keep styling in color-shared (e.g. a corresponding `.css` in the same folder or in a shared stylesheet the block already loads).

```javascript
// express/code/scripts/color-shared/components/createActionMenuComponent.js
import { createTag } from '../../../scripts/utils.js';

export function createActionMenuComponent(options = {}) {
  const { tabs = [], activeId, onTabChange, onUndo, onRedo } = options;

  const container = createTag('div', { class: 'action-menu' });
  const tablist = createTag('div', { role: 'tablist', class: 'action-menu-tablist' });

  tabs.forEach((tab) => {
    const tabEl = createTag('button', { role: 'tab', 'data-id': tab.id });
    tabEl.textContent = tab.label;
    if (tab.id === activeId) tabEl.setAttribute('aria-selected', 'true');
    tabEl.addEventListener('click', () => onTabChange?.(tab.id));
    tablist.appendChild(tabEl);
  });

  container.appendChild(tablist);
  // ... undo/redo buttons, etc.

  return {
    element: container,
    setActiveTab(id) { /* update aria-selected, etc. */ },
    destroy() { container.remove(); },
  };
}
```

---

## 2. (Optional) Add CSS in color-shared

- Add `action-menu.css` for the component’s styles.
- Use Figma tokens where possible (e.g. from `color-tokens.css` or shared tokens).

**How does CSS get loaded in the consumer?**  
Shared component CSS is not auto-loaded by Franklin (only block JS + block CSS are). The consumer loads it in one of two ways:

1. **Block CSS `@import` (Franklin/Milo recommended for block-owned UI)** — Franklin auto-loads `blocks/block-name/block-name.css` when the block is on the page. That file can `@import` the shared component CSS so everything stays in the normal block-CSS flow. Use this when one block is the consumer (e.g. color-wheel uses Action Menu).
2. **JS `loadStyle()` at use time** — Call `loadStyle(pathToCss)` from `getLibs()/utils/utils.js` when the component is first used. Use this when the component isn’t tied to a single block (e.g. shared modal opened from multiple places). The modal uses this in `createModalManager.js`.

---

## 3. Import and use in the block (e.g. color-wheel)

**Option A — Block uses the component directly**

```javascript
// express/code/blocks/color-wheel/color-wheel.js
import { createActionMenuComponent } from '../../scripts/color-shared/components/createActionMenuComponent.js';

export default async function decorate(block) {
  block.innerHTML = '';
  block.className = 'color-wheel';

  const actionMenu = createActionMenuComponent({
    tabs: [
      { id: 'palette', label: 'Palette' },
      { id: 'contrast', label: 'Contrast Checker' },
      { id: 'color-blindness', label: 'Color blindness simulator' },
    ],
    activeId: 'palette',
    onTabChange: (id) => { /* switch panel content */ },
  });

  block.appendChild(actionMenu.element);
}
```

**Option B — Block uses a renderer that imports the component**

The **renderer** (in color-shared or in the block) imports the shared component, builds the page layout, and mounts the component. The block only creates the renderer and calls `renderer.render(block)`.

*Note: Color Wheel does not have a renderer yet; it currently shows a placeholder. The example below is the pattern to follow when you add one.*

*Renderer (color-shared) — to be created:*

```javascript
// express/code/scripts/color-shared/renderers/createColorWheelRenderer.js
import { createActionMenuComponent } from '../components/createActionMenuComponent.js';

export function createColorWheelRenderer(options = {}) {
  const { container } = options;
  let actionMenuInstance;

  function render(block) {
    block.innerHTML = '';
    block.className = 'color-wheel';

    const wrapper = document.createElement('div');
    wrapper.className = 'color-wheel-wrapper';

    const header = document.createElement('header');
    header.className = 'color-wheel-header';

    actionMenuInstance = createActionMenuComponent({
      tabs: [
        { id: 'palette', label: 'Palette' },
        { id: 'contrast', label: 'Contrast Checker' },
        { id: 'color-blindness', label: 'Color blindness simulator' },
      ],
      activeId: 'palette',
      onTabChange: (id) => { /* switch panel content; update activeId */ },
    });
    header.appendChild(actionMenuInstance.element);

    const main = document.createElement('main');
    main.className = 'color-wheel-main';
    main.setAttribute('role', 'tabpanel');
    // ... add wheel, strips, etc.

    wrapper.append(header, main);
    block.append(wrapper);
  }

  function destroy() {
    actionMenuInstance?.destroy();
  }

  return { render, destroy };
}
```

*Block (color-wheel) — once the renderer exists:*

```javascript
// express/code/blocks/color-wheel/color-wheel.js
import { createColorWheelRenderer } from '../../scripts/color-shared/renderers/createColorWheelRenderer.js';

export default async function decorate(block) {
  const renderer = createColorWheelRenderer();
  renderer.render(block);
}
```

---

## 4. Reference: existing shared component

**Filters (used by color-explore gradients):**

| What | Where |
|------|--------|
| Component | `color-shared/components/createFiltersComponent.js` |
| Consumer | `color-explore` → `renderers/createGradientsRenderer.js` |
| Import in consumer | `import { createFiltersComponent } from '../../../scripts/color-shared/components/createFiltersComponent.js';` |
| Usage | `const filters = createFiltersComponent({ variant: 'gradients', onFilterChange }); container.appendChild(filters.element);` |

Same pattern for **Action Menu** in **color-wheel**: implement `createActionMenuComponent.js` in color-shared, then in color-wheel (or its renderer) import it and mount `actionMenu.element`.
