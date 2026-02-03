# Data Service Architecture - On-Demand Loading Pattern

## Overview

Just like Lit components load on-demand, **Data Services are created only when blocks need them**. Each page loads only the data it needs, when it needs it.

**Related Documentation:**
- For deep link handling and event-driven initialization, see `INITIALIZATION_ARCHITECTURE.md`
- For dependency deduplication across blocks, see `createDependencyLoader.js`
- For URL param parsing, see `createPageInitService.js`

---

## Parallel Patterns

### Lit Components (On-Demand)

```
Page loads → Block loads → Renderer needs component → 
  Adapter called → Lit component imported → Lit library loads
```

**Result:** Lit loads ONLY if page uses Lit components

---

### Data Service (On-Demand)

```
Page loads → Block loads → Block needs data → 
  Service created → API called → Data cached
```

**Result:** API called ONLY if page needs data

---

## Per-Page Data Loading

### 1. **Explore Page** (search-marquee + color-explore)

```javascript
// search-marquee block
import { createPageInitService } from '../../scripts/color-shared/services/createPageInitService.js';

export default async function decorate(block) {
  const initService = createPageInitService();
  const initialState = initService.getInitialState();

  const searchInput = document.createElement('input');
  searchInput.value = initialState.query;
  block.appendChild(searchInput);

  if (initialState.hasParams) {
    initService.initialize();
  }
}

// color-explore block
import { createColorDataService } from '../../scripts/color-shared/services/createColorDataService.js';
import { globalDependencyLoader } from '../../scripts/color-shared/services/createDependencyLoader.js';

export default async function decorate(block) {
  const dataService = createColorDataService({
    variant: 'strips',
    initialLoad: 24,
  });

  document.addEventListener('color:init', async (e) => {
    const { query } = e.detail;
    const data = await globalDependencyLoader.loadApi(dataService);
    const results = query ? await dataService.search(query) : data;
    renderer.render(container);
  });

  const initService = createPageInitService();
  if (!initService.hasDeepLinkParams()) {
    const data = await globalDependencyLoader.loadApi(dataService);
    renderer.render(container);
  }
}
```

**API Calls:**
- search-marquee: ❌ NO API call (handles input only, reads URL params)
- color-explore: ✅ YES - One API call (deduplicated via dependency loader)

**Deep Link Flow:**
1. URL has `?q=blue` → search-marquee dispatches `color:init`
2. color-explore listens for `color:init` → loads API → searches → renders

**Normal Flow:**
1. No URL params → color-explore loads API immediately → renders

**Result:** Explore page makes 1 API call (deduplicated by dependency loader)

---

### 2. **Extract Page** (color-extract only)

```javascript
// color-extract block
export default async function decorate(block) {
  // NO data service created on page load
  // Data service created ONLY when user uploads image
  
  renderer.on('image-upload', async (imageData) => {
    // Service created on-demand when extraction happens
    const extractionService = createColorExtractionService();
    const colors = await extractionService.extractColors(imageData);
  });
}
```

**API Calls:**
- Page load: ❌ NO API call
- Image upload: ✅ YES - One API call for color extraction

**Result:** Extract page makes 0 API calls on initial load

---

### 3. **Color Wheel Page** (color-wheel only)

```javascript
// color-wheel block
export default async function decorate(block) {
  // NO data service needed
  // Pure client-side color manipulation
  // No API calls
  
  const renderer = createColorWheelRenderer({
    initialColor: '#FF0000',
    onColorChange: (color) => {
      // All processing is client-side
    }
  });
}
```

**API Calls:**
- Page load: ❌ NO API call
- User interaction: ❌ NO API call (all client-side)

**Result:** Color Wheel page makes 0 API calls (pure client-side tool)

---

### 4. **Contrast Checker Page** (contrast-checker only)

```javascript
// contrast-checker block
export default async function decorate(block) {
  // NO data service needed
  // Pure client-side WCAG calculation
  
  const renderer = createContrastCheckerRenderer({
    onCheck: (fg, bg) => {
      const ratio = calculateContrast(fg, bg);
      // All WCAG validation is client-side
    }
  });
}
```

**API Calls:**
- Page load: ❌ NO API call
- Contrast check: ❌ NO API call (all client-side)

**Result:** Contrast Checker makes 0 API calls (utility tool)

---

### 5. **Color Blindness Page** (color-blindness only)

```javascript
// color-blindness block
export default async function decorate(block) {
  // NO data service needed
  // Pure client-side color simulation
  
  const renderer = createColorBlindnessRenderer({
    onSimulate: (palette, type) => {
      const simulated = simulateColorBlindness(palette, type);
      // All simulation is client-side
    }
  });
}
```

