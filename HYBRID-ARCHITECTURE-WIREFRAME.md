# 🏗️ Hybrid Architecture Wireframe

**Branch:** MWPW-185804-hybrid  
**Strategy:** Functional Factory + Lit Components  
**Approach:** One variant at a time

---

## 📐 **Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│  color-explorer.js (Entry Point)                        │
│  • Parse authoring config (variant, settings)           │
│  • Determine which variant to render                    │
│  • Create appropriate renderer via factory              │
│  • Handle global events & cleanup                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  factory/createColorRenderer.js  │
        │  • Registry of variants          │
        │  • Route to correct renderer     │
        │  • Merge default configs         │
        └─────────────────────────────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ STRIPS   │   │GRADIENTS │   │ EXTRACT  │
    │ Renderer │   │ Renderer │   │ Renderer │
    └──────────┘   └──────────┘   └──────────┘
         │              │              │
         │ Each uses:   │              │
         │ • Base       │              │
         │ • Adapters   │              │
         │ • Services   │              │
         └──────────────┴──────────────┘
                     │
                     ▼
         ┌────────────────────────┐
         │  Lit Web Components    │
         │  (via Adapters)        │
         └────────────────────────┘
```

---

## 📂 **File Structure**

```
express/code/blocks/color-explorer/
│
├── 📄 color-explorer.js               [ENTRY POINT]
│   └─→ Responsibility: Parse config, create renderer, handle lifecycle
│
├── 📁 factory/
│   └── 📄 createColorRenderer.js      [ROUTER]
│       └─→ Responsibility: Variant selection & renderer creation
│
├── 📁 adapters/                       [NEW - LIT WRAPPERS]
│   ├── 📄 litComponentAdapters.js     
│   │   └─→ Responsibility: Wrap Lit components in functional API
│   │   └─→ Functions: createPaletteAdapter(), createSearchAdapter(), etc.
│   │
│   └── 📄 stateAdapter.js
│       └─→ Responsibility: Bridge ColorThemeController + BlockMediator
│
├── 📁 renderers/
│   ├── 📄 createBaseRenderer.js       [SHARED BASE]
│   │   └─→ Responsibility: Common utilities, event system
│   │
│   ├── 📄 createStripsRenderer.js     [VARIANT 1 - START HERE]
│   │   └─→ Responsibility: Palette strips grid with Lit <color-palette>
│   │   └─→ Uses: <color-palette>, <color-search>
│   │   └─→ Layout: Grid of palette cards
│   │
│   ├── 📄 createGradientsRenderer.js  [VARIANT 2 - NEXT]
│   │   └─→ Responsibility: Gradient cards with custom UI
│   │   └─→ Uses: <ac-color-swatch> for palette colors
│   │   └─→ Layout: Custom gradient cards in 3-col grid
│   │
│   └── 📄 createExtractRenderer.js    [VARIANT 3 - LAST]
│       └─→ Responsibility: Image upload + color extraction
│       └─→ Uses: <color-wheel>, <color-palette>, <ac-brand-libraries-color-picker>
│       └─→ Layout: Upload zone + results
│
├── 📁 services/
│   ├── 📄 createColorDataService.js   [DATA LAYER]
│   │   └─→ Responsibility: Fetch, cache, filter data
│   │   └─→ API endpoints: /api/color/palettes, /api/color/gradients
│   │
│   └── 📄 createLibrariesService.js   [NEW - ADOBE INTEGRATION]
│       └─→ Responsibility: Save to Adobe Libraries
│       └─→ Authentication & API calls
│
└── 📁 modal/
    └── 📄 createColorModalManager.js  [MODAL SYSTEM]
        └─→ Responsibility: Full-screen/drawer modals
        └─→ Uses: <color-wheel> for editing
```

---

## 🎯 **Phase 1: Strips Variant (Start Here)**

### **Why Strips First?**
- ✅ Simplest variant (just display palettes)
- ✅ Direct 1:1 mapping to Lit `<color-palette>` component
- ✅ Already exists in color-poc
- ✅ Validates adapter pattern quickly

### **File Responsibilities:**

#### **1. Entry Point**
**File:** `color-explorer.js`

```javascript
// WIREFRAME - Entry Point Structure

// Imports
import { createColorRenderer } from './factory/createColorRenderer.js';
import { createColorDataService } from './services/createColorDataService.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

// Entry Point Flow:
export default async function decorate(block) {
  // 1. Parse config from authoring
  const config = parseConfig(block);
  
  // 2. Fetch data for variant
  const dataService = createColorDataService(config);
  const data = await dataService.fetch();
  
  // 3. Create renderer via factory
  const renderer = createColorRenderer(config.variant, {
    data,
    config,
    dataService,
  });
  
  // 4. Render to DOM
  renderer.render(block);
  
  // 5. Set up event listeners
  setupGlobalEvents(renderer);
}
```

**Responsibilities:**
- ✅ Parse authoring config
- ✅ Orchestrate services & renderer
- ✅ Handle global lifecycle
- ❌ NO rendering logic (delegates to renderer)
- ❌ NO direct DOM manipulation

---

#### **2. Factory**
**File:** `factory/createColorRenderer.js`

```javascript
// WIREFRAME - Factory Structure

