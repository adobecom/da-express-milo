# Initialization Architecture - Deep Linking & Dependency Loading

## Problem Statement

Different pages have different initialization requirements:

1. **Explore Page** (with `search-marquee`):
   - Marquee is LCP (Largest Contentful Paint)
   - Marquee handles input only (NO API calls)
   - Deep linking via URL params (`?q=blue&category=nature`)
   - On page load with params → need to fetch results immediately
   - Results rendering needs Lit components

2. **Other Pages** (Extract, Wheel, Contrast, etc.):
   - No search-marquee
   - Each block is responsible for its own dependencies
   - May or may not need API calls
   - May or may not need Lit components

**Challenge**: How to handle initialization and dependency loading in a scalable way?

---

## Solution: Decoupled Initialization System

### Architecture Principles

1. **Blocks are autonomous** - Each block owns its dependencies
2. **Shared services coordinate** - Central services handle URL params and loading
3. **Event-driven communication** - Blocks communicate via events, not direct coupling
4. **Lazy loading** - Dependencies load only when needed
5. **Deep link support** - URL params trigger automatic initialization

---

## Components

### 1. Page Init Service

**File**: `express/code/scripts/color-shared/services/createPageInitService.js`

**Responsibilities**:
- Read URL parameters
- Parse deep link state (query, filters)
- Dispatch initialization events
- No API calls, no rendering

**Example**:
```javascript
const initService = createPageInitService();
const state = initService.getInitialState();

// state = {
//   query: 'blue',
//   filters: { category: 'nature' },
//   hasParams: true
// }

if (state.hasParams) {
  initService.initialize(); // Dispatches 'color:init' event
}
```

---

### 2. Dependency Loader

**File**: `express/code/scripts/color-shared/services/createDependencyLoader.js`

**Responsibilities**:
- Load API data (with deduplication)
- Load Lit components (with deduplication)
- Track loading state
- Prevent duplicate requests

**Example**:
```javascript
import { globalDependencyLoader } from './createDependencyLoader.js';

// Load API (deduplicated across all blocks)
const data = await globalDependencyLoader.loadApi(dataService);

// Load Lit component (deduplicated across all blocks)
await globalDependencyLoader.loadLitComponent(
  'color-palette',
  '../../../libs/color-components/components/color-palette/index.js'
);

// Check if loaded
const hasApi = globalDependencyLoader.isApiLoaded();
const hasLit = globalDependencyLoader.isLitLoaded('color-palette');
```

---

## Implementation Patterns

### Pattern A: Explore Page (with search-marquee)

#### search-marquee Block

**Responsibilities**:
- LCP hero
- Handle user input
- Dispatch search events
- Read URL params for initial value
- **NO API calls**
- **NO results rendering**

```javascript
// express/code/blocks/search-marquee/search-marquee.js
import { createPageInitService } from '../../scripts/color-shared/services/createPageInitService.js';

export default async function decorate(block) {
  const initService = createPageInitService();
  const initialState = initService.getInitialState();

  // Render search input with initial query
  const searchInput = document.createElement('input');
  searchInput.value = initialState.query;
  block.appendChild(searchInput);

  // Handle user input
  searchInput.addEventListener('input', (e) => {
    document.dispatchEvent(new CustomEvent('search:query', {
      detail: { query: e.target.value }
    }));
  });

  // Trigger initialization if deep link params exist
  if (initialState.hasParams) {
    initService.initialize(); // Dispatches 'color:init' event
  }
}
```

#### color-explore Block

**Responsibilities**:
- Listen for initialization events
- Fetch data via API
- Render results with Lit components
- Handle search/filter events

