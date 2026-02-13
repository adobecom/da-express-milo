# Discover Cards Block - Function Documentation

## Functions

### `syncMinHeights(groups)`
Synchronizes minimum heights across groups of elements for consistent card heights.

**Parameters:**
- `groups` (Array) - Array of element groups to sync heights

---

### `createControl(items, container)`
Creates gallery control buttons (prev/next) and status dots for navigation.

**Parameters:**
- `items` (NodeList|Array) - Gallery items to control
- `container` (HTMLElement) - Container element for the gallery

**Returns:**
- `HTMLElement` - Control element with buttons and status

---

### `buildGallery(items, container, root)`
Builds a gallery with navigation controls and scroll behavior.

**Parameters:**
- `items` (NodeList|Array) - Gallery items
- `container` (HTMLElement) - Container element (defaults to items parent)
- `root` (HTMLElement) - Root element for controls (defaults to container parent)

**Throws:**
- `Error` - If root is invalid

---

### `decorate(block)`
Main decorator function for discover-cards blocks. Handles both regular cards and flip card variants.

**Parameters:**
- `block` (HTMLElement) - The discover-cards block element to decorate