import { createStripsRenderer } from '../renderers/createStripsRenderer.js';
import { createGradientsRenderer } from '../renderers/createGradientsRenderer.js';
import { createExtractRenderer } from '../renderers/createExtractRenderer.js';

// Registry Pattern
const RENDERER_REGISTRY = {
  strips: {
    create: createStripsRenderer,
    defaultConfig: { /* ... */ },
  },
  gradients: {
    create: createGradientsRenderer,
    defaultConfig: { /* ... */ },
  },
  extract: {
    create: createExtractRenderer,
    defaultConfig: { /* ... */ },
  },
};

// Factory Function
export function createColorRenderer(variant, options) {
  // 1. Lookup variant in registry
  const entry = RENDERER_REGISTRY[variant] || RENDERER_REGISTRY.strips;
  
  // 2. Merge configs
  const finalConfig = { ...entry.defaultConfig, ...options.config };
  
  // 3. Create & return renderer
  return entry.create({ ...options, config: finalConfig });
}
```

**Responsibilities:**
- ✅ Route to correct renderer
- ✅ Merge configurations
- ✅ Return renderer instance
- ❌ NO rendering logic
- ❌ NO business logic

---

#### **3. Adapter Layer (NEW)**
**File:** `adapters/litComponentAdapters.js`

```javascript
// WIREFRAME - Adapter Structure

/**
 * Purpose: Wrap Lit components in functional API
 * Pattern: Each adapter returns an object with:
 *   - element: The DOM element
 *   - Methods: Functional API (update, destroy, etc.)
 *   - Events: Converted to callbacks
 */

// Example: Color Palette Adapter
export function createPaletteAdapter(paletteData, callbacks = {}) {
  // 1. Import Lit component (dynamic)
  import('../../../libs/color-components/components/color-palette/index.js');
  
  // 2. Create element
  const element = document.createElement('color-palette');
  
  // 3. Set properties
  element.palette = paletteData;
  
  // 4. Convert Lit events → callbacks
  element.addEventListener('ac-palette-select', (e) => {
    callbacks.onSelect?.(e.detail.palette);
  });
  
  // 5. Return functional API
  return {
    element,                          // DOM element to append
    update: (newData) => { /* ... */ },  // Update data
    destroy: () => { /* ... */ },        // Cleanup
  };
}

// Example: Search Adapter
export function createSearchAdapter(callbacks = {}) {
  // Similar pattern...
}
```

**Responsibilities:**
- ✅ Import Lit components dynamically
- ✅ Convert Lit events to functional callbacks
- ✅ Provide functional API (update, destroy)
- ✅ Hide Lit implementation details
- ❌ NO layout logic
- ❌ NO business logic

---

#### **4. Strips Renderer (PHASE 1 FOCUS)**
**File:** `renderers/createStripsRenderer.js`

```javascript
// WIREFRAME - Strips Renderer Structure

import { createBaseRenderer } from './createBaseRenderer.js';
import { createPaletteAdapter, createSearchAdapter } from '../adapters/litComponentAdapters.js';
import { createTag } from '../../../scripts/utils.js';

export function createStripsRenderer(options) {
  // 1. Get base functionality
  const base = createBaseRenderer(options);
  const { getData, emit } = base;
  
  // 2. Private state
  let gridElement = null;
  let searchAdapter = null;
  const paletteAdapters = [];
  
  // 3. Create search UI (Lit component via adapter)
  function createSearchUI() {
    searchAdapter = createSearchAdapter({
      onSearch: (query) => emit('search', { query }),
    });
    
    const container = createTag('div', { class: 'search-container' });
    container.appendChild(searchAdapter.element);
    return container;
  }
  
  // 4. Create palette card (Lit component via adapter)
  function createPaletteCard(palette) {
    const adapter = createPaletteAdapter(palette, {
      onSelect: (selectedPalette) => emit('palette-click', selectedPalette),
    });
    
    paletteAdapters.push(adapter);
    return adapter.element;
  }
  
  // 5. Create grid layout (vanilla DOM)
  function createGrid() {
    const grid = createTag('div', { class: 'color-grid palettes-grid' });
    
    const data = getData();
    data.forEach((palette) => {
      const card = createPaletteCard(palette);
      grid.appendChild(card);
    });
    
    return grid;
  }
  
  // 6. Render function (orchestration)
  function render(container) {
    container.innerHTML = '';
    
    // Layout: Search + Grid
    const searchUI = createSearchUI();
    gridElement = createGrid();
    
    container.appendChild(searchUI);
    container.appendChild(gridElement);
  }
  
  // 7. Update function
  function update(newData) {
    // Re-render or update adapters
  }
  
  // 8. Cleanup function
  function destroy() {
    searchAdapter?.destroy();
    paletteAdapters.forEach(a => a.destroy());
  }
  
  // 9. Return public API
  return {
    ...base,
    render,
    update,
    destroy,
  };
}
```

**Responsibilities:**
- ✅ Layout & orchestration
- ✅ Use adapters for Lit components
- ✅ Handle variant-specific logic
- ✅ Emit events for interactions
- ❌ NO direct Lit component usage (via adapters only)
- ❌ NO data fetching (uses service)

---

#### **5. Base Renderer (Shared)**
**File:** `renderers/createBaseRenderer.js`

```javascript
// WIREFRAME - Base Renderer Structure