**API Calls:**
- Page load: ❌ NO API call
- Simulation: ❌ NO API call (all client-side)

**Result:** Color Blindness page makes 0 API calls (simulation tool)

---

## Data Service Features

### 1. **Created On-Demand**

```javascript
// In block's decorate function
const dataService = createColorDataService({
  variant: config.variant,  // 'strips' or 'gradients'
  initialLoad: 24,
});
```

Service is created ONLY when block needs data.

### 1.5. **Global Deduplication (New)**

```javascript
import { globalDependencyLoader } from './createDependencyLoader.js';

// First block calls this
const data1 = await globalDependencyLoader.loadApi(dataService);

// Second block calls this (returns cached, no duplicate API call)
const data2 = await globalDependencyLoader.loadApi(dataService);
```

**Prevents:**
- Duplicate API calls across multiple blocks
- Race conditions when multiple blocks load simultaneously
- Wasted bandwidth

**Use Case:** If multiple blocks need data on same page, API is called once and shared.

---

### 2. **Promise Queue (Prevents Race Conditions)**

```javascript
async function fetch(filters = {}) {
  // If fetch already in progress, return same promise
  if (fetchPromise) {
    return fetchPromise;  // No duplicate API calls!
  }
  
  fetchPromise = (async () => {
    // ... fetch logic ...
  })();
  
  return fetchPromise;
}
```

**Prevents:**
- Duplicate API calls
- Race conditions
- Wasted bandwidth

---

### 3. **Automatic Caching**

```javascript
async function fetch(filters = {}) {
  // Return cached data if available
  if (cache && !filters.forceRefresh) {
    return cache;  // No API call needed!
  }
  
  // Fetch and cache
  const data = await apiCall();
  cache = data;
  return data;
}
```

**Benefits:**
- First call: Fetches from API
- Subsequent calls: Returns cached data instantly
- Manual refresh: Use `forceRefresh: true`

---

### 4. **Mock Data Fallback**

```javascript
async function fetch(filters = {}) {
  const isLocalhost = window.location.hostname === 'localhost' 
    || window.location.hostname.includes('.aem.page');

  if (isLocalhost || !config.apiEndpoint) {
    // Use mock data for development
    return getMockData(config.variant);
  }
  
  try {
    // Try API call
    const response = await window.fetch(apiEndpoint);
    return await response.json();
  } catch (error) {
    // Fallback to mock data on error
    return getMockData(config.variant);
  }
}
```

**Benefits:**
- Works in localhost without API
- Works in AEM preview without API
- Graceful degradation on API errors

---

## API Call Summary

| Page | API Calls on Load | API Calls on User Action | Total (Initial) |
|------|-------------------|-------------------------|-----------------|
| **Explore** | 1 (color-explore) | Search/filter (cached) | **1** |
| **Extract** | 0 | 1 (on image upload) | **0** |
| **Color Wheel** | 0 | 0 (client-side only) | **0** |
| **Contrast Checker** | 0 | 0 (client-side only) | **0** |
| **Color Blindness** | 0 | 0 (client-side only) | **0** |

---

## Performance Implications

### Explore Page

**Initial Load:**
```
HTML → CSS → JS → Block init → Data service created → API call (1)
```

**Search/Filter:**
```
User types → Client-side filter on cached data → No API call
```

**Load More:**
```
User clicks → Returns more from cache OR API call if needed
```

---

### Other Pages

**Initial Load:**
```
HTML → CSS → JS → Block init → No data service needed → 0 API calls
```

**User Actions:**
- Extract: Upload image → API call for extraction
- Color Wheel: Change color → Client-side only
- Contrast Checker: Check contrast → Client-side only
- Color Blindness: Simulate → Client-side only

---

## Shared Pattern: On-Demand Architecture

### Both Lit and Data Services Follow:

1. **Lazy Loading**
   - Lit: Loads when first component needed
   - Data: Fetches when first data needed

2. **Single Instance**
   - Lit: One `lit-all.min.js` shared across components
   - Data: One cache shared across operations

3. **No Overhead**
   - Lit: Pages without Lit components don't load library
   - Data: Pages without data needs don't call API

4. **Performance First**
   - Lit: Dynamic imports, browser caching
   - Data: Promise queue, client-side caching

5. **Graceful Degradation**
   - Lit: Falls back to vanilla JS if import fails
   - Data: Falls back to mock data if API fails

---

## Example Timeline: Explore Page (With Deep Link)

