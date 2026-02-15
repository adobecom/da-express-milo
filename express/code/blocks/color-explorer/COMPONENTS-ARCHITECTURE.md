# 🏗️ Components Architecture - Placement & Responsibility

## 📋 **Architecture Decisions Summary**

| Component | Location | Used By | Reason |
|-----------|----------|---------|--------|
| **Search** | `components/` (shared) | Palettes, Gradients | Reusable across variants |
| **Filters** | `components/` (shared) | Palettes, Gradients | Reusable across variants |
| **Load More** | `components/` (shared) | Palettes, Gradients | Reusable but **controlled by renderers** |
| **Color Wheel Modal** | `components/` (shared) | All variants | Reusable modal with Lit wheel |

---

## 🎯 **Load More - Key Decision**

### **Question: Entry Point or Renderer?**

**✅ ANSWER: Included in Renderers (NOT entry point)**

### **Why?**

```javascript
// ❌ BAD: Entry point managing pagination
export default async function decorate(block) {
  // Entry point shouldn't know about pagination details
  renderer.render(block);
  
  const loadMoreBtn = createLoadMoreButton(); // ← Wrong place!
  block.appendChild(loadMoreBtn);
}
```

```javascript
// ✅ GOOD: Renderer managing its own pagination
export function createGradientsRenderer(options) {
  function render(container) {
    const grid = createGrid();
    
    // Each renderer controls its own pagination
    const loadMore = createLoadMoreComponent({
      remaining: 10,
      onLoadMore: () => loadMoreItems(),
    });
    
    container.appendChild(grid);
    container.appendChild(loadMore.element); // ← Right place!
  }
}
```

### **Reasoning:**

1. **Variant-Specific Behavior**
   - Palettes may load 24, show 10 more
   - Gradients may load 24, show 10 more
   - Extract has no pagination
   - Different variants = different logic

2. **Renderer Controls Data**
   - Renderer knows current state
   - Renderer fetches more data
   - Renderer updates grid
   - Entry point stays simple

3. **Separation of Concerns**
   - Entry point: Orchestration
   - Renderer: Rendering & pagination
   - Component: UI & events

4. **Flexibility**
   - Each renderer can customize button
   - Different page sizes per variant
   - Easy to add infinite scroll later

---

## 📁 **File Structure**

```
express/code/blocks/color-explorer-hybrid/
│
├── color-explorer-hybrid.js           [ENTRY POINT]
│   └─→ Orchestrates, no UI components
│
├── components/                        [SHARED COMPONENTS]
│   ├── createSearchComponent.js       ← Wraps Lit <color-search>
│   ├── createFiltersComponent.js      ← Vanilla dropdowns
│   ├── createLoadMoreComponent.js     ← Vanilla button
│   └── createColorWheelModal.js       ← Modal with Lit <color-wheel>
│
├── renderers/
│   ├── createStripsRenderer.js        [USES: Search, Filters, LoadMore]
│   ├── createGradientsRenderer.js     [USES: Search, Filters, LoadMore]
│   └── createExtractRenderer.js       [USES: ColorWheelModal only]
│
└── adapters/
    └── litComponentAdapters.js        [LIT WRAPPERS]
        ├── createPaletteAdapter()     ← <color-palette>
        ├── createSearchAdapter()      ← <color-search>
        └── createColorWheelAdapter()  ← <color-wheel>
```

---

## 🔄 **Component Flow - Palettes/Gradients**

```
Entry Point
    │
    ├─→ Creates Renderer
    │
    ▼
Renderer
    │
    ├─→ createSearchComponent()        [Shared Component]
    │   └─→ createSearchAdapter()      [Lit Wrapper]
    │       └─→ <color-search>         [Lit Component]
    │
    ├─→ createFiltersComponent()       [Shared Component]
    │   └─→ Vanilla dropdowns
    │
    ├─→ createGrid()
    │   └─→ createPaletteCard()
    │       └─→ createPaletteAdapter() [Lit Wrapper]
    │           └─→ <color-palette>    [Lit Component]
    │
    └─→ createLoadMoreComponent()      [Shared Component]
        └─→ Vanilla button
        └─→ Calls renderer.loadMore()
```

---

## 🎨 **Component Usage Matrix**

| Component | Strips (Palettes) | Gradients | Extract |
|-----------|-------------------|-----------|---------|
| **Search** | ✅ Yes | ✅ Yes | ❌ No |
| **Filters** | ✅ Yes | ✅ Yes | ❌ No |
| **Load More** | ✅ Yes (24→34) | ✅ Yes (24→34) | ❌ No |
| **Color Wheel Modal** | ⚠️ Optional | ✅ Yes (edit) | ✅ Yes (adjust) |
| **Palette Cards** | ✅ Yes (Lit) | ❌ No | ⚠️ Maybe (results) |
| **Gradient Cards** | ❌ No | ✅ Yes (custom) | ❌ No |
| **Upload UI** | ❌ No | ❌ No | ✅ Yes |

---

