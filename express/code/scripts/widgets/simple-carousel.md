# Simple Carousel Widget

Lightweight, reusable horizontal scrolling carousel with arrow navigation. Perfect for thumbnails, image galleries, color pickers, size selectors, and any simple horizontal scroll pattern.

## Why This Carousel?

Existing carousels (`basic-carousel.js`, `grid-carousel.js`, `carousel.js`) are feature-heavy with:
- Auto-play/pause controls
- Grid layouts
- Infinity scroll
- Template-specific logic
- Toggle triggers

**Simple Carousel** is minimal (~100 lines) with only essential features:
- Left/right arrow navigation
- Intersection Observer for arrow visibility
- Keyboard navigation
- Optional active item centering
- Zero block-specific dependencies

## Usage

### Basic Implementation

```javascript
import createSimpleCarousel from '../../scripts/widgets/simple-carousel.js';

const carouselParent = document.querySelector('.thumbnail-container');
await createSimpleCarousel('.thumbnail-item', carouselParent);
```

### With Options

```javascript
await createSimpleCarousel('.color-swatch', colorContainer, {
  ariaLabel: 'Color selector carousel',
  centerActive: true,
  activeClass: 'selected'
});
```

## API

### Function Signature

```javascript
createSimpleCarousel(selector, parent, options)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `selector` | `string` | No | CSS selector for carousel items. If omitted, uses all direct children of parent |
| `parent` | `HTMLElement` | Yes | Parent element containing carousel items |
| `options` | `Object` | No | Configuration options (see below) |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ariaLabel` | `string` | `'Carousel'` | Accessible label for the carousel region |
| `centerActive` | `boolean` | `false` | Auto-scroll to center the active item when class changes |
| `activeClass` | `string` | `'active'` | CSS class name to watch for active items (used with `centerActive`) |

### Return Value

Returns an object with:

```javascript
{
  container: HTMLElement,      // Main carousel container
  platform: HTMLElement,        // Scrollable platform element
  items: NodeList,             // All carousel items
  scrollTo: (index) => void    // Programmatically scroll to item by index
}
```

## HTML Structure Generated

```html
<div class="simple-carousel-container" role="region" aria-label="Carousel">
  <div class="simple-carousel-platform">
    <div class="simple-carousel-left-trigger"></div>
    <!-- Your carousel items here with class="simple-carousel-item" -->
    <div class="simple-carousel-right-trigger"></div>
  </div>
</div>
<div class="simple-carousel-fader-left arrow-hidden">
  <a class="button simple-carousel-arrow simple-carousel-arrow-left"></a>
</div>
<div class="simple-carousel-fader-right arrow-hidden">
  <a class="button simple-carousel-arrow simple-carousel-arrow-right"></a>
</div>
```

## CSS Customization

Override these classes in your block CSS:

```css
.simple-carousel-container {
  /* Container styling */
}

.simple-carousel-platform {
  /* Scrollable area */
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.simple-carousel-item {
  /* Individual items */
  scroll-snap-align: center;
}

.simple-carousel-arrow {
  /* Arrow button styling */
}

.simple-carousel-arrow-left,
.simple-carousel-arrow-right {
  /* Direction-specific arrows */
}

.arrow-hidden {
  /* Hide arrows at scroll boundaries */
  opacity: 0;
  pointer-events: none;
}
```

## Examples

### Product Thumbnail Carousel

```javascript
const thumbnailWrapper = document.querySelector('.product-thumbnails');
const carousel = await createSimpleCarousel('.thumbnail', thumbnailWrapper, {
  ariaLabel: 'Product image thumbnails',
  centerActive: true,
  activeClass: 'selected'
});

// Programmatically scroll to specific thumbnail
carousel.scrollTo(2); // Scroll to 3rd thumbnail
```

### Color Picker

```javascript
const colorPicker = document.querySelector('.color-options');
await createSimpleCarousel('.color-swatch', colorPicker, {
  ariaLabel: 'Color options'
});

// Handle color selection
colorPicker.querySelectorAll('.color-swatch').forEach((swatch, index) => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    swatch.classList.add('selected');
  });
});
```

### Business Drawer

```javascript
const businessDrawer = document.querySelector('.business-selector');
await createSimpleCarousel('.business-card', businessDrawer, {
  ariaLabel: 'Business options carousel'
});
```

## Accessibility Features

- **ARIA Labels**: Container has `role="region"` and configurable `aria-label`
- **Keyboard Navigation**:
  - `Enter` or `Space` on arrows to navigate
  - `Arrow Left` / `Arrow Right` when items are focused
- **Screen Reader Support**: Each item labeled as "Item X of Y"
- **Focus Management**: All items and arrows are keyboard focusable

## Intersection Observer

Uses Intersection Observer to automatically show/hide arrows:
- Left arrow hidden when scrolled to start
- Right arrow hidden when scrolled to end
- Trigger elements at edges detect scroll position
- Class `arrow-hidden` added/removed automatically

## Active Item Centering

When `centerActive: true`:
- Watches for `activeClass` changes via MutationObserver
- Auto-scrolls to center the active item smoothly
- Useful for thumbnails, color pickers, size selectors

## Performance

- Minimal DOM manipulation
- Native scroll behavior (hardware accelerated)
- Intersection Observer (efficient scroll detection)
- No polling or timers
- ~100 lines of code

## Browser Support

- Modern browsers with Intersection Observer support
- Scroll snap (graceful degradation)
- Smooth scroll behavior (graceful degradation)

## Common Use Cases

1. **Product Detail Pages**: Thumbnail galleries, paper type selectors, color pickers
2. **Color Pickers**: Horizontal color swatches  
3. **Size Selectors**: Size options carousel
4. **Business Drawers**: Organization/team selectors
5. **Image Galleries**: Simple photo carousels
6. **Filter Options**: Scrollable filter chips

### PDP Implementation Notes

The Print Product Detail (PDP) block uses this carousel for:

**Thumbnail Gallery** (Desktop & Mobile):
- Always a carousel at all viewport sizes
- Gradient fade overlays on arrow edges (88px wide)
- `centerActive: true` to keep selected thumbnail centered
- Arrows positioned at container edges with fade effect

**Mini-Pill Selectors** (Paper Type, Color, etc.):
- Always a carousel at all viewport sizes
- Gradient fade overlays on arrow edges (64px wide)
- Tooltips on hover (custom CSS `::after` pseudo-elements)
- First pill tooltip aligns left to prevent clipping
- Container uses `overflow: visible` to allow tooltips to escape
- Platform uses `overflow-x: hidden; overflow-y: visible` for scrolling

**Key CSS Override Pattern**:
```css
.pdpx-mini-pill-selector-options-wrapper {
  overflow: visible; /* Allow tooltips to escape */
  .simple-carousel-container {
    overflow: hidden; /* Clip horizontal scroll */
  }
  .simple-carousel-platform {
    overflow-x: auto; /* Enable scrolling */
    overflow-y: visible; /* Allow tooltips above */
  }
}
```

## Migration from Other Carousels

If migrating from `basic-carousel.js` or `grid-carousel.js`:

**Remove:**
- Auto-play logic
- Play/pause buttons
- Grid layout code
- Infinity scroll
- Template-specific classes

**Keep:**
- Arrow navigation
- Scroll behavior
- Intersection Observer pattern
- Keyboard support

## Notes

- No build process: Code is vanilla JavaScript
- No inline comments: Documentation lives here
- Reusable: Not tied to any specific block
- Minimal: Only essential carousel features
- Extensible: Easy to customize via CSS

