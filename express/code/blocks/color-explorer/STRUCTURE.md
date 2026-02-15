# 📂 Color Explorer Hybrid - File Structure

**Status:** WIREFRAME - Structure files created  
**Phase:** 1 - Strips Variant Focus  
**Next:** Copy Lit components from color-poc branch

---

## 📁 Directory Tree

```
express/code/blocks/color-explorer-hybrid/
│
├── 📄 color-explorer-hybrid.js        ✅ CREATED (Entry Point)
│   │
│   └─→ Imports from:
│       ├── factory/createColorRenderer.js
│       ├── services/createColorDataService.js
│       └── scripts/block-mediator.min.js
│
├── 📁 factory/
│   └── 📄 createColorRenderer.js      ✅ CREATED (Router)
│       │
│       └─→ Imports from:
│           ├── renderers/createStripsRenderer.js
│           ├── renderers/createGradientsRenderer.js
│           └── renderers/createExtractRenderer.js
│
├── 📁 adapters/
│   └── 📄 litComponentAdapters.js     ✅ CREATED (Lit Wrappers)
│       │
│       └─→ Imports from:
│           └── libs/color-components/components/* (⚠️ NEED TO COPY)
│
├── 📁 renderers/
│   ├── 📄 createBaseRenderer.js       ✅ CREATED (Shared Base)
│   ├── 📄 createStripsRenderer.js     ✅ CREATED (Phase 1 - FOCUS)
│   ├── 📄 createGradientsRenderer.js  ✅ CREATED (Phase 2 - Placeholder)
│   └── 📄 createExtractRenderer.js    ✅ CREATED (Phase 3 - Placeholder)
│
├── 📁 services/
│   └── 📄 createColorDataService.js   ✅ CREATED (Data Layer)
│
├── 📄 color-explorer-hybrid.css       ⚠️ TODO (Styles)
│
└── 📄 STRUCTURE.md                    ✅ THIS FILE

```

---

## 🔗 Import Chain - Strips Variant

```
📄 color-explorer-hybrid.js (Entry Point)
    │
    ├─→ 📦 factory/createColorRenderer.js
    │       │
    │       └─→ 📦 renderers/createStripsRenderer.js
    │               │
    │               ├─→ 📦 renderers/createBaseRenderer.js
    │               │       └─→ BlockMediator (from scripts/)
    │               │
    │               └─→ 📦 adapters/litComponentAdapters.js
    │                       │
    │                       └─→ 🔴 libs/color-components/ (MISSING!)
    │                           ├── components/color-palette/
    │                           ├── components/color-search/
    │                           └── (need to copy from color-poc)
    │
    └─→ 📦 services/createColorDataService.js
```

---

## ⚠️ Missing Dependencies

### 🔴 Critical: Lit Components Library

**Need to copy from color-poc branch:**

```
express/code/libs/color-components/
├── components/
│   ├── color-palette/
│   │   └── index.js               (Used by createPaletteAdapter)
│   ├── color-search/
│   │   └── index.js               (Used by createSearchAdapter)
│   ├── color-wheel/
│   │   └── index.js               (Future: modal editing)
│   ├── ac-color-swatch/
│   │   └── index.js               (Future: gradient cards)
│   └── ... (14 other components)
├── controllers/
│   └── ColorThemeController.js    (Future: state management)
├── utils/
│   └── ColorConversions.js        (Future: color manipulation)
└── deps/
    ├── lit.js                     (Lit library)
    └── lit-all.min.js             (Full Lit bundle)
```

**Command to copy:**
```bash
# From color-poc branch
git checkout origin/color-poc -- express/code/libs/color-components/
```

---

## 📊 Data Flow - Strips Variant

```
1. User visits page
   │
   ↓
2. color-explorer-hybrid.js decorates block
   │
   ├─→ Parses config (variant: strips)
   ├─→ Creates data service
   ├─→ Fetches mock data (24 palettes)
   ├─→ Sets BlockMediator state
   │
   ↓
3. Factory creates Strips Renderer
   │
   ↓
4. Strips Renderer renders UI:
   │
   ├─→ createSearchUI()
   │   └─→ createSearchAdapter()
   │       └─→ <color-search> (Lit component)
   │
   ├─→ createFilters()
   │   └─→ Vanilla DOM (for now)
   │
   └─→ createPalettesGrid()
       └─→ For each palette:
           └─→ createPaletteCard()
               └─→ createPaletteAdapter()
                   └─→ <color-palette> (Lit component)
```

---

## 🎯 Phase 1 Status

### ✅ Completed
- [x] Entry point structure
- [x] Factory router
- [x] Adapter pattern design
- [x] Base renderer with shared utilities
- [x] Strips renderer wireframe
- [x] Data service with mock data
- [x] Gradients renderer placeholder
- [x] Extract renderer placeholder
- [x] File structure documentation

### ⚠️ In Progress
- [ ] Copy Lit components from color-poc
- [ ] Create CSS file
- [ ] Fix linter errors
- [ ] Test imports
- [ ] Create test HTML page

### 🔜 Next Steps
- [ ] Get Lit components working
- [ ] Implement actual rendering
- [ ] Add real styles
- [ ] Test in browser
- [ ] Add filters functionality

---

## 📝 Key Concepts

### **Adapter Pattern**
Every Lit component is wrapped in a functional adapter:
- **Input:** Data + callbacks
- **Output:** { element, update, destroy }
- **Benefit:** Renderers never directly touch Lit

### **Factory Pattern**
One entry point, multiple variants:
- Registry maps variants to renderers
- Configuration merged automatically
- Easy to add new variants

### **Composition Over Inheritance**
- Base renderer provides utilities
- Specific renderers compose with base
- No class hierarchies

---

## 🔍 File Responsibilities Quick Reference

| File | What It Does | What It Doesn't Do |
|------|-------------|-------------------|
| **color-explorer-hybrid.js** | Parse config, orchestrate | Render UI, fetch data |
| **factory/createColorRenderer.js** | Route to renderer | Contain business logic |
| **adapters/litComponentAdapters.js** | Wrap Lit in functional API | Layout, business logic |
| **renderers/createBaseRenderer.js** | Event system, utilities | Variant-specific rendering |
| **renderers/createStripsRenderer.js** | Layout, orchestration | Direct Lit usage, data fetching |
| **services/createColorDataService.js** | Fetch, cache, filter data | Render UI, manage state |

---

**Ready for next step:** Copy Lit components! 🚀
