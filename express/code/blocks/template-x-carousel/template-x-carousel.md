# Template X Carousel Block - Function Documentation

## Functions

### `createTemplates(recipe, customProperties = null)`
Creates template elements from a recipe, filtering and rendering valid templates.

**Parameters:**
- `recipe` (string) - Recipe identifier for fetching templates
- `customProperties` (Object|null) - Optional custom properties for template rendering

**Returns:**
- `Promise<Array<HTMLElement>>` - Array of template elements

---

### `createTemplatesContainer(recipe, el, isPanel = false, queryParams = '')`
Creates a templates container configured for search bar functionality. Uses custom URL config for desktop/Android, default links for iOS.

**Parameters:**
- `recipe` (string) - Recipe identifier
- `el` (HTMLElement) - Container element
- `isPanel` (boolean) - Whether this is a panel variant
- `queryParams` (string) - Query parameters to append

**Returns:**
- `Promise<Object>` - Object with templatesContainer, updateTemplates function, and control element

---

### `extractQueryParams(row)`
Extracts query parameters from a row element and removes it from DOM.

**Parameters:**
- `row` (HTMLElement) - Row element containing query params

**Returns:**
- `string` - Extracted query parameters

---

### `renderTemplates(el, recipe, toolbar, isPanel = false, queryParams = '')`
Renders templates into the carousel and sets up controls.

**Parameters:**
- `el` (HTMLElement) - Container element
- `recipe` (string) - Recipe identifier
- `toolbar` (HTMLElement) - Toolbar element
- `isPanel` (boolean) - Whether this is a panel variant
- `queryParams` (string) - Query parameters

---

### `initPanelVariant(el)`
Initializes the panel variant of template-x-carousel.

**Parameters:**
- `el` (HTMLElement) - The template-x-carousel block element

---

### `initDefaultVariant(el)`
Initializes the default variant of template-x-carousel.

**Parameters:**
- `el` (HTMLElement) - The template-x-carousel block element

---

### `scaleTemplatesForMobile(el)`
Scales down templates that are longer than 320px to 320px on mobile for v2 variant.

**Parameters:**
- `el` (HTMLElement) - The template-x-carousel element

---

### `decorateBreadcrumbs(block)`
Decorates breadcrumbs for the block if bc class is present.

**Parameters:**
- `block` (HTMLElement) - The template-x-carousel block element

---

### `init(el)`
Main initialization function for template-x-carousel blocks. Handles panel and default variants, breadcrumbs, and mobile scaling.

**Parameters:**
- `el` (HTMLElement) - The template-x-carousel block element to initialize
