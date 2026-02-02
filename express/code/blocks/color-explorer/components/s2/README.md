# Spectrum 2 Components - Bundled Version

## 📦 What's in this folder

This folder contains **bundled versions** of Spectrum Web Components, copied from npm and bundled into single files.

### Files:
- **`sp-tags.bundle.js`** (97 KB) - Full Spectrum tags container component
- **`sp-tag.bundle.js`** (84 KB) - Individual tag component
- **`build-bundle.mjs`** - Script to rebuild bundles from node_modules
- **`.map` files** - Source maps for debugging

---

## ✅ Why This Approach?

**Problem:** Spectrum Web Components have 50+ dependencies (Lit, base classes, controllers, etc.)

**Solution:** Bundle everything into 2 files using esbuild

### Advantages:
- ✅ **No CDN dependency** - all code is local
- ✅ **No build process in app** - bundles are pre-built
- ✅ **Only 2 files** - easy to manage (181 KB total)
- ✅ **Works offline** - no internet required
- ✅ **Easy to update** - just re-run the bundler

---

## 🚀 How to Use

### 1. Add Import Map to HTML

Spectrum components need Lit (template library), which is marked as external and loaded from CDN:

```html
<!-- Add this to your HTML <head> BEFORE any module scripts -->
<script type="importmap">
{
  "imports": {
    "lit": "https://cdn.jsdelivr.net/npm/lit@3.1.0/index.js",
    "lit/": "https://cdn.jsdelivr.net/npm/lit@3.1.0/",
    "@lit/reactive-element": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@2.0.4/reactive-element.js",
    "@lit/reactive-element/": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@2.0.4/"
  }
}
</script>
```

**Why external Lit?** Keeping Lit external reduces bundle size (Lit is ~50KB and many other libraries use it).

### 2. Import in Your JavaScript

```javascript
// Import the bundled Spectrum tags
import './components/s2/sp-tags.bundle.js';
import './components/s2/sp-tag.bundle.js';

// Now you can use <sp-tags> and <sp-tag> in your code
const tagsContainer = document.createElement('sp-tags');
const tag = document.createElement('sp-tag');
tag.textContent = 'My Tag';
tagsContainer.appendChild(tag);
```

---

## 🔄 Updating the Bundles

If you update the `@spectrum-web-components/tags` package:

```bash
# 1. Update the package
npm update @spectrum-web-components/tags

# 2. Rebuild the bundles
node express/code/blocks/color-explorer/components/s2/build-bundle.mjs

# 3. Done! New bundles are generated
```

---

## 📊 Bundle Size

| File | Size | Gzipped |
|------|------|---------|
| `sp-tags.bundle.js` | 97 KB | ~25 KB |
| `sp-tag.bundle.js` | 84 KB | ~22 KB |
| **Total** | **181 KB** | **~47 KB** |

Plus Lit from CDN: ~50 KB (gzipped), cached across sites.

---

## 🔍 What's Inside the Bundles?

The bundles contain:
- Spectrum tag components (Tag.js, Tags.js)
- Base classes (SpectrumElement, SizedMixin)
- Reactive controllers (RovingTabindex)
- Focus management (FocusVisiblePolyfillMixin)
- Spectrum styles (CSS-in-JS)
- All other dependencies EXCEPT Lit

**External (loaded separately):**
- Lit (template library)
- @lit/reactive-element (base for web components)

---

## 🛠️ Troubleshooting

### "Cannot find module 'lit'"
**Cause:** Import map not loaded or incorrect  
**Fix:** Add the import map to your HTML `<head>` BEFORE script tags

### "sp-tag is not defined"
**Cause:** Bundle not imported  
**Fix:** Import `sp-tag.bundle.js` in your JavaScript

### Bundle is outdated
**Cause:** Spectrum package was updated but bundle wasn't rebuilt  
**Fix:** Run `node build-bundle.mjs` to regenerate

### Need different Lit version
**Cause:** Version mismatch  
**Fix:** Update the CDN URL in your import map

---

## 🎯 Browser Support

- ✅ Chrome/Edge 89+
- ✅ Firefox 108+
- ✅ Safari 16.4+
- ✅ All browsers with native ES modules + import maps support

**Polyfill for older browsers:** Use [es-module-shims](https://github.com/guybedford/es-module-shims)

---

## 📚 More Info

- **Spectrum Web Components:** https://opensource.adobe.com/spectrum-web-components/
- **Import Maps:** https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap
- **esbuild (bundler):** https://esbuild.github.io/

---

## ✅ Benefits Over Other Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **This (Bundled)** | ✅ Local code<br>✅ No app build<br>✅ Easy to update | ⚠️ Requires import map<br>⚠️ Lit from CDN |
| **Full CDN** | ✅ No setup<br>✅ External caching | ❌ Internet required<br>❌ External dependency |
| **Manual Vendoring** | ✅ Fully offline | ❌ 100+ files to manage<br>❌ Complex path rewriting |
| **App Build Process** | ✅ Smallest bundle<br>✅ Full control | ❌ Requires build tools<br>❌ More complexity |

---

**Recommendation:** Use this bundled approach for prototyping. For production, consider adding a build process for optimal bundle size.
