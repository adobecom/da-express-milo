# Color shared modal shell (MWPW-185800)

Reusable modal shell for color UI: curtain, header, content slot, breakpoints. Content is 100% consumer-supplied.

**Dev-only:** Used to demonstrate the Modal gradient. Full spec: `dev/32-tickets/MWPW-185800/FEATURES-SUPPORTED.md`.

---

## API

```js
import { createModalManager } from './createModalManager.js';

const modal = createModalManager();

modal.open({
  content: document.createElement('div'), // required: string | Node | function
  title: 'Modal',
  showTitle: true,
  onClose: () => {},
});

modal.close();
modal.updateTitle('New title');
modal.getBody();
modal.isOpen();
modal.destroy();
```

---

## Content contract

| Type | Behavior |
|------|----------|
| **string** | Rendered as plain text (`textContent`). No HTML. |
| **Node** | Appended to `.ax-color-modal-content`. |
| **function** | Called once; result used as above. |

For HTML, pass a Node. Do not pass unsanitized user/API HTML.

---

## Layout (CSS only)

- **&lt; 768px:** Drawer from bottom, handle visible
- **768px – 1023px:** Centered drawer, 536px
- **≥ 1024px:** Desktop modal, ~898px

---

## Files

| File | Purpose |
|------|---------|
| `createModalManager.js` | Shell logic, focus trap, keyboard, aria |
| `modal-styles.css` | Layout, breakpoints, animations |
| `modal-figma-tokens.css` | Design tokens |
| `modal-gradient-content.css` | Gradient content styles (dev demo) |
