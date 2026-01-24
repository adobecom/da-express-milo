# Color Explorer Block - Technical Guide

**Version:** 1.0  
**Last Updated:** Current  
**Branch:** Gradients (Lit-free)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Usage](#installation--usage)
4. [API Reference](#api-reference)
5. [Configuration](#configuration)
6. [File Structure](#file-structure)
7. [Data Flow](#data-flow)
8. [Event System](#event-system)
9. [Styling](#styling)
10. [Accessibility](#accessibility)
11. [Performance](#performance)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Color Explorer block is a flexible, multi-variant component for displaying color palettes and gradients. It uses a functional factory pattern with no class-based code (except imported libraries).

### Variants

- **gradients**: Displays gradient cards in a grid (currently implemented)
- **strips**: Displays color palette strips (future)
- **extract**: Image color extraction (future)

### Data Source Status

**Current Implementation:**
- Uses temporary hardcoded gradients (34 items) as a placeholder
- This is **temporary** - the block is designed to work with the backend API

**Production Ready:**
- API endpoint integration (`/api/color/gradients`) is implemented
- Will automatically switch to API when backend is available
- Falls back to hardcoded data only if API is unavailable

### Key Features

- ✅ Mobile-first responsive design
- ✅ Keyboard navigation support
- ✅ Incremental DOM updates (performance optimized)
- ✅ Error handling with user-facing messages
- ✅ Design token integration (no hardcoded values)
- ✅ Lit-free implementation (gradients variant)

---

## Architecture

### Functional Factory Pattern

The block uses a functional factory pattern where:

1. **Entry Point** (`color-explorer.js`) parses configuration
2. **Factory** (`factory/createColorRenderer.js`) routes to appropriate renderer
3. **Renderers** handle variant-specific UI rendering
4. **Services** manage data fetching and state
5. **Components** provide reusable UI elements

### Core Principles

- **No Classes**: All code is functional (except imported libraries)
- **Composition Over Inheritance**: Base renderer provides utilities, specific renderers compose
- **Separation of Concerns**: Clear boundaries between data, UI, and business logic
- **Error Boundaries**: Try-catch blocks around critical operations

---

## Installation & Usage

### Basic Usage

Add the block to your HTML:

```html
<div class="color-explorer gradients">
  <!-- Block will be decorated automatically -->
</div>
```

**Note:** Currently uses temporary hardcoded gradients while waiting for backend API. The block will automatically use the API endpoint (`/api/color/gradients`) when the backend is ready.

### With Configuration

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
</div>
```

### Variants

- **Gradients**: Add `gradients` class
- **Strips**: Add `strips` class (default)
- **Extract**: Add `extract` class

---

## API Reference

### Entry Point: `color-explorer.js`

#### `decorate(block)`

Main entry point function. Automatically called by Milo block system.

**Parameters:**
- `block` (HTMLElement): The block element to decorate

**Returns:** Promise (resolves when decoration complete)

**Example:**
```javascript
import decorate from './blocks/color-explorer/color-explorer.js';

const block = document.querySelector('.color-explorer');
await decorate(block);
```

---

### Factory: `createColorRenderer(variant, options)`

Creates a renderer instance for the specified variant.

**Parameters:**
- `variant` (string): Variant type (`'gradients'`, `'strips'`, `'extract'`)
- `options` (Object): Configuration options
  - `container` (HTMLElement): Container element for rendering
  - `data` (Array): Initial data array
  - `config` (Object): Variant-specific configuration
  - `dataService` (Object): Data service instance
  - `modalManager` (Object): Modal manager instance
  - `stateKey` (string): BlockMediator state key

**Returns:** Renderer instance object

**Example:**
```javascript
import { createColorRenderer } from './factory/createColorRenderer.js';

const renderer = createColorRenderer('gradients', {
  container: document.querySelector('.container'),
  data: gradientData,
  config: { modalType: 'full-screen' }
});
```

---

### Renderer: `createGradientsRenderer(options)`

Creates a gradients-specific renderer instance.

**Parameters:**
- `options` (Object): See `createColorRenderer` options

**Returns:** Renderer instance with methods:
- `render()`: Renders the gradients view
- `update(newData)`: Updates with new data
- `refresh()`: Refreshes data from source
- `getDisplayedCount()`: Returns current displayed count
- `getAllGradients()`: Returns all gradients array
- `getMaxGradients()`: Returns total gradient count
- `on(event, callback)`: Register event listener
- `emit(event, detail)`: Emit event

**Example:**
```javascript
import { createGradientsRenderer } from './renderers/createGradientsRenderer.js';

const renderer = createGradientsRenderer({
  container: document.querySelector('.container'),
  data: gradients,
  config: {},
  modalManager: modalMgr
});

await renderer.render();

renderer.on('gradient-click', ({ gradient }) => {
  console.log('Gradient clicked:', gradient.name);
});
```

---

### Base Renderer: `createBaseRenderer(options)`

Provides shared functionality for all renderers.

**Returns:** Base API object with:
- `on(event, callback)`: Register event listener
- `emit(event, detail)`: Emit event
- `getData()`: Get current data
- `setData(newData)`: Set new data
- `getState()`: Get BlockMediator state
- `updateState(updates)`: Update BlockMediator state
- `createGrid()`: Create grid container
- `createCard(item)`: Create card element
- `createLoader()`: Create loading indicator
- `createError(message)`: Create error message element

---

### Data Service: `createColorDataService(config)`

Manages data fetching, caching, and filtering. Designed to work with backend API, with temporary hardcoded fallback.

**Parameters:**
- `config` (Object): Service configuration
  - `variant` (string): Variant type
  - `apiEndpoint` (string): API endpoint URL

**Returns:** Service API object with:
- `fetch(filters)`: Fetch data from API (returns Promise)
  - **Current:** Falls back to hardcoded gradients if API unavailable
  - **Production:** Will use API endpoint when backend is ready
- `search(query)`: Search cached data
- `filter(criteria)`: Filter cached data
- `clearCache()`: Clear cached data

**Example:**
```javascript
import { createColorDataService } from './services/createColorDataService.js';

const dataService = createColorDataService({
  variant: 'gradients',
  apiEndpoint: '/api/color/gradients'  // Will be used when backend is ready
});

// Currently returns hardcoded data (temporary)
// Will automatically switch to API when backend is available
const data = await dataService.fetch();
const filtered = dataService.filter({ type: 'linear' });
```

**Data Source Priority:**
1. **Primary:** API endpoint (`/api/color/gradients`) - when backend is ready
2. **Fallback:** Hardcoded gradients (temporary placeholder)

---

### Modal: `createGradientModal(gradient, options)`

Creates gradient editing modal content.

**Parameters:**
- `gradient` (Object): Gradient data object
  - `id` (string): Gradient ID
  - `name` (string): Gradient name
  - `gradient` (string): CSS gradient string (optional)
  - `colorStops` (Array): Color stops array (optional)
  - `angle` (number): Gradient angle (optional)
- `options` (Object): Modal options
  - `onSave` (Function): Callback when gradient is saved
  - `onColorEdit` (Function): Callback when color is edited

**Returns:** Modal API object with:
- `element` (HTMLElement): Modal content element
- `getGradient()`: Get current gradient state
- `updateColorStop(index, newColor)`: Update color stop
- `destroy()`: Cleanup function

**Example:**
```javascript
import { createGradientModal } from './modal/createGradientModal.js';

const modal = createGradientModal(gradient, {
  onSave: (updated) => {
    console.log('Saved:', updated);
  },
  onColorEdit: (color, index) => {
    console.log('Editing color:', color, index);
  }
});

modalManager.open({
  content: modal.element,
  title: 'Edit Gradient'
});
```

---

## Configuration

### Block-Level Configuration

Configuration is parsed from block HTML structure:

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
    <div>Search Enabled</div>
    <div>true</div>
  </div>
  <div>
    <div>Modal Type</div>
    <div>full-screen</div>
  </div>
</div>
```

### Configuration Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `variant` | string | `'strips'` | Variant type |
| `apiEndpoint` | string | `/api/color/palettes` | API endpoint URL |
| `limit` | number | `24` | Initial results limit |
| `searchEnabled` | boolean | `true` | Enable search functionality |
| `modalType` | string | `'drawer'` | Modal type (`'drawer'` or `'full-screen'`) |

### Variant-Specific Configuration

#### Gradients Variant

```javascript
{
  gridColumns: 3,
  cardLayout: 'vertical-gradient',
  searchEnabled: true,
  modalType: 'full-screen'
}
```

---

## File Structure

```
express/code/blocks/color-explorer/
│
├── color-explorer.js              [Entry Point]
├── color-explorer.css             [Styles]
│
├── factory/
│   └── createColorRenderer.js     [Renderer Factory]
│
├── renderers/
│   ├── createBaseRenderer.js      [Base Renderer]
│   ├── createGradientsRenderer.js [Gradients Renderer]
│   ├── createStripsRenderer.js    [Strips Renderer]
│   └── createExtractRenderer.js   [Extract Renderer]
│
├── services/
│   └── createColorDataService.js  [Data Service]
│
├── modal/
│   ├── createColorModalManager.js [Modal Manager]
│   ├── createGradientModal.js    [Gradient Modal]
│   └── createPaletteModal.js      [Palette Modal]
│
├── components/
│   ├── createLoadMoreComponent.js [Load More Button]
│   ├── createSearchComponent.js   [Search Component]
│   └── createFiltersComponent.js  [Filters Component]
│
└── adapters/
    └── litComponentAdapters.js    [Lit Component Adapters]
```

---

## Data Flow

### Initialization Flow

```
1. Block HTML parsed
   │
   ├─→ parseConfig() extracts configuration
   │
   ↓
2. Services Created
   │
   ├─→ createColorDataService(config)
   ├─→ createColorModalManager(config)
   │
   ↓
3. Data Fetched
   │
   ├─→ dataService.fetch() or getMockData()
   │
   ↓
4. State Initialized
   │
   ├─→ BlockMediator.set(stateKey, { ... })
   │
   ↓
5. Renderer Created
   │
   ├─→ createColorRenderer(variant, options)
   │   └─→ createGradientsRenderer(options)
   │
   ↓
6. UI Rendered
   │
   ├─→ renderer.render()
   │   └─→ Creates DOM elements
```

### Update Flow

```
User Action (Load More, Search, etc.)
   │
   ├─→ Event Emitted
   │   └─→ renderer.emit('load-more', { ... })
   │
   ↓
State Updated
   │
   ├─→ BlockMediator.set(stateKey, newState)
   │
   ↓
Renderer Updated
   │
   ├─→ renderer.update(newData)
   │   └─→ Incremental DOM updates
```

---

## Event System

### Events Emitted

#### `gradient-click`
Emitted when a gradient card is clicked.

**Detail:**
```javascript
{
  gradient: {
    id: 'gradient-1',
    name: 'Sunset Vibes',
    gradient: 'linear-gradient(...)',
    // ... other properties
  }
}
```

#### `load-more`
Emitted when "Load More" button is clicked.

**Detail:**
```javascript
{
  displayedCount: 34
}
```

#### `gradient-saved`
Emitted when gradient is saved.

**Detail:**
```javascript
{
  gradient: { /* updated gradient object */ }
}
```

#### `gradient-save-to-library`
Emitted when gradient is saved to Adobe Libraries.

**Detail:**
```javascript
{
  gradient: { /* gradient object */ }
}
```

#### `color-edit`
Emitted when color stop is edited.

**Detail:**
```javascript
{
  color: '#FF6B6B',
  stopIndex: 0,
  gradient: { /* gradient object */ }
}
```

#### `error`
Emitted when an error occurs.

**Detail:**
```javascript
{
  message: 'Error description',
  error: ErrorObject
}
```

### Event Listeners

```javascript
const renderer = createGradientsRenderer(options);

renderer.on('gradient-click', ({ gradient }) => {
  console.log('Gradient clicked:', gradient.name);
});

renderer.on('load-more', ({ displayedCount }) => {
  console.log('Now showing:', displayedCount);
});

renderer.on('error', ({ message, error }) => {
  console.error('Error:', message, error);
});
```

---

## Styling

### CSS Variables Used

The block uses design tokens from `styles.css`:

#### Spacing
- `--spacing-100`: 8px
- `--spacing-200`: 12px
- `--spacing-300`: 16px
- `--spacing-400`: 24px
- `--spacing-500`: 32px
- `--spacing-600`: 40px
- `--spacing-900`: 80px

#### Colors
- `--color-default-font`: #131313
- `--color-white`: #FFFFFF
- `--color-gray-200`: Border color
- `--color-gray-300`: Light gray
- `--color-light-gray`: Light gray border
- `--color-blue-600`: Focus ring color

#### Typography
- `--body-font-family`: Font family
- `--ax-body-weight`: 400
- `--ax-body-weight-bold`: 700
- `--ax-heading-xs-size`: 16px
- `--ax-heading-xs-lh`: 20px
- `--ax-body-xs-size`: 14px
- `--ax-body-xs-lh`: 21px
- `--ax-detail-l-lh`: 20px

#### Layout
- `--block-wd-grid-max-width`: Max grid width
- `--border-width-2`: 2px

### Responsive Breakpoints

- **Mobile**: Up to 767px
- **Tablet**: 768px - 1199px
- **Desktop**: 1200px and above

### Key CSS Classes

#### `.color-explorer-container`
Main container wrapper with responsive padding.

#### `.gradients-main-section`
Main section containing header, grid, and load more button.

#### `.gradients-grid`
Grid container for gradient cards.

#### `.gradient-card`
Individual gradient card element.

#### `.gradient-visual`
Gradient visual display (height: 50px mobile, 80px desktop).

#### `.gradient-info`
Info row containing name and action button.

#### `.gradient-action-btn`
Action button for opening modal.

---

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between cards and buttons
- **Enter/Space**: Activate card or button
- **Focus Management**: Visual focus indicators with `:focus-visible`

### ARIA Attributes

- `aria-label`: Descriptive labels for cards and buttons
- `aria-hidden`: Icons marked as decorative
- `role`: Semantic roles where appropriate

### Focus Styles

Focus rings use `--color-blue-600` with 4px offset to prevent content overlap.

### Screen Reader Support

- Cards have descriptive `aria-label` attributes
- Buttons have clear action labels
- Error messages are accessible

---

## Performance

### Optimizations

1. **Incremental DOM Updates**: Only changed elements are updated
2. **Lazy Loading**: Modal code loaded dynamically on demand
3. **Event Delegation**: Efficient event handling
4. **Fragment Usage**: DOM fragments for batch inserts

### DOM Update Strategy

Instead of clearing entire container (`innerHTML = ''`), the renderer:
- Updates existing cards in place
- Adds new cards only when needed
- Removes excess cards when count decreases
- Preserves focus and scroll position

### Memory Management

- Event listeners cleaned up on destroy
- Modal content destroyed on close
- No memory leaks from closures

---

## Troubleshooting

### Common Issues

#### Block Not Rendering

**Symptoms:** Empty block or error message

**Solutions:**
1. Check browser console for errors
2. Verify block has correct class (`color-explorer gradients`)
3. Check that `color-explorer.js` is imported
4. Verify data is available

#### Gradients Not Displaying

**Symptoms:** Grid is empty

**Solutions:**
1. Check `data` array is not empty
2. Verify gradient objects have `id` and `name` properties
3. Check `gradient` or `colorStops` property exists
4. Verify CSS is loaded

#### Modal Not Opening

**Symptoms:** Clicking card does nothing

**Solutions:**
1. Check `modalManager` is provided to renderer
2. Verify modal import path is correct
3. Check browser console for import errors
4. Verify gradient data is valid

#### Performance Issues

**Symptoms:** Slow rendering or lag

**Solutions:**
1. Check number of gradients (should be paginated)
2. Verify incremental updates are working
3. Check for memory leaks in event listeners
4. Profile with browser DevTools

### Error Handling

All errors are:
1. Logged via `window.lana` (if available)
2. Emitted as `error` events
3. Displayed as user-facing messages where appropriate

### Debugging

To debug issues:

1. **Check BlockMediator State:**
```javascript
const state = BlockMediator.get('color-explorer-gradients');
console.log('State:', state);
```

2. **Listen to Events:**
```javascript
renderer.on('error', ({ message, error }) => {
  console.error('Renderer error:', message, error);
});
```

3. **Inspect Renderer:**
```javascript
console.log('Displayed count:', renderer.getDisplayedCount());
console.log('All gradients:', renderer.getAllGradients());
```

---

## Data Format

### Gradient Object Structure

```javascript
{
  id: 'gradient-1',                    // Required: Unique identifier
  name: 'Sunset Vibes',                // Required: Display name
  gradient: 'linear-gradient(...)',     // Optional: CSS gradient string
  colorStops: [                        // Optional: Color stops array
    { color: '#FF6B6B', position: 0 },
    { color: '#FFF96B', position: 1 }
  ],
  angle: 90,                           // Optional: Gradient angle
  type: 'linear',                      // Optional: Gradient type
  coreColors: ['#FF6B6B', '#FFF96B']  // Optional: Core colors array
}
```

**Note:** This structure matches the expected API response format. The backend API should return an array of gradient objects in this format.

### Data Transformation

The renderer automatically converts `colorStops` to CSS gradient strings:

```javascript
// Input
{
  colorStops: [
    { color: '#FF6B6B', position: 0 },
    { color: '#FFF96B', position: 1 }
  ],
  angle: 90
}

// Output (used for rendering)
{
  gradient: 'linear-gradient(90deg, #FF6B6B 0%, #FFF96B 100%)'
}
```

---

## State Management

### BlockMediator Integration

The block uses `BlockMediator` for state management:

```javascript
const stateKey = `color-explorer-${variant}`;

// Set state
BlockMediator.set(stateKey, {
  selectedItem: null,
  currentData: [...],
  allData: [...],
  searchQuery: '',
  currentPage: 1,
  pageSize: 24,
  hasMore: true,
  totalCount: 34
});

// Get state
const state = BlockMediator.get(stateKey);

// Subscribe to changes
BlockMediator.subscribe(stateKey, ({ newValue }) => {
  console.log('State updated:', newValue);
});
```

---

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Features Used**:
  - ES6 Modules
  - Async/Await
  - Template Literals
  - Arrow Functions
  - Array Methods (map, filter, forEach)
  - Custom Events
  - CSS Grid
  - CSS Variables

---

## Contributing

### Adding a New Variant

1. Create renderer file: `renderers/createNewVariantRenderer.js`
2. Register in factory: `factory/createColorRenderer.js`
3. Add default config to registry
4. Update CSS with variant-specific styles
5. Test thoroughly

### Code Style

- Use functional programming patterns
- No classes (except imported libraries)
- Use design tokens (no hardcoded values)
- Follow existing naming conventions
- Add error handling for all critical operations

---

## License

Internal Adobe project - See main repository license.

---

## Changelog

### Version 1.0 (Current)
- Initial gradients variant implementation
- Incremental DOM updates
- Error handling
- Accessibility features
- Design token integration
- Lit-free implementation

---

## Related Documentation

- [Code Review](./CODE-REVIEW.md)
- [Architecture Overview](./STRUCTURE.md)
- [Modal Architecture](./modal/MODAL-ARCHITECTURE.md)
- [Components Architecture](./COMPONENTS-ARCHITECTURE.md)
