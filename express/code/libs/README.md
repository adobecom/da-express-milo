# Shared Libraries

This directory contains shared JavaScript libraries used across the codebase.

---

## 📦 Lit (Template Library)

**Version:** 3.x  
**Location:** `/express/code/libs/lit/`

### What is Lit?
- Lightweight template library for building web components
- Required by Spectrum Web Components
- ~50 KB (gzipped)

### Why Local?
- ✅ **Full offline support** - no CDN dependency
- ✅ **Version control** - locked to specific version
- ✅ **Performance** - served from same domain (no DNS lookup)
- ✅ **Reliability** - no external dependency

### How It's Loaded
Via import map in `head.html`:

```html
<script type="importmap">
{
  "imports": {
    "lit": "/express/code/libs/lit/index.js",
    "lit/": "/express/code/libs/lit/"
  }
}
</script>
```

### Singleton Pattern
**ES modules load only once!** Even if multiple files `import 'lit'`, the browser:
1. Loads it once
2. Caches it
3. Reuses the same instance everywhere

No need for manual singleton logic - the browser handles it!

---

## 📦 @lit/reactive-element

**Version:** 2.x  
**Location:** `/express/code/libs/@lit/reactive-element/`

### What is it?
- Base class for building reactive web components
- Core dependency of Lit
- Provides reactivity and lifecycle methods

### Import Map
```html
"@lit/reactive-element": "/express/code/libs/@lit/reactive-element/reactive-element.js",
"@lit/reactive-element/": "/express/code/libs/@lit/reactive-element/"
```

---

## 🔄 Updating Libraries

### To Update Lit:

```bash
# 1. Update npm package
npm update lit @lit/reactive-element

# 2. Copy to libs
rm -rf express/code/libs/lit express/code/libs/@lit
mkdir -p express/code/libs/lit express/code/libs/@lit/reactive-element
cp -r node_modules/lit/* express/code/libs/lit/
cp -r node_modules/@lit/reactive-element/* express/code/libs/@lit/reactive-element/

# 3. Test your app
# No code changes needed - import map points to local files
```

---

## 📊 Library Sizes

| Library | Files | Size |
|---------|-------|------|
| `lit/` | ~50 files | ~200 KB |
| `@lit/reactive-element/` | ~30 files | ~100 KB |
| **Total** | ~80 files | **~300 KB** |

**Gzipped:** ~50 KB total

---

## 🎯 Used By

- Spectrum Web Components (`components/s2/spectrum-tags.bundle.js`)
- Any future web components that use Lit

---

## ⚠️ Important Notes

1. **Don't modify these files** - they're copied from npm
2. **Update via npm** - always sync with node_modules version
3. **Import map required** - must be in HTML before module scripts
4. **Browser caches** - Lit loads once, used everywhere automatically

---

## 🧹 Files to Ignore

The following Lit files are included but not critical:
- `*.d.ts` - TypeScript definitions (dev only)
- `*.d.ts.map` - TypeScript source maps (dev only)
- `development/` - Development builds (not used in production)

These can be removed if you need to reduce the directory size, but they don't impact runtime performance.

---

**Questions?** See the main project documentation or check the Lit docs:  
https://lit.dev/docs/
