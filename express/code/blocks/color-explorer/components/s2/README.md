# Spectrum 2 Components - Integration Guide

## Problem

Spectrum Web Components have complex dependencies (Lit, decorators, base classes) that require a build process to bundle properly.

## Solutions

We have **3 options** for using Spectrum tags without a build process:

---

### ✅ **Option 1: CDN Import (Recommended - No files needed)**

Use ESM CDN to load Spectrum components directly in the browser:

```javascript
// In your JS files, replace:
import '@spectrum-web-components/tags/sp-tags.js';
import '@spectrum-web-components/tags/sp-tag.js';

// With:
import 'https://esm.sh/@spectrum-web-components/tags@1.11.0/sp-tags.js';
import 'https://esm.sh/@spectrum-web-components/tags@1.11.0/sp-tag.js';
```

**Pros:**
- ✅ Zero setup - just change import paths
- ✅ No files to maintain in repo
- ✅ CDN handles all dependencies automatically
- ✅ Browser caching

**Cons:**
- ❌ Requires internet connection
- ❌ External dependency

---

### Option 2: Import Maps (Requires HTML changes)

Add an import map to your HTML pages:

```html
<script type="importmap">
{
  "imports": {
    "@spectrum-web-components/tags/": "https://esm.sh/@spectrum-web-components/tags@1.11.0/",
    "lit": "https://esm.sh/lit@3",
    "@lit/reactive-element": "https://esm.sh/@lit/reactive-element@2"
  }
}
</script>
```

Then your imports work as-is:
```javascript
import '@spectrum-web-components/tags/sp-tags.js';
```

**Pros:**
- ✅ Keep original import syntax
- ✅ Centralized CDN configuration

**Cons:**
- ❌ Requires HTML modification
- ❌ Older browser support limited

---

### Option 3: Local Vendoring (Complex - Use only if offline is required)

Copy ALL dependencies into your codebase and rewrite imports. This requires:

1. Copy Spectrum tags files
2. Copy Lit (template library)
3. Copy all Spectrum base classes
4. Copy reactive controllers
5. Rewrite ALL import paths
6. Test thoroughly

**Pros:**
- ✅ Fully offline
- ✅ No external dependencies

**Cons:**
- ❌ Very complex setup
- ❌ Hard to maintain/update
- ❌ Large code footprint
- ❌ Manual path rewriting

---

## Recommendation

**Use Option 1 (CDN Import)** for the prototype:

1. It's the simplest
2. No build process needed
3. Easy to revert
4. Fast to implement

If you need offline support, we can explore Option 3, but it will require significant effort.

---

## Current Status

Files in this directory:
- `sp-tag.js`, `sp-tags.js` - Copied from node_modules (but won't work without dependencies)
- `tags-src/`, `base/`, `button/`, etc. - Partial dependencies (incomplete)

**These files are NOT ready to use yet** - they still have unresolved imports.

To make them work, you need to either:
1. Switch to CDN imports (Option 1)
2. Set up import maps (Option 2)
3. Complete the vendoring process (Option 3) - requires ~2-3 hours of work

---

## Next Steps

Let me know which option you prefer, and I'll implement it properly!