export function createBaseRenderer(options) {
  const { data, config } = options;
  
  // 1. Shared state
  let currentData = data;
  const eventListeners = {};
  
  // 2. Event system
  function on(event, callback) { /* ... */ }
  function emit(event, detail) { /* ... */ }
  
  // 3. Data access
  function getData() { return currentData; }
  function setData(newData) { currentData = newData; }
  
  // 4. Common utilities
  function createCard(item) { /* Placeholder */ }
  function createGrid() { /* Placeholder */ }
  
  // 5. Return shared API
  return {
    on,
    emit,
    getData,
    setData,
    createCard,
    createGrid,
    config,
  };
}
```

**Responsibilities:**
- ✅ Event system (on/emit)
- ✅ Data management
- ✅ Common utilities
- ✅ Shared between all renderers
- ❌ NO rendering (renderers override)

---

#### **6. Data Service**
**File:** `services/createColorDataService.js`

```javascript
// WIREFRAME - Data Service Structure

export function createColorDataService(config) {
  // 1. Cache
  let cache = null;
  
  // 2. Fetch data
  async function fetch(filters = {}) {
    // Check cache
    if (cache) return cache;
    
    // Fetch from API or mock
    const endpoint = config.apiEndpoint;
    const data = await fetchData(endpoint, filters);
    
    // Cache & return
    cache = data;
    return data;
  }
  
  // 3. Search
  function search(query) { /* ... */ }
  
  // 4. Filter
  function filter(criteria) { /* ... */ }
  
  // 5. Return API
  return {
    fetch,
    search,
    filter,
  };
}
```

**Responsibilities:**
- ✅ Data fetching
- ✅ Caching
- ✅ Search & filter
- ❌ NO rendering
- ❌ NO UI logic

---

## 📋 **Implementation Checklist - Phase 1 (Strips)**

### **Step 1: Foundation Files**
- [ ] Update `color-explorer.js` entry point
- [ ] Keep `factory/createColorRenderer.js` (minimal changes)
- [ ] Keep `renderers/createBaseRenderer.js` (minimal changes)

### **Step 2: Adapter Layer**
- [ ] Create `adapters/` folder
- [ ] Create `adapters/litComponentAdapters.js`
- [ ] Implement `createPaletteAdapter()` function
- [ ] Implement `createSearchAdapter()` function

### **Step 3: Strips Renderer**
- [ ] Update `renderers/createStripsRenderer.js`
- [ ] Use `createPaletteAdapter()` for cards
- [ ] Use `createSearchAdapter()` for search
- [ ] Test rendering

### **Step 4: Get Lit Components**
- [ ] Copy `libs/color-components/` from color-poc branch
- [ ] Verify imports work
- [ ] Test `<color-palette>` component loads

### **Step 5: Styling**
- [ ] Add CSS for strips variant
- [ ] Override Lit component styles if needed
- [ ] Match Figma design

### **Step 6: Test**
- [ ] Test strips variant loads
- [ ] Test search works
- [ ] Test palette selection
- [ ] Test no console errors

---

## 🎯 **Success Criteria - Phase 1**

✅ Strips variant renders using Lit `<color-palette>` components  
✅ Adapters successfully wrap Lit components  
✅ Search functionality works  
✅ Palette selection emits events  
✅ No console errors  
✅ Matches Figma design  
✅ Factory pattern maintained  

---

## 📝 **Notes**

- **Start with Strips only** - Get one variant working perfectly
- **Adapters isolate Lit** - Renderers never directly import Lit
- **Functional wrappers** - All Lit interactions through adapter API
- **Event-driven** - Components communicate via events
- **No rush** - Build solid foundation first

---

## 🔜 **Next Phases (After Strips Works)**

- **Phase 2:** Gradients Renderer (custom cards + Lit swatches)
- **Phase 3:** Extract Renderer (upload + Lit wheel)
- **Phase 4:** Modal integration (Lit wheel for editing)
- **Phase 5:** Adobe Libraries (save functionality)

---

**Ready to build?** Let's start with the wireframe files! 🚀
