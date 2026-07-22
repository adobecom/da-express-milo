# How Blocks Know They Need Lit

## The Question

How does a block determine if it needs to load Lit components?

## The Answer

**Blocks don't "decide" at runtime - it's designed into the renderer.**

---

## Decision Flow

### 1. **Design Time Decision** (Before Code Runs)

When building a block, the developer chooses:
- Use **Lit components** (Brad's components) → Use adapters
- Use **Vanilla JS** → Build DOM manually

This is NOT a runtime check. It's hardcoded into the renderer.

---

### 2. **Block Initialization** (Runtime)

```javascript
// express/code/blocks/color-explore/color-explore.js
export default async function decorate(block) {
  const renderer = createStripsRenderer({ ... });
  renderer.render(block);
}
```

Block doesn't know or care about Lit. It just calls the renderer.

---

### 3. **Renderer Imports Adapters** (Design Time)

```javascript
// express/code/scripts/color-shared/renderers/createStripsRenderer.js
import { 
  createPaletteAdapter,   // ← Lit adapter
  createSearchAdapter     // ← Lit adapter
} from '../adapters/litComponentAdapters.js';
```

**Decision made here:** This renderer WILL use Lit components.

---

### 4. **Renderer Calls Adapters** (Runtime)

```javascript
function createPaletteCard(palette) {
  const adapter = createPaletteAdapter(palette, { ... });
  // ↑ This triggers Lit import
  
  card.appendChild(adapter.element);
  return card;
}
```

When adapter is called → Lit import happens.

---

### 5. **Adapter Imports Lit Component** (Runtime - Lazy)

```javascript
export function createPaletteAdapter(paletteData, callbacks = {}) {
  // Dynamic import - Lit loads NOW
  import('../../../libs/color-components/components/color-palette/index.js');
  
  const element = document.createElement('color-palette');
  // ...
}
```

**This is when Lit actually loads.**

---

## Full Timeline

```
Design Time:
  Developer decides → "I want to use Lit components"
    ↓
  Developer writes renderer → import adapters
    ↓
  Renderer hardcoded → will call adapters

Runtime:
  Block loads → calls renderer
    ↓
  Renderer.render() → calls createPaletteAdapter()
    ↓
  Adapter function runs → import('color-palette/index.js')
    ↓
  Lit component loads → import('deps/lit.js')
    ↓
  Lit library loads → deps/lit-all.min.js
    ↓
  Custom element registered → <color-palette> available
    ↓
  Element created → document.createElement('color-palette')
```

---

## Per-Block Analysis

### Blocks That Use Lit

| Block | Renderer | Lit Components Used | When Lit Loads |
|-------|----------|---------------------|----------------|
| **color-explore** | `createStripsRenderer` | `<color-palette>`, `<color-search>` | On first render |
| **color-wheel** | Built-in | `<color-wheel>` | On block load |
| **color-extract** | Built-in | `<color-palette>`, `<ac-color-swatch>` | After image upload |

### Blocks That Don't Use Lit

| Block | Renderer | Why No Lit? |
|-------|----------|-------------|
| **contrast-checker** | Built-in vanilla JS | Simple form, no complex UI |
| **color-blindness** | Built-in vanilla JS | Canvas manipulation, no Brad components |

---

## How Decision is Made

### Option A: Use Lit (Current Default)

```javascript
// Renderer imports adapters (Lit)
import { createPaletteAdapter } from '../adapters/litComponentAdapters.js';

function createCard(palette) {
  const adapter = createPaletteAdapter(palette);
  return adapter.element;
}
```

**Pros:**
- Uses Brad's polished components
- Consistent with design system
- Less code to write

**Cons:**
- 35 KB Lit library (cached after first load)
- Dynamic import delay

---

### Option B: Vanilla JS (Fallback)

```javascript
// No adapters, build DOM manually
function createCard(palette) {
  const card = document.createElement('div');
  card.className = 'palette';
  
  palette.colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.style.backgroundColor = color;
    card.appendChild(swatch);
  });
  
  return card;
}
```

**Pros:**
- No dependencies
- Instant render
- Smaller bundle

**Cons:**
- More code to write
- Manual styling
- Not using design system

---

## Detection at Runtime

### How to Check if Lit Will Load

**Before Block Loads:**
```javascript
// You can't know until renderer is created
// It's determined by which renderer the block uses
```

**After Block Loads:**
```javascript
// Check if Lit was used
const usesLit = !!window.customElements.get('color-palette');
```

**Check Block's Renderer:**
```javascript
const block = document.querySelector('.color-explore');
const renderer = block.rendererInstance;

// If renderer imports adapters → uses Lit
// If renderer is vanilla → no Lit
```

---

## Why This Design?

### 1. **Separation of Concerns**
- Block: "I need to display palettes"
- Renderer: "I'll use Lit components for that"
- Adapter: "I'll import the Lit component"
- Block doesn't need to know implementation details

### 2. **Lazy Loading**
- Lit loads ONLY when adapter is called
- Not all pages load all components
- Cached after first load

### 3. **Flexibility**
- Easy to swap renderers
- Can mix Lit and vanilla in same app
- Can add vanilla fallback if Lit fails

---

## Example: Mixed Approach

Some blocks might use BOTH Lit and vanilla:

```javascript
function createCard(palette, useLit = true) {
  if (useLit) {
    // Use Lit component
    const adapter = createPaletteAdapter(palette);
    return adapter.element;
  } else {
    // Vanilla fallback
    const card = buildVanillaPalette(palette);
    return card;
  }
}
```

---

## Configuration-Based Decision (Future)

Could make it configurable:

```javascript
// express/code/blocks/color-explore/color-explore.js
export default async function decorate(block) {
  const config = parseBlockConfig(block);
  
  // Option 1: Explicit in block config
  const useLit = config.useLit !== false; // default true
  
  // Option 2: Feature detection
  const useLit = supportsCustomElements();
  
  // Option 3: Environment-based
  const useLit = !window.location.hostname.includes('legacy');
  
  const renderer = useLit 
    ? createStripsRenderer(config)     // Uses Lit adapters
    : createVanillaRenderer(config);   // Pure vanilla
    
  renderer.render(block);
}
```

---

## Summary

### How Blocks Know They Need Lit:

**They don't.** The **renderer** knows.

1. **Design Decision**: Developer chooses renderer
2. **Renderer Imports**: Renderer imports adapters (hardcoded)
3. **Runtime Load**: Adapter dynamically imports Lit component
4. **Lazy Loading**: Lit loads when first component needed

### Decision Point:

```
Block
  ↓ (uses)
Renderer ← DECISION MADE HERE
  ↓ (imports)
Adapter
  ↓ (dynamic imports)
Lit Component
  ↓ (imports)
Lit Library
```

### Key Insight:

**The renderer is the decision point.** If a renderer imports adapters, it will use Lit. If it doesn't, it won't.

### Current Pattern:

- **color-explore** → `createStripsRenderer` → adapters → **Lit WILL load**
- **color-wheel** → direct adapter usage → **Lit WILL load**
- **contrast-checker** → vanilla renderer → **Lit WON'T load**

### Runtime Check:

```javascript
// After page loads, check what actually loaded:
console.log('Lit loaded:', !!window.customElements.get('color-palette'));
```

But this is **after the fact**, not a decision mechanism.

---

## Related Documentation

- For Lit loading flow: `PAGE_STRUCTURE_AND_LIT_LOADING.md`
- For adapter implementation: `express/code/scripts/color-shared/adapters/litComponentAdapters.js`
- For renderer patterns: `express/code/scripts/color-shared/renderers/`
