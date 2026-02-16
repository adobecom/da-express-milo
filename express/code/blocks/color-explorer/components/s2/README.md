# Spectrum 2 Components - Self-Contained Bundle

## 📦 What's in this folder

This folder contains a **self-contained bundled version** of Spectrum Web Components Tags with Lit included.

### Files:
- **`spectrum-tags.bundle.js`** (98 KB / ~35 KB gzipped) - Spectrum tags + Lit
- **`build-bundle.mjs`** - Script to rebuild bundle from node_modules
- **`loadLit.js`** - (Unused) Legacy Lit loader with fallback chain
- **`README.md`** - This file

---

## ✅ Why Self-Contained? (Final Solution)

**We tried Milo's shared Lit pattern, but it doesn't work for Spectrum components.**

### The Problem

Spectrum components import from Lit subpaths:
```javascript
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { html } from 'lit/directives/if-defined.js';
// ... and 10+ other subpath imports
```

**Milo's `lit-all.min.js` is a single bundled file** - it doesn't export subpaths like `/decorators.js`.

So when we tried to use it:
```
1. Load Milo's lit-all.min.js ✅
2. Load spectrum-tags.bundle.js ✅
3. Spectrum tries: import 'lit/decorators.js' ❌
4. Error: Failed to fetch! (path doesn't exist)
```

### The Solution

**Bundle Lit directly into `spectrum-tags.bundle.js` (self-contained):**

```javascript
// build-bundle.mjs
await esbuild.build({
  // ...
  external: [], // Bundle everything, including Lit!
});
```

**Result:**
- ✅ Works everywhere (no external dependencies)
- ✅ Simple (no import maps, no Lit loading logic)
- ✅ Reliable (self-contained)
- ✅ Fast (loads once on-demand, cached by browser)
- 📦 Size: 98 KB uncompressed, ~35 KB gzipped

---

## 🚀 How to Use

### 1. Just import and use!

```javascript
// In your modal/component file
let spectrumLoaded = false;

export async function createModalContent() {
  // Load Spectrum bundle on-demand (includes Lit)
  if (!spectrumLoaded) {
    await import('../components/s2/spectrum-tags.bundle.js');
    spectrumLoaded = true;
  }

  // Use Spectrum components
  const tagsContainer = document.createElement('sp-tags');
  const tag = document.createElement('sp-tag');
  tag.textContent = 'Example Tag';
  tagsContainer.appendChild(tag);
}
```

That's it! No Lit loading, no import maps, no setup required.

---

## 🔄 How to Update/Rebuild

### Prerequisites
```bash
cd /Users/cano/Adobe/da-express-milo
npm install # Ensures @spectrum-web-components/tags is installed
```

### Rebuild Bundle
```bash
cd express/code/blocks/color-explorer/components/s2
node build-bundle.mjs
```

**Output:**
```
✅ Bundle created successfully!
  spectrum-tags.bundle.js  97.8kb
```

### What gets bundled:
- ✅ Lit (~35 KB)
- ✅ Spectrum Tags components (~20 KB)
- ✅ Spectrum base classes (~15 KB)
- ✅ All dependencies
- Total: ~98 KB uncompressed, ~35 KB gzipped

---

## 📊 Bundle Analysis

### What's Inside?
```bash
# Check bundle size
ls -lh spectrum-tags.bundle.js
# Output: 98 KB

# Check imports (should be none!)
grep -o 'from"lit[^"]*"' spectrum-tags.bundle.js
# Output: (empty - no external imports!)
```

### Size Comparison
| Approach | Bundle Size | Network Transfer (gzipped) | Dependencies |
|----------|-------------|----------------------------|--------------|
| **Self-Contained (Current)** | 98 KB | ~35 KB | None ✅ |
| Milo's Pattern (Broken) | 74 KB | ~25 KB | Milo's Lit (doesn't work ❌) |
| CDN (Not offline) | 0 KB | ~35 KB | CDN required ❌ |

---

## 🧪 Testing

### Test in a Modal
```javascript
// Test Spectrum tags render
const tags = document.createElement('sp-tags');
const tag = document.createElement('sp-tag');
tag.textContent = 'Test Tag';
tags.appendChild(tag);
document.body.appendChild(tags);

// Expected: Tag renders with Spectrum styles ✅
```

### Verify No External Imports
```bash
# Should return no results
grep -o 'from"lit[^"]*"' spectrum-tags.bundle.js
```

---

## 🔍 Troubleshooting

### "Failed to fetch spectrum-tags.bundle.js"
1. **Hard refresh:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Check file exists:** `ls express/code/blocks/color-explorer/components/s2/spectrum-tags.bundle.js`
3. **Rebuild bundle:** `node build-bundle.mjs`

### Tags don't render
1. **Check console for errors**
2. **Verify Spectrum bundle loaded:** Check Network tab
3. **Verify custom elements registered:** `console.log(customElements.get('sp-tag'))`

---

## 📚 References

- [Spectrum Web Components](https://opensource.adobe.com/spectrum-web-components/)
- [Spectrum Tags Documentation](https://opensource.adobe.com/spectrum-web-components/components/tags/)
- [esbuild](https://esbuild.github.io/)

---

## 🎯 Lessons Learned

### What We Tried (Chronologically)

1. **CDN imports** - Works but requires internet ❌
2. **Local vendoring** - Too many files, complex paths ❌
3. **Import maps (CDN)** - Still requires internet ❌
4. **Import maps (local Lit)** - Added 1MB of files ❌
5. **Milo's shared Lit** - Doesn't support subpath imports ❌
6. **Self-contained bundle** - Works perfectly! ✅

### Key Insights

1. **Milo's lit-all.min.js is a single file** - No subpath exports
2. **Spectrum needs subpath imports** - `lit/decorators.js`, `lit/directives/*`
3. **Import maps have limitations** - Can't map file to directory
4. **Self-contained is simplest** - No dependencies, works everywhere

### Final Architecture

```
express/code/blocks/color-explorer/
├── components/s2/
│   └── spectrum-tags.bundle.js  (98 KB - includes Lit)
├── modal/
│   ├── createGradientModalContent.js  → imports bundle
│   └── createPaletteModalContent.js   → imports bundle
└── components/floating-toolbar/
    └── createCCLibrariesDrawer.js     → imports bundle

No external dependencies!
No import maps!
No Lit loading logic!
Just works! ✅
```

---

**Result:** Clean, simple, reliable Spectrum integration with no external dependencies or complex setup! 🎉
