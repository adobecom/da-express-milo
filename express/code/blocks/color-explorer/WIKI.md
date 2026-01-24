# Color Explorer - Gradients Variant Wiki

> **Quick Reference Guide** for the Gradients variant of the Color Explorer block.

---

## 🚀 Quick Start

### Basic Implementation

```html
<!-- Add to your page -->
<div class="color-explorer gradients"></div>
```

That's it! The block will automatically:
- Fetch gradients from API endpoint (or use temporary hardcoded data)
- Render gradient cards in a responsive grid
- Handle card clicks and modal interactions
- Support keyboard navigation
- Provide "Load More" functionality

> **Note:** Currently using temporary hardcoded gradients (34) while waiting for backend API. The block is designed to work with the API endpoint when ready.

---

## 📋 Gradients Variant Overview

The Gradients variant displays color gradients in a card-based grid layout:

- **Mobile**: 1 column (up to 767px)
- **Tablet**: 2 columns (768px - 1199px)
- **Desktop**: 3 columns (1200px+)

Each card shows:
- Gradient visual preview (50px mobile, 80px desktop)
- Gradient name
- Action button to open modal editor

---

## ⚙️ Configuration

### Minimal Configuration

```html
<div class="color-explorer gradients"></div>
```

Uses default settings:
- Initial display: 24 gradients
- Load more increment: 10 gradients
- Modal type: Full-screen
- Data source: API endpoint (currently falls back to 34 hardcoded gradients as temporary placeholder)

### With Custom Settings

```html
<div class="color-explorer gradients">
  <div>
    <div>API Endpoint</div>
    <div>/api/color/gradients</div>
  </div>
  <div>
    <div>Limit</div>
    <div>24</div>
  </div>
  <div>
    <div>Modal Type</div>
    <div>full-screen</div>
  </div>
</div>
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `API Endpoint` | `/api/color/gradients` | API endpoint for fetching gradients |
| `Limit` | `24` | Initial number of gradients to display |
| `Modal Type` | `full-screen` | Modal display type (`full-screen` or `drawer`) |

---

## 🎨 Styling - Gradients Variant

### Key CSS Classes

| Class | Purpose | Notes |
|-------|---------|-------|
| `.color-explorer-container` | Content wrapper | Responsive padding (16px mobile, 32px tablet, 40px desktop) |
| `.gradients-main-section` | Main section | Contains header, grid, and load more button |
| `.gradients-header` | Header container | Contains title |
| `.gradients-title` | Title element | Shows "X color gradients" count |
| `.gradients-grid` | Grid container | CSS Grid layout (1/2/3 columns) |
| `.gradient-card` | Individual card | Focusable, clickable card element |
| `.gradient-visual` | Gradient preview | Height: 50px (mobile), 80px (desktop) |
| `.gradient-info` | Info row | Contains name and action button |
| `.gradient-name` | Gradient name | Font: 14px, weight: 500, color: #131313 |
| `.gradient-actions` | Actions container | Right-aligned button container |
| `.gradient-action-btn` | Action button | Opens modal editor |
| `.gradient-load-more-btn` | Load more button | Appears when more gradients available |

### Responsive Breakpoints

- **Mobile**: ≤767px
  - 1 column grid
  - Padding: 16px left/right
  - Gradient visual height: 50px
  
- **Tablet**: 768px - 1199px
  - 2 columns grid
  - Padding: 32px left/right
  - Gradient visual height: 80px
  
- **Desktop**: ≥1200px
  - 3 columns grid
  - Padding: 40px left/right
  - Gradient visual height: 80px

---

## 🔧 API - Gradients Renderer

### Creating a Renderer

```javascript
import { createGradientsRenderer } from './renderers/createGradientsRenderer.js';

const renderer = createGradientsRenderer({
  container: document.querySelector('.container'),  // Required: DOM container
  data: gradientsArray,                            // Optional: Gradient data array
  config: {                                        // Optional: Configuration
    modalType: 'full-screen',
    gridColumns: 3
  },
  dataService: myDataService,                      // Optional: Data service
  modalManager: myModalManager                     // Optional: Modal manager
});
```

### Renderer Methods

```javascript
// Render the gradients UI
await renderer.render();

// Update with new gradient data
renderer.update(newGradientsArray);

// Refresh data from source
renderer.refresh();

// Get current displayed count
const count = renderer.getDisplayedCount();  // e.g., 24

// Get all gradients array
const all = renderer.getAllGradients();      // Returns all 34 gradients