```
URL: /express/colors?q=sunset

1. Page load (HTML)
   └─ No Lit loaded yet
   └─ No API called yet

2. Franklin loads blocks:
   ├─ search-marquee.js
   └─ color-explore.js

3. search-marquee initializes:
   └─ Reads URL params (?q=sunset)
   └─ Sets input value to "sunset"
   └─ Dispatches 'color:init' event
   └─ No API call
   └─ No Lit components yet

4. color-explore initializes:
   └─ Creates data service (first time)
   └─ Sets up event listener for 'color:init'
   └─ Does NOT call API yet (waiting for event)

5. color-explore receives 'color:init' event:
   └─ Calls globalDependencyLoader.loadApi()
   └─ First and ONLY API call on page load
   └─ Data cached globally

6. Data service searches for "sunset":
   └─ Filters cached data client-side
   └─ No additional API call

7. Renderer creates palette cards:
   └─ createPaletteAdapter() called
   └─ Dynamically imports <color-palette>
   └─ Lit library loads (first time)

8. Palette cards render:
   └─ Uses cached data (no new API call)
   └─ Uses cached Lit (no new import)

9. User types new search:
   └─ Filters cached data client-side
   └─ No API call needed
   └─ Instant results

10. User loads more:
    └─ Returns more from cache OR
    └─ Makes new API call if cache exhausted
```

## Example Timeline: Explore Page (No Deep Link)

```
URL: /express/colors

1. Page load (HTML)
   └─ No Lit loaded yet
   └─ No API called yet

2. Franklin loads blocks:
   ├─ search-marquee.js
   └─ color-explore.js

3. search-marquee initializes:
   └─ Reads URL params (none)
   └─ Sets up empty search input
   └─ Does NOT dispatch 'color:init' (no params)
   └─ No API call

4. color-explore initializes:
   └─ Creates data service (first time)
   └─ Sets up event listener for 'color:init'
   └─ Detects no deep link params
   └─ Calls globalDependencyLoader.loadApi() immediately
   └─ First and ONLY API call on page load
   └─ Data cached globally

5. Renderer creates palette cards:
   └─ createPaletteAdapter() called
   └─ Dynamically imports <color-palette>
   └─ Lit library loads (first time)

6. Palette cards render:
   └─ Displays all palettes
   └─ Uses cached data
   └─ Uses cached Lit

7. User types in search:
   └─ Filters cached data client-side
   └─ Instant results
```

---

## Best Practices

### 1. **Create Services Only When Needed**

```javascript
// ✅ GOOD - Create when block needs data
export default async function decorate(block) {
  const service = createColorDataService(config);
  const data = await service.fetchData();
}

// ❌ BAD - Create services globally/eagerly
const globalService = createColorDataService();
export default async function decorate(block) {
  // Service created even if block never loads
}
```

---

### 2. **Use Caching for Repeat Operations**

```javascript
// ✅ GOOD - Leverage cache for searches
renderer.on('search', async (query) => {
  const results = dataService.search(query);  // Uses cache
});

// ❌ BAD - Re-fetch for every search
renderer.on('search', async (query) => {
  const results = await dataService.fetchData({ q: query });  // New API call!
});
```

---

### 3. **Don't Create Services for Client-Side Tools**

```javascript
// ✅ GOOD - Color wheel is pure client-side
export default async function decorate(block) {
  const renderer = createColorWheelRenderer({ ... });
  // No data service needed
}

// ❌ BAD - Unnecessary service creation
export default async function decorate(block) {
  const service = createColorDataService();  // Why?
  const renderer = createColorWheelRenderer({ ... });
}
```

---

## Summary

### On-Demand Architecture

Both **Lit components** and **Data Services** use the same principle:

**Load only when needed, share when possible, cache for performance.**

### New: Event-Driven Initialization

**search-marquee** (LCP, input only):
- ✅ Reads URL params for deep links
- ✅ Dispatches `color:init` event with parsed state
- ❌ NO API calls
- ❌ NO data service
- ❌ NO rendering

**color-explore** (data + rendering):
- ✅ Listens for `color:init` event (deep link coordination)
- ✅ Creates data service and loads API via dependency loader
- ✅ Renders results with Lit components
- ✅ Handles all search/filter/load-more operations

**Other blocks** (autonomous):
- ✅ Self-contained, own their dependencies
- ✅ Use dependency loader for deduplication
- ✅ Load API/Lit only when needed

### API Efficiency

- **Explore (with deep link):** 1 API call (triggered by event, deduplicated)
- **Explore (no deep link):** 1 API call (immediate load, deduplicated)
- **Extract:** 0 on load, 1 on upload (user-triggered)
- **Color Wheel:** 0 (pure client-side)
- **Contrast Checker:** 0 (pure client-side)
- **Color Blindness:** 0 (pure client-side)

### Result

Each page is optimized for its specific use case. No unnecessary overhead, no wasted API calls, fast performance. Event-driven coordination enables scalable multi-block composition.
