# FAQ V2 Block - Function Documentation

## Functions

### `toggleContentLinksDisabledState(contentEl, disabled)`
Toggles the disabled state of links within content element for accessibility.

**Parameters:**
- `contentEl` (HTMLElement) - Content element containing links
- `disabled` (boolean) - Whether to disable links

---

### `buildTableLayout(block)`
Builds the expandable table layout for FAQ accordions with longform variant support.

**Parameters:**
- `block` (HTMLElement) - The FAQ block element

---

### `buildOriginalLayout(block)`
Builds the original FAQ layout with view more/less toggle functionality.

**Parameters:**
- `block` (HTMLElement) - The FAQ block element

---

### `decorate(block)`
Main decorator function for faqv2 blocks. Handles both expandable and original layouts, and injects FAQPage JSON-LD schema.

**Parameters:**
- `block` (HTMLElement) - The FAQ block element to decorate
