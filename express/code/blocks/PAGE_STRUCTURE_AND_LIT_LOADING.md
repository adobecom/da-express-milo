# Page Structure & Lit Loading Architecture

## Overview

Different Color pages have different block compositions. **Only Explore page** has `search-marquee` (LCP optimization). Other pages load their respective blocks directly.

---

## Page Structures

### 1. **Explore Page** (Special Case - Has Search Marquee)

```html
<!-- /express/colors/explore -->
<main>
  <div class="section">
    <div class="search-marquee">
      <!-- Search hero (LCP) -->
      <!-- May use Lit: <color-search> component -->
    </div>
  </div>
  
  <div class="section">
    <div class="color-explore" data-variant="strips">
      <!-- Palette strips grid -->
      <!-- Uses Lit: <color-palette> components -->
    </div>
  </div>
</main>
```

**Lit Loading:**
- `search-marquee` loads → May dynamically import `<color-search>`
- `color-explore` loads → Dynamically imports `<color-palette>`
- Both share same `deps/lit.js` (loaded once)

---

### 2. **Extract Page** (No Search Marquee)

```html
<!-- /express/colors/extract -->
<main>
  <div class="section">
    <div class="color-extract">
      <!-- Image upload + color extraction -->
      <!-- Uses Lit: <color-wheel>, <ac-color-swatch> -->
    </div>
  </div>
</main>
```

**Lit Loading:**
- Only `color-extract` block loads
- Dynamically imports Lit components on-demand
- No search-marquee, no extra overhead

---

### 3. **Color Wheel Page** (No Search Marquee)

```html
<!-- /express/colors/wheel -->
<main>
  <div class="section">
    <div class="color-wheel">
      <!-- Interactive color wheel -->
      <!-- Uses Lit: <color-wheel>, <color-harmony-toolbar> -->
    </div>
  </div>
</main>
```

**Lit Loading:**
- Only `color-wheel` block loads
- Dynamically imports `<color-wheel>` component
- Standalone page, optimized for color picker UX

---

### 4. **Contrast Checker Page** (No Search Marquee)

```html
<!-- /express/colors/contrast-checker -->
<main>
  <div class="section">
    <div class="contrast-checker">
      <!-- WCAG contrast validation -->
      <!-- Uses Lit: <ac-color-swatch> -->
    </div>
  </div>
</main>
```

**Lit Loading:**
- Only `contrast-checker` block loads
- Minimal Lit usage (color swatches)
- Lightweight, accessibility-focused page

---

### 5. **Color Blindness Simulator Page** (No Search Marquee)

```html
<!-- /express/colors/color-blindness -->
<main>
  <div class="section">
    <div class="color-blindness">
      <!-- Color blindness simulation -->
      <!-- Uses Lit: <color-palette> for preview -->
    </div>
  </div>
</main>
```

**Lit Loading:**
- Only `color-blindness` block loads
- Dynamically imports Lit components for preview
- Simulation-focused, no search needed

---

## Lit Loading Strategy

### On-Demand Dynamic Imports

**All blocks use the same pattern:**

```javascript
// In block's main file (e.g., color-extract.js)
export default async function decorate(block) {
  // Block-specific setup
  const renderer = createExtractRenderer({ ... });
  renderer.render(container);
}
```

```javascript
// In renderer (e.g., createExtractRenderer.js)
export function createExtractRenderer(options) {
  // Renderer creates adapters as needed
  const wheelAdapter = createColorWheelAdapter('#FF0000', { ... });
}
```

```javascript
// In adapter (litComponentAdapters.js)
export function createColorWheelAdapter(initialColor, callbacks) {
  // Dynamic import - ONLY loads when adapter is called
  import('../../../libs/color-components/components/color-wheel/index.js');
  
  const element = document.createElement('color-wheel');
  return { element, setColor, destroy };
}
```

```javascript
// In Lit component (color-wheel/index.js)
// Static import - loads when component is imported
import { LitElement, html } from '../../../deps/lit.js';

export class ColorWheel extends LitElement { ... }
```

---

## Key Advantages

### 1. **No Overhead for Non-Lit Pages**

If a page doesn't use Lit components, `deps/lit.js` never loads.

### 2. **Shared Lit Instance**

All Lit components share the same `deps/lit.js` → `lit-all.min.js` (35 KB).
Loaded once, cached by browser.

### 3. **Page-Specific Optimization**