// Get maximum gradient count
const max = renderer.getMaxGradients();      // Returns 34
```

### Events - Gradients Variant

#### `gradient-click`
Fired when a gradient card is clicked.

```javascript
renderer.on('gradient-click', ({ gradient }) => {
  console.log('Clicked:', gradient.name);
  // gradient.id, gradient.name, gradient.gradient, etc.
});
```

#### `load-more`
Fired when "Load More" button is clicked.

```javascript
renderer.on('load-more', ({ displayedCount }) => {
  console.log('Now showing:', displayedCount, 'gradients');
});
```

#### `gradient-saved`
Fired when gradient is saved in modal.

```javascript
renderer.on('gradient-saved', ({ gradient }) => {
  console.log('Saved:', gradient);
});
```

#### `gradient-save-to-library`
Fired when gradient is saved to Adobe Libraries.

```javascript
renderer.on('gradient-save-to-library', ({ gradient }) => {
  console.log('Saved to library:', gradient);
});
```

#### `color-edit`
Fired when color stop is edited in modal.

```javascript
renderer.on('color-edit', ({ color, stopIndex, gradient }) => {
  console.log('Editing color:', color, 'at index:', stopIndex);
});
```

#### `error`
Fired when an error occurs.

```javascript
renderer.on('error', ({ message, error }) => {
  console.error('Error:', message, error);
});
```

---

## 📊 Gradient Data Format

### Required Properties

```javascript
{
  id: 'gradient-1',              // Required: Unique identifier
  name: 'Sunset Vibes'          // Required: Display name
}
```

### Optional Properties

```javascript
{
  // CSS gradient string (preferred if available)
  gradient: 'linear-gradient(90deg, #FF6B6B 0%, #FFF96B 100%)',
  
  // OR color stops array (will be converted to gradient string)
  colorStops: [
    { color: '#FF6B6B', position: 0 },
    { color: '#FFF96B', position: 1 }
  ],
  angle: 90,                      // Gradient angle (default: 90)
  type: 'linear',                 // 'linear', 'radial', or 'conic'
  
  // Additional metadata
  coreColors: ['#FF6B6B', '#FFF96B']  // Core colors array
}
```

### Example Gradient Object

```javascript
{
  id: 'gradient-1',
  name: 'Sunset Vibes',
  gradient: 'linear-gradient(90deg, rgb(255, 107, 107) 0%, rgb(255, 142, 83) 25%, rgb(255, 160, 107) 50%, rgb(255, 208, 107) 75%, rgb(255, 249, 107) 100%)',
  colorStops: [
    { color: 'rgb(255, 107, 107)', position: 0 },
    { color: 'rgb(255, 142, 83)', position: 0.25 },
    { color: 'rgb(255, 160, 107)', position: 0.5 },
    { color: 'rgb(255, 208, 107)', position: 0.75 },
    { color: 'rgb(255, 249, 107)', position: 1 }
  ],
  angle: 90,
  type: 'linear',
  coreColors: ['rgb(255, 107, 107)', 'rgb(255, 249, 107)']
}
```

### Data Transformation

The renderer automatically converts `colorStops` to CSS gradient strings:

- If `gradient` property exists → uses it directly
- If only `colorStops` exists → converts to `linear-gradient()` string
- If neither exists → uses fallback gradient

---

## 🐛 Troubleshooting - Gradients Variant

### Block Not Rendering

**Symptoms:** Empty block or "undefined" text

**Solutions:**
1. ✅ Verify class: `color-explorer gradients` (both classes required)
2. ✅ Check `color-explorer.js` is imported and loaded
3. ✅ Check browser console for errors
4. ✅ Verify block has `data-block-status` attribute after load
5. ✅ Ensure container element exists

### Gradients Not Displaying

**Symptoms:** Grid is empty or only shows "Load more" button

**Solutions:**
1. ✅ Check data array has items (default: 34 hardcoded gradients)
2. ✅ Verify gradient objects have `id` and `name` properties
3. ✅ Check `gradient` or `colorStops` property exists
4. ✅ Ensure CSS file (`color-explorer.css`) is loaded
5. ✅ Verify `.gradients-grid` element exists in DOM

### Modal Not Opening

**Symptoms:** Clicking card does nothing

**Solutions:**
1. ✅ Check `modalManager` is provided to renderer
2. ✅ Verify modal import path is correct
3. ✅ Check browser console for import errors
4. ✅ Verify gradient data is valid (has `id` and `name`)
5. ✅ Check for JavaScript errors in console

### Load More Not Working

**Symptoms:** Button doesn't load more gradients

**Solutions:**
1. ✅ Check `displayedCount` is less than total (34)
2. ✅ Verify `loadMoreIncrement` is set (default: 10)
3. ✅ Check event listener is attached
4. ✅ Verify `updateCards()` function is working

### Performance Issues

**Symptoms:** Slow rendering or lag when scrolling

**Solutions:**
1. ✅ Verify incremental DOM updates are working (check `updateCards()`)
2. ✅ Check number of gradients (should paginate at 24 initially)
3. ✅ Profile with Chrome DevTools Performance tab
4. ✅ Check for memory leaks (event listeners not cleaned up)
5. ✅ Verify CSS is not causing reflows

### Keyboard Navigation Issues

**Symptoms:** Cards not focusable or focus ring missing

**Solutions:**
1. ✅ Verify `tabindex="0"` on `.gradient-card` elements
2. ✅ Check `aria-label` attributes are present
3. ✅ Verify `:focus-visible` styles in CSS
4. ✅ Test with keyboard (Tab, Enter, Space)

---

## ♿ Accessibility

- ✅ Keyboard navigation (Tab, Enter, Space)
- ✅ Screen reader support (ARIA labels)
- ✅ Focus management
- ✅ Error announcements

---

## 📚 Additional Resources

- [Technical Guide](./TECHNICAL-GUIDE.md) - Comprehensive documentation
- [Code Review](./CODE-REVIEW.md) - Code quality review
- [Architecture](./STRUCTURE.md) - System architecture

---

## 💡 Examples - Gradients Variant

### Basic HTML Usage

```html
<!-- Minimal implementation -->
<div class="color-explorer gradients"></div>
```

### With Custom Configuration

```html
<div class="color-explorer gradients">
  <div>
    <div>API Endpoint</div>
    <div>/api/color/gradients</div>
  </div>
  <div>
    <div>Limit</div>
    <div>24</div>
  </div>
  <div>
    <div>Modal Type</div>
    <div>full-screen</div>
  </div>
