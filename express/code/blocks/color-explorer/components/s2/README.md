# Spectrum 2 Components - Bundled Version

## 📦 What's in this folder

This folder contains a **bundled version** of Spectrum Web Components Tags, copied from npm and bundled into a single file.

### Files:
- **`spectrum-tags.bundle.js`** (97 KB) - Complete Spectrum tags (both `<sp-tags>` and `<sp-tag>`)
- **`build-bundle.mjs`** - Script to rebuild bundle from node_modules
- **`importmap.html`** - Import map template for Lit dependency
- **`README.md`** - This file

---

## ✅ Why This Approach?

**Problem:** Spectrum Web Components have 50+ dependencies (Lit, base classes, controllers, etc.)

**Solution:** Bundle EVERYTHING into a single self-contained file using esbuild

### Advantages:
- ✅ **No external dependencies** - Lit bundled inside (fully self-contained)
- ✅ **No build process in app** - bundle is pre-built
- ✅ **Only 1 file** - easy to manage (98 KB minified, ~26 KB gzipped)
- ✅ **Works offline** - no internet required
- ✅ **No import map needed** - just import the bundle
- ✅ **Easy to update** - just re-run the bundler

---

## 🚀 How to Use

### Simply Import the Bundle

No import map needed! Everything is bundled together:

```javascript
// Import the bundled Spectrum tags (single file for both components)
import './components/s2/spectrum-tags.bundle.js';

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
| `spectrum-tags.bundle.js` | 98 KB | ~26 KB |

**Total first load:** ~26 KB (gzipped)

**What's included:**
- Spectrum Tags (`<sp-tags>` and `<sp-tag>`)
- Lit template library
- All base classes and controllers
- Everything needed to run - no external dependencies!

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

### "sp-tag is not defined"
**Cause:** Bundle not imported  
**Fix:** Import `spectrum-tags.bundle.js` in your JavaScript

### Bundle is outdated
**Cause:** Spectrum package was updated but bundle wasn't rebuilt  
**Fix:** Run `node build-bundle.mjs` to regenerate

### Need different Spectrum/Lit version
**Cause:** npm packages updated  
**Fix:** 
1. Update packages: `npm update @spectrum-web-components/tags lit`
2. Rebuild bundle: `node build-bundle.mjs`

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