## 📝 **Usage Examples**

### **Example 1: Strips Renderer**

```javascript
// renderers/createStripsRenderer.js

import { createSearchComponent } from '../components/createSearchComponent.js';
import { createFiltersComponent } from '../components/createFiltersComponent.js';
import { createLoadMoreComponent } from '../components/createLoadMoreComponent.js';

export function createStripsRenderer(options) {
  const base = createBaseRenderer(options);
  
  let searchComponent;
  let filtersComponent;
  let loadMoreComponent;
  
  function render(container) {
    // 1. Search
    searchComponent = createSearchComponent({
      onSearch: (query) => handleSearch(query),
    });
    
    // 2. Filters
    filtersComponent = createFiltersComponent({
      variant: 'strips',
      onFilterChange: (filters) => handleFilterChange(filters),
    });
    
    // 3. Grid
    const grid = createPalettesGrid();
    
    // 4. Load More
    loadMoreComponent = createLoadMoreComponent({
      remaining: 10,
      onLoadMore: async () => {
        const moreData = await fetchMore();
        appendToGrid(moreData);
        loadMoreComponent.updateRemaining(0);
      },
    });
    
    // Assemble
    container.appendChild(searchComponent.element);
    container.appendChild(filtersComponent.element);
    container.appendChild(grid);
    container.appendChild(loadMoreComponent.element);
  }
  
  return { ...base, render };
}
```

### **Example 2: Gradients Renderer**

```javascript
// renderers/createGradientsRenderer.js

import { createSearchComponent } from '../components/createSearchComponent.js';
import { createFiltersComponent } from '../components/createFiltersComponent.js';
import { createLoadMoreComponent } from '../components/createLoadMoreComponent.js';
import { createColorWheelModal } from '../components/createColorWheelModal.js';

export function createGradientsRenderer(options) {
  const base = createBaseRenderer(options);
  
  let modal;
  
  function render(container) {
    // Same structure as Strips
    const searchComponent = createSearchComponent({ /* ... */ });
    const filtersComponent = createFiltersComponent({ variant: 'gradients' });
    const grid = createGradientsGrid();
    const loadMoreComponent = createLoadMoreComponent({ /* ... */ });
    
    // Create modal for editing
    modal = createColorWheelModal({
      modalType: 'full-screen',
      onSave: (color) => updateGradient(color),
    });
    
    // Assemble
    container.appendChild(searchComponent.element);
    container.appendChild(filtersComponent.element);
    container.appendChild(grid);
    container.appendChild(loadMoreComponent.element);
  }
  
  return { ...base, render };
}
```

### **Example 3: Extract Renderer**

```javascript
// renderers/createExtractRenderer.js

import { createColorWheelModal } from '../components/createColorWheelModal.js';

export function createExtractRenderer(options) {
  const base = createBaseRenderer(options);
  
  function render(container) {
    // NO search, filters, or load more
    
    // Just upload UI
    const uploadZone = createUploadZone();
    const resultsGrid = createResultsGrid();
    
    // Modal for adjusting
    const modal = createColorWheelModal({
      modalType: 'drawer',
      onSave: (color) => updateExtractedColor(color),
    });
    
    container.appendChild(uploadZone);
    container.appendChild(resultsGrid);
  }
  
  return { ...base, render };
}
```

---

## 🎯 **Benefits of This Architecture**

### **1. Reusability**
✅ Components used by multiple renderers  
✅ Write once, use everywhere  
✅ Consistent UI across variants

### **2. Flexibility**
✅ Each renderer controls its own layout  
✅ Easy to add/remove components  
✅ Variant-specific customization

### **3. Separation of Concerns**
✅ Entry point: Orchestration only  
✅ Renderers: Layout & behavior  
✅ Components: Reusable UI pieces  
✅ Adapters: Lit integration

### **4. Maintainability**
✅ Clear file structure  
✅ Easy to find components  
✅ Simple to update shared components

---

## 📊 **Load More - Detailed Flow**

```
User Clicks "Load More"
    │
    ├─→ LoadMoreComponent emits event
    │
    ▼
Renderer's onLoadMore callback
    │
    ├─→ Fetch more data (or use cached)
    │   └─→ dataService.fetch({ offset: 24, limit: 10 })
    │
    ├─→ Append new cards to grid
    │   └─→ createGradientCard() × 10
    │
    └─→ Update LoadMoreComponent
        ├─→ updateRemaining(0)  // No more items
        └─→ Button hides automatically
```

---

## ✅ **Summary**

**Load More Placement:** ✅ **In Renderers**

**Why?**
- Pagination is variant-specific
- Renderer controls data flow
- Entry point stays simple
- Maximum flexibility

**Components Are:**
- ✅ Shared & reusable
- ✅ Controlled by renderers
- ✅ Wrap Lit components via adapters
- ✅ Emit events, don't manage state

**This Architecture:**
- ✅ Scales well
- ✅ Easy to understand
- ✅ Simple to extend
- ✅ Follows functional patterns
