# Spectrum 2 Components - Following Milo's Pattern

## 📦 What's in this folder

This folder contains a **bundled version** of Spectrum Web Components Tags that follows **Milo's pattern** for shared Lit usage.

### Files:
- **`spectrum-tags.bundle.js`** (~12 KB) - Spectrum tags components
- **`build-bundle.mjs`** - Script to rebuild bundle from node_modules
- **`README.md`** - This file

---

## ✅ Why This Approach (Milo's Pattern)?

**Problem:** If we bundle Lit into every component, we load Lit multiple times (wasteful!)

**Solution:** Load Lit once globally (Milo's `lit-all.min.js`), all components share it

### Architecture:
```
head.html
├── <script src="/libs/deps/lit-all.min.js"></script>  ← Lit loads ONCE
└── Components use the shared Lit instance

express/code/blocks/color-explorer/
├── components/s2/spectrum-tags.bundle.js  ← No Lit inside (~12 KB)
├── components/other-component.js          ← Uses same Lit (~8 KB)
└── components/another-component.js        ← Uses same Lit (~10 KB)

Total Lit loaded: 35 KB (once!)
Total components: ~30 KB
```

### Advantages:
- ✅ **Lit loads once** - Shared by all components (Milo's pattern)
- ✅ **Smaller bundles** - Components don't include Lit (~12 KB vs ~98 KB)
- ✅ **No duplication** - Add 10 components, Lit still loads once
- ✅ **Works offline** - All files local
- ✅ **Easy to update** - Just re-run the bundler
- ✅ **Consistent with Milo** - Uses same pattern as Adobe's framework

---

## 🚀 How to Use

### 1. Lit is loaded globally (already done in head.html)

```html
<!-- head.html -->
<script src="/libs/deps/lit-all.min.js"></script>
```

### 2. Import Spectrum components

```javascript
// Import the bundled Spectrum tags
import './components/s2/spectrum-tags.bundle.js';

// Now you can use <sp-tags> and <sp-tag>
const tagsContainer = document.createElement('sp-tags');
const tag = document.createElement('sp-tag');
tag.textContent = 'My Tag';
tagsContainer.appendChild(tag);
```

---

## 🔄 Updating the Bundle

If you update the `@spectrum-web-components/tags` package:

```bash
# 1. Update the package
npm update @spectrum-web-components/tags

# 2. Rebuild the bundle
node express/code/blocks/color-explorer/components/s2/build-bundle.mjs

# 3. Done! New bundle is generated
```

---

## 📊 Bundle Size Comparison

| Approach | Bundle Size | Lit Included? | Total Lit Loaded |
|----------|-------------|---------------|------------------|
| **Milo's Pattern (Current)** | ~12 KB | ❌ (shared) | 35 KB (once!) |
| Bundled Lit per component | ~98 KB | ✅ (bundled) | 98 KB × N components 💥 |

**With 3 components:**
- Milo's pattern: 35 KB (Lit) + 36 KB (components) = **71 KB total** ✅
- Bundled approach: 98 KB × 3 = **294 KB total** ❌

**Winner:** Milo's pattern (4× smaller!)

---

## 🔍 What's Inside the Bundle?

The bundle contains:
- Spectrum tag components (Tag.js, Tags.js)
- Base classes (SpectrumElement, SizedMixin)
- Reactive controllers (RovingTabindex)
- Focus management (FocusVisiblePolyfillMixin)
- Spectrum styles (CSS-in-JS)

**External (loaded via Milo's lit-all.min.js):**
- Lit (template library)
- @lit/reactive-element (base for web components)

---

## 🛠️ Troubleshooting

### "sp-tag is not defined"
**Cause:** Bundle not imported  
**Fix:** Import `spectrum-tags.bundle.js` in your JavaScript

### "Failed to resolve module specifier 'lit'"
**Cause:** Milo's lit-all.min.js not loaded  
**Fix:** Ensure `<script src="/libs/deps/lit-all.min.js"></script>` is in head.html

### Bundle is outdated
**Cause:** Spectrum package was updated but bundle wasn't rebuilt  
**Fix:** Run `node build-bundle.mjs` to regenerate

### Need different Spectrum version
**Fix:** 
1. Update package: `npm update @spectrum-web-components/tags`
2. Rebuild bundle: `node build-bundle.mjs`

---

## 🎯 Browser Support

- ✅ Chrome/Edge 89+
- ✅ Firefox 108+
- ✅ Safari 16.4+
- ✅ All browsers with native ES modules support

**Polyfill for older browsers:** Use [es-module-shims](https://github.com/guybedford/es-module-shims)

---

## 📚 More Info

- **Spectrum Web Components:** https://opensource.adobe.com/spectrum-web-components/
- **Milo's Lit:** https://github.com/adobecom/milo/blob/stage/libs/deps/lit-all.min.js
- **esbuild (bundler):** https://esbuild.github.io/

---

## ✅ Benefits Over Other Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Milo's Pattern (Current)** | ✅ Lit loads once<br>✅ Small bundles<br>✅ Scales well | ⚠️ Requires global Lit |
| **Bundled Lit per component** | ✅ Self-contained | ❌ Lit duplicated per component<br>❌ Large bundles (98 KB each) |
| **Full CDN** | ✅ No setup | ❌ Internet required<br>❌ External dependency |
| **Manual Vendoring** | ✅ Fully offline | ❌ 100+ files to manage<br>❌ Complex path rewriting |

---

**Recommendation:** This approach (Milo's pattern) is perfect for production - efficient, scalable, and consistent with Adobe's framework.
