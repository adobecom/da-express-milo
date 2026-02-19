# Banner Background Block - Function Documentation

## Functions

### `detectBackgroundVariant(block)`
Detects background variant class on the block.

**Parameters:**
- `block` (HTMLElement) - The banner block element

**Returns:**
- `string|null` - Background variant class name or null

---

### `preloadBackgroundImage(imagePath)`
Preloads background image for performance.

**Parameters:**
- `imagePath` (string) - Path to the background image

---

### `createBackgroundContainer(block)`
Creates background container and restructures DOM.

**Parameters:**
- `block` (HTMLElement) - The banner-bg block element

---

### `injectLogo(block, section)`
Injects Adobe Express logo if configured.

**Parameters:**
- `block` (HTMLElement) - The banner block element
- `section` (HTMLElement) - The parent section element

---

### `styleButtons(block, variantClass)`
Applies comprehensive button styling efficiently.

**Parameters:**
- `block` (HTMLElement) - The banner block element
- `variantClass` (string|null) - Background variant class

---

### `formatPhoneNumbers(block)`
Formats sales phone numbers.

**Parameters:**
- `block` (HTMLElement) - The banner block element

---

### `initializeDependencies(block)`
Phase 1: Initialize dependencies and utilities.

**Parameters:**
- `block` (HTMLElement) - The banner block element

---

### `setupBackground(block)`
Phase 2: Detect and setup background handling.

**Parameters:**
- `block` (HTMLElement) - The banner block element

**Returns:**
- `string|null` - Background variant class name

---

### `handleSectionInheritance(block)`
Phase 3: Handle section inheritance and styling.

**Parameters:**
- `block` (HTMLElement) - The banner block element

**Returns:**
- `HTMLElement` - The parent section element

---

### `enhanceContent(block, section, variantClass)`
Phase 4: Enhance content with logos, buttons, and formatting.

**Parameters:**
- `block` (HTMLElement) - The banner block element
- `section` (HTMLElement) - The parent section element
- `variantClass` (string|null) - Background variant class

---

### `decorate(block)`
Main decorator function for banner-bg blocks.

**Parameters:**
- `block` (HTMLElement) - The banner block element to decorate
