# SEO Nav Block - Function Documentation

## Functions

### `decorateCarousel(links, container)`
Decorates links as carousel buttons and builds the carousel.

**Parameters:**
- `links` (Array) - Array of paragraph elements containing links
- `container` (HTMLElement) - Container element for the carousel

---

### `updatePillsByCKG(block, carouselDiv)`
Mutation observer callback that updates carousel pills when block content changes via CKG.

**Parameters:**
- `block` (HTMLElement) - The seo-nav block element
- `carouselDiv` (HTMLElement) - Carousel container element

**Returns:**
- `Function` - Mutation observer callback function

---

### `decorate(block)`
Main decorator function for seo-nav blocks. Handles v2 variant, carousel decoration, and SEO copy.

**Parameters:**
- `block` (HTMLElement) - The seo-nav block element to decorate