- **Explore**: Search-marquee (LCP) + color-explore (below fold)
- **Extract**: Single block, focused UX
- **Color Wheel**: Single block, interactive tool
- **Contrast Checker**: Minimal Lit, fast load
- **Color Blindness**: Single block, simulation-focused

### 4. **No Build Step Required**

- All imports use relative paths
- Franklin auto-loads block JS/CSS
- Dynamic imports handled by browser
- No bundler needed

---

## Lit Loading Timeline

### Example: Explore Page

```
1. Page load (HTML)
   └─ Franklin detects blocks: search-marquee, color-explore

2. Franklin loads blocks in parallel:
   ├─ search-marquee.js + search-marquee.css
   └─ color-explore.js + color-explore.css

3. color-explore.js executes:
   └─ createStripsRenderer() called

4. createStripsRenderer creates palette cards:
   └─ createPaletteAdapter() called (first time)

5. Adapter dynamically imports:
   └─ import('color-palette/index.js')

6. color-palette/index.js loads:
   └─ import('../../../deps/lit.js')

7. deps/lit.js loads:
   └─ import('./lit-all.min.js') → Lit library (35 KB)

8. Custom element registered:
   └─ customElements.define('color-palette', ColorPalette)

9. All subsequent <color-palette> elements render instantly
   (Lit already loaded and cached)
```

---

## Performance Implications

### Explore Page (With Search Marquee)

**Initial Load:**
- HTML + CSS + search-marquee.js + color-explore.js
- Lit loads on-demand when first palette renders
- Total: ~35 KB for Lit (one-time, cached)

**Subsequent Navigation:**
- Lit already cached
- Only block-specific JS/CSS loads
- Near-instant render

### Other Pages (No Search Marquee)

**Initial Load:**
- HTML + CSS + block.js (e.g., color-wheel.js)
- Lit loads on-demand when first Lit component renders
- Total: ~35 KB for Lit (one-time, cached)

**Advantage:**
- No search-marquee overhead
- Faster initial page load
- Focused UX per page

---

## Search Marquee Decision

### Why Only Explore Has It?

**Explore Page:**
- Primary use case: Browse and search palettes/gradients
- Search is hero/LCP element
- Users expect search-first experience

**Other Pages:**
- Extract: Upload image → extract colors (no search needed)
- Color Wheel: Interactive tool (no search needed)
- Contrast Checker: Utility tool (no search needed)
- Color Blindness: Simulation tool (no search needed)

**Design Decision:**
- Search-marquee is NOT a shared component
- It's page-specific for Explore
- Other pages have focused, single-purpose UX

---

## Franklin Block Loading

### Auto-Loading Behavior

Franklin automatically:
1. Detects blocks in HTML: `<div class="block-name">`
2. Loads JS: `express/code/blocks/block-name/block-name.js`
3. Loads CSS: `express/code/blocks/block-name/block-name.css`
4. Calls `decorate(block)` function

**Our Blocks:**
- `color-explore` → Auto-loads color-explore.js + CSS
- `color-extract` → Auto-loads color-extract.js + CSS
- `color-wheel` → Auto-loads color-wheel.js + CSS
- `search-marquee` → Auto-loads search-marquee.js + CSS (Explore only)

**Shared Components:**
- Located in `scripts/color-shared/`
- NOT auto-loaded by Franklin
- Imported by blocks as needed
- CSS must be manually loaded (see `createStripsRenderer.js`)

---

## Summary

### Page Composition

| Page | Blocks | Uses Search Marquee? | Lit Components |
|------|--------|---------------------|----------------|
| **Explore** | search-marquee + color-explore | ✅ YES | <color-palette>, <color-search> |
| **Extract** | color-extract | ❌ NO | <color-wheel>, <ac-color-swatch> |
| **Color Wheel** | color-wheel | ❌ NO | <color-wheel>, <color-harmony-toolbar> |
| **Contrast Checker** | contrast-checker | ❌ NO | <ac-color-swatch> |
| **Color Blindness** | color-blindness | ❌ NO | <color-palette> |

### Lit Loading

- ✅ **On-demand**: Loaded when first Lit component is used
- ✅ **Shared**: Same 35 KB Lit library for all components
- ✅ **Cached**: Browser caches across pages
- ✅ **No build step**: Works directly in Franklin

### Architecture

- ✅ **Multi-block**: Each page uses appropriate block(s)
- ✅ **Modular**: Blocks are independent
- ✅ **Shared library**: Common components in `scripts/color-shared/`
- ✅ **Page-optimized**: Each page loads only what it needs