```javascript
// express/code/blocks/color-explore/color-explore.js
import { createColorDataService } from '../../scripts/color-shared/services/createColorDataService.js';
import { globalDependencyLoader } from '../../scripts/color-shared/services/createDependencyLoader.js';
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';

export default async function decorate(block) {
  const dataService = createColorDataService({ variant: 'palettes' });
  
  // Listen for page initialization (deep links)
  document.addEventListener('color:init', async (e) => {
    const { query, filters } = e.detail;
    
    block.classList.add('is-loading');
    
    // Load dependencies
    const data = await globalDependencyLoader.loadApi(dataService);
    
    // Search if query exists
    const results = query ? await dataService.search(query) : data;
    
    // Render
    const renderer = createStripsRenderer({ container: block, data: results });
    renderer.render(block);
    
    block.classList.remove('is-loading');
  });

  // Listen for search events from marquee
  document.addEventListener('search:query', async (e) => {
    const { query } = e.detail;
    
    block.classList.add('is-loading');
    const results = await dataService.search(query);
    renderer.update(results);
    block.classList.remove('is-loading');
  });

  // Load initial data if no deep link params
  const initService = createPageInitService();
  if (!initService.hasDeepLinkParams()) {
    block.classList.add('is-loading');
    const data = await globalDependencyLoader.loadApi(dataService);
    const renderer = createStripsRenderer({ container: block, data });
    renderer.render(block);
    block.classList.remove('is-loading');
  }
}
```

**Flow**:
```
Page Load with ?q=blue
  ↓
search-marquee decorates
  ↓
search-marquee reads URL params
  ↓
search-marquee dispatches 'color:init' event
  ↓
color-explore receives 'color:init'
  ↓
color-explore loads API (via dependency loader)
  ↓
color-explore searches for "blue"
  ↓
color-explore renders results (loads Lit if needed)
```

---

### Pattern B: Other Pages (no search-marquee)

#### color-extract Block

**Responsibilities**:
- Load own dependencies
- No initial API call (user uploads image first)
- Load Lit components when needed

```javascript
// express/code/blocks/color-extract/color-extract.js
import { globalDependencyLoader } from '../../scripts/color-shared/services/createDependencyLoader.js';

export default async function decorate(block) {
  // No API on load - user needs to upload image first
  
  const uploadArea = document.createElement('div');
  uploadArea.className = 'upload-area';
  uploadArea.textContent = 'Drop image here';
  block.appendChild(uploadArea);

  uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    
    // Extract colors from image
    const colors = await extractColors(file);
    
    // Load Lit component on demand
    await globalDependencyLoader.loadLitComponent(
      'color-palette',
      '../../../libs/color-components/components/color-palette/index.js'
    );
    
    // Render palette
    const palette = document.createElement('color-palette');
    palette.palette = { colors };
    block.appendChild(palette);
  });
}
```

#### color-wheel Block

**Responsibilities**:
- Load own dependencies
- No API needed (pure client-side)
- Load Lit components immediately

```javascript
// express/code/blocks/color-wheel/color-wheel.js
import { globalDependencyLoader } from '../../scripts/color-shared/services/createDependencyLoader.js';

export default async function decorate(block) {
  // No API needed - pure client-side
  
  block.classList.add('is-loading');
  
  // Load Lit component
  await globalDependencyLoader.loadLitComponent(
    'color-wheel',
    '../../../libs/color-components/components/color-wheel/index.js'
  );
  
  // Render wheel
  const wheel = document.createElement('color-wheel');
  wheel.baseColor = '#FF0000';
  block.appendChild(wheel);
  
  block.classList.remove('is-loading');
}
```

**Flow**:
```
Page Load
  ↓
color-wheel decorates
  ↓
color-wheel loads Lit component (via dependency loader)
  ↓
color-wheel renders immediately
```

---

## Event API

### Events Dispatched

#### 1. `color:init`
Dispatched by page init service when deep link params exist.

```javascript
document.dispatchEvent(new CustomEvent('color:init', {
  detail: {
    query: 'blue',
    filters: { category: 'nature' },
    hasParams: true
  }
}));
```

#### 2. `search:query`
Dispatched by search-marquee when user types.

```javascript
document.dispatchEvent(new CustomEvent('search:query', {
  detail: { query: 'blue' }
}));
```

#### 3. `search:filter`
Dispatched by filter component when filters change.

```javascript
document.dispatchEvent(new CustomEvent('search:filter', {
  detail: { category: 'nature', mood: 'calm' }
}));
```

---

## Scalability Benefits

### ✅ Blocks are Autonomous
- Each block owns its initialization
- No tight coupling between blocks
- Blocks can be added/removed without affecting others

### ✅ Dependency Deduplication
- API called once, shared across all blocks
- Lit components loaded once, shared across all blocks
- No redundant network requests