</div>
```

### Programmatic Usage

```javascript
import { createGradientsRenderer } from './renderers/createGradientsRenderer.js';
import { createColorModalManager } from './modal/createColorModalManager.js';

// Prepare gradient data
const gradients = [
  {
    id: 'gradient-1',
    name: 'Sunset Vibes',
    gradient: 'linear-gradient(90deg, #FF6B6B 0%, #FFF96B 100%)'
  },
  // ... more gradients
];

// Create modal manager
const modalManager = createColorModalManager({ modalType: 'full-screen' });

// Create renderer
const renderer = createGradientsRenderer({
  container: document.querySelector('.gradients-container'),
  data: gradients,
  config: {
    modalType: 'full-screen',
    gridColumns: 3
  },
  modalManager: modalManager
});

// Render
await renderer.render();

// Listen to events
renderer.on('gradient-click', ({ gradient }) => {
  console.log('User clicked:', gradient.name);
});

renderer.on('load-more', ({ displayedCount }) => {
  console.log('Loaded more. Now showing:', displayedCount);
});
```

### Custom Gradient Data

```javascript
// Using colorStops (will be converted automatically)
const customGradients = [
  {
    id: 'custom-1',
    name: 'Custom Gradient',
    colorStops: [
      { color: '#FF0000', position: 0 },
      { color: '#00FF00', position: 0.5 },
      { color: '#0000FF', position: 1 }
    ],
    angle: 45,
    type: 'linear'
  }
];

const renderer = createGradientsRenderer({
  container: document.querySelector('.container'),
  data: customGradients
});

await renderer.render();
```

### Updating Gradients Dynamically

```javascript
// Get current state
const currentCount = renderer.getDisplayedCount();
const allGradients = renderer.getAllGradients();

// Add new gradients
const newGradients = [
  {
    id: 'new-1',
    name: 'New Gradient',
    gradient: 'linear-gradient(180deg, #000000 0%, #FFFFFF 100%)'
  }
];

const updatedGradients = [...allGradients, ...newGradients];
renderer.update(updatedGradients);
```

---

## 🔗 Related Files - Gradients Variant

### Core Files
- `color-explorer.js` - Entry point (parses config, creates renderer)
- `renderers/createGradientsRenderer.js` - Gradients-specific renderer
- `factory/createColorRenderer.js` - Renderer factory (routes to gradients)

### Supporting Files
- `renderers/createBaseRenderer.js` - Base renderer (shared utilities)
- `services/createColorDataService.js` - Data service (fetching, caching)
- `modal/createGradientModal.js` - Gradient editing modal
- `modal/createColorModalManager.js` - Modal manager
- `components/createLoadMoreComponent.js` - Load more button component
- `color-explorer.css` - Styles (gradients-specific styles included)

### Documentation
- `TECHNICAL-GUIDE.md` - Comprehensive technical documentation
- `CODE-REVIEW.md` - Code quality review
- `STRUCTURE.md` - Architecture overview

---

## 📈 Gradients Variant Features

### ✅ Implemented Features
- ✅ Responsive grid layout (1/2/3 columns)
- ✅ 34 hardcoded gradients
- ✅ Incremental DOM updates
- ✅ Load more functionality (10 at a time)
- ✅ Gradient modal editor
- ✅ Keyboard navigation
- ✅ Error handling
- ✅ Design token integration
- ✅ Mobile-first CSS

### 🔜 Future Enhancements
- 🔜 Filter functionality (color type, gradient type, time period)
- 🔜 Search functionality
- ✅ API integration (ready - currently using temporary hardcoded data while backend is being developed)
- 🔜 Save to Adobe Libraries
- 🔜 Export gradients (CSS, JSON)

### 📝 Current Status

**Data Source:** 
- **Temporary:** 34 hardcoded gradients (placeholder while backend API is being developed)
- **Production Ready:** API endpoint integration (`/api/color/gradients`) - will automatically switch when backend is available

The block is architected to work with the backend API. The hardcoded data is only a temporary fallback for development/testing purposes.

---

**Last Updated:** Current  
**Variant:** Gradients  
**Status:** ✅ Production Ready