### ✅ Deep Link Support
- URL params work automatically
- Any block can listen for `color:init`
- Consistent behavior across all pages

### ✅ Page-Specific Optimization
- Explore page: search-marquee + color-explore coordination
- Other pages: single block, self-contained
- Each page loads only what it needs

### ✅ Event-Driven Architecture
- Loose coupling via events
- Easy to add new listeners
- Easy to debug (event log in DevTools)

---

## Real-World Scenarios

### Scenario 1: Deep Link to Explore Page

**URL**: `https://example.com/express/colors?q=sunset&category=nature`

```
1. Page loads
2. search-marquee decorates
   - Sets input value to "sunset"
   - Dispatches 'color:init' with { query: 'sunset', filters: { category: 'nature' } }
3. color-explore decorates
   - Listens for 'color:init'
4. color-explore receives 'color:init'
   - Loads API via dependency loader
   - Searches for "sunset"
   - Filters by category "nature"
   - Renders results
```

---

### Scenario 2: Extract Page Load

**URL**: `https://example.com/express/colors/extract`

```
1. Page loads
2. color-extract decorates
   - Renders upload area
   - Waits for user input
3. User drops image
   - Extracts colors
   - Loads Lit component via dependency loader
   - Renders palette
```

---

### Scenario 3: Multiple Blocks on One Page (Future)

**URL**: `https://example.com/express/colors/compare`

```
1. Page loads
2. color-palette-block decorates
   - Loads API via dependency loader (first call)
   - Loads color-palette Lit component
   - Renders palettes
3. color-trends-block decorates
   - Loads API via dependency loader (cached, no network call)
   - Loads color-chart Lit component
   - Renders trends
```

**Result**: API called once, both blocks use cached data.

---

## Migration Path

### Phase 1: Add Services (Current)
- Create `createPageInitService.js`
- Create `createDependencyLoader.js`
- Document architecture

### Phase 2: Update search-marquee
- Remove API calls (if any)
- Add deep link support
- Dispatch `color:init` event

### Phase 3: Update color-explore
- Listen for `color:init`
- Use dependency loader for API
- Remove direct API calls

### Phase 4: Update Other Blocks
- Use dependency loader consistently
- Add deep link support where needed

---

## Testing

### Test Deep Links

```javascript
// Explore page with query
window.location.href = '/express/colors?q=blue';

// Explore page with filters
window.location.href = '/express/colors?category=nature&mood=calm';

// Extract page (no params)
window.location.href = '/express/colors/extract';
```

### Test Dependency Loading

```javascript
import { globalDependencyLoader } from './createDependencyLoader.js';

// Check if API loaded
console.log('API loaded:', globalDependencyLoader.isApiLoaded());

// Check if Lit loaded
console.log('Lit loaded:', globalDependencyLoader.isLitLoaded('color-palette'));
```

### Test Event Flow

```javascript
// Listen for initialization
document.addEventListener('color:init', (e) => {
  console.log('Init event:', e.detail);
});

// Listen for search
document.addEventListener('search:query', (e) => {
  console.log('Search event:', e.detail);
});
```

---

## Summary

### Responsibilities by Component

| Component | API Calls | Lit Loading | Deep Links | Rendering |
|-----------|-----------|-------------|------------|-----------|
| **search-marquee** | ❌ NO | ❌ NO | ✅ YES (read params) | ❌ NO (input only) |
| **color-explore** | ✅ YES | ✅ YES | ✅ YES (listen for init) | ✅ YES |
| **color-extract** | ❌ NO (user-triggered) | ✅ YES | ❌ NO | ✅ YES |
| **color-wheel** | ❌ NO | ✅ YES | ❌ NO | ✅ YES |
| **contrast-checker** | ❌ NO | ✅ YES | ❌ NO | ✅ YES |

### Key Patterns

1. **search-marquee**: LCP + input handler + deep link dispatcher
2. **color-explore**: Event listener + API loader + renderer
3. **Other blocks**: Self-contained + dependency loader + renderer

### Scalability Guarantees

- ✅ Blocks can be composed in any combination
- ✅ Dependencies load once and are shared
- ✅ Deep links work automatically
- ✅ No tight coupling between blocks
- ✅ Easy to add new blocks or pages
